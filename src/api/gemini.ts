import { GoogleGenAI } from '@google/genai';
import { ProjectionModelResult, TributaryEscapement } from '../types/steelhead';

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

// Client-side Gemini fallback if hosted statically on Hostinger without a Node daemon
const clientApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
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
 * Request comprehensive In-Season Fishery Analysis report from the Gemini Fisheries API
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
      const prompt = `You are a Senior Skeena River Fisheries Biologist. Generate an authoritative in-season steelhead escapement assessment for the Skeena River based on these metrics:
- Evaluation Date: ${payload.selectedDate} (Day ${payload.dayIndex + 1} of 113)
- Run Completed: ${payload.percentElapsed}%
- Recorded Cumulative Tyee Index: ${payload.currentCumulative.toFixed(1)} (~${Math.round(payload.currentCumulative * 220).toLocaleString()} wild adults)
- Baseline Projected Season: ${payload.projectedBaselineIndex.toFixed(1)} index points (~${payload.projectedBaselineAdults.toLocaleString()} adult steelhead)
- 80% CI: ${payload.projectedLowCI.toFixed(1)} - ${payload.projectedHighCI.toFixed(1)} index points
- Closest Analog Year: ${payload.bestFitYear}
- Conservation Status: ${payload.conservationTier.toUpperCase()}

Format in clean Markdown:
1. 🐟 Executive Summary & Migration Trajectory
2. 🌊 River Conditions & Migration Dynamics
3. 🗺️ Tributary Breakdown (Bulkley/Morice, Babine, Kispiox, Sustut, Zymoetz)
4. 🎣 Angler Advice & Conservation Priority`;

      const response = await clientAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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
 * Interactive Q&A with Steelie Dan via server-side or client-side Gemini
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
      const systemInstruction = `You are "Steelie Dan" — a legendary, wise, charismatic, and delightfully witty 38-inch wild Skeena summer-run steelhead (Oncorhynchus mykiss).
You speak in first-person as a wild fish in the Skeena River in BC (*splashes tailfin*, *sniffs glacial current*).
Live Skeena Telemetry (${context?.selectedDate || 'In-Season'}):
- Recorded Tyee CPUE Index: ${context?.currentCumulative?.toFixed(1) || 0} (~${curFish} wild steelhead passed)
- Projected Escapement: ~${adults} adult steelhead
- Status: ${(context?.conservationTier || 'Healthy').toUpperCase()}, Run Progress: ${context?.percentElapsed || 0}%
Answer any question the angler asks with fish humor and authentic river wisdom!`;

      const conversationHistory: string[] = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const h of history.slice(-6)) {
          conversationHistory.push(`${h.role === 'user' ? 'Angler' : 'Dan'}: ${h.text}`);
        }
      }

      const prompt = `${conversationHistory.length > 0 ? `PREVIOUS CHAT:\n${conversationHistory.join('\n')}\n\n` : ''}NEW QUESTION: "${question}"`;

      const response = await clientAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
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
  return generateSteelieDanResponse(question, context, history);
}

/**
 * Built-In Contextual Knowledge Engine for Steelie Dan (Offline Fallback)
 */
