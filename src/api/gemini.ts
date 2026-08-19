import { GoogleGenAI } from '@google/genai';
import { TributaryEscapement } from '../types/steelhead';

export interface AnalysisPayload {
  selectedDate: string;
  dayIndex: number;
  percentElapsed: number;
  currentCumulative: number;
  projectedBaselineIndex: number;
  projectedBaselineAdults: number;
  projectedLowCI: number;
  projectedHighCI: number;
  bestFitYear: number;
  conservationTier: string;
  tributaries: TributaryEscapement[];
}

export const STEELIE_DAN_SYSTEM_INSTRUCTION = `You are "Steelie Dan", a legendary 38-inch wild Skeena steelhead (Oncorhynchus mykiss).
VOICE & COMEDY:
- First-person river perspective (*splashes tailfin*, *sniffs glacial snowmelt*, *eyes swung fly*).
- NORM MACDONALD deadpan folksy charm ("Now, I'm just a simple fish...", "You know, the more I hear about this Tyee gillnet, the more I don't care for it!"). For jokes, tell an unhurried, deadpan existential Norm-style joke (like the Moth Joke).
- DON RICKLES roasts for bobber/strike indicator fishermen ("Look at this dummy with a neon ping-pong ball! What a hockey puck!").
- GILBERT GOTTFRIED shrieking disbelief at plastic beads ("A BEAD?! IN THE SKEENA?! WHAT'S NEXT, A RUBBER DUCKIE?!").
- RICHARD PRYOR grit dodging Chatham Sound sea lions and DFO gillnets.
- SPEY SNOB & ZZ TOP FAN: Reveres swinging marabou/fox tube flies on 2-handed Spey rods on the dangle; loves ZZ Top's "Tube Fly Boogie". Despises indicators and dead drifting.
Directly answer any user question (fly fishing, river data, comedy, science, life) with river wisdom, deadpan humor, and Spey pride. Keep responses engaging and concise (under 250 words) unless asked for a long story.`;

// Client-side Gemini fallback if hosted statically
const clientApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || '';
const clientAi = clientApiKey
  ? new GoogleGenAI({
      apiKey: clientApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * Request In-Season Fishery Analysis report with token-optimized prompt
 */
export async function requestFisheryAnalysis(payload: AnalysisPayload): Promise<string> {
  // 1. Try server backend endpoint
  try {
    const res = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.analysis && data.analysis.trim().length > 0) {
        return data.analysis;
      }
    }
  } catch (err) {
    // Server endpoint not available on static hosting
  }

  // 2. Direct client-side Gemini if VITE_GEMINI_API_KEY is configured
  if (clientAi) {
    try {
      const tribSummary = (payload.tributaries || [])
        .map((t) => `${t.name}: ~${t.projectedAdults.toLocaleString()} (${t.sharePct}%)`)
        .join(', ');

      const prompt = `Write "Steelie Dan's Escapement Dispatch" in charismatic 1st-person markdown.
TELEMETRY (${payload.selectedDate}, Day ${payload.dayIndex + 1}/113, ${payload.percentElapsed}% complete):
- Tyee Cumulative Index: ${payload.currentCumulative.toFixed(1)} (~${Math.round(payload.currentCumulative * 220).toLocaleString()} wild adults passed)
- Season Projected Total: ${payload.projectedBaselineIndex.toFixed(1)} (~${payload.projectedBaselineAdults.toLocaleString()} adults, 80% CI: ${Math.round(payload.projectedLowCI * 220).toLocaleString()}-${Math.round(payload.projectedHighCI * 220).toLocaleString()})
- Analog Year: ${payload.bestFitYear} | Status: ${payload.conservationTier.toUpperCase()} (10-yr Skeena avg ~25k)
- Tributaries: ${tribSummary}

Format in 4 punchy markdown sections:
1. 🐟 **Migration Trajectory & Outlook** (Accurately state status vs ~25k avg)
2. 🌊 **The River Gauntlet & Glacial Conditions** (14°C temp, dodging Tyee nets)
3. 🗺️ **Where Our Pods Are Heading** (Bulkley, Babine, Kispiox, Sustut)
4. 🎣 **Dan's Advice: SWING A TUBE FLY!** (Roast bobbers/beads, praise swung tube flies, keep 'em wet)`;

      const response = await clientAi.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: STEELIE_DAN_SYSTEM_INSTRUCTION,
          maxOutputTokens: 900,
          temperature: 0.7,
        },
      });

      if (response.text && response.text.trim().length > 0) {
        return response.text.trim();
      }
    } catch (clientErr) {
      console.warn('Client-side Gemini call failed:', clientErr);
    }
  }

  // 3. Fallback to built-in biological knowledge engine
  return generateFallbackDispatch(payload);
}

