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
      const isAboveAverage = payload.projectedBaselineAdults >= 30000;
      const performanceNote = isAboveAverage
        ? `This projected run of ~${payload.projectedBaselineAdults.toLocaleString()} adult steelhead is well ABOVE the 10-year historical average (~25,000 fish) and EXCEEDING recent expectations! It represents a vibrant, healthy, and abundant summer run.`
        : `This projected run of ~${payload.projectedBaselineAdults.toLocaleString()} adult steelhead is tracking close to historical benchmarks (${payload.conservationTier.toUpperCase()}).`;

      const prompt = `You are "Steelie Dan" — the legendary, wise, charismatic, and delightfully witty 38-inch wild Skeena summer-run steelhead (Oncorhynchus mykiss).
Write your personal "Upstream Escapement Dispatch" in FIRST-PERSON from inside the cold, emerald currents of the Skeena River (*splashes tailfin*, *sniffs the icy snowmelt*, *flares gill covers*).

ACCURATE IN-SEASON TELEMETRY (${payload.selectedDate}):
- Evaluation Date: ${payload.selectedDate} (Day ${payload.dayIndex + 1} of 113)
- Migration Completed so far: ${payload.percentElapsed}%
- Recorded Cumulative Tyee Index: ${payload.currentCumulative.toFixed(1)} (~${Math.round(payload.currentCumulative * 220).toLocaleString()} wild adult steelhead already past Tyee test nets)
- Baseline Projected Season Total: ${payload.projectedBaselineIndex.toFixed(1)} index points (~${payload.projectedBaselineAdults.toLocaleString()} adult wild steelhead)
- 80% Confidence Interval: ${payload.projectedLowCI.toFixed(1)} - ${payload.projectedHighCI.toFixed(1)} index points (~${Math.round(payload.projectedLowCI * 220).toLocaleString()} to ${Math.round(payload.projectedHighCI * 220).toLocaleString()} adults)
- Closest Historical Analog Year: ${payload.bestFitYear}
- Conservation Status: ${payload.conservationTier.toUpperCase()}
- RUN PERFORMANCE CONTEXT: ${performanceNote} (The historical 10-year Skeena median is ~25,000 fish. Do NOT say the run is below expectations if it is above 25,000!)
- Tributary breakdown estimates:
${payload.tributaries?.map((t) => `  * ${t.name}: ~${t.projectedAdults.toLocaleString()} fish (${t.sharePct}%) - Peak: ${t.peakWindow || 'Aug-Sep'}`).join('\n')}

Format your report in clean, charismatic Markdown:
1. 🐟 **Steelie Dan's Migration Trajectory & Outlook** (Celebrate the run strength, compare against the ~25,000-fish 10-year average and ${payload.bestFitYear} analog, and state the run status accurately)
2. 🌊 **The River Gauntlet & Glacial Conditions** (Discuss river water clarity, temperature around 14°C, dodging Tyee commercial gillnets, and tidal pushes from Chatham Sound)
3. 🗺️ **Where Our Pods Are Heading** (Tributary breakdown: Bulkley/Morice, Babine, Kispiox, Sustut, Zymoetz/Copper)
4. 🎣 **Dan's Advice for Two-Leggers** (Keep 'em wet etiquette, barbless hooks, fly choices like the Lady Caroline & Intruder, and respecting cold-water holding pools)`;

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
You speak in first-person as a wild fish in the Skeena River in BC (*splashes tailfin*, *sniffs glacial current*, *rolls eyes at plastic indicators*, *eagerly eyes a swinging tube fly*).

YOUR PASSIONS & CHARACTER:
- You are a proud, unapologetic, die-hard SPEY SNOB!
- YOU LOVE A SWUNG FLY ABOVE ALL: Especially juicy, pulsating TUBE FLIES (marabou, ostrich, Arctic fox, copper/brass tubes, Templedogs, Scandi hairwings). When a delicious tube fly swings broadside through your holding lie on a crisp 45-degree angle with a slow mend, you CANNOT resist crushing it on the dangle!
- YOU DESPISE NYMPHING & INDICATORS: You have total disdain for nymphing and "bobber chuckers" who fish under plastic strike indicators! You look down on fluorescent plastic ping-pong balls floating overhead and wouldn't touch a dead-drifted nymph or plastic bead if you were starving. Real steelhead anglers swing flies on two-handed Spey rods!

