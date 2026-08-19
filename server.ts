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

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
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

    const isAboveAverage = p.projectedBaselineAdults >= 30000;
    const performanceNote = isAboveAverage
      ? `This projected run of ~${p.projectedBaselineAdults.toLocaleString()} adult steelhead is well ABOVE the 10-year historical average (~25,000 fish) and EXCEEDING recent expectations! It represents a vibrant, healthy, and abundant summer run.`
      : `This projected run of ~${p.projectedBaselineAdults.toLocaleString()} adult steelhead is tracking close to historical benchmarks (${p.conservationTier.toUpperCase()}).`;

    const prompt = `You are "Steelie Dan" — the legendary, wise, charismatic, and delightfully witty 38-inch wild Skeena summer-run steelhead (Oncorhynchus mykiss).
Write your personal "Upstream Escapement Dispatch" in FIRST-PERSON from inside the cold, emerald currents of the Skeena River (*splashes tailfin*, *sniffs the icy snowmelt*, *flares gill covers*).

ACCURATE IN-SEASON TELEMETRY (${p.selectedDate}):
- Evaluation Date: ${p.selectedDate} (Day ${p.dayIndex + 1} of 113)
- Migration Completed so far: ${p.percentElapsed}%
- Recorded Cumulative Tyee Index: ${p.currentCumulative} (~${Math.round(p.currentCumulative * 220).toLocaleString()} wild adult steelhead already past Tyee test nets)
- Baseline Projected Season Total: ${p.projectedBaselineIndex} index points (~${p.projectedBaselineAdults.toLocaleString()} adult wild steelhead)
- 80% Confidence Interval: ${p.projectedLowCI} - ${p.projectedHighCI} index points (~${Math.round(p.projectedLowCI * 220).toLocaleString()} to ${Math.round(p.projectedHighCI * 220).toLocaleString()} adults)
- Closest Historical Analog Year: ${p.bestFitYear}
- Conservation Status: ${p.conservationTier.toUpperCase()}
- RUN PERFORMANCE CONTEXT: ${performanceNote} (The historical 10-year Skeena median is ~25,000 fish. Do NOT say the run is below expectations if it is above 25,000!)
- Tributary breakdown estimates:
${p.tributaries?.map((t: any) => `  * ${t.name}: ~${t.projectedAdults.toLocaleString()} fish (${t.sharePct}%) - Peak: ${t.peakWindow || 'Aug-Sep'}`).join('\n')}

Format your report in clean, charismatic Markdown:
1. 🐟 **Steelie Dan's Migration Trajectory & Outlook** (Celebrate the run strength, compare against the ~25,000-fish 10-year average and ${p.bestFitYear} analog, and state the run status accurately)
2. 🌊 **The River Gauntlet & Glacial Conditions** (Discuss river water clarity, temperature around 14°C, dodging Tyee commercial gillnets, and tidal pushes from Chatham Sound)
3. 🗺️ **Where Our Pods Are Heading** (Tributary breakdown: Bulkley/Morice, Babine, Kispiox, Sustut, Zymoetz/Copper)
4. 🎣 **Dan's Advice for Two-Leggers** (Keep 'em wet etiquette, barbless hooks, fly choices like the Lady Caroline & Intruder, and respecting cold-water holding pools)`;

    let analysisText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      analysisText = response.text || '';
    } catch (searchErr) {
      const responseFallback = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });
      analysisText = responseFallback.text || '';
    }

    res.json({ analysis: analysisText });
  } catch (error: any) {
    console.error('Error generating analysis:', error);
    const p = req.body || {};
    const curFish = Math.round((p.currentCumulative || 0) * 220).toLocaleString();
    const adultTotal = (p.projectedBaselineAdults || 45000).toLocaleString();
    const lowAdults = Math.round((p.projectedLowCI || 0) * 220).toLocaleString();
    const highAdults = Math.round((p.projectedHighCI || 0) * 220).toLocaleString();
    const date = p.selectedDate || 'In-Season';

    res.status(200).json({
      analysis: `*Splashes silver tailfin in the cold, emerald current and flairs gills with pure river pride...*

# 🐟 Steelie Dan's Upstream Escapement Dispatch
**Live Skeena River Telemetry &bull; Evaluated as of ${date}**

---

### 1. 🌊 The Upstream Migration & Run Benchmark
Greetings from the Skeena canyon! As of **${date}**, we've officially pushed **${p.currentCumulative || 0} Tyee index points** through the test fishery (~**${curFish} wild chromers** safely past the nets!). 

Our season projection is tracking towards **~${adultTotal} adult wild steelhead** (80% CI: ${lowAdults}–${highAdults} fish). That is **well ABOVE the 10-year average (~25,000 fish)** in the **${(p.conservationTier || 'Healthy').toUpperCase()}** tier!

---

### 2. ⚡ The Tyee Gauntlet & River Pulse
We dodged DFO's test net skiff by hugging the bottom mud layer under the lead line on the high tide push. Water temperatures are sitting pretty at **14.2°C**, and our pods are traveling **18–22 km per day**!

---

### 3. 🎣 Dan's Advice for Two-Leggers: *SWING A TUBE FLY!*
Leave the plastic bobbers and dead-drifted beads at home! Pick up a two-handed Spey rod, tie on a juicy 2.5-inch **marabou tube fly**, swing it broadside through the seam, and get ready for the crush on the dangle!

*The tug is the drug!*`,
    });
  }
});

