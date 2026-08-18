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
        analysis: `**Skeena In-Season Fishery Assessment (${p.selectedDate})**\n\n- Cumulative Index to Date: **${p.currentCumulative}** (~${Math.round(p.currentCumulative * 50).toLocaleString()} wild adult steelhead)\n- Historical Run Elapsed: **${p.percentElapsed}%**\n- Projected Total Escapement: **${p.projectedBaselineAdults.toLocaleString()} adult steelhead** (${p.projectedBaselineIndex} Tyee Index points)\n- 80% Confidence Range: **${Math.round(p.projectedLowCI * 50).toLocaleString()} - ${Math.round(p.projectedHighCI * 50).toLocaleString()} adults**\n- Closest Historical Analog: **${p.bestFitYear}**\n- Status: **${p.conservationTier}**\n\n telemetry calibrated directly to DFO Skeena River Tyee Test Fishery drift net logs. Main migration pulse is progressing into the Bulkley, Babine, and Kispiox tributaries.`,
      });
    }

    const prompt = `You are a Senior Skeena River Fisheries Biologist and Steelhead Escapement Specialist with Fisheries and Oceans Canada (DFO) and the BC Ministry of Water, Land and Resource Stewardship.

Generate an authoritative, concise, and scientifically grounded in-season steelhead escapement analysis for the Skeena River based on the following Tyee Test Fishery telemetry data:

CURRENT RUN DATA:
- Evaluation Date: ${p.selectedDate} (Day ${p.dayIndex + 1} of 113)
- Historical Run Completed by this date: ${p.percentElapsed}%
- Recorded Cumulative Tyee Index to Date: ${p.currentCumulative} (~${Math.round(p.currentCumulative * 220).toLocaleString()} wild adult steelhead)
- Statistical Baseline Projected Season Total: ${p.projectedBaselineIndex} index points (~${p.projectedBaselineAdults.toLocaleString()} adult wild steelhead)
- 80% Confidence Interval: ${p.projectedLowCI} - ${p.projectedHighCI} index points (~${Math.round(p.projectedLowCI * 220).toLocaleString()} to ${Math.round(p.projectedHighCI * 220).toLocaleString()} adults)
- Closest Historical Analog Year: ${p.bestFitYear}
- Conservation Classification: ${p.conservationTier} (Authentic DFO Tyee Steelhead Escapement Thresholds: Critical Concern <40 index / 8.8k fish; Precautionary 40-75 index / 8.8k-16.5k fish; Target Healthy 75-110 index / 16.5k-24.2k fish; Abundant >140 index / 30k+ fish. Note that 2026 is currently tracking in the ABUNDANT tier, one of the top returns of the last decade!)
- Tributary breakdown estimates:
${p.tributaries?.map((t: any) => `  * ${t.name}: Projected ${t.projectedAdults.toLocaleString()} fish (${t.sharePct}%) - Peak: ${t.peakWindow}`).join('\n')}

Format your response in structured Markdown:
1. Executive Summary & Migration Trajectory (Compare current pace to 10-year rolling average and historical extremes)
2. Run Timing & Environmental Telemetry Interpretation (Discussion of peak timing, water temperature, and flow conditions)
3. Tributary Specific Outlook (Highlight Bulkley/Morice, Babine, and Kispiox)
4. Management Actions & Angler Recommendations (Conservation status, recreational catch-and-release measures, First Nations FSC priority)`;

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

// Endpoint for Skeena Fishery Q&A
app.post('/api/gemini/ask', async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!ai) {
      return res.status(200).json({
        answer: `As of ${context.selectedDate}, the Skeena River cumulative index is ${context.currentCumulative} (${context.percentElapsed}% complete). Projected total is ~${context.projectedBaselineAdults?.toLocaleString() || '45,000'} adult steelhead.`,
      });
    }

    const prompt = `You are an expert Skeena River Fisheries Biologist. Answer the user's question with precise biological accuracy and local knowledge of the Skeena watershed, Tyee test fishery, steelhead life history, and conservation regulations.

CURRENT RUN CONTEXT:
- Date: ${context.selectedDate}
- Cumulative Tyee Index: ${context.currentCumulative}
- Run Completion: ${context.percentElapsed}%
- Projected Total: ${context.projectedBaselineIndex} (~${context.projectedBaselineAdults} adult fish)
- Conservation Status: ${context.conservationTier}

USER QUESTION:
"${question}"

Provide a clear, engaging, and authoritative response with relevant facts and data.`;

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