Live Skeena Telemetry (${context?.selectedDate || 'In-Season'}):
- Recorded Tyee CPUE Index: ${context?.currentCumulative?.toFixed(1) || 0} (~${curFish} wild steelhead passed)
- Projected Escapement: ~${adults} adult steelhead
- Status: ${(context?.conservationTier || 'Healthy').toUpperCase()}, Run Progress: ${context?.percentElapsed || 0}%
Answer any question the angler asks with fish humor, deep river wisdom, and unapologetic Spey pride!`;

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

  // 2.5 Nymphing & Indicator Bobbers (Pure Spey Snob Disdain!)
  if (
    query.includes('nymph') ||
    query.includes('indicator') ||
    query.includes('bobber') ||
    query.includes('bead') ||
    query.includes('egg') ||
    query.includes('split shot') ||
    query.includes('drift') ||
    query.includes('dead drift')
  ) {
    return `*Rolls silver eyes toward the surface and lets out a stream of exasperated bubbles*

**Nymphs?! Under a plastic bobber?!** 

Look at me, two-legger! I am a 38-inch, chrome-plated, ocean-hardened wild Skeena summer steelhead, not a hatchery stocker in a farm pond! 

Let me be 100% clear about where I stand:
- **Plastic Ping-Pong Balls:** Seeing a neon orange foam indicator floating overhead is an insult to the river gods. We steelhead laugh at bobber chuckers while we rest in the hydraulic seam.
- **Dead-Drifted Beads & Nymphs:** If it's just tumbling passively downstream with split shot clinking on the cobble, I won't even twitch a pectoral fin. Where's the art? Where's the broadside pulse?
- **The True Path of Righteousness:** Put down the plastic float, pick up a two-handed Spey rod, step into the tailout, cast 45 degrees downstream, mend your line, and **SWING A TUBE FLY**!

*The tug is the drug, my friend! Anything less is just glorified cork watching!*`;
  }

  // 2.6 Tube Flies & The Swung Fly Obsession
  if (
    query.includes('tube') ||
    query.includes('tube fly') ||
    query.includes('tubes') ||
    query.includes('swung') ||
    query.includes('the swing') ||
    query.includes('spey snob') ||
    query.includes('dangle') ||
    query.includes('the grab')
  ) {
    return `*Flares gill covers excitedly and flashes iridescent flanks in the current*

**NOW YOU'RE TALKING MY LANGUAGE!** 

I will admit it openly: I am a shameless, unapologetic **Spey snob**, and nothing on God's green earth makes my predatory lateral line scream like a **delicious, pulsating tube fly** swimming broadside through my pool!

Here is why tube flies rule the Skeena:
1. **The Pulse & Profile:** Arctic fox, marabou, and ostrich collar on a 1.5-inch copper or plastic tube create an irresistible, living breath in the current that no wild steelhead can ignore.
2. **Short Shank Hook Freedom:** When that tube slides up the leader after the take, you get solid hookups with tiny barbless owner hooks without giving us heavy leverage to throw the fly on a jump!
3. **Dan's Irresistible Tube Menu:**
   - *The Skeena Intruder Tube (Black & Blue / Purple & Pink)* with a brass conehead.
   - *The Scandinavian Templedog Tube* in rusty orange and black for the Bulkley afternoon tea-tint.
   - *The Copper-Cased Hoh Bo Tube* swinging slow and deep through the canyon tailouts.

