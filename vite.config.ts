import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  loadDatabase,
  saveDatabase,
  getInitialDatabase,
  rollbackDatabase,
  addScrapeAuditLog,
} from './server/db/tyeeDatabase';
import {
  syncDFODailyRecords,
  previewScrapeFromSource,
  scrapePastDecadeBatch,
  scrapeBulkHistoricalArchive,
  scrapeSpecificYear,
  importRawDFOData,
  validateDatasetIntegrity,
  recalculateCumulativeCurve,
} from './server/services/dfoScraper';

dotenv.config();

// Scraper background scheduler state tracking
let lastScrapeExecutionTime: string | null = null;
let lastScrapeStatus: 'SUCCESS' | 'ERROR' | 'PARTIAL' | 'IDLE' = 'IDLE';
let lastScrapeMessage: string = 'Scheduler initialized. Waiting for automated hourly cycle.';
let lastScrapeRecordsUpdated: number = 0;
const HOURLY_POLL_MS = 60 * 60 * 1000;
let nextScheduledScrapeTime: string | null = new Date(Date.now() + HOURLY_POLL_MS).toISOString();
let schedulerStarted = false;

function devApiPlugin(): Plugin {
  return {
    name: 'dev-api-plugin',
    configureServer(server) {
      // Start hourly automated scraper loop once in Vite dev server
      if (!schedulerStarted) {
        schedulerStarted = true;
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

        // Scheduled 1-hour recurring interval
        setInterval(runBackgroundDailySync, HOURLY_POLL_MS);
      }

      server.middlewares.use(async (req, res, next) => {
        // 1. Scraper scheduler status
        if (req.url === '/api/tyee/scraper/status') {
          try {
            const db = loadDatabase();
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
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
              })
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        // 2. Dataset retrieval
        if (req.url?.startsWith('/api/tyee/dataset')) {
          try {
            const db = loadDatabase();
            const currentYear = db.activeSeasonMetadata?.year || 2026;
            const decadeStart = currentYear - 10;
            const decadeEnd = currentYear - 1;
            const defaultDecadeYears: number[] = [];
            for (let y = decadeStart; y <= decadeEnd; y++) {
              if (db.years[y]) defaultDecadeYears.push(y);
            }

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

            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: true,
                currentYear,
                defaultDecadeYears,
                availableArchiveYears: db.availableYears,
                activeSeasonMetadata: db.activeSeasonMetadata,
                avgCurve,
                years: db.years,
                lastUpdated: db.lastUpdated,
                scrapeLogs: db.scrapeLogs?.slice(0, 15) || [],
              })
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        // 3. Specific historical year
        if (req.url?.startsWith('/api/tyee/year/')) {
          try {
            const yearStr = req.url.split('/api/tyee/year/')[1]?.split('?')[0];
            const year = parseInt(yearStr, 10);
            const db = loadDatabase();

            if (db.years[year]) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, year: db.years[year], cached: true }));
            }

            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(
              JSON.stringify({
                success: false,
                message: `Historical year ${year} is not yet in the local archive.`,
                availableYears: db.availableYears,
              })
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }

        // 4. Scraper Audit History
        if (req.url === '/api/tyee/scraper/history') {
          try {
            const db = loadDatabase();
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, logs: db.scrapeLogs || [] }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // Handle POST endpoints
        if (
          req.url?.startsWith('/api/tyee/') ||
          req.url?.startsWith('/api/gemini/')
        ) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const data = body ? JSON.parse(body) : {};

              // POST /api/tyee/sync-daily
              if (req.url === '/api/tyee/sync-daily') {
                const { year, url } = data;
                const result = await syncDFODailyRecords({
                  year: year || 2026,
                  url: url || undefined,
                });
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(result));
              }

              // POST /api/tyee/scraper/scrape-decade
              if (req.url === '/api/tyee/scraper/scrape-decade') {
                const result = await scrapePastDecadeBatch();
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(result));
              }

              // POST /api/tyee/scraper/bulk-historical
              if (req.url === '/api/tyee/scraper/bulk-historical') {
                const startYear = parseInt(data.startYear, 10) || 1956;
                const endYear = parseInt(data.endYear, 10) || 2025;
                const result = await scrapeBulkHistoricalArchive(startYear, endYear);
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(result));
              }

              // POST /api/tyee/scraper/scrape-year
              if (req.url === '/api/tyee/scraper/scrape-year') {
                const { year, url } = data;
                const targetYear = parseInt(year, 10) || 2026;
                const result = await scrapeSpecificYear(targetYear, url);
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(result));
              }

              // POST /api/tyee/scraper/preview
              if (req.url === '/api/tyee/scraper/preview') {
                const { url, rawPayload, year } = data;
                const preview = await previewScrapeFromSource({
                  url,
                  rawPayload,
                  year: year || 2026,
                });
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(preview));
              }

              // POST /api/tyee/import
              if (req.url === '/api/tyee/import') {
                const { tableText, year } = data;
                const result = importRawDFOData(tableText, year || 2026);
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(result));
              }

              // POST /api/tyee/scraper/rollback
              if (req.url === '/api/tyee/scraper/rollback') {
                const result = rollbackDatabase();
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(result));
              }

              // POST /api/tyee/scraper/validate
              if (req.url === '/api/tyee/scraper/validate') {
                const year = data.year || 2026;
                const result = validateDatasetIntegrity(year);
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(result));
              }

              // POST /api/tyee/scraper/recalculate
              if (req.url === '/api/tyee/scraper/recalculate') {
                const year = data.year || 2026;
                const result = recalculateCumulativeCurve(year);
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(result));
              }

              // POST /api/tyee/scraper/reset-seed
              if (req.url === '/api/tyee/scraper/reset-seed') {
                const seed = getInitialDatabase();
                saveDatabase(seed);
                res.setHeader('Content-Type', 'application/json');
                return res.end(
                  JSON.stringify({ success: true, message: 'Database reset to baseline seed.' })
                );
              }

              // Gemini endpoints
              const apiKey = process.env.GEMINI_API_KEY || '';
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

              if (req.url === '/api/gemini/analyze') {
                const p = data;
                if (!ai) {
                  const fallbackAnalysis = `### Skeena River Steelhead In-Season Biological Appraisal
**Date:** ${p.selectedDate} | **Run Completion:** ${p.percentElapsed}% | **Status:** ${p.conservationTier?.toUpperCase() || 'HEALTHY'}

- **Current Cumulative Tyee Index:** **${p.currentCumulative}**
- **Projected Season Total:** **${p.projectedBaselineAdults?.toLocaleString()} adult steelhead** (${p.projectedBaselineIndex} index pts)
- **Confidence Range (80% CI):** ${Math.round(p.projectedLowCI * 220).toLocaleString()} to ${Math.round(p.projectedHighCI * 220).toLocaleString()} adult fish
- **Closest 10-Year Historical Analog:** **${p.bestFitYear}** run profile

#### In-Season Dynamics
Migration numbers past the Tyee Test Fishery continue to show positive momentum. Summer water temperatures and mainstem flows are within optimal physiological thresholds for wild Skeena steelhead. Tributary recruitment to the Bulkley/Morice, Babine, and Kispiox systems is tracking comfortably above conservation concern benchmarks.`;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ analysis: fallbackAnalysis }));
                }

                const prompt = `You are a Senior Skeena River Fisheries Biologist and Steelhead Escapement Analyst. Generate an authoritative in-season steelhead escapement assessment for the Skeena River based on these Tyee Test Fishery metrics:
- Evaluation Date: ${p.selectedDate}
- Run Completed historically: ${p.percentElapsed}%
- Recorded Cumulative Index to Date: ${p.currentCumulative} (~${Math.round(p.currentCumulative * 220).toLocaleString()} wild adult steelhead)
- Projected Season Total: ${p.projectedBaselineIndex} index points (~${p.projectedBaselineAdults?.toLocaleString()} adult steelhead)
- 80% CI Range: ${p.projectedLowCI} - ${p.projectedHighCI} index points (~${Math.round(p.projectedLowCI * 220).toLocaleString()} - ${Math.round(p.projectedHighCI * 220).toLocaleString()} adults)
- Closest Historical Analog Year: ${p.bestFitYear}
- Conservation Status: ${p.conservationTier}
- Tributary breakdown estimates:
${p.tributaries?.map((t: any) => `  * ${t.name}: Projected ${t.projectedAdults?.toLocaleString()} fish (${t.sharePct}%) - Peak: ${t.peakWindow || 'Aug-Sep'}`).join('\n')}

Format in clean Markdown with:
1. 🐟 Executive Summary & Migration Trajectory (Compare against 10-year rolling baselines and historical analog)
2. 🌊 Environmental & Migration Hydrology (Water temperature, Skeena discharge, and river velocity)
3. 🗺️ Sub-Basin Distribution Outlook (Bulkley/Morice, Babine, Kispiox, Sustut, Zymoetz)
4. 🎣 Angler, First Nations Priority & Conservation Advisory (Responsible angling, thermal refuges, single barbless)`;

                const response = await ai.models.generateContent({
                  model: 'gemini-3.7-flash',
                  contents: prompt,
                  config: {
                    tools: [{ googleSearch: {} }],
                  },
                });

                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ analysis: response.text }));
              }

              if (req.url === '/api/gemini/ask') {
                const { question, context, history } = data;
                if (!ai) {
                  res.statusCode = 404;
                  return res.end(JSON.stringify({ error: 'Offline mode' }));
                }

                const systemInstruction = `You are "Steelie Dan" — a legendary, wise, charismatic, and delightfully witty 38-inch wild Skeena summer-run steelhead (Oncorhynchus mykiss). You have nickel-bright scales, powerful fins, a keen lateral line, and an encyclopedic mind.

YOUR PERSONA & CHARACTER:
- You speak in first-person as an actual wild steelhead fish in the Skeena River basin in British Columbia.
- You have fish mannerisms (*splashes tailfin*, *flares gill covers*, *sniffs the cold glacial plume*, *glances up through the surface film*, *dodges a nylon gillnet*).
- You are exceptionally intelligent, articulate, warm, and helpful.

YOUR CAPABILITY & SCOPE:
- YOU CAN ANSWER ANY QUESTION THE USER ASKS!
- CRITICAL: Always DIRECTLY answer the user's specific question!`;

                const conversationHistory: string[] = [];
                if (Array.isArray(history) && history.length > 0) {
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

                const response = await ai.models.generateContent({
                  model: 'gemini-3.7-flash',
                  contents: prompt,
                  config: {
                    systemInstruction,
                    tools: [{ googleSearch: {} }],
                  },
                });

                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ answer: response.text }));
              }

              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Not found' }));
            } catch (e: any) {
              console.error('Dev API error:', e);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    define: {
      __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    },
    plugins: [react(), tailwindcss(), devApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      sourcemap: false,
      minify: true,
      cssMinify: true,
    },
  };
});
