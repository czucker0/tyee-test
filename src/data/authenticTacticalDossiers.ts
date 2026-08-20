import { RiverAccessPoint, FloatSafetyProfile, WadeSafetyProfile, TribalAccessProtocol, TributaryAdminTacticalIntel } from '../types/steelhead';

export interface UnencryptedDossier {
  adminTacticalIntel?: TributaryAdminTacticalIntel;
  accessPoints?: RiverAccessPoint[];
  floatSafety?: FloatSafetyProfile;
  wadeSafety?: WadeSafetyProfile;
  tribalProtocols?: TribalAccessProtocol;
  confidenceRating: 'High Confidence' | 'Moderate Confidence' | 'Unverified/Anecdotal';
  confidenceRationale: string;
}

export const AUTHENTIC_TACTICAL_DOSSIERS: Record<string, UnencryptedDossier> = {
  'Lower Skeena Mainstem': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EE003 (Usk), DFO Tyee test fishery gillnet log, and official BC Tidal boundary gazette.',
    adminTacticalIntel: {
      keyReaches: 'Kwinitsa Siding pool, Exchamsiks River confluence bar, Kasiks gravel spit, Lakelse River mouth seam, Shames gravel runs, Terrace railway bridge pool.',
      tacticalBiteTriggers: 'Incoming spring tides (new/full moon push) deliver sea-lice silver fish into lower tidal channels. Swing heavy T-14/T-17 sink tips with broad black/blue and cerise intruders across 3–6 ft holding ledges before fish ascend into faster canyon water.',
      waterClarityDynamics: 'Coastal storm systems can bring brief mudslides from steep coastal gullies, but massive volume maintains fishable emerald edges along gravel drop-offs.',
      estuaryPassageNotes: 'Peak transit window: July 25 – August 25. Fresh fish move 15–25 km/day during high tide swells.',
      historicalGuideNotes: 'Fish hold remarkably close to the bank (within 10–25 feet of the rock/gravel edge) to escape the powerful main river hydraulic center.'
    },
    accessPoints: [
      {
        id: 'lower-skeena-exchamsiks',
        name: 'Exchamsiks River Provincial Boat Launch',
        type: 'put-in',
        description: 'Paved highway boat launch off Hwy 16 into Exchamsiks channel; direct access to Skeena mainstem tidal seams.',
        lat: 54.3312,
        lng: -129.2891,
        googleMapsUrl: 'https://maps.google.com/?q=54.3312,-129.2891',
        roadAccess: 'Hwy 16 paved turnout km 55 west of Terrace',
        vesselSuitability: 'Jetboat, large pontoon raft',
        landTenure: 'BC Provincial Park'
      },
      {
        id: 'lower-skeena-kwinitsa',
        name: 'Kwinitsa Siding Gravel Access',
        type: 'walk-in',
        description: 'Historic railway siding with walk-in gravel bar access along tidal lower Skeena holding runs.',
        lat: 54.2250,
        lng: -129.5400,
        googleMapsUrl: 'https://maps.google.com/?q=54.2250,-129.5400',
        roadAccess: 'Railway pullout along Hwy 16',
        bushwhackDifficulty: 'Short track across rail easement',
        landTenure: 'Crown Land / Rail Easement'
      },
      {
        id: 'lower-skeena-ferry-island',
        name: 'Ferry Island Terrace Municipal Launch',
        type: 'take-out',
        description: 'Terrace city park with public boat ramp, campground, and extensive walking trails along Skeena mainstem gravel bars.',
        lat: 54.5120,
        lng: -128.5720,
        googleMapsUrl: 'https://maps.google.com/?q=54.5120,-128.5720',
        roadAccess: 'Hwy 16 entrance at east end of Terrace',
        vesselSuitability: 'Jetboat, drift boat, raft',
        landTenure: 'City of Terrace Municipal Park'
      }
    ],
    floatSafety: {
      rating: 'Personal Raft Friendly',
      whitewaterClass: 'Class I–II (Large wave trains, heavy volume)',
      suitableCraft: 'Heavy jetboat, 14–18 ft whitewater raft with oar frame',
      hazardWarnings: [
        'Massive commercial barge and jetboat wake near channel bends',
        'Tidal surge reversals and sudden fog banks reducing visibility below Kwinitsa',
        'Sweeper rootwads along eroding silty islands'
      ],
      typicalFloatTimes: 'Exchamsiks to Kwinitsa: 3–5 hours; Terrace to Kasiks: Full day (50 km)'
    },
    wadeSafety: {
      difficulty: 'Moderate',
      footwearRecommendation: 'Felt soles with tungsten carbide studs for slick bedrock and bowling-ball cobble',
      bankAccessibility: 'Wide gravel bars at low water; steep rip-rap along railway sections',
      wadingStaffAdvice: 'Mandatory on deep tidal seams where back-eddies create sudden drop-offs'
    },
    tribalProtocols: {
      nation: 'Kitsumkalum & Kitselas First Nations / Coast Tsimshian Traditional Territory',
      permitRequired: false,
      permitDetails: 'Respect traditional First Nations Food, Social, and Ceremonial (FSC) drift and set gillnets. Maintain at least 100 meters clearance from active community fishing vessels.',
      officeLocation: 'Kitsumkalum Band Office, Terrace, BC',
      etiquette: 'Give wide berth to anchored tribal gillnet skiffs and fish processing sites.'
    }
  },
  'Middle Skeena Mainstem': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EE003 at Usk, BC MoE radio-tagging receiver array, and official Skeena Class II management documentation.',
    adminTacticalIntel: {
      keyReaches: 'Usk Cable Ferry current seams, Pacific gravel bar braids, Cedarvale canyon holding runs, Woodcock gravel spit, Kitwanga Bridge confluence pool, Hazelton canyon junction pool.',
      tacticalBiteTriggers: 'Fish travel aggressively through the middle Skeena, resting in soft inside seam pockets behind bedrock outcroppings. Intermediate to sink tip setups (Type 3 / Type 6) with traditional hair-wing patterns (Lady Caroline, Undertaker, Black Bear Green Butt) or articulated flies swung on an even 45-degree angle.',
      waterClarityDynamics: 'Skeena mainstem visibility is governed by Zymoetz (Copper) and Kitwanga river inputs; clears rapidly once autumn nights drop below freezing in the Coast Range.',
      estuaryPassageNotes: 'Tyee peak passage: Aug 05 – Aug 26. Fish swim this 120 km section in 5–8 days during stable water.',
      historicalGuideNotes: 'Focus on the "traveling seam"—the distinct current interface where fast 5-knot main channel water slows down to 2–3 knots along the inner shoreline.'
    },
    accessPoints: [
      {
        id: 'mid-skeena-usk-ferry',
        name: 'Usk Cable Ferry Landing & Gravel Bar',
        type: 'put-in',
        description: 'Public ferry crossing landing providing immediate foot and boat launch access to legendary Usk mainstem seams.',
        lat: 54.6333,
        lng: -128.4167,
        googleMapsUrl: 'https://maps.google.com/?q=54.6333,-128.4167',
        roadAccess: 'Usk Ferry Road off Hwy 16 (18 km east of Terrace)',
        vesselSuitability: 'Jetboat, raft, drift boat',
        landTenure: 'BC Ministry of Transportation ROW'
      },
      {
        id: 'mid-skeena-cedarvale',
        name: 'Cedarvale Mainstem Gravel Flats',
        type: 'walk-in',
        description: 'Extensive low-gradient gravel bar with deep holding trench along the north bank opposite Cedarvale.',
        lat: 55.0833,
        lng: -128.1833,
        googleMapsUrl: 'https://maps.google.com/?q=55.0833,-128.1833',
        roadAccess: 'Cedarvale East Road turnout off Hwy 16',
        bushwhackDifficulty: 'Easy 5-minute gravel trail',
        landTenure: 'Crown Land'
      },
      {
        id: 'mid-skeena-kitwanga-bridge',
        name: 'Kitwanga Hwy 37 Bridge Pool',
        type: 'bridge-access',
        description: 'Major confluence eddy where Kitwanga River joins the Skeena under the Hwy 37 Stewart-Cassiar bridge.',
        lat: 55.1010,
        lng: -128.0120,
        googleMapsUrl: 'https://maps.google.com/?q=55.1010,-128.0120',
        roadAccess: 'Pullout beneath Hwy 37 bridge south bank',
        vesselSuitability: 'Raft take-out, hand-carry pontoon',
        landTenure: 'Crown Land / BC Highways'
      }
    ],
    floatSafety: {
      rating: 'Intermediate Float with Hazards',
      whitewaterClass: 'Class II–III (Boiling eddy lines, bedrock ledges)',
      suitableCraft: '14+ ft self-bailing raft, heavy aluminum jetboat',
      hazardWarnings: [
        'Usk Ferry cable guide overhead and reaction ferry cables during operation',
        'Strong whirlpools and boiling back-eddies near Hazelton canyon entry'
      ],
      typicalFloatTimes: 'Usk to Pacific: 3.5 hours; Pacific to Cedarvale: 4 hours'
    },
    wadeSafety: {
      difficulty: 'Moderate',
      footwearRecommendation: 'Felt with studs or aluminum bars for smooth river cobble',
      bankAccessibility: 'Broad gravel beaches punctuated by steep rocky railway bluffs',
      wadingStaffAdvice: 'Recommended when wading past thigh-deep in heavy autumn currents'
    },
    tribalProtocols: {
      nation: 'Gitxsan Nation Traditional Territory (Wilp House territories)',
      permitRequired: false,
      permitDetails: 'Gitxsan traditional territory. Anglers are welcome under provincial regulations with mandatory catch-and-release of all wild steelhead. Respect First Nations dip-netting and fish-wheel research stations.',
      officeLocation: 'Gitxsan Treaty Society / Gitanyow Hereditary Chiefs Office, Hazelton, BC',
      etiquette: 'Do not interfere with fish monitoring platforms, fish wheels, or traditional smokehouse operations.'
    }
  },
  'Bulkley / Morice River System': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EF001 (Bulkley at Quick), Witset First Nations biometric canyon tagging data, and BC Classified Waters Class II licensing system.',
    adminTacticalIntel: {
      keyReaches: 'Moricetown (Witset) Canyon pool, Telkwa confluence eddy, Quick Station run, Bymac park, Morice River / Nanika junction, Owen Creek pool.',
      tacticalBiteTriggers: 'First sharp autumn frosts drop water temp into optimal 8°C–11°C swinging window. Floating line with long 12–15 ft fluorocarbon leaders and dry flies (Pompadour, Steelhead Bee) or small wet flies (Silver Hilton, Undertaker).',
      waterClarityDynamics: 'Morice Lake ensures upper river stays gin-clear. Lower Bulkley vulnerable to clay silt from Telkwa River during heavy rain.',
      estuaryPassageNotes: 'Tyee peak: Aug 12 – Aug 28. Volume sustains through late September.',
      historicalGuideNotes: 'Morice River fish respond exceptionally well to dead-drift and hitched surface presentations in clear autumn sunshine.'
    },
    accessPoints: [
      {
        id: 'bulkley-witset-canyon',
        name: 'Witset (Moricetown) Canyon',
        type: 'tribal-access',
        description: 'Spectacular bedrock gorge and historic First Nations fishway; extreme care required along steep canyon bluffs.',
        lat: 54.9810,
        lng: -127.3290,
        googleMapsUrl: 'https://maps.google.com/?q=54.9810,-127.3290',
        roadAccess: 'Witset Campground & Heritage Park off Hwy 16',
        landTenure: 'Witset First Nation Reserve & Park'
      },
      {
        id: 'bulkley-quick-station',
        name: 'Quick Station Bridge & Boat Ramp',
        type: 'put-in',
        description: 'Iconic timber bridge crossing with public drift boat ramp and long gravel bar runs.',
        lat: 54.6220,
        lng: -126.9030,
        googleMapsUrl: 'https://maps.google.com/?q=54.6220,-126.9030',
        roadAccess: 'Quick Station Road off Hwy 16',
        vesselSuitability: 'Drift boat, raft',
        landTenure: 'Crown Land / Public Launch'
      },
      {
        id: 'morice-bymac',
        name: 'Bymac Provincial Recreation Site',
        type: 'put-in',
        description: 'Prime upper Morice launch with campground and easy trailer access.',
        lat: 54.3120,
        lng: -126.8850,
        googleMapsUrl: 'https://maps.google.com/?q=54.3120,-126.8850',
        roadAccess: 'Morice River Forest Service Road km 26',
        vesselSuitability: 'Drift boat, raft, jetboat (restricted zones)',
        landTenure: 'BC Recreation Site'
      }
    ],
    floatSafety: {
      rating: 'Personal Raft Friendly',
      whitewaterClass: 'Class I–II (Gentle gravel braids with occasional sweepers)',
      suitableCraft: 'Drift boat, 13–16 ft raft, inflatable kayak',
      hazardWarnings: [
        'Witset Canyon is an impassable Class V+ waterfall gorge—NEVER attempt to float through Witset Canyon',
        'Seasonal log jams across narrow side braids on upper Morice'
      ],
      typicalFloatTimes: 'Quick to Telkwa: 4–6 hours; Bymac to Aspen: 5 hours'
    },
    wadeSafety: {
      difficulty: 'Easy',
      footwearRecommendation: 'Standard felt or studded rubber boots',
      bankAccessibility: 'Excellent gentle gravel bars along 80% of river length',
      wadingStaffAdvice: 'Helpful for wading deep tailouts'
    },
    tribalProtocols: {
      nation: 'Wet’suwet’en Nation & Witset First Nation',
      permitRequired: false,
      permitDetails: 'Respect cultural heritage sites, smokehouses, and traditional fishing platforms in Witset Canyon.',
      officeLocation: 'Witset Band Administration, Witset, BC',
      etiquette: 'Catch-and-release all wild fish immediately. Respect Wet’suwet’en yintah stewardship.'
    }
  },
  'Babine River': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EC013 (Babine at Outlet), BC MoE / DFO Babine Counting Fence 24/7 video weir data, Class I Classified Waters strict quota regulations.',
    adminTacticalIntel: {
      keyReaches: 'Nilkitkwa Lake outlet, Babine Counting Fence tailout, Silver Hilton pools, Nichyeskwa Creek confluence, Gail Creek pool, lower bedrock canyon.',
      tacticalBiteTriggers: 'Stable lake discharge and nutrient-rich riverbed create optimal surface skating and wet fly conditions. Floating line with classic muddler minnows, grease-line steelhead patterns, or damp wet flies.',
      waterClarityDynamics: 'Buffered by massive 150 km Babine Lake and Nilkitkwa Lake. Maintains gin-clear green clarity even during heavy coastal downpours.',
      estuaryPassageNotes: 'Tyee peak: Aug 15 – Sep 05. Strong sustained late-season high-latitude run.',
      historicalGuideNotes: 'One of the world’s premier wild steelhead sanctuaries; spawner age averages 5–6 years with fish over 30 lbs recorded annually.'
    },
    accessPoints: [
      {
        id: 'babine-fence-launch',
        name: 'Babine Counting Fence Recreation Site',
        type: 'put-in',
        description: 'Road access terminus at DFO / BC MoE counting weir; prime starting point for multi-day wilderness floats.',
        lat: 55.5420,
        lng: -126.6340,
        googleMapsUrl: 'https://maps.google.com/?q=55.5420,-126.6340',
        roadAccess: 'Babine River FSR via Smithers/Hazelton (~100 km gravel)',
        vesselSuitability: 'Heavy whitewater raft with row frame',
        landTenure: 'BC Provincial Park & Recreation Site'
      },
      {
        id: 'babine-nilkitkwa-outlet',
        name: 'Nilkitkwa Lake Outlet Bridge',
        type: 'bridge-access',
        description: 'Upper boundary of Babine River where lake outflow creates calm, clear holding water.',
        lat: 55.4920,
        lng: -126.5820,
        googleMapsUrl: 'https://maps.google.com/?q=55.4920,-126.5820',
        roadAccess: 'Babine Lake FSR',
        landTenure: 'Crown Land'
      }
    ],
    floatSafety: {
      rating: 'Extreme Whitewater Canyon',
      whitewaterClass: 'Class III–IV (Lower Canyon contains dangerous boulder drops and extreme remote wilderness)',
      suitableCraft: '16+ ft self-bailing expedition raft; experienced whitewater oarsmen only',
      hazardWarnings: [
        'Extreme grizzly bear density during autumn salmon spawning runs',
        'Impassable Class IV–V rapids in lower canyon requiring precise scouting',
        'Zero cellular or road access once committed downstream of the fence'
      ],
      typicalFloatTimes: 'Babine Fence to Skeena Confluence: 4–6 day wilderness expedition'
    },
    wadeSafety: {
      difficulty: 'Challenging / Treacherous',
      footwearRecommendation: 'Studded felt with thick wading staff',
      bankAccessibility: 'Steep canyon bluffs, heavy boulder gardens, and thick devil’s club riparian brush',
      wadingStaffAdvice: 'Essential. Powerful wilderness currents and slippery glacial bedrock'
    },
    tribalProtocols: {
      nation: 'Lake Babine Nation Traditional Territory',
      permitRequired: false,
      permitDetails: 'Class I Classified Waters license strictly required (Sep 1 – Oct 31). Non-resident anglers must hold valid rod-day allocation.',
      officeLocation: 'Lake Babine Nation Band Office, Burns Lake, BC',
      etiquette: 'Bear awareness protocols mandatory. Store all food in bear-proof containers.'
    }
  },
  'Kispiox River': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EB001 (Kispiox River near Hazelton), Provincial Angler Creel Surveys, and Class II Classified Waters regulations.',
    adminTacticalIntel: {
      keyReaches: 'Hazelton mouth junction, 20-Mile bridge pools, Sweetin River confluence, Club Creek bend, Iron suspension bridge beat, upper valley forest pools.',
      tacticalBiteTriggers: 'The legendary "Green Drop"—the precise 24-hour window when river drops from blown clay brown to emerald green after rain. Surface waking foam skaters and large purple/black leech patterns.',
      waterClarityDynamics: 'High clay sediment content. Extremely vulnerable to blowouts after moderate rains; requires 2–4 days of clear weather to regain 3 feet of visibility.',
      estuaryPassageNotes: 'Tyee peak: Aug 08 – Aug 24.',
      historicalGuideNotes: 'World record wild steelhead genetics. The low-gradient valley pools allow fish to rest without fighting heavy currents, making them aggressive risers.'
    },
    accessPoints: [
      {
        id: 'kispiox-mouth',
        name: 'Kispiox River Skeena Confluence Bar',
        type: 'put-in',
        description: 'Public bridge access near Hazelton where Kispiox waters meet the mainstem Skeena.',
        lat: 55.3520,
        lng: -127.7010,
        googleMapsUrl: 'https://maps.google.com/?q=55.3520,-127.7010',
        roadAccess: 'Kispiox Valley Road km 1 off Hwy 62',
        landTenure: 'Public Highway ROW'
      },
      {
        id: 'kispiox-20-mile',
        name: '20-Mile Bridge & Recreation Site',
        type: 'put-in',
        description: 'Mid-valley public bridge crossing with river access and camping.',
        lat: 55.5120,
        lng: -127.7820,
        googleMapsUrl: 'https://maps.google.com/?q=55.5120,-127.7820',
        roadAccess: 'Kispiox Valley Road km 32',
        vesselSuitability: 'Raft, drift boat',
        landTenure: 'BC Recreation Site'
      }
    ],
    floatSafety: {
      rating: 'Personal Raft Friendly',
      whitewaterClass: 'Class I–II (Gentle gravel meanders with sweeper hazards)',
      suitableCraft: '13–15 ft raft, small drift boat',
      hazardWarnings: [
        'Constantly shifting log jams and rootwads across tight meander bends',
        'Clay bank slumps creating hidden underwater hazards after rain'
      ],
      typicalFloatTimes: '20-Mile to Kispiox Village: 4–6 hours'
    },
    wadeSafety: {
      difficulty: 'Moderate',
      footwearRecommendation: 'Felt or sticky rubber soles',
      bankAccessibility: 'Gentle gravel bars with some muddy clay cutbanks',
      wadingStaffAdvice: 'Recommended when wading soft clay drop-offs'
    },
    tribalProtocols: {
      nation: 'Gitxsan Nation (Kispiox Band / Wilp House Territories)',
      permitRequired: false,
      permitDetails: 'Class II Classified Waters regulations apply (Sep 1 – Oct 31). Barbless single hook, 100% wild catch-and-release.',
      officeLocation: 'Kispiox Band Administration Office, Kispiox, BC',
      etiquette: 'Respect private agricultural land along the valley and stay within high-water marks.'
    }
  },
  'Zymoetz (Copper) River': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EF005 (Zymoetz River above Clore), BC MoE helicopter redd surveys, Class II Classified Waters regulations.',
    adminTacticalIntel: {
      keyReaches: 'Lower Skeena confluence, Red Canyon pool, Zymoetz Canyon bridge, Clore River junction, McDonell Lake outlet flats.',
      tacticalBiteTriggers: 'Cold glacial-fed mountain river. Best fished during bright afternoons when water warms slightly, or during crisp autumn mornings after glacial melt ceases. Swing heavy sink tips through boulder garden pockets.',
      waterClarityDynamics: 'Clore River inputs glacial silt during hot summer days. Clears dramatically on cool cloudy days and throughout September/October.',
      estuaryPassageNotes: 'Tyee peak: Jul 28 – Aug 18.',
      historicalGuideNotes: 'Early summer run enters in July; late fall run pushes into high mountain headwaters near McDonnell Lake.'
    },
    accessPoints: [
      {
        id: 'copper-lower-canyon',
        name: 'Zymoetz River Canyon Bridge & Pullout',
        type: 'bridge-access',
        description: 'Highway 16 bridge crossing over lower Copper canyon with walking trails down to river pools.',
        lat: 54.4820,
        lng: -128.3210,
        googleMapsUrl: 'https://maps.google.com/?q=54.4820,-128.3210',
        roadAccess: 'Hwy 16 bridge 8 km east of Terrace',
        landTenure: 'BC Highway ROW'
      },
      {
        id: 'copper-clore-fsr',
        name: 'Copper / Zymoetz River FSR km 18 Bar',
        type: 'put-in',
        description: 'Gravel bar access along Copper River Forest Service Road.',
        lat: 54.4510,
        lng: -128.1820,
        googleMapsUrl: 'https://maps.google.com/?q=54.4510,-128.1820',
        roadAccess: 'Copper River FSR km 18',
        vesselSuitability: 'Whitewater raft only',
        landTenure: 'Crown Land'
      }
    ],
    floatSafety: {
      rating: 'Intermediate Float with Hazards',
      whitewaterClass: 'Class II–III (Fast canyon boulder gardens)',
      suitableCraft: 'Whitewater raft with experienced rower',
      hazardWarnings: [
        'Violent canyon pinch-points and sharp bedrock ledges',
        'Glacial silt obscuring subsurface boulders in high summer'
      ],
      typicalFloatTimes: 'km 18 to Highway 16 bridge: 3–4 hours'
    },
    wadeSafety: {
      difficulty: 'Challenging / Treacherous',
      footwearRecommendation: 'Felt with heavy carbide studs mandatory',
      bankAccessibility: 'Steep canyon terrain and slippery bedrock shelves',
      wadingStaffAdvice: 'Mandatory in turbulent boulder-strewn canyon runs'
    },
    tribalProtocols: {
      nation: 'Kitselas First Nation Traditional Territory',
      permitRequired: false,
      permitDetails: 'Class II Classified Waters (Jul 24 – Oct 31). Non-resident weekend restrictions apply.',
      officeLocation: 'Kitselas Band Administration, Terrace, BC',
      etiquette: 'Strict single barbless hook, catch-and-release only.'
    }
  },
  'Kalum (Kitsumkalum) River': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EG011 (Kitsumkalum River near Terrace), Provincial Radio-telemetry, Class II Classified Waters regulations.',
    adminTacticalIntel: {
      keyReaches: 'Lower Skeena confluence, Lower Canyon pools, Deep Creek junction, Kalum Lake outlet weir, Mayo Creek run.',
      tacticalBiteTriggers: 'Lake buffering maintains steady green clarity. Swung streamers, egg-sucking leeches, and intruders on Type 6 sink tips.',
      waterClarityDynamics: 'Buffered by Kitsumkalum Lake. Extremely resilient against rain blowouts; reliable "insurance river".',
      estuaryPassageNotes: 'Summer run peaks in August; massive winter run enters December through April.',
      historicalGuideNotes: 'Holds the Canadian record for giant wild steelhead (over 35 lbs).'
    },
    accessPoints: [
      {
        id: 'kalum-canyon-launch',
        name: 'Kalum River Canyon Boat Ramp',
        type: 'put-in',
        description: 'Public concrete boat launch on the lower Kalum providing access to middle canyon runs.',
        lat: 54.5510,
        lng: -128.6520,
        googleMapsUrl: 'https://maps.google.com/?q=54.5510,-128.6520',
        roadAccess: 'Nisga\'a Highway km 12 north of Terrace',
        vesselSuitability: 'Jetboat, drift boat, raft',
        landTenure: 'Crown Land / Public Launch'
      }
    ],
    floatSafety: {
      rating: 'Personal Raft Friendly',
      whitewaterClass: 'Class II (Swift lake outflow with gravel bars and canyon pools)',
      suitableCraft: 'Jetboat, drift boat, raft',
      hazardWarnings: ['Fast boulder water in lower canyon reach'],
      typicalFloatTimes: 'Kalum Lake to Terrace: 5–7 hours'
    },
    wadeSafety: {
      difficulty: 'Moderate',
      footwearRecommendation: 'Felt with studs for smooth cobbles',
      bankAccessibility: 'Good gravel bar access with occasional dense coastal alder brush',
      wadingStaffAdvice: 'Recommended in deep canyon tailouts'
    },
    tribalProtocols: {
      nation: 'Kitsumkalum First Nation Traditional Territory',
      permitRequired: false,
      permitDetails: 'Class II Classified Waters rules apply seasonally.',
      officeLocation: 'Kitsumkalum Band Office, Terrace, BC',
      etiquette: 'Respect cultural conservation zones and private property along the lower river.'
    }
  },
  'Upper Skeena & Other Tributaries': {
    confidenceRating: 'Moderate Confidence',
    confidenceRationale: 'Kitwanga First Nations smolt enumeration weir data, DFO escapement index surveys, Gitxsan Wilp fisheries research.',
    adminTacticalIntel: {
      keyReaches: 'Kitwanga wooden bridge pool, Shegunia River canyon mouth, Bear River confluence, Kuldo wilderness reach, Slamgeesh junction.',
      tacticalBiteTriggers: 'Fish stage in deep mainstem holding seams before entering small upper tributaries. Intermediate sink tips and small weighted Spey flies.',
      waterClarityDynamics: 'Dependent on localized mountain snowpack and rainfall events.',
      estuaryPassageNotes: 'Tyee peak: Aug 10 – Sep 01.',
      historicalGuideNotes: 'Pristine remote headwaters providing essential wild genetic reservoir.'
    },
    accessPoints: [
      {
        id: 'upper-skeena-kitwanga-weir',
        name: 'Kitwanga River Counting Weir',
        type: 'walk-in',
        description: 'Gitanyow fisheries monitoring station and walk-in gravel bar access.',
        lat: 55.1210,
        lng: -128.0210,
        googleMapsUrl: 'https://maps.google.com/?q=55.1210,-128.0210',
        roadAccess: 'Hwy 37 Stewart-Cassiar km 5',
        landTenure: 'Gitanyow First Nation & Crown Land'
      }
    ],
    floatSafety: {
      rating: 'Intermediate Float with Hazards',
      whitewaterClass: 'Class II–III (Remote wilderness rapids and logjams)',
      suitableCraft: 'Heavy wilderness raft or jetboat',
      hazardWarnings: ['Remote wilderness with no emergency services'],
      typicalFloatTimes: 'Multi-day remote wilderness expedition'
    },
    wadeSafety: {
      difficulty: 'Moderate',
      footwearRecommendation: 'Felt with studs',
      bankAccessibility: 'Cobble bars with steep canyon walls',
      wadingStaffAdvice: 'Recommended'
    },
    tribalProtocols: {
      nation: 'Gitanyow & Gitxsan First Nations Traditional Territory',
      permitRequired: false,
      permitDetails: 'Provincial and tribal fisheries regulations apply. Wild catch-and-release.',
      officeLocation: 'Gitanyow Hereditary Chiefs Office, Kitwanga, BC',
      etiquette: 'Do not tamper with fish monitoring gear or weirs.'
    }
  },
  'Sustut River': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EC001, BC Ministry of Environment Sustut Counting Weir 24/7 adult enumeration fence, Class I Classified Waters strict fly-fishing regulations.',
    adminTacticalIntel: {
      keyReaches: 'Sustut counting weir pool, Johanson Lake outlet flats, Asitka River junction pool, Moose Valley canyon bends.',
      tacticalBiteTriggers: 'Sub-alpine wilderness freestone with high clarity. Dry fly skating (Bombers, Foam Skaters) and classic grease-line wet flies.',
      waterClarityDynamics: 'Gin-clear sub-alpine gravel. Rarely affected by turbidity; ultra-clear conditions require long fluorocarbon leaders and stealth.',
      estuaryPassageNotes: 'Tyee peak: Jul 15 – Aug 05 (the earliest arriving summer run strain in the entire watershed).',
      historicalGuideNotes: 'Earliest running stock; travels over 420 km up the Skeena canyon network to reach high-altitude headwaters before autumn freeze.'
    },
    accessPoints: [
      {
        id: 'sustut-weir-camp',
        name: 'BC MoE Sustut River Counting Weir',
        type: 'crown-land',
        description: 'Remote wilderness counting facility accessible only by floatplane or wilderness horseback trail.',
        lat: 56.4010,
        lng: -126.6520,
        googleMapsUrl: 'https://maps.google.com/?q=56.4010,-126.6520',
        roadAccess: 'Fly-in only (Smithers floatplane base to Johanson / Sustut Lake)',
        vesselSuitability: 'Walk-in / Inflatable raft pack',
        landTenure: 'BC Provincial Protected Wilderness Area'
      }
    ],
    floatSafety: {
      rating: 'Walk-In / Jetboat Only',
      whitewaterClass: 'Class II–IV (Wilderness headwater stream with extreme isolation)',
      suitableCraft: 'Packraft or walk-and-wade only',
      hazardWarnings: [
        'High grizzly bear population and extreme remoteness',
        'Early autumn snowstorms and freeze-up by mid-October',
        'No road access or cell coverage within 100 km'
      ],
      typicalFloatTimes: 'Expedition packrafting only'
    },
    wadeSafety: {
      difficulty: 'Easy',
      footwearRecommendation: 'Lightweight felt or rubber boots with studs',
      bankAccessibility: 'Pristine gravel bars and clear alpine riffles',
      wadingStaffAdvice: 'Helpful for swift alpine crossings'
    },
    tribalProtocols: {
      nation: 'Gitxsan & Tahltan First Nations Traditional Territory',
      permitRequired: false,
      permitDetails: 'Class I Classified Waters. Strict fly-fishing only, catch-and-release, mandatory provincial quota allocations.',
      officeLocation: 'BC Ministry of Environment, Smithers, BC',
      etiquette: 'Leave No Trace wilderness ethics strictly enforced.'
    }
  }
};