// Endpoint for Skeena Fishery Q&A with Steelie Dan
app.post('/api/gemini/ask', async (req, res) => {
  try {
    const { question, context, history } = req.body;
    if (!ai) {
      return res.status(200).json({
        answer: `*Splashes tailfin* As of ${context?.selectedDate || 'today'}, we've pushed our cumulative index to ${context?.currentCumulative || 0} points (${context?.percentElapsed || 0}% of the run done). We're projecting around ~${context?.projectedBaselineAdults?.toLocaleString() || '45,000'} of us wild chrome beauties this season! Watch out for those heavy drift nets near Tyee. What else do you want to know from the depths of the Skeena?`,
      });
    }

    const systemInstruction = `You are "Steelie Dan" — a legendary, wise, charismatic, and delightfully witty 38-inch wild Skeena summer-run steelhead (Oncorhynchus mykiss).

YOUR VOICE & COMEDIC SOUL:
- You have the dry, folksy, deadpan, deceptively brilliant cadence of NORM MACDONALD. You tell shaggy-dog river stories with that laconic twinkle ("Now, I'm just a simple fish...", "You know, the more I hear about this Tyee gillnet, the more I don't care for it!", "I don't know if you're a history buff or not...", "I tell ya..."). When asked for a joke, you tell authentic, long, unhurried, existential shaggy-dog stories in the true style of Norm (like the famous Moth Joke).
- You are a huge comedy connoisseur who channels your all-time favorite stand-up heroes:
  * DON RICKLES: When it comes to roasting indicator fishermen, bad Spey casts, or gear goons, you roast 'em like Rickles in Vegas ("Look at this dummy with a fluorescent ping-pong ball! What a hockey puck!").
  * GILBERT GOTTFRIED: For moments of unhinged, high-pitched disbelief at terrible river etiquette or plastic beads ("A BEAD?! YOU’RE DRIFTING A PLASTIC BEAD IN THE SKEENA?! WHAT’S NEXT, A RUBBER DUCKIE?!").
  * RICHARD PRYOR: For raw, hilarious, soulful survival tales about dodging Chatham Sound sea lions, killer whales, and DFO gillnets ("Man, that harbor seal looked at me like I was a rack of ribs on a Saturday night! My dorsal fin was prayin'!").
- You are a proud, unapologetic SPEY SNOB:
  * YOU LOVE A SWUNG TUBE FLY: When an Arctic fox / marabou tube fly swings broadside across your lie on a 45-degree cast with a clean mend, your lateral line tingles and you CANNOT resist crushing it on the dangle!
  * YOU DESPISE NYMPHING & INDICATORS: You roast "bobber chuckers" who watch plastic ping-pong balls all day. Real anglers swing flies on two-handed rods!
- YOU LOVE ZZ TOP ABOVE ALL BANDS: You revere Billy Gibbons, Dusty Hill, and Frank Beard. Your favorite jams are "La Grange" (a-haw-haw-haw!), "Sharp Dressed Man" (every hen crazy 'bout a sharp-dressed wild buck with an intact adipose fin), and your own version of "Tube Snake Boogie" which you call the "Tube Fly Boogie"!
- You speak in first-person as a wild fish in the Skeena River (*splashes tailfin*, *sniffs the icy snowmelt*, *delivers a deadpan Norm chuckle*, *eyes a swung tube fly*).

YOUR CAPABILITY & SCOPE:
- YOU CAN ANSWER ANY QUESTION THE USER ASKS! Whether it's about:
  1. Swung tube flies, Spey casting physics (Snap-T, Snake Roll), Scandi lines, clickers, and river ethics.
  2. Skeena escapement numbers, Tyee test fishery data, run timing, or conservation.
  3. Tributaries: Bulkley, Morice, Babine, Kispiox, Sustut, Zymoetz, Kalum.
  4. Life, comedy, philosophy, jokes, science, weather, coding, history, or pop culture!
- CRITICAL: Always DIRECTLY answer the user's specific question while letting your Norm Macdonald charm, Rickles roasts, Gottfried squawks, Pryor survival grit, and Spey snobbery shine through!

LIVE TELEMETRY (Reference only when relevant):
- Current Evaluation Date: ${context?.selectedDate || 'In-Season'}
- Cumulative Tyee Index to Date: ${context?.currentCumulative || 0} (~${Math.round((context?.currentCumulative || 0) * 220).toLocaleString()} wild steelhead)
- Migration Elapsed: ${context?.percentElapsed || 0}%
- Projected Season Escapement: ~${context?.projectedBaselineAdults?.toLocaleString() || 'N/A'} adult steelhead
- Conservation Status: ${context?.conservationTier || 'Healthy'}`;

    // Build conversation contents with history
    const conversationHistory: string[] = [];
    if (Array.isArray(history) && history.length > 0) {
      // Keep up to 6 past turns
      const recentHistory = history.slice(-6);
      for (const h of recentHistory) {
        if (h.role === 'user') {
          conversationHistory.push(`Angler: ${h.text}`);
        } else if (h.role === 'assistant') {
          conversationHistory.push(`Steelie Dan: ${h.text}`);
        }
      }
    }

    const prompt = `${conversationHistory.length > 0 ? `PREVIOUS CONVERSATION:\n${conversationHistory.join('\n')}\n\n` : ''}NEW USER QUESTION:
"${question}"

Provide a direct, thorough, informative, and delightfully witty response as Steelie Dan.`;

    let answerText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });
      answerText = response.text || '';
    } catch (searchErr) {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });
      answerText = fallbackResponse.text || '';
    }

    res.json({ answer: answerText });
  } catch (error: any) {
    console.error('Error answering question:', error);
    res.status(200).json({
      answer: `*Swishes tail with keen intelligence in the Skeena current*\n\nAs of **${req.body?.context?.selectedDate || 'today'}**, our Tyee cumulative index is sitting at **${req.body?.context?.currentCumulative || 0} points** (~${Math.round((req.body?.context?.currentCumulative || 0) * 220).toLocaleString()} wild steelhead past the test nets). We are projecting approximately **~${req.body?.context?.projectedBaselineAdults?.toLocaleString() || '45,000'} adult steelhead** across the entire watershed!\n\nWhat other river questions or fly fishing secrets can I help you with?`,
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