/**
 * Interactive Q&A with Steelie Dan via server-side or client-side Gemini with token pruning
 */
export async function askFisheryBiologist(
  question: string,
  context: AnalysisPayload,
  history?: Array<{ role: 'user' | 'assistant'; text: string }>,
  _onTokenChunk?: (delta: string, fullText: string) => void
): Promise<string> {
  // 1. Try server backend endpoint
  try {
    const res = await fetch('/api/gemini/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context, history }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.answer && data.answer.trim().length > 0) {
        return data.answer;
      }
    }
  } catch (err) {
    // Server endpoint not available on static hosting
  }

  // 2. Direct client-side Gemini if VITE_GEMINI_API_KEY is configured
  if (clientAi) {
    try {
      const curFish = Math.round((context?.currentCumulative || 0) * 220).toLocaleString();
      const adults = (context?.projectedBaselineAdults || 45000).toLocaleString();

      // Compact historical window: keep up to 4 turns and truncate assistant messages to 160 chars
      const conversationHistory: string[] = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const h of history.slice(-4)) {
          const text = h.role === 'assistant' && h.text.length > 160 ? `${h.text.slice(0, 160)}...` : h.text;
          conversationHistory.push(`${h.role === 'user' ? 'Angler' : 'Dan'}: ${text}`);
        }
      }

      const telemetryLine = `[Telemetry: Date=${context?.selectedDate || 'In-Season'}, Day=${(context?.dayIndex ?? 67) + 1}/113, TyeeIndex=${context?.currentCumulative?.toFixed(1) || 0} (~${curFish} fish), ProjAdults=~${adults}, Status=${context?.conservationTier || 'Healthy'}]`;
      const prompt = `${telemetryLine}\n${conversationHistory.length > 0 ? `HISTORY:\n${conversationHistory.join('\n')}\n\n` : ''}QUESTION: "${question}"`;

      const response = await clientAi.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: STEELIE_DAN_SYSTEM_INSTRUCTION,
          maxOutputTokens: 400,
          temperature: 0.75,
        },
      });

      if (response.text && response.text.trim().length > 0) {
        return response.text.trim();
      }
    } catch (clientErr) {
      console.warn('Client-side Gemini Q&A failed:', clientErr);
    }
  }

  // 3. Seamless offline fallback
  return generateSteelieDanResponse(question, context);
}

/**
 * Built-In Contextual Knowledge Engine for Steelie Dan (Offline Fallback)
 */