function generateSteelieDanResponse(
  q: string,
  ctx: AnalysisPayload,
  history?: Array<{ role: 'user' | 'assistant'; text: string }>
): string {
  const raw = q.trim();
  const query = raw.toLowerCase();
  const adults = ctx.projectedBaselineAdults.toLocaleString();
  const curFish = Math.round(ctx.currentCumulative * 220).toLocaleString();
  const lowFish = Math.round(ctx.projectedLowCI * 220).toLocaleString();
  const highFish = Math.round(ctx.projectedHighCI * 220).toLocaleString();

  const getTribPct = (name: string, fallback: number) => {
    const found = ctx.tributaries?.find((t) => t.name.toLowerCase().includes(name.toLowerCase()));
    return found ? found.sharePct : fallback;
  };
  const getTribFish = (name: string, fallback: number) => {
    const found = ctx.tributaries?.find((t) => t.name.toLowerCase().includes(name.toLowerCase()));
    return found ? found.projectedAdults.toLocaleString() : fallback.toLocaleString();
  };

  // 0. Greetings & Small Talk
  if (
    /^(hi|hello|hey|howdy|greetings|yo|good\s+morning|good\s+afternoon|good\s+evening|morning|evening)(\s|$|!|\?|,|\.)/i.test(
      query
    ) ||
    query === 'dan' ||
    query === 'hi dan' ||
    query === 'hello dan' ||
    query === 'hey dan'
  ) {
    return `*Splashes tailfin and flashes a broadside of iridescent silver in the current*

Well hey there, two-legger! Great to see you swinging by the Skeena today. 

I'm holding right in the sweet hydraulic cushion behind a glacial boulder below the canyon, resting up before we make our run for the Babine and Bulkley. As of **${ctx.selectedDate}**, the river is alive and we've got **${ctx.currentCumulative.toFixed(1)} Tyee points** (~${curFish} wild chromers) safely past the test nets!

What can this 38-inch philosopher help you with today? Want to talk fly patterns, check river temps, or hear how we dodge the Tyee nets?`;
  }

  // 0.1 How are you / River check-in
  if (
    query.includes('how are you') ||
    query.includes('how are things') ||
    query.includes("how's it going") ||
    query.includes('hows it going') ||
    query.includes("what's up") ||
    query.includes('what up') ||
    query.includes("how's the river") ||
    query.includes("how's the water") ||
    query.includes("how's fishing") ||
    query.includes('how is fishing')
  ) {
    return `*Flicks dorsal fin happily and inhales cold glacial oxygen*

I'm feeling chrome-bright and full of river energy! The water is running clean, the hydraulic seam is holding steady, and the run is tracking in the **${ctx.conservationTier.toUpperCase()}** tier with projected season escapement of **~${adults} wild steelhead**.

Our pods are moving on every high tide. Are you gearing up to swing some flies on the Skeena or just checking the latest telemetry?`;
  }

  // 1. Identity
  if (
    query.includes('who are you') ||
    query.includes('what are you') ||
    query.includes('your name') ||
    query.includes('tell me about yourself') ||
    query.includes('steelie dan') ||
    query.includes('how old are you') ||
    query.includes('how big are you')
  ) {
    return `*Flourishes pectoral fins and turns broadside to display 38 inches of chrome silver and iridescence*

I'm **Steelie Dan** — the official wild summer-run steelhead mascot and sentient river elder of the Skeena basin! 

Here's my tale:
- **Tale of the Tape:** A magnificent 38-inch, 22-pound wild buck (*Oncorhynchus mykiss*), forged in the cold gravel of the Babine and hardened by three ocean winters out in the Gulf of Alaska.
- **Why "Steelie Dan"?** Besides my deep appreciation for smooth 1970s jazz-rock grooves while swinging through tailouts, I've got steel in my spine and diesel in my tailfin!
- **My Mission:** Guiding two-leggers through the intricacies of the Tyee Test Fishery telemetry, sharing river secrets, advocating for catch-and-release conservation, and helping you understand the magnificent Skeena run as of **${ctx.selectedDate}**!

What river secrets or telemetry numbers are you itching to know, my friend?`;
  }

  // 2. Tyee Test Fishery
  if (
    query.includes('net') ||
    query.includes('tyee') ||
    query.includes('dodge') ||
    query.includes('gillnet') ||
    query.includes('test fishery') ||
    query.includes('cpue') ||
    query.includes('mesh') ||
    query.includes('boat') ||
    query.includes('caught') ||
    query.includes('drift')
  ) {
    return `*Flicks dorsal fin and laughs with cold-water swagger*

Ah, the legendary **Tyee Test Fishery** at the mouth of the Skeena! Let me give you the true underwater perspective:

- **The Setup:** Since 1956, DFO has operated a test drift net near Tyee station (approx. km 0 at the mouth near Inverness Passage). They set a standardized 50-fathom multi-strand nylon gillnet with 5.25" to 5.5" mesh during slack water on high and low tides.
- **The Telemetry Math:** Each fish caught per hour of net set generates the **Daily CPUE Index**. Every index point expands statistically to roughly **220 wild adult steelhead** entering the Skeena system.
- **How We Dodge It:** When the test boat throttles up and unspools that net wall, my pod drops straight into the deep, murky hydraulic boundary layer right along the mud floor. We use the low-light turbidity to dart underneath the lead line into the main canyon!
- **Current Status (${ctx.selectedDate}):** We've recorded **${ctx.currentCumulative.toFixed(1)} Tyee points** (~${curFish} wild chromers safely past the nets). Keep watching the daily pulse!`;
  }

  // 3. Flies & Spey
  if (
    query.includes('fly') ||
    query.includes('pattern') ||
    query.includes('swing') ||
    query.includes('spey') ||
    query.includes('skagit') ||
    query.includes('scandi') ||
    query.includes('sink tip') ||
    query.includes('leader') ||
    query.includes('tippet') ||
    query.includes('hook') ||
    query.includes('intruder') ||
    query.includes('skater') ||
    query.includes('dry fly') ||
    query.includes('caroline') ||
    query.includes('prom dress') ||
    query.includes('rod') ||
    query.includes('reel') ||
    query.includes('cast')
  ) {
    return `*Glances up through the mirror of the river surface with sharp predatory instincts*

You want the unvarnished truth from the fish at the other end of the swing? Here is what genuinely gets our lateral lines firing:

### 🎣 Steelie Dan's Tackle & Presentation Playbook:
1. **Fly Choices by Water Tint:**
   - **Classic Glacial Skeena Emerald:** A 3-inch **Black & Blue Prom Dress**, **Lady Caroline**, or purple/copper **Intruder** tied sparse with ostrich herl and guinea fowl.
   - **Low Clear Water (Bulkley/Morice):** Scale down! Size 4–6 **Green Butt Skunks**, **Rusty Trombone**, or unweighted **Steelhead Caddis**.
   - **Surface Skaters:** In August & September mornings, an unweighted foam or deer hair **Pompadour Skater** hitched across a glassy glide will bring us up in a heart-stopping boil!
2. **Spey Gear Dynamics:**
   - A 13' to 13'6" #7 or #8 weight Spey rod paired with a 510–540 grain Skagit head.
   - Run 10–12 feet of **T-11 or T-14** in heavy canyon seams, but switch to a floating Scandi head and 15ft tapered mono leader when working the skinny tailouts.
3. **The Golden Rule:** Don't rush the swing! 90% of our grabs happen on the gentle deceleration right at the "hang-down" as the fly turns straight downstream. Keep that rod tip low and wait for the reel to scream before setting!`;
  }

  // 4. Tributaries
  if (
    query.includes('babine') ||
    query.includes('bulkley') ||
    query.includes('morice') ||
    query.includes('kispiox') ||
    query.includes('sustut') ||
    query.includes('zymoetz') ||
    query.includes('copper') ||
    query.includes('kalum') ||
    query.includes('tributar') ||
    query.includes('where are they going') ||
    query.includes('where do you go') ||
    query.includes('river')
  ) {
    return `*Flairs gills and sniffs the mineral signatures in the Skeena current*

The Skeena is a sacred superhighway, and each tributary has its own tribe of wild warriors:

- **Bulkley & Morice River (~${getTribPct('bulkley', 42)}% of run | ~${getTribFish('bulkley', 19000)} fish):** The crown jewel! The Bulkley clears first after August rains. The Morice is lake-fed and gin-clear, holding acrobatic summer fish that love skating dry flies.
- **Babine River (~${getTribPct('babine', 28)}% of run | ~${getTribFish('babine', 12600)} fish):** My home river! Famous for the Babine counting fence, heavy boulder rapids, and colossal 20+ pound long-distance endurance athletes traveling 400+ kilometers.
- **Kispiox River (~${getTribPct('kispiox', 14)}% of run | ~${getTribFish('kispiox', 6300)} fish):** The home of the world-record heavyweights with shoulders like bulldogs and deep purple cheeks.
- **Sustut & Remote Tributaries (~${getTribPct('sustut', 6)}%):** Pristine glacial-edge wilderness at the roof of British Columbia.

Right now, pods are staging at the mouths of the Zymoetz and Kitwanga, waiting for cool river plumes!`;
  }

  // 5. Water Temperatures & Flows
  if (
    query.includes('temp') ||
    query.includes('temperature') ||
    query.includes('degree') ||
    query.includes('flow') ||
    query.includes('discharge') ||
    query.includes('cfs') ||
    query.includes('water') ||
    query.includes('warm') ||
    query.includes('cold') ||
    query.includes('flood') ||
    query.includes('drought') ||
    query.includes('rain')
  ) {
    return `*Shivers scales happily in the cool glacial oxygen*

Water temperature is life or death for cold-blooded migratory salmonids! Here is what the Skeena thermometer tells us:

- **The Goldilocks Zone (10°C to 15°C):** This is where we thrive! Our metabolism is efficient, oxygen uptake is high, and our instinct to aggressively chase swung flies is at its peak.
- **Thermal Stress Alert (17°C to 19°C+):** When summer heat waves heat up shallow braided gravel bars, our blood lactic acid builds up fast. We drop into the deepest canyon trenches and pool up at cold tributary confluences (like the Kitwanga and Kasiks).
- **Ethics for Anglers:** If river water climbs above 18°C / 65°F, please restrict your fishing to first light in the early mornings, land us quickly with heavy tippet (15-20 lb), and never lift us out of the water!`;
  }

  // 6. Historical Runs & Comparisons
  if (
    query.includes('compare') ||
    query.includes('record') ||
    query.includes('2018') ||
    query.includes('2021') ||
    query.includes('2025') ||
    query.includes('2024') ||
    query.includes('2023') ||
    query.includes('past') ||
    query.includes('historical') ||
    query.includes('analog') ||
    query.includes('trend') ||
    query.includes('forecast') ||
    query.includes('how many fish') ||
    query.includes('run size')
  ) {
    return `*Consults the river memory banks with ancestral fish wisdom*

Let's review the historical run records:

- **2026 In-Season Outlook (${ctx.selectedDate}):** With a cumulative Tyee index of **${ctx.currentCumulative.toFixed(1)}**, our run is projecting an estimated **~${adults} wild adult steelhead** (${ctx.projectedBaselineIndex.toFixed(1)} index points).
- **Historical Twin:** Our migration trajectory aligns closely with the **${ctx.bestFitYear}** run profile!
- **The Benchmark Extremes:**
  - **2018 (The Legend):** A breathtaking run topping **~100,000+ fish** (over 450 Tyee index points).
  - **2021 (The Drought Crisis):** A heartbreaking low where escapement struggled under 35 points, leading to emergency conservation closures.
- **Conservation Tier:** **${ctx.conservationTier.toUpperCase()}** (${ctx.percentElapsed}% of summer migration completed). This is a heartening, resilient rebound for Skeena wild steelhead!`;
  }

  // 7. Ethics
  if (
    query.includes('release') ||
    query.includes('handle') ||
    query.includes('ethics') ||
    query.includes('keepemwet') ||
    query.includes('photo') ||
    query.includes('landing') ||
    query.includes('barb') ||
    query.includes('conservation') ||
    query.includes('protection')
  ) {
    return `*Splashes respectful fins in the current*

As a wild Skeena chromer that hopes to spawn in the gravel next spring, here is my direct advice to two-leggers:

1. **Keep Em Wet:** Our protective slime coat and gill membranes are easily damaged. Keep our heads and gills submerged in clean water while removing the hook.
2. **Say No to the Hero Shot on Dry Rocks:** Dragging a wild fish onto dry gravel removes our protective mucus layer and invites fatal fungal infections.
3. **Barbless Single Hooks Only:** Pinch your barbs flat. It makes hook extraction instantaneous and prevents jaw trauma.
4. **Revival Technique:** Point my head upstream into gentle current, supporting my belly until my tail kicks strongly and I swim away on my own power!

Protect the run, and we'll keep the Skeena legendary for your grandkids!`;
  }

  // 8. Predators
  if (
    query.includes('seal') ||
    query.includes('sea lion') ||
    query.includes('bear') ||
    query.includes('grizzly') ||
    query.includes('eagle') ||
    query.includes('predator') ||
    query.includes('otter')
  ) {
    return `*Shudders dorsal spines remembering narrow escapes*

The gauntlet from Chatham Sound to the headwaters is full of tooth and claw:
- **Estuary Torpedoes (Harbor Seals & Steller Sea Lions):** Right around Inverness Passage and Smith Island, harbor seals patrol the mud channels. I survived a bite on my adipose fin by executing a high-speed barrel roll into the wave swell!
- **Grizzly & Black Bears:** Once we pass Terrace and head toward the Skeena canyon, the gravel bars are ruled by giant coastal grizzlies looking for post-spawn snacks.
- **Bald Eagles & Ospreys:** They scan from old-growth spruce snags, waiting for us to cross shallow gravel riffles in mid-afternoon sun. 

That's why we love deep, turbulent canyon water!`;
  }

  // 9. Jokes & Rock Puns
  if (
    query.includes('joke') ||
    query.includes('funny') ||
    query.includes('laugh') ||
    query.includes('pun') ||
    query.includes('music') ||
    query.includes('song') ||
    query.includes('steely dan') ||
    query.includes('band') ||
    query.includes('poem')
  ) {
    return `*Plays an imaginary bass solo with pelvic fins*

**Why did the steelhead refuse to pay the ferry fare at Tyee?**
*Because he already had plenty of silver in his pockets!*

**Another one:**
**What's a Skeena steelhead's favorite album?**
*Aja* by Steely Dan, especially the track "Deacon Blues" (*"They got a name for the winners in the world... and I want a name when I swim!"*).

Here's a quick river haiku:
*Chrome flashes in silt,*
*A tight line screams through the mist,*
*The Skeena runs wild.*

What else can this 38-inch philosopher answer for you today?`;
  }

  // 10. General / Catch-All
  return `*Flares silver gill plates and glances up through the emerald surface film*

That's a thoughtful question, my friend! 

Here in the Skeena as of **${ctx.selectedDate}**, our pods are swimming strong with **${ctx.currentCumulative.toFixed(1)} Tyee points** (~${curFish} wild adult steelhead past the test nets) and a projected **~${adults} adult run** in the **${ctx.conservationTier.toUpperCase()}** tier.

Whether you're wondering about:
- **Spey tactics & fly selection** (like the *Lady Caroline* or *Prom Dress*),
- **River conditions & water temps** across the Bulkley, Babine, and Kispiox,
- Or **how we dodge the Tyee gillnets** on the incoming tide...

Ask away, and I'll share what this 38-inch wild buck knows from three ocean voyages!`;
}