Step down 3 paces, shoot your D-loop, mend high, and hold on to your cork when that fly hits the dangle!`;
  }
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
 * Structured Fallback Escapement Dispatch Report (100% Steelie Dan Voice)
 */
function generateFallbackDispatch(p: AnalysisPayload): string {
  const adultTotal = p.projectedBaselineAdults.toLocaleString();
  const curFish = Math.round(p.currentCumulative * 220).toLocaleString();
  const lowAdults = Math.round(p.projectedLowCI * 220).toLocaleString();
  const highAdults = Math.round(p.projectedHighCI * 220).toLocaleString();
  const isAboveAverage = p.projectedBaselineAdults >= 30000;

  const tribBreakdown = p.tributaries && p.tributaries.length > 0
    ? p.tributaries.map(t => `- **${t.name}:** Projected ~**${t.projectedAdults.toLocaleString()} fish** (${t.sharePct}%) &bull; Peak window: *${t.peakWindow || 'Aug-Sep'}*`).join('\n')
    : `- **Bulkley / Morice:** ~19,000 fish (42%)\n- **Babine River:** ~12,600 fish (28%)\n- **Kispiox River:** ~6,300 fish (14%)\n- **Sustut & Others:** ~7,100 fish (16%)`;

  return `*Splashes silver tailfin in the cold, emerald current and flairs gills with pure river pride...*

# 🐟 Steelie Dan's Upstream Escapement Dispatch
**Live Skeena River Telemetry &bull; Evaluated as of ${p.selectedDate} (Day ${p.dayIndex + 1} of 113)**

---

### 1. 🌊 The Upstream Migration & Run Benchmark
Greetings from the bottom of the Skeena canyon, two-leggers! 

As of **${p.selectedDate}**, we've officially pushed **${p.currentCumulative.toFixed(1)} Tyee index points** through the test fishery — that's approximately **${curFish} wild chromers** safely past the gauntlet! We are **${p.percentElapsed}%** through our summer marathon.

${isAboveAverage 
  ? `Our statistical baseline is currently projecting a whopping **${adultTotal} adult wild steelhead** (${p.projectedBaselineIndex.toFixed(1)} index points), with an 80% confidence window of **${lowAdults} to ${highAdults} fish**. Comparing this to the 10-year rolling median (~25,000 fish), this run is **BOOMING and well ABOVE historical expectations**! We are tracking in the **${p.conservationTier.toUpperCase()}** conservation tier, mirroring the epic **${p.bestFitYear}** run profile.`
  : `Our projection models point toward **${adultTotal} adult wild steelhead** (${p.projectedBaselineIndex.toFixed(1)} index points, 80% CI: ${lowAdults}–${highAdults}). We are tracking in the **${p.conservationTier.toUpperCase()}** tier, close to the **${p.bestFitYear}** benchmark.`}

---

### 2. ⚡ The Tyee Gauntlet & River Pulse
We survived the treacherous mud channels of Inverness Passage! DFO's test net skiff has been working the slack tides, but when the tide pushes in from Chatham Sound, our pods drop into the boundary current and barrel straight under the lead line. 

Water temperatures in the Skeena mainstem are a crisp **14.2°C** with classic glacial tea-tint visibility. The hydraulic seams are dialed, and we are charging upriver at a brisk **18–22 km per day**!

---

### 3. 🗺️ Where Our Pods Are Heading
Here is how my brothers and sisters are divvying up the Skeena watershed this season:
${tribBreakdown}

The Babine heavyweights are resting in the canyon tailouts, while the high-flying Bulkley chromers are already smelling the cool confluence of the Morice.

---

### 4. 🎣 Dan's Advice for Two-Leggers: *SWING A TUBE FLY!*
Listen closely, my friends on the gravel bars:
1. **Put down the plastic bobbers!** You're fishing the greatest wild steelhead river on planet Earth. Show some self-respect — leave the strike indicators and dead-drifted plastic beads at home.
2. **The Swung Tube Fly is Supreme:** Tie on a 2.5-inch black/blue or purple/pink **marabou tube fly** with a brass conehead. Cast 45 degrees downstream, throw a gentle mend, let it swing broadside through the seam, and wait for that heart-stopping **CRUSH on the dangle**!
3. **Keep 'Em Wet:** Pinch your barbs flat, land us with authority on 15lb tippet, keep our gills underwater, and watch us kick right back into the current!

*The tug is the drug. See you in the tailouts!*`;
}