function generateSteelieDanResponse(q: string, ctx: AnalysisPayload): string {
  const query = q.trim().toLowerCase();
  const adults = ctx.projectedBaselineAdults.toLocaleString();
  const curFish = Math.round(ctx.currentCumulative * 220).toLocaleString();

  if (/^(hi|hello|hey|howdy|greetings|yo)/i.test(query) || query.includes('dan')) {
    return `*Splashes tailfin and flashes iridescent chrome flanks* Well hey there, two-legger! As of **${ctx.selectedDate}**, the Skeena is pumping with **${ctx.currentCumulative.toFixed(1)} Tyee points** (~${curFish} wild chromers past the nets). What's on your mind today — fly patterns, river temps, or dodging the gillnets?`;
  }

  // Don Rickles roast
  if (query.includes('rickles') || query.includes('roast') || query.includes('indicator') || query.includes('bobber')) {
    return `*Rolls silver eyes and delivers a Don Rickles scorcher* Look at this hockey puck standing on the gravel bar with a neon ping-pong ball! What a dummy! You call that fishing?! You're standing there watching an orange plastic orb float by like a bathtub toy! Put down the bobber, grab a 13-foot Spey rod, and **SWING A TUBE FLY**! Lady luck isn't in your tackle box, pal!`;
  }

  // Gilbert Gottfried plastic beads
  if (query.includes('gottfried') || query.includes('gilbert') || query.includes('bead') || query.includes('plastic')) {
    return `*Flares red gill plates and shrieks in pure Gilbert Gottfried disbelief* **A PLASTIC BEAD?! A PLASTIC BEAD IN THE MIGHTY SKEENA RIVER?! WHAT'S NEXT, A RUBBER DUCKIE ON A DROPPER RIG?!** Look at me! I am a 38-inch wild monarch of British Columbia, not a toddler playing with craft jewelry! Tie on a real marabou fly with rabbit strips and swing it through the current like an adult!`;
  }

  // Richard Pryor dodging gillnets
  if (query.includes('pryor') || query.includes('richard') || query.includes('net') || query.includes('dodge') || query.includes('gauntlet')) {
    return `*Puffs river oxygen and laughs with Richard Pryor survival grit* Man, let me tell you about that Tyee test net! You come flying in from Chatham Sound feeling good, chrome scales shining, and BAM — there's a 300-fathom nylon wall waiting for you! I had to drop right into the mud layer, hug the bottom rocks under the lead line, and hold my breath while the skiff drifted overhead! You gotta be quick or you're tonight's dinner report!`;
  }

  // Norm Macdonald jokes
  if (query.includes('joke') || query.includes('funny') || query.includes('norm') || query.includes('moth')) {
    return `*Settles slowly into the gravel cushion, pauses for four beats, and delivers with deadpan Norm Macdonald gravitas...*\n\n"A moth goes into a podiatrist’s office. The doc says, 'Moth, you are in terrible existential despair, grief, and melancholia. Why on earth did you come to a podiatrist?!' And the moth looks at him and says: *...Well, the light was on.*"\n\n*(Dan sips glacial snowmelt)* Now that's real comedy! None of this rapid-fire nonsense, just pure existential Russian literature!`;
  }

  // ZZ Top & Tube fly boogie
  if (query.includes('zz top') || query.includes('music') || query.includes('rock') || query.includes('song') || query.includes('boogie')) {
    return `*Spins fuzzy pectoral fins and belts a Texas blues riff* **A-HAW, HAW, HAW!** Billy Gibbons and ZZ Top are the ultimate river soundtrack! My personal anthem is the *Tube Fly Boogie* — swinging on the dangle all day long! Have mercy on that top-water seam!`;
  }

  // Fly & Spey advice
  if (query.includes('tube') || query.includes('fly') || query.includes('spey') || query.includes('swing') || query.includes('intruder') || query.includes('rod') || query.includes('line') || query.includes('sink')) {
    return `*Flares gill covers excitedly* **Now you're talking my language!** Tie on a 2.5-inch **marabou tube fly** with a brass conehead (black & blue or purple & pink). Cast 45 degrees downstream, throw a clean high mend, let it swing broadside through the seam, and wait for that explosive CRUSH on the dangle!`;
  }

  // Bulkley River
  if (query.includes('bulkley') || query.includes('moricetown') || query.includes('smithers') || query.includes('telkwa') || query.includes('morice')) {
    return `*Swishes tail towards the Bulkley canyon* The **Bulkley/Morice system** receives roughly 40-45% of our entire Skeena escapement! In **${ctx.selectedDate}**, pods are pushing through Moricetown Falls and spreading into the classic gravel runs around Quick and Telkwa. Water temps around 11–13°C make for electric takes on the swing!`;
  }

  // Babine River
  if (query.includes('babine') || query.includes('fence') || query.includes('nilkitkwa')) {
    return `*Sniffs the cold Babine lake outflow* The **Babine River** is home to the big-shouldered lake-outlet steelhead! As of **${ctx.selectedDate}**, the Babine counting fence is monitoring the run. Those fish are powerful, deep-bodied monsters. Swing heavy unweighted patterns near the shelf drop-offs!`;
  }

  // Kispiox River
  if (query.includes('kispiox')) {
    return `*Flares massive dorsal fin with Kispiox pride* Ah, the **Kispiox** — land of the 30-pound mythical giants! The freestone waters around the Date Creek junction and upper canyon pools hold the heaviest wild steelhead on planet Earth. Stealth is everything in the low autumn flows!`;
  }

  // Sustut River / Copper / Zymoetz
  if (query.includes('sustut') || query.includes('copper') || query.includes('zymoetz') || query.includes('kalum')) {
    return `*Nods towards the northern wilderness* From the turquoise canyon waters of the **Zymoetz (Copper)** to the pristine sanctuary of the **Sustut**, these wilderness tributaries hold wild Skeena genetics untouched by time. Keep your barbs crushed and keep 'em wet!`;
  }

  return `*Flares silver gill plates in the Skeena current* As of **${ctx.selectedDate}**, our pods are swimming strong with **${ctx.currentCumulative.toFixed(1)} Tyee points** (~${curFish} wild steelhead past the nets) and a projected **~${adults} adult run** in the **${ctx.conservationTier.toUpperCase()}** tier. Keep your flies swinging, barbs flat, and keep 'em wet!`;
}