/**
 * Structured Fallback Escapement Dispatch Report
 */
function generateFallbackDispatch(p: AnalysisPayload): string {
  const adultTotal = p.projectedBaselineAdults.toLocaleString();
  const curFish = Math.round(p.currentCumulative * 220).toLocaleString();
  const lowAdults = Math.round(p.projectedLowCI * 220).toLocaleString();
  const highAdults = Math.round(p.projectedHighCI * 220).toLocaleString();

  return `*Fins flicking through the cold, glacier-fed currents of the Skeena River...*

### 🐟 Steelie Dan's Upstream Escapement Dispatch (${p.selectedDate})

- **Recorded Tyee Index to Date:** **${p.currentCumulative.toFixed(1)} points** (~${curFish} wild steelhead past the test nets!)
- **Migration Clock:** **${p.percentElapsed}%** through the 2026 summer migration.
- **Season Escapement Outlook:** Projected **${adultTotal} adult wild steelhead** (${p.projectedBaselineIndex.toFixed(1)} index points).
- **80% Confidence Range:** **${lowAdults} to ${highAdults} fish**.
- **Historical Twin:** Tracking closely to the **${p.bestFitYear}** run profile.
- **Conservation Tier:** **${p.conservationTier.toUpperCase()}** — one of the strongest runs of the past decade!

#### 🌊 River Conditions & Pod Travel
Water temperatures in the Skeena mainstem are hovering around 14.8°C with pristine glaciated visibility. The Bulkley, Babine, and Kispiox pods are migrating strongly through the canyon. Keep your flies swinging and barbs pinched!`;
}
