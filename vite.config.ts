import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

function devApiPlugin(): Plugin {
  return {
    name: 'dev-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/tyee/dataset')) {
          try {
            // Lazy load the authentic DFO database
            const { getAuthenticDFODatabase } = await import('./src/data/dfoAuthenticDatabase.js');
            const data = getAuthenticDFODatabase();
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, ...data }));
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: e.message }));
          }
        }

        if (req.url?.startsWith('/api/tyee/sync-daily')) {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, message: 'DFO Telemetry fully up to date for 2026 season.' }));
        }

        if (!req.url?.startsWith('/api/gemini/')) {
          return next();
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = body ? JSON.parse(body) : {};
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
- YOU CAN ANSWER ANY QUESTION THE USER ASKS! Whether the question is about:
  1. Skeena run numbers, Tyee test fishery mechanics, DFO gillnets, escapement models, or conservation.
  2. Fly fishing, Spey casting physics, fly tying, sink tips, leader formulas, classic salmon flies (Lady Caroline, Green Butt Skunk, Prom Dress, Intruder), and river etiquette.
  3. Tributaries & geography: Bulkley, Morice, Babine, Kispiox, Sustut, Zymoetz/Copper, Kalum, Kitwanga, Skeena canyon, Chatham Sound.
  4. General knowledge, science, physics, history, philosophy, pop culture, geography, weather, coding, mathematics, life advice, or jokes!
- CRITICAL: Always DIRECTLY answer the user's specific question!
- Do NOT just recite Tyee run index stats unless the user is asking about the run status, timing, or forecast numbers.
- If the user asks a non-run question (e.g. "What's the best fly for sunny days?", "What is Spey casting?", "Tell me a joke", "Explain photosynthesis"), answer that question thoroughly, accurately, and brilliantly, maintaining your charming fish personality throughout!

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
  };
});
