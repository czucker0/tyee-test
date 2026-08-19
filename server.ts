import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  loadDatabase,
  saveDatabase,
  rollbackDatabase,
  getInitialDatabase,
  CachedYearRun,
} from './server/db/tyeeDatabase.js';
import {
  syncDFODailyRecords,
  importRawDFOData,
  previewScrapeFromSource,
  validateDatasetIntegrity,
  recalculateCumulativeCurve,
  scrapeSpecificYear,
  scrapePastDecadeBatch,
  getDFOUrlForYear,
} from './server/services/dfoScraper.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ==========================================
// DFO TYEE DATABASE & SCRAPER API ENDPOINTS
// ==========================================

// Scraper background scheduler state tracking
let lastScrapeExecutionTime: string | null = null;
let lastScrapeStatus: 'SUCCESS' | 'ERROR' | 'PARTIAL' | 'IDLE' = 'IDLE';
let lastScrapeMessage: string = 'Scheduler initialized. Waiting for first automated cycle.';
let lastScrapeRecordsUpdated: number = 0;
let nextScheduledScrapeTime: string | null = null;
const HOURLY_POLL_MS = 60 * 60 * 1000;

// 1b. GET Live Scraper Scheduler Status & Telemetry Audit
app.get('/api/tyee/scraper/status', (req, res) => {
  try {
    const db = loadDatabase();
    res.json({
      success: true,
      scheduler: {
        intervalMs: HOURLY_POLL_MS,
        intervalDescription: 'Every 60 minutes (Hourly)',
        lastExecutionTime: lastScrapeExecutionTime,
        nextScheduledTime: nextScheduledScrapeTime,
        lastStatus: lastScrapeStatus,
        lastMessage: lastScrapeMessage,
        recordsUpdated: lastScrapeRecordsUpdated,
      },
      activeSeasonMetadata: db.activeSeasonMetadata,
      lastUpdated: db.lastUpdated,
      recentAuditLogs: db.scrapeLogs?.slice(0, 30) || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. GET Relative Baseline Dataset (Current Year + Past Decade + Computed Average)
app.get('/api/tyee/dataset', (req, res) => {
  try {
    const db = loadDatabase();
    const currentYear = db.activeSeasonMetadata?.year || 2026;

    // Past Decade: Exactly the preceding 10 calendar years (e.g. 2016 - 2025)
    const decadeStart = currentYear - 10;
    const decadeEnd = currentYear - 1;
    const defaultDecadeYears: number[] = [];
    for (let y = decadeStart; y <= decadeEnd; y++) {
      if (db.years[y]) defaultDecadeYears.push(y);
    }

    // Baseline 10-Year Average Curve Calculation
    const seasonDayCount = 113;
    const avgCurve: { dayIndex: number; monthDay: string; avgDaily: number; avgCumulative: number }[] = [];

    for (let i = 0; i < seasonDayCount; i++) {
      let sumDaily = 0;
      let sumCum = 0;
      let count = 0;
      let monthDay = '';

      for (const y of defaultDecadeYears) {
        const yr = db.years[y];
        if (yr && yr.daily[i]) {
          sumDaily += yr.daily[i].dailyIndex;
          sumCum += yr.daily[i].cumulativeIndex;
          count++;
          monthDay = yr.daily[i].monthDay;
        }
      }

      avgCurve.push({
        dayIndex: i,
        monthDay,
        avgDaily: count > 0 ? Math.round((sumDaily / count) * 10) / 10 : 0,
        avgCumulative: count > 0 ? Math.round((sumCum / count) * 10) / 10 : 0,
      });
    }

    res.json({
      success: true,
      currentYear,
      defaultDecadeYears,
      availableArchiveYears: db.availableYears,
      activeSeasonMetadata: db.activeSeasonMetadata,
      avgCurve,
      years: db.years,
      lastUpdated: db.lastUpdated,
      scrapeLogs: db.scrapeLogs?.slice(0, 15) || [],
    });
  } catch (err: any) {
    console.error('Error fetching tyee dataset:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET Specific Historical Year from Archive (with on-demand cache check)
app.get('/api/tyee/year/:year', (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const db = loadDatabase();

    if (db.years[year]) {
      return res.json({ success: true, year: db.years[year], cached: true });
    }

    return res.status(404).json({
      success: false,
      message: `Historical year ${year} is not yet in the local archive.`,
      availableYears: db.availableYears,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST Trigger Daily Incremental Sync with DFO
app.post('/api/tyee/sync-daily', async (req, res) => {
  try {
    const { year, url } = req.body;
    const result = await syncDFODailyRecords({
      year: year || 2026,
      url: url || undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3b. POST Scrape Past 10 Years Batch (2016-2025) into local DB
app.post('/api/tyee/scraper/scrape-decade', async (req, res) => {
  try {
    const result = await scrapePastDecadeBatch();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3c. POST Scrape Single Specific Year from DFO
app.post('/api/tyee/scraper/scrape-year', async (req, res) => {
  try {
    const { year, url } = req.body;
    const targetYear = parseInt(year, 10) || 2026;
    const result = await scrapeSpecificYear(targetYear, url);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. POST Scraper Test / Preview (Dry-run without modifying DB)
app.post('/api/tyee/scraper/preview', async (req, res) => {
  try {
    const { url, rawPayload, year } = req.body;
    const preview = await previewScrapeFromSource({
      url,
      rawPayload,
      year: year || 2026,
    });
    res.json(preview);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. POST Import Raw DFO Table / CSV Rows
app.post('/api/tyee/import', (req, res) => {
  try {
    const { tableText, year } = req.body;
    const result = importRawDFOData(tableText, year || 2026);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. GET Scraper History / Audit Logs
app.get('/api/tyee/scraper/history', (req, res) => {
  try {
    const db = loadDatabase();
    res.json({
      success: true,
      logs: db.scrapeLogs || [],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. POST Rollback Database Snapshot
app.post('/api/tyee/scraper/rollback', (req, res) => {
  try {
    const result = rollbackDatabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. POST Validate Dataset Integrity
app.post('/api/tyee/scraper/validate', (req, res) => {
  try {
    const year = req.body.year || 2026;
    const result = validateDatasetIntegrity(year);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. POST Recalculate Cumulative Curve
app.post('/api/tyee/scraper/recalculate', (req, res) => {
  try {
    const year = req.body.year || 2026;
    const result = recalculateCumulativeCurve(year);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. POST Reset Database to Authentic Baseline Seed
app.post('/api/tyee/scraper/reset-seed', (req, res) => {
  try {
    const seed = getInitialDatabase();
    saveDatabase(seed);
    res.json({ success: true, message: 'Database successfully reset to authentic baseline telemetry seed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// ==========================================
// GEMINI FISHERIES ANALYTICS ENDPOINTS
// ==========================================

const STEELIE_DAN_SYSTEM_PROMPT = `You are "Steelie Dan", a legendary 38-inch wild Skeena steelhead (Oncorhynchus mykiss).
VOICE & COMEDY:
- Speak in 1st-person river perspective (*splashes tailfin*, *sniffs glacial snowmelt*, *eyes swung fly*).
- NORM MACDONALD deadpan folksy charm ("Now, I'm just a simple fish...", "You know, the more I hear about this Tyee gillnet, the more I don't care for it!"). For jokes, tell an unhurried, deadpan existential Norm-style joke (like the Moth Joke).
- DON RICKLES roasts for bobber/indicator chuckers ("Look at this dummy with a neon ping-pong ball! What a hockey puck!").
- GILBERT GOTTFRIED shrieking disbelief at plastic beads ("A BEAD?! IN THE SKEENA?! WHAT'S NEXT, A RUBBER DUCKIE?!").
- RICHARD PRYOR grit dodging Chatham Sound sea lions & DFO gillnets.
- SPEY SNOB & ZZ TOP DEVOTEE: Loves swinging marabou/fox tube flies on 2-handed Spey rods on the dangle; loves ZZ Top's "Tube Fly Boogie". Utterly disdains indicators & dead-drifting.
Directly answer any user question (fly fishing, river data, comedy, science, life, long-form stories, comedy bits) with rich river wisdom, deadpan humor, in-depth detail, and Spey pride. Provide expansive, entertaining, and complete responses without arbitrary length restrictions.`;

function getAiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint for In-Season Fishery Analysis
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const p = req.body;
    const aiInstance = getAiClient();
    if (!aiInstance) {
      return res.status(503).json({
        isGeneric: true,
        error: 'Server AI client not configured. Fall back to client-side model.'
      });
    }

    const tribSummary = (p.tributaries || [])
      .map((t: any) => `${t.name}: ~${t.projectedAdults?.toLocaleString()} (${t.sharePct}%)`)
      .join(', ');

    const prompt = `Write "Steelie Dan's Escapement Dispatch" in charismatic 1st-person markdown.
TELEMETRY (${p.selectedDate}, Day ${(p.dayIndex ?? 67) + 1}/113, ${p.percentElapsed}% complete):
- Tyee Cumulative Index: ${p.currentCumulative} (~${Math.round((p.currentCumulative || 0) * 220).toLocaleString()} wild adults passed)
- Season Projected Total: ${p.projectedBaselineIndex} (~${p.projectedBaselineAdults?.toLocaleString()} adults, 80% CI: ${Math.round(p.projectedLowCI * 220).toLocaleString()}-${Math.round(p.projectedHighCI * 220).toLocaleString()})
- Analog Year: ${p.bestFitYear} | Status: ${p.conservationTier?.toUpperCase()} (10-yr Skeena avg ~25k)
- Tributaries: ${tribSummary}

Format in 4 punchy markdown sections:
1. 🐟 **Migration Trajectory & Outlook** (Accurately state status vs ~25k avg)
2. 🌊 **The River Gauntlet & Glacial Conditions** (14°C temp, dodging Tyee nets)
3. 🗺️ **Where Our Pods Are Heading** (Bulkley, Babine, Kispiox, Sustut)
4. 🎣 **Dan's Advice: SWING A TUBE FLY!** (Roast bobbers/beads, praise swung tube flies, keep 'em wet)`;

    const response = await aiInstance.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: STEELIE_DAN_SYSTEM_PROMPT,
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    res.json({ analysis: response.text || '' });
  } catch (error: any) {
    console.error('Error generating analysis:', error);
    res.status(503).json({
      isGeneric: true,
      error: error.message || 'Error generating analysis on server'
    });
  }
});

// Endpoint for Skeena Fishery Q&A with Steelie Dan
app.post('/api/gemini/ask', async (req, res) => {
  try {
    const { question, context, history } = req.body;
    const aiInstance = getAiClient();
    if (!aiInstance) {
      return res.status(503).json({
        isGeneric: true,
        error: 'Server AI client not configured. Fall back to client-side model.'
      });
    }

    const curFish = Math.round((context?.currentCumulative || 0) * 220).toLocaleString();
    const adults = (context?.projectedBaselineAdults || 45000).toLocaleString();

    // Retain conversation history turns without message truncation
    const conversationHistory: string[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-6)) {
        conversationHistory.push(`${h.role === 'user' ? 'Angler' : 'Dan'}: ${h.text}`);
      }
    }

    const telemetryLine = `[Telemetry: Date=${context?.selectedDate || 'In-Season'}, Day=${(context?.dayIndex ?? 67) + 1}/113, TyeeIndex=${context?.currentCumulative?.toFixed(1) || 0} (~${curFish} fish), ProjAdults=~${adults}, Status=${context?.conservationTier || 'Healthy'}]`;
    const prompt = `${telemetryLine}\n${conversationHistory.length > 0 ? `HISTORY:\n${conversationHistory.join('\n')}\n\n` : ''}QUESTION: "${question}"`;

    const response = await aiInstance.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: STEELIE_DAN_SYSTEM_PROMPT,
        maxOutputTokens: 2048,
        temperature: 0.75,
      },
    });

    res.json({ answer: response.text || '' });
  } catch (error: any) {
    console.error('Error answering question on server:', error);
    res.status(503).json({
      isGeneric: true,
      error: error.message || 'Error answering question on server'
    });
  }
});

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  // Automated background polling: Initial startup sync + recurring 1-hour interval
  const runBackgroundDailySync = async () => {
    lastScrapeExecutionTime = new Date().toISOString();
    nextScheduledScrapeTime = new Date(Date.now() + HOURLY_POLL_MS).toISOString();
    try {
      console.log('[DFO Scraper Service] Executing scheduled hourly DFO sync...');
      const result = await syncDFODailyRecords({ year: 2026 });
      lastScrapeStatus = result.success ? (result.updatedRecordsCount > 0 ? 'SUCCESS' : 'PARTIAL') : 'ERROR';
      lastScrapeMessage = result.message;
      lastScrapeRecordsUpdated = result.updatedRecordsCount;
      console.log(`[DFO Scraper Service] Sync result [${lastScrapeStatus}]: ${result.message} (Updated: ${result.updatedRecordsCount})`);
    } catch (err: any) {
      lastScrapeStatus = 'ERROR';
      lastScrapeMessage = `Background sync exception: ${err.message}`;
      lastScrapeRecordsUpdated = 0;
      console.error('[DFO Scraper Service] Background sync failed:', err.message);
    }
  };

  // Run initial sync 2.5s after boot
  setTimeout(runBackgroundDailySync, 2500);

  // Recurring 1-hour polling interval (3600000 ms = 60 minutes)
  setInterval(runBackgroundDailySync, HOURLY_POLL_MS);
});