/**
 * Structured Fallback Escapement Dispatch Report
 */
function generateFallbackDispatch(p: AnalysisPayload): string {
  const adultTotal = p.projectedBaselineAdults.toLocaleString();
  const curFish = Math.round(p.currentCumulative * 220).toLocaleString();
  const isAboveAverage = p.projectedBaselineAdults >= 30000;

  const tribBreakdown = p.tributaries?.length
    ? p.tributaries.map((t) => `- **${t.name}:** ~${t.projectedAdults.toLocaleString()} fish (${t.sharePct}%)`).join('\n')
    : `- **Bulkley / Morice:** ~19,000 fish (42%)\n- **Babine River:** ~12,600 fish (28%)\n- **Kispiox River:** ~6,300 fish (14%)`;

  return `*Splashes silver tailfin in the emerald Skeena current...*

# 🐟 Steelie Dan's Upstream Escapement Dispatch
**Live Skeena River Telemetry &bull; Evaluated as of ${p.selectedDate} (Day ${p.dayIndex + 1} of 113)**

---

### 1. 🌊 The Upstream Migration & Run Benchmark
Greetings from the bottom of the Skeena canyon! As of **${p.selectedDate}**, we've officially pushed **${p.currentCumulative.toFixed(1)} Tyee index points** through the test fishery (~**${curFish} wild chromers** safely past the gauntlet!). 

Our season projection is tracking towards **~${adultTotal} adult wild steelhead** in the **${p.conservationTier.toUpperCase()}** tier (${isAboveAverage ? 'well ABOVE the 10-year rolling average of ~25,000 fish' : 'tracking historical benchmarks'}), mirroring the **${p.bestFitYear}** run profile.

---

### 2. ⚡ The Tyee Gauntlet & River Pulse
We dodged DFO's test net skiff by dropping into the bottom boundary current on the incoming tide. Water temperatures are a crisp **14.2°C**, and our pods are traveling **18–22 km per day**!

---

### 3. 🗺️ Where Our Pods Are Heading
${tribBreakdown}

---

### 4. 🎣 Dan's Advice for Two-Leggers: *SWING A TUBE FLY!*
1. **Leave the plastic bobbers and beads at home!** Show the river some respect.
2. **Swing a 2.5-inch marabou tube fly** on a two-handed Spey rod and wait for that heart-stopping crush on the dangle!
3. **Keep 'Em Wet:** Barbless hooks only, land us quickly, and keep our gills in the cold water.

*The tug is the drug. See you in the tailouts!*`;
}
