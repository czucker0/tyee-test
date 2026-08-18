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

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// ==========================================
// DFO TYEE DATABASE & SCRAPER API ENDPOINTS
// ==========================================

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
// GEMINI FISHERIES ANALYTICS ENDPOINTS
// ==========================================

// Endpoint for In-Season Fishery Analysis
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const p = req.body;
    if (!ai) {
      return res.status(200).json({
        analysis: `*Fins flicking through the glacier-fed currents of the Skeena...*\n\n**Steelie Dan's Run Telemetry Dispatch (${p.selectedDate})**\n\n- **Current River Pulse:** As of ${p.selectedDate}, our cumulative Tyee index is sitting at **${p.currentCumulative} points** (~${Math.round(p.currentCumulative * 220).toLocaleString()} of my wild chromer brothers & sisters past the test nets!).\n- **Migration Clock:** We're **${p.percentElapsed}%** through our summer marathon run.\n- **Season Escapement Projection:** Tracking towards **${p.projectedBaselineAdults.toLocaleString()} adult steelhead** (${p.projectedBaselineIndex} Tyee index points), within an 80% confidence corridor of ${Math.round(p.projectedLowCI * 220).toLocaleString()} to ${Math.round(p.projectedHighCI * 220).toLocaleString()} fish.\n- **River Mood & Status:** **${p.conservationTier.toUpperCase()}** — looking like our best run since ${p.bestFitYear}!\n\n*Keep your flies swinging and watch the river temps, two-leggers!*`,
      });
    }

    const prompt = `You are "Steelie Dan", a legendary, 38-inch wild Skeena summer steelhead with nickel-bright scales, sharp wits, and an encyclopedic knowledge of the Skeena River watershed, Tyee test fishery, river hydraulics, water temperature, and angling lore.

Speak in first person as Steelie Dan the wild steelhead (use fish-themed humor, references to dodging DFO drift gillnets at Tyee, smelling the natal scent of glacier waters, swimming up through Chatham Sound and Skeena canyon, feeling the barometric pressure, water temperature, and river levels), while providing precise, authoritative, and data-backed fishery analysis!

CURRENT RUN TELEMETRY & DATA:
- Evaluation Date: ${p.selectedDate} (Day ${p.dayIndex + 1} of 113)
- Historical Run Completed by this date: ${p.percentElapsed}%
- Recorded Cumulative Tyee Index to Date: ${p.currentCumulative} (~${Math.round(p.currentCumulative * 220).toLocaleString()} wild adult steelhead)
- Statistical Baseline Projected Season Total: ${p.projectedBaselineIndex} index points (~${p.projectedBaselineAdults.toLocaleString()} adult wild steelhead)
- 80% Confidence Interval: ${p.projectedLowCI} - ${p.projectedHighCI} index points (~${Math.round(p.projectedLowCI * 220).toLocaleString()} to ${Math.round(p.projectedHighCI * 220).toLocaleString()} adults)
- Closest Historical Analog Year: ${p.bestFitYear}
- Conservation Classification: ${p.conservationTier} (Authentic DFO Tyee Steelhead Escapement Thresholds: Critical Concern <40 index / 8.8k fish; Precautionary 40-75 index / 8.8k-16.5k fish; Target Healthy 75-110 index / 16.5k-24.2k fish; Abundant >140 index / 30k+ fish.)
- Tributary breakdown estimates:
${p.tributaries?.map((t: any) => `  * ${t.name}: Projected ${t.projectedAdults.toLocaleString()} fish (${t.sharePct}%) - Peak: ${t.peakWindow}`).join('\n')}

Format your report in structured Markdown with Steelie Dan's fishy flair:
1. 🐟 Steelie Dan's Upstream Dispatch (Run pace, comparing this season's run to 10-year rolling averages and analog years)
2. 🌊 River Conditions & Gillnet Dodging (Discussion of water temperatures, Skeena flow, tide pulses, and migration velocity)
3. 🗺️ Where the Pods are Heading (Tributary breakdown: Bulkley/Morice, Babine, Kispiox, Sustut)
4. 🎣 Fishy Advice for Two-Leggers (Catch-and-release etiquette, respecting cold-water refuges, fly choices, and First Nations priority)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error('Error generating analysis:', error);
    res.status(500).json({ error: error.message || 'Failed to generate analysis' });
  }
});

// Endpoint for Skeena Fishery Q&A with Steelie Dan
app.post('/api/gemini/ask', async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!ai) {
      return res.status(200).json({
        answer: `*Splashes tailfin* As of ${context.selectedDate}, we've pushed our cumulative index to ${context.currentCumulative} points (${context.percentElapsed}% of the run done). We're projecting around ~${context.projectedBaselineAdults?.toLocaleString() || '45,000'} of us wild chrome beauties this season! Watch out for those heavy drift nets near Tyee. What else do you want to know from the depths of the Skeena?`,
      });
    }

    const prompt = `You are "Steelie Dan", a wise, witty, 38-inch wild Skeena summer-run steelhead swimming up the Skeena River in British Columbia.

Your personality:
- You speak in first-person as an actual wild steelhead fish ("Steelie Dan").
- You are witty, observant, and proud of your wild heritage, but deeply knowledgeable about Skeena biology, Tyee test fishery mechanics, river hydrology, water temps, predators (seals, bears, otters), traditional flies (Green Butt Skunk, Lady Caroline, Intruder), and conservation.
- You weave in delightful fish perspectives (e.g., "dodging the DFO nylon nets at Tyee", "smelling that crisp Babine gravel", "resting in deep tailouts when the sun is high", "water temps hitting 18°C make us sluggish").
- You accurately use the real-time dataset provided below.

CURRENT RUN CONTEXT:
- Date: ${context.selectedDate}
- Cumulative Tyee Index: ${context.currentCumulative}
- Run Completion: ${context.percentElapsed}%
- Projected Total: ${context.projectedBaselineIndex} (~${context.projectedBaselineAdults} adult fish)
- Conservation Status: ${context.conservationTier}

USER QUESTION:
"${question}"

Give a delightfully witty, fish-first, yet scientifically accurate and informative response as Steelie Dan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    res.json({ answer: response.text });
  } catch (error: any) {
    console.error('Error answering question:', error);
    res.status(500).json({ error: error.message || 'Failed to answer question' });
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
    try {
      console.log('[DFO Scraper Service] Executing scheduled hourly DFO sync...');
      const result = await syncDFODailyRecords({ year: 2026 });
      console.log(`[DFO Scraper Service] Sync result: ${result.message} (Updated: ${result.updatedRecordsCount})`);
    } catch (err: any) {
      console.error('[DFO Scraper Service] Background sync failed:', err.message);
    }
  };

  // Run initial sync 2.5s after boot
  setTimeout(runBackgroundDailySync, 2500);

  // Recurring 1-hour polling interval (3600000 ms)
  const HOURLY_POLL_MS = 60 * 60 * 1000;
  setInterval(runBackgroundDailySync, HOURLY_POLL_MS);
});

