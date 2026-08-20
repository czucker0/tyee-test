import { RiverAccessPoint, FloatSafetyProfile, WadeSafetyProfile, TribalAccessProtocol, TributaryAdminTacticalIntel, SuggestedFloat, RadioRoadProtocol } from '../types/steelhead';

export interface UnencryptedDossier {
  adminTacticalIntel?: TributaryAdminTacticalIntel;
  accessPoints?: RiverAccessPoint[];
  suggestedFloats?: SuggestedFloat[];
  roadProtocols?: RadioRoadProtocol[];
  floatSafety?: FloatSafetyProfile;
  wadeSafety?: WadeSafetyProfile;
  tribalProtocols?: TribalAccessProtocol;
  confidenceRating: 'High Confidence' | 'Moderate Confidence' | 'Unverified/Anecdotal';
  confidenceRationale: string;
}

export const AUTHENTIC_TACTICAL_DOSSIERS: Record<string, UnencryptedDossier> = {
  'Lower Skeena Mainstem': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'Water Survey of Canada (WSC Station 08EE003 at Usk), DFO Tyee test fishery gillnet logs, and official BC Tidal boundary gazette.',
    adminTacticalIntel: {
      keyReaches: 'Kwinitsa Siding pool, Exchamsiks River confluence bar, Kasiks gravel spit, Lakelse River mouth seam, Shames gravel runs, Terrace railway bridge pool, Polymar gravel trench.',
      tacticalBiteTriggers: 'Incoming spring tides (new/full moon push) deliver sea-lice silver fish into lower tidal channels. Swing heavy T-14/T-17 sink tips with broad black/blue and cerise intruders (3–4.5 inch articulated patterns with pink/purple ostrich ruffs) across 1–2 meter holding ledges before fish ascend into faster canyon water. Fish rest right on the transition break.',
      waterClarityDynamics: 'Coastal storm systems can bring brief mudslides from steep coastal gullies, but massive volume maintains fishable emerald edges along gravel drop-offs. Clears faster on dropping barometric pressure after frontal passage.',
      estuaryPassageNotes: 'Peak transit window: July 25 – August 25. Fresh fish move 15–25 km/day during high tide swells.',
      historicalGuideNotes: 'Fish hold remarkably close to the bank (within 3–8 meters of the rock/gravel edge) to escape the powerful main river hydraulic center. Anglers casting 30 meters often cast right over the travelling pods.',
      bearSafetyNotes: 'Moderate bear density along tidal sloughs and salmon carcasses. Always carry bear spray on your wading belt and make noise when walking through tall willow flats.',
      streamEtiquette: 'Strict Keep \'Em Wet protocol: Revive wild fish facing upstream in soft knee-deep current. Step down 2 full paces between casts to maintain polite pool rotation.'
    },
    roadProtocols: [
      {
        roadName: 'Highway 16 West Corridor (Terrace to Prince Rupert)',
        rrChannel: 'BC Hwy 16 Public Highway',
        frequencyMhz: 'Standard VHF Highway',
        callingRules: 'Paved provincial highway. Watch for heavy transport freight trucks and railway crossings.'
      }
    ],
    suggestedFloats: [
      {
        id: 'lower-skeena-float-1',
        name: 'Exchamsiks to Kwinitsa Tidal Jet Run',
        distanceKm: '22 km',
        estimatedTime: '3 to 5 hours (Power craft / Jetboat only)',
        suitableCraft: 'Heavy Inboard/Outboard Jetboat (18ft–24ft) or heavy 16ft+ whitewater raft with expert oarsperson. STRICTLY NOT SUITED FOR PERSONAL PONTOONS.',
        whitewaterClass: 'Class I–II (Severe volume: 2,000–8,000 m³/s, heavy tidal standing waves)',
        putInParking: 'Exchamsiks Provincial Park paved launch. Ample trailer parking, paved turnaround loop, public washrooms.',
        takeOutParking: 'Kwinitsa Railway pullout off Hwy 16. Rough gravel shoulder; parking for 4–5 vehicles, steep ballast retrieval.',
        vehicleClearance: '2WD Paved/Gravel',
        hazardNotes: 'Tidal surge reversals, sudden ocean fog banks reducing visibility below 20 meters, and heavy commercial tug/jet wake.'
      },
      {
        id: 'lower-skeena-float-2',
        name: 'Terrace (Ferry Island) to Kasiks River Run',
        distanceKm: '62 km',
        estimatedTime: 'Full Day Expedition (6 to 8 hours)',
        suitableCraft: 'Heavy 20ft+ Power Jetboat with reserve fuel. Expert navigational river-reading required.',
        whitewaterClass: 'Class II (Massive standing wave trains, boiling seams, shifting mid-river gravel shoals)',
        putInParking: 'Ferry Island Terrace Municipal Launch. Double wide concrete boat ramp, trailer parking for 20+ rigs.',
        takeOutParking: 'Kasiks Wilderness Resort / Boat Ramp at km 62 west. Private gravel ramp with day-use parking fee.',
        vehicleClearance: '2WD Paved/Gravel',
        hazardNotes: 'Long remote stretches between road access points. High wind against tide generates 1.5-meter standing wave trains.'
      }
    ],
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
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Large paved parking lot with 15+ trailer stalls and public washroom facilities.',
        vesselSuitability: 'Heavy Jetboat, large whitewater raft',
        landTenure: 'BC Provincial Park',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'lower-skeena-kasiks',
        name: 'Kasiks Wilderness Resort & Boat Ramp',
        type: 'put-in',
        description: 'Private/commercial gravel ramp on Kasiks River mouth entering lower tidal Skeena. Excellent fuel and emergency extraction point.',
        lat: 54.3050,
        lng: -129.3080,
        googleMapsUrl: 'https://maps.google.com/?q=54.3050,-129.3080',
        roadAccess: 'Hwy 16 km 62 west of Terrace',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Gravel parking area for 10+ rigs; day-use ramp fee may apply.',
        vesselSuitability: 'Jetboat, sled',
        landTenure: 'Commercial Lease / Provincial Access',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'lower-skeena-kwinitsa',
        name: 'Kwinitsa Siding Gravel Access',
        type: 'walk-in',
        description: 'Historic CN railway siding with walk-in gravel bar access along tidal lower Skeena holding runs. Steep railway ballast descent.',
        lat: 54.2250,
        lng: -129.5400,
        googleMapsUrl: 'https://maps.google.com/?q=54.2250,-129.5400',
        roadAccess: 'Railway pullout along Hwy 16 (km 78 west)',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Gravel highway pullout suitable for 3–4 vehicles; do not block railway emergency access gate.',
        trailDistanceKm: '0.2 km',
        bushwhackDifficulty: 'Short track across rail easement; steep grade with loose rock ballast',
        landTenure: 'Crown Land / Rail Easement',
        confidenceRating: 'Moderate Confidence'
      },
      {
        id: 'lower-skeena-shames',
        name: 'Shames River Confluence Bar',
        type: 'walk-in',
        description: 'Gravel alluvial fan at Shames River confluence. Fish stage on clear-water mixing seam during heavy Skeena run-off.',
        lat: 54.3920,
        lng: -128.9850,
        googleMapsUrl: 'https://maps.google.com/?q=54.3920,-128.9850',
        roadAccess: 'Hwy 16 bridge gravel pullout 30 km west of Terrace',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Wide shoulder pullout for 6–8 vehicles north of bridge.',
        trailDistanceKm: '0.4 km',
        bushwhackDifficulty: '10-minute walk through willow flats and dry gravel channels',
        landTenure: 'Crown Land',
        confidenceRating: 'Moderate Confidence'
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
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Large paved municipal parking area with dedicated boat trailer stalls.',
        vesselSuitability: 'Jetboat, drift boat, raft',
        landTenure: 'City of Terrace Municipal Park',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'lower-skeena-old-cannery-forum',
        name: 'Old Inverness Cannery Slough Track',
        type: 'bushwhack',
        description: 'Overgrown railway trail leading to tidal slough outlet. Bushwhack down tidal bank; steep drop and heavy coastal brush.',
        lat: 54.1950,
        lng: -129.9820,
        googleMapsUrl: 'https://maps.google.com/?q=54.1950,-129.9820',
        roadAccess: 'Port Edward road shoulder near rail crossing',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Narrow road shoulder for 2 vehicles max.',
        trailDistanceKm: '0.8 km',
        bushwhackDifficulty: 'Severe heavy devil’s club and alder brush; rubber boots required for marsh crossing',
        landTenure: 'Unverified / Port Authority Buffer',
        confidenceRating: 'Unverified/Anecdotal'
      }
    ],
    floatSafety: {
      rating: 'Heavy Powercraft / Jetboat Only (Severe Volume)',
      whitewaterClass: 'Class I–II (Extreme 2,000–8,000 m³/s hydraulic discharge, heavy standing waves, powerful ocean tidal reversals)',
      suitableCraft: 'Heavy commercial/custom inboard jetboat (18ft–24ft) or heavy 16ft+ commercial whitewater raft with experienced oarsperson. STRICTLY DANGEROUS & UNSUITED FOR SOLO PERSONAL PONTOON BOATS, SMALL RAFTS, OR CANOES.',
      hazardWarnings: [
        'Severe hydraulic discharge (2,000–8,000 m³/s) creating inescapable mid-river currents and heavy wave trains against ocean winds',
        'Violent tidal surges and standing whirlpools below Kasiks/Kwinitsa with sudden marine fog banks reducing visibility to <20 meters',
        'Massive commercial barge and high-speed jetboat wake in narrow shipping channels',
        'Quicksand-like glacial silt drop-offs and floating deadhead logs in side channels'
      ],
      typicalFloatTimes: 'Terrace to Kasiks: Full Day (62 km heavy power run); Exchamsiks to Kwinitsa: 3–5 hours (Heavy craft only)'
    },
    wadeSafety: {
      difficulty: 'Moderate',
      footwearRecommendation: 'Felt soles with hardened tungsten carbide studs for slick glacial slate shelves and submerged clay deposits',
      bankAccessibility: 'Wide expansive gravel bars at low water; hazardous railway rip-rap and steep clay drop-offs on northern shore',
      wadingStaffAdvice: 'Mandatory. Deep glacial back-eddies create sudden suction drop-offs into 5+ meter glacier depths.'
    },
    tribalProtocols: {
      nation: 'Kitsumkalum & Kitselas First Nations / Coast Tsimshian Traditional Territory',
      permitRequired: false,
      permitDetails: 'Respect traditional First Nations Food, Social, and Ceremonial (FSC) drift and set gillnets. Maintain at least 100 meters clearance from active community fishing vessels.',
      officeLocation: 'Kitsumkalum Band Office, Terrace, BC',
      etiquette: 'Give wide berth to anchored tribal gillnet skiffs and fish processing sites.'
    }
  },
  'Kalum (Kitsumkalum) River': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EG011, Provincial Classified Waters Class II registry, and Terrace Rod & Gun conservation logs.',
    adminTacticalIntel: {
      keyReaches: 'Upper Kalum canyon tail-out, Beaver Creek confluence, Deep Creek tail-out, Glacier Creek mouth run, Mud Lake outflow flats, Lower Kalum bridge pool.',
      tacticalBiteTriggers: 'The Kalum holds colossal multi-salt ocean winter and summer run genetics (up to 35+ lbs). Glacier Lake buffering provides consistent turquoise clarity. Swing deep with Type 6/8 sink tips or Skagit heads with 3 meter T-14 and heavy weighted Intruder flies (black/purple, olive/copper). In slower tailouts, switch to a slow floating line dry fly drag-free skated bomber on calm dawn mists.',
      waterClarityDynamics: 'Exceptionally stable due to Kitsumkalum Lake settling basin. When Skeena runs brown from storm surges, the Kalum stays fishable emerald.',
      estuaryPassageNotes: 'Summer run enters late June through August. Winter run enters November through April.',
      historicalGuideNotes: 'Focus on massive bedrock shelves where spring-fed cold upwellings create thermal oxygen refuges.',
      bearSafetyNotes: 'High-density grizzly feeding area during August–October salmon runs. Keep bear spray readily accessible on your belt.',
      streamEtiquette: 'Classified Waters Class II rules apply. Single barbless hooks only. Practice unhooking fish in the water without lifting their bodies into the air.'
    },
    roadProtocols: [
      {
        roadName: 'West Kalum FSR',
        rrChannel: 'RR-2',
        frequencyMhz: '150.080 MHz',
        callingRules: 'Active industrial logging traffic. Mandatory VHF radio. Call KM markers: state empty/loaded and direction (e.g. \'Pickup empty, up at KM 6\').'
      }
    ],
    suggestedFloats: [
      {
        id: 'kalum-float-1',
        name: 'Upper Kalum Lake-Outflow Drift',
        distanceKm: '14 km',
        estimatedTime: '3 to 4 hours',
        suitableCraft: '14–16 ft Drift boat or inflatable whitewater raft. (MANDATORY TAKE-OUT AT KM 8 BEFORE CANYON)',
        whitewaterClass: 'Class II (Gentle emerald riffles, clear boulder tailouts)',
        putInParking: 'Kitsumkalum Lake Provincial Park Boat Ramp. Concrete ramp, trailer stalls for 12+ vehicles.',
        takeOutParking: 'Kalum Canyon Forestry Rec Site (West Kalum FSR km 8). Gravel slide launch, parking for 6–8 rigs.',
        vehicleClearance: 'High-Clearance AWD',
        hazardNotes: 'CRITICAL LETHAL HAZARD: DO NOT MISS THE KM 8 TAKE-OUT. The Kalum Canyon below this point is an impassable Class IV–V whitewater gorge.',
        mandatoryExitPoint: 'KM 8 Canyon Rec Site'
      },
      {
        id: 'kalum-float-2',
        name: 'Lower Kalum Fishery Road to Hwy 16 Drift',
        distanceKm: '16 km',
        estimatedTime: '4 to 5 hours',
        suitableCraft: '14–16 ft Drift boat, inflatable raft, or skilled jetboat.',
        whitewaterClass: 'Class II (Swift emerald braids, gravel bar chutes)',
        putInParking: 'Fishery Road / Martin Creek Drift Launch off West Kalum Road km 4.5. Gravel pullout for 4–6 rigs.',
        takeOutParking: 'Kalum River Hwy 16 Bridge Ramp (west of Terrace). Concrete/gravel ramp beneath bridge with 8+ parking spots.',
        vehicleClearance: 'High-Clearance AWD',
        hazardNotes: 'Braided island channels with submerged old-growth rootwads and sweepers. Always scout the main current braid.'
      }
    ],
    accessPoints: [
      {
        id: 'kalum-lake-launch',
        name: 'Kitsumkalum Lake Provincial Park Boat Ramp',
        type: 'put-in',
        description: 'Concrete boat launch at south end of Kitsumkalum Lake providing direct drift entry to Upper Kalum river mouth.',
        lat: 54.7180,
        lng: -128.7650,
        googleMapsUrl: 'https://maps.google.com/?q=54.7180,-128.7650',
        roadAccess: 'Nisga\'a Hwy (Hwy 113) 25 km north of Terrace',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Paved boat launch parking with 12+ vehicle and trailer stalls.',
        vesselSuitability: 'Drift boat, raft, jetboat',
        landTenure: 'BC Provincial Park',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'kalum-canyon-takeout',
        name: 'Kalum Canyon Forestry Rec Site / Take-Out',
        type: 'take-out',
        description: 'Well-maintained gravel take-out immediately above Kalum Canyon whitewater gorge. MANDATORY TAKE-OUT for non-whitewater craft.',
        lat: 54.6420,
        lng: -128.7210,
        googleMapsUrl: 'https://maps.google.com/?q=54.6420,-128.7210',
        roadAccess: 'West Kalum FSR km 8',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Forestry rec site with space for 6–8 vehicles; rough gravel turning loop.',
        vesselSuitability: 'Drift boat, raft extraction',
        landTenure: 'Rec Sites and Trails BC',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'kalum-deep-creek',
        name: 'Deep Creek Confluence Walk-In',
        type: 'walk-in',
        description: 'Foot trail off West Kalum Road down through spruce timber to legendary Deep Creek holding pool.',
        lat: 54.5830,
        lng: -128.6750,
        googleMapsUrl: 'https://maps.google.com/?q=54.5830,-128.6750',
        roadAccess: 'West Kalum Road pullout km 4.5',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Gravel turnout on west side of road for 3–4 vehicles.',
        trailDistanceKm: '0.3 km',
        bushwhackDifficulty: '10-minute maintained trail, moderate slope',
        landTenure: 'Crown Land',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'kalum-hwy-bridge',
        name: 'Kalum River Hwy 16 Bridge Ramp',
        type: 'take-out',
        description: 'Gravel take-out under Hwy 16 bridge near confluence with Skeena River at Terrace.',
        lat: 54.5290,
        lng: -128.6480,
        googleMapsUrl: 'https://maps.google.com/?q=54.5290,-128.6480',
        roadAccess: 'Hwy 16 westbound shoulder 3 km west of Terrace',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Paved/compact gravel lot under highway bridge with space for 8+ vehicles.',
        vesselSuitability: 'Drift boat, raft, jetboat',
        landTenure: 'MoTI Right of Way',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'kalum-mayo-creek-bushwhack',
        name: 'Lower Kalum Mayo Creek Rail Cut',
        type: 'bushwhack',
        description: 'Pullout by hydro transmission tower; 12-minute bushwhack along the cutline down to the Mayo Run tailout.',
        lat: 54.5520,
        lng: -128.6620,
        googleMapsUrl: 'https://maps.google.com/?q=54.5520,-128.6620',
        roadAccess: 'West Kalum FSR km 4.5',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Small hydro spur shoulder for 2 vehicles.',
        trailDistanceKm: '0.5 km',
        bushwhackDifficulty: 'Moderate bushwhack through hemlock cutline and clay bank scramble',
        landTenure: 'Crown Forestry Land',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'kalum-old-trapper-spur',
        name: 'Old Trapper Spur 14 Bedrock Track',
        type: 'bushwhack',
        description: 'Decommissioned timber cruiser spur leading to inaccessible canyon drop-pool. Unmaintained for 25 years; heavy windfalls.',
        lat: 54.6750,
        lng: -128.7400,
        googleMapsUrl: 'https://maps.google.com/?q=54.6750,-128.7400',
        roadAccess: 'Overgrown skid trail off West Kalum FSR km 14',
        vehicleClearance: 'True 4x4 (Low-Range Required)',
        parkingInfo: 'Ditch-blocked spur; park on FSR shoulder only.',
        trailDistanceKm: '1.2 km',
        bushwhackDifficulty: 'Extreme windfall maze and steep ravine; rope handline advised',
        landTenure: 'Crown Forestry Timber License',
        confidenceRating: 'Unverified/Anecdotal'
      }
    ],
    floatSafety: {
      rating: 'Reach-Dependent: Drift Friendly / Mid-Canyon Hazard',
      whitewaterClass: 'Upper Kalum & Lower Kalum: Class II. Kalum Canyon (KM 8 to KM 5): Impassable Class IV–V Gorge',
      suitableCraft: '14–16 ft Drift boats and rafts permitted on Upper Kalum (Lake to KM 8) and Lower Kalum (Fishery Rd to Hwy 16). STRICTLY NO DRIFT BOATS THROUGH KALUM CANYON.',
      hazardWarnings: [
        'DEATH HAZARD: Kalum Canyon gorge is impassable to drift boats. Take out at KM 8 Canyon Rec Site before canyon entrance.',
        'Dense grizzly bear feeding concentration along lower timbered gravel bars during salmon runs',
        'Submerged sweepers and rootwads on braided island channels in lower river'
      ],
      typicalFloatTimes: 'Upper Kalum (Kitsumkalum Lake to KM 8 Rec Site): 3–4 hours; Lower Kalum (Fishery Rd to Hwy 16): 4–5 hours'
    },
    wadeSafety: {
      difficulty: 'Moderate',
      footwearRecommendation: 'Studded felt waders; sharp shale ledges and slippery glacial clay banks',
      bankAccessibility: 'Steep timbered cut-banks with slick root systems; use established game trails',
      wadingStaffAdvice: 'Recommended when wading the tailouts of deep glacial boulder runs'
    },
    tribalProtocols: {
      nation: 'Kitsumkalum First Nation (Tsimshian Nation)',
      permitRequired: true,
      permitDetails: 'Class II Classified Waters licence required from BC MoE. Non-guided non-resident alien restrictions apply on weekends.',
      officeLocation: 'Kitsumkalum Band Office, Terrace, BC',
      costInfo: 'Provincial Class II Classified Waters license fee',
      etiquette: 'Respect First Nations fish fences and communal smokehouses along lower river corridors.'
    }
  },
  'Zymoetz (Copper) River': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EF005 (Zymoetz at Hwy 16), BC MoE Classified Waters Class II registry, and Bulkley-Skeena Angling Management Plan.',
    adminTacticalIntel: {
      keyReaches: 'Lower Copper Canyon tail-out, KM 9.5 (6-Mile) bridge run, McDonnell Lake outflow braids, Limonite Creek confluence, KM 24 Fossil Beds run, Clore River junction bar, Skeena confluence eddy.',
      tacticalBiteTriggers: 'Known for high-energy acrobatic fish. Early season fish respond violently to dry flies (Pompadour, Steelhead Bomber, grease-line skater) in low clear autumn flows. In colder autumn temps, shift to small unweighted copper/black leech patterns or sparse Spey flies swung close to bedrock walls. Around the mid-river Fossil Bed canyon runs (km 22–26), fish hold tight to the submerged dark Permian shale ledges where undercut pockets provide cover from high river velocity.',
      waterClarityDynamics: 'Extremely vulnerable to flash mudslides from Limonite / Clore River shale gullies after heavy coastal rains. Can turn chocolate milk in 3 hours, then clear back to gin-clear in 48 hours.',
      estuaryPassageNotes: 'Enters early: July 15 – August 20. Peak holding season: August 20 – October 15.',
      historicalGuideNotes: 'When copper colored or slightly milky, fish move into ultra-shallow knee-deep inside gravel tail-outs where velocity is lowest. The famous Zymoetz Permian/Jurassic Fossil Beds between km 22 and 26 feature exposed shale shelves bearing ancient ammonites and bivalve fossils; strictly leave fossils undisturbed in situ as removal is prohibited under BC heritage conservation.',
      bearSafetyNotes: 'High grizzly presence along the upper Clore and Copper river braids. Carry bear spray on your chest or hip holster at all times.',
      streamEtiquette: 'Classified Waters Class II regulations apply. Keep fish submerged in the water during hook removal; never drag fish across abrasive dry shale.'
    },
    roadProtocols: [
      {
        roadName: 'Zymoetz (Copper) River FSR',
        rrChannel: 'RR-1',
        frequencyMhz: '153.050 MHz',
        callingRules: 'Active heavy industrial logging haul corridor. Mandatory 2-way VHF radio. Drivers must call KM markers, direction, and loaded/empty status ascending/descending (e.g. \'Empty pickup, up at KM 18\').'
      }
    ],
    suggestedFloats: [
      {
        id: 'copper-float-1',
        name: 'Upper Copper Scenic Drift (Clore Confluence to KM 9.5 Bridge)',
        distanceKm: '28 km',
        estimatedTime: '5 to 7 hours',
        suitableCraft: '14–16 ft Drift boat or self-bailing whitewater raft. (MANDATORY TAKE-OUT AT KM 9.5 BRIDGE)',
        whitewaterClass: 'Class II (Swift boulder runs, clear canyon riffles)',
        putInParking: 'KM 38 Clore Confluence Rec Site off Copper FSR. Rough gravel launch area, space for 4–6 vehicles with trailers.',
        takeOutParking: 'KM 9.5 (6-Mile) Bridge Rec Site. Gravel slide launch, parking area for 6–8 rigs.',
        vehicleClearance: 'True 4x4 (Low-Range Required)',
        hazardNotes: 'LETHAL HAZARD: MANDATORY TAKE-OUT AT KM 9.5 BRIDGE. DO NOT PROCEED PAST THE BRIDGE INTO THE IMPASSABLE CLASS V COPPER CANYON.',
        mandatoryExitPoint: 'KM 9.5 (6-Mile) Bridge'
      },
      {
        id: 'copper-float-2',
        name: 'Mid-Copper Fossil Beds Run (KM 24 to KM 9.5 Bridge)',
        distanceKm: '14.5 km',
        estimatedTime: '3 to 4.5 hours',
        suitableCraft: '14–16 ft Drift boat or inflatable raft.',
        whitewaterClass: 'Class II (Pristine shale ledges, boulder tailouts)',
        putInParking: 'KM 24 Fossil Beds pullout off Copper FSR. Narrow road shoulder for 3 vehicles; manual craft slide down gravel chute.',
        takeOutParking: 'KM 9.5 (6-Mile) Bridge Rec Site. Gravel ramp and parking for 8 rigs.',
        vehicleClearance: 'High-Clearance AWD',
        hazardNotes: 'Sharp shale shelves can abrade inflatable craft. Mandatory take-out at KM 9.5 bridge.',
        mandatoryExitPoint: 'KM 9.5 (6-Mile) Bridge'
      }
    ],
    accessPoints: [
      {
        id: 'zymoetz-hwy16-confluence',
        name: 'Zymoetz Hwy 16 Bridge Launch & Bar',
        type: 'put-in',
        description: 'Paved highway turnout and gravel ramp immediately below Hwy 16 bridge into Zymoetz/Skeena confluence pool.',
        lat: 54.5210,
        lng: -128.4350,
        googleMapsUrl: 'https://maps.google.com/?q=54.5210,-128.4350',
        roadAccess: 'Hwy 16 km 8 east of Terrace',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Large paved/gravel parking area with space for 10+ rigs.',
        vesselSuitability: 'Raft, drift boat, jetboat',
        landTenure: 'MoTI Right of Way / Rec Site',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'zymoetz-6-mile-bridge',
        name: 'KM 9.5 (6-Mile) Bridge Rec Site & Launch',
        type: 'put-in',
        description: 'Forestry Recreation Site with rough gravel slide launch into prime middle Zymoetz holding runs. Mandatory take-out for upstream floats.',
        lat: 54.5580,
        lng: -128.3420,
        googleMapsUrl: 'https://maps.google.com/?q=54.5580,-128.3420',
        roadAccess: 'Zymoetz (Copper) River FSR km 9.5',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Forestry Rec site with 8 parking stalls and fire rings.',
        vesselSuitability: 'Whitewater raft, drift boat extraction',
        landTenure: 'Rec Sites and Trails BC',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'zymoetz-canyon-lookout',
        name: 'Copper River Canyon Chasm Hazard',
        type: 'hazard-canyon',
        description: 'Narrow Class V+ sheer bedrock gorge with boiling hydraulics and siphon rocks. Impassable gorge.',
        lat: 54.5720,
        lng: -128.2950,
        googleMapsUrl: 'https://maps.google.com/?q=54.5720,-128.2950',
        roadAccess: 'Copper River FSR km 15 viewpoint',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Narrow cliffside turnout for 2 vehicles.',
        vesselSuitability: 'NONE - IMPASSABLE GORGE',
        landTenure: 'Crown Land',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'zymoetz-fossil-beds-bushwhack',
        name: 'KM 24 Permian Fossil Beds Bushwhack Trail',
        type: 'bushwhack',
        description: 'Steep 150m descent down dry shale drainage gully directly to ancient Permian fossil ledges and deep holding pool.',
        lat: 54.5820,
        lng: -128.2450,
        googleMapsUrl: 'https://maps.google.com/?q=54.5820,-128.2450',
        roadAccess: 'Copper River FSR km 24 pullout',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Gravel shoulder pullout for 2–3 vehicles.',
        trailDistanceKm: '0.25 km',
        bushwhackDifficulty: 'Steep shale scramble through devil\'s club; studded boots and trekking staff recommended',
        landTenure: 'Crown Land / BC Heritage Reserve',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'zymoetz-clore-confluence',
        name: 'KM 38 Clore River Confluence Remote Rec Site',
        type: 'walk-in',
        description: 'Remote forestry wilderness site where glacial Clore River enters the Copper. High holding density in emerald back-eddies.',
        lat: 54.5910,
        lng: -128.1580,
        googleMapsUrl: 'https://maps.google.com/?q=54.5910,-128.1580',
        roadAccess: 'Copper River FSR km 38 (active logging trucks, VHF radio required)',
        vehicleClearance: 'True 4x4 (Low-Range Required)',
        parkingInfo: 'Rough clearing at rec site for 4–5 trucks with trailers.',
        trailDistanceKm: '0.1 km',
        bushwhackDifficulty: 'Rough path down bluff',
        landTenure: 'Crown Land / Rec Site',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'zymoetz-limonite-bushwhack',
        name: 'KM 14 Limonite Creek Confluence Overlook',
        type: 'bushwhack',
        description: 'Hidden overgrown skid-trail leading to gravel bench opposite Limonite Creek mouth.',
        lat: 54.5690,
        lng: -128.3050,
        googleMapsUrl: 'https://maps.google.com/?q=54.5690,-128.3050',
        roadAccess: 'Copper River FSR km 14.2 pullout',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Old forestry spur entrance for 2 vehicles.',
        trailDistanceKm: '0.6 km',
        bushwhackDifficulty: '20-minute moderate bushwhack down timbered slope',
        landTenure: 'Crown Forestry Land',
        confidenceRating: 'High Confidence'
      }
    ],
    floatSafety: {
      rating: 'Reach-Dependent: Upper Drift / Lower Lethal Canyon',
      whitewaterClass: 'Upper/Middle (McDonnell/Clore to KM 9.5 Bridge): Class II. Lower Canyon (KM 9.5 Bridge to Skeena): Class V+ Lethal Whitewater Gorge',
      suitableCraft: '14–16 ft Drift boats and self-bailing whitewater rafts on UPPER/MIDDLE ONLY. NO BOATS OF ANY KIND IN LOWER CANYON.',
      hazardWarnings: [
        'LETHAL CANYON HAZARD: The Lower Zymoetz Canyon below KM 9.5 (6-Mile) Bridge is an impassable Class V+ gorge with undercut siphon ledges and boiling hydraulics. MANDATORY TAKE-OUT AT KM 9.5 BRIDGE.',
        'Active heavy industrial logging corridor on single-lane Zymoetz FSR. 2-way VHF radio (RR-1 / 153.050 MHz) mandatory for all traffic.',
        'Flash mudslides from Limonite Creek and Clore River during autumn rain-on-snow events'
      ],
      typicalFloatTimes: 'Upper Float (KM 38 Clore to KM 9.5 Bridge): 5–7 hours (Class II drift); Middle Float (KM 24 Fossil Beds to KM 9.5 Bridge): 3–4.5 hours'
    },
    wadeSafety: {
      difficulty: 'Challenging / Treacherous',
      footwearRecommendation: 'Studded boots with heavy ankle support; greasy canyon boulder gardens and steep scree slopes',
      bankAccessibility: 'Sheer canyon walls in multiple sectors; steep bush descents requiring handlines',
      wadingStaffAdvice: 'Essential. River bottom consists of shifting bowling-ball cobblestones and sudden bedrock faults'
    },
    tribalProtocols: {
      nation: 'Kitselas & Wet\'suwet\'en First Nations Territory',
      permitRequired: true,
      permitDetails: 'Class II Classified Waters licence mandatory. BC resident and non-resident quota days apply.',
      officeLocation: 'Kitselas Band Administration, Terrace, BC',
      costInfo: 'Class II Classified Waters licence',
      etiquette: 'Pack out all garbage, respect wildlife corridor signs, yield road to heavy industrial timber transport.'
    }
  },
  'Middle Skeena Mainstem': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EE003 at Usk, BC MoE radio-tagging receiver arrays, and Skeena Class II management documentation.',
    adminTacticalIntel: {
      keyReaches: 'Usk Cable Ferry current seams, Pacific gravel bar braids, Cedarvale canyon holding runs, Woodcock gravel spit, Kitwanga Bridge confluence pool, Hazelton canyon junction pool.',
      tacticalBiteTriggers: 'Fish travel aggressively through the middle Skeena, resting in soft inside seam pockets behind bedrock outcroppings. Intermediate to sink tip setups (Type 3 / Type 6) with traditional hair-wing patterns (Lady Caroline, Undertaker, Black Bear Green Butt) or articulated flies swung on an even 45-degree angle.',
      waterClarityDynamics: 'Skeena mainstem visibility is governed by Zymoetz (Copper) and Kitwanga river inputs; clears rapidly once autumn nights drop below freezing in the Coast Range.',
      estuaryPassageNotes: 'Tyee peak passage: Aug 05 – Aug 26. Fish swim this 120 km section in 5–8 days during stable water.',
      historicalGuideNotes: 'Focus on the "traveling seam"—the distinct current interface where fast 5-knot main channel water slows down to 2–3 knots along the inner shoreline.',
      bearSafetyNotes: 'Watch for black bears and grizzlies along salmon spawning tributaries (Kitwanga, Kasiks, Shames). Always carry bear spray.',
      streamEtiquette: 'Observe courteous river etiquette: Never anchor a boat directly above a wading angler. Step-down rotation mandatory.'
    },
    roadProtocols: [
      {
        roadName: 'Highway 16 East (Terrace to Hazelton)',
        rrChannel: 'BC Hwy 16 Corridor',
        frequencyMhz: 'Standard VHF Highway',
        callingRules: 'Paved highway. Monitor standard road conditions and watch for wildlife crossing.'
      }
    ],
    suggestedFloats: [
      {
        id: 'mid-skeena-float-1',
        name: 'Hazelton (Ksan) to Kitwanga Bridge Jet Run',
        distanceKm: '38 km',
        estimatedTime: '4 to 6 hours',
        suitableCraft: 'Heavy inboard/outboard jetboat with experienced navigator, or 16ft+ whitewater raft.',
        whitewaterClass: 'Class II–III (Large boiling eddy lines, standing wave trains, Roche de Boule canyon narrows)',
        putInParking: 'Ksan Historic Village Launch in Old Hazelton. Wide gravel ramp, parking for 15+ vehicles.',
        takeOutParking: 'Kitwanga Hwy 37 Bridge Pullout. Large gravel shoulder under bridge for 8+ vehicles.',
        vehicleClearance: '2WD Paved/Gravel',
        hazardNotes: 'Kitselas and Roche de Boule canyon narrows create powerful boiling whirlpools that can capsize light personal craft.'
      }
    ],
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
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Gravel ferry landing parking for 8–10 vehicles.',
        vesselSuitability: 'Jetboat, raft, drift boat',
        landTenure: 'BC Ministry of Transportation ROW',
        confidenceRating: 'High Confidence'
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
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Gravel turnout for 4–5 vehicles.',
        trailDistanceKm: '0.3 km',
        bushwhackDifficulty: 'Easy 5-minute gravel trail',
        landTenure: 'Crown Land',
        confidenceRating: 'Moderate Confidence'
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
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Large pullout beneath bridge for 8 vehicles.',
        vesselSuitability: 'Raft take-out, hand-carry pontoon',
        landTenure: 'Crown Land / BC Highways',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'mid-skeena-hazelton-confluence',
        name: 'Ksan Historic Village / Bulkley Confluence Ramp',
        type: 'put-in',
        description: 'Public river access and cultural historic park at the dramatic junction of the Skeena and Bulkley rivers.',
        lat: 55.2450,
        lng: -127.6950,
        googleMapsUrl: 'https://maps.google.com/?q=55.2450,-127.6950',
        roadAccess: 'Old Hazelton village center to Ksan parking lot',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Large paved visitor parking lot with public launch access.',
        vesselSuitability: 'Jetboat, drift boat, whitewater raft',
        landTenure: 'Village of Hazelton / Gitxsan Territory',
        confidenceRating: 'High Confidence'
      }
    ],
    floatSafety: {
      rating: 'Heavy Powercraft / Jetboat Only (Severe Volume)',
      whitewaterClass: 'Class II–III (Heavy boiling upwellings, standing whirlpools)',
      suitableCraft: 'Heavy inboard/outboard jetboats (experienced navigators only), 16ft+ whitewater rafts',
      hazardWarnings: [
        'Kitselas and Roche de Boule canyons present extreme hydraulic boil lines that can capsize light craft',
        'Active First Nations set nets along eddy seams—maintain 100m distance',
        'Railway bridge footings create powerful hydraulic pinning hazards'
      ],
      typicalFloatTimes: 'Hazelton to Kitwanga: 4–6 hours (38 km); Kitwanga to Usk: Full day (65 km)'
    },
    wadeSafety: {
      difficulty: 'Moderate',
      footwearRecommendation: 'Felt sole boots with hardened studs for slick slate rock shelves',
      bankAccessibility: 'Long open gravel bars on inside bends; sheer rail bed rip-rap on outside bends',
      wadingStaffAdvice: 'Strongly recommended when wading out into heavy current to reach the inside seam'
    },
    tribalProtocols: {
      nation: 'Gitxsan Nation (Gitanmaax, Glen Vowell, Kispiox, Gitwangak, Gitanyow Bands)',
      permitRequired: false,
      permitDetails: 'Respect unceded Gitxsan Lax Yip (traditional house territories). Anglers must honour hereditary chief fish camp closures and traditional net fisheries.',
      officeLocation: 'Gitxsan Hereditary Chiefs Office, Hazelton, BC',
      etiquette: 'Do not interfere with traditional dip net, gaff, or smokehouse operations at canyon stations.'
    }
  },
  'Kispiox River': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EB004 (Kispiox near Hazelton), Provincial Class I Classified Waters registry, and historic Skeena world-record catch registers.',
    adminTacticalIntel: {
      keyReaches: 'Sweetin Creek pool, KM 33 (20-Mile) bridge run, Lower Footbridge run, KM 14 Potato Patch pool, Triangle pool, Kispiox / Skeena confluence mouth run.',
      tacticalBiteTriggers: 'World-famous for legendary heavy-shouldered hook-nosed genetic titans (30–40+ lbs). Slow gradient, tea-stained water with extensive log structures. Elite surface dry-fly water in September! Skate large deer-hair bombers (Steelhead Orange, Natural Brown) or hitched Muddler Minnows dead-drifted over log tail-outs. As October frost cools the river below 5°C, switch to slow-swung Marabou Spey flies (black/purple, midnight blue) on light 1.5–3 meter intermediate sink tips.',
      waterClarityDynamics: 'Gentle, peat-buffered watershed. Stays fishable longer during moderate rain but takes longer to drop if headwater muskeg bogs saturate.',
      estuaryPassageNotes: 'Passes Tyee: Aug 05 – Aug 28. Enters Kispiox mouth late August through October.',
      historicalGuideNotes: 'Kispiox fish are notoriously cover-oriented. They hold right tight against sunken old-growth cedar sweepers and slow deep mud banks rather than open gravel flats.',
      bearSafetyNotes: 'Extremely dense grizzly bear population along the river corridor during autumn salmon die-off. Always carry bear spray on your hip holster.',
      streamEtiquette: 'Class I Classified Waters License required. Non-resident alien schedule restrictions strictly enforced. Single barbless hooks only.'
    },
    roadProtocols: [
      {
        roadName: 'Kispiox Valley Road & FSR',
        rrChannel: 'RR-1',
        frequencyMhz: '153.050 MHz',
        callingRules: 'Paved to km 18, compact gravel beyond. Industrial log trucks active on upper FSR. Call KM markers past km 25.'
      }
    ],
    suggestedFloats: [
      {
        id: 'kispiox-float-1',
        name: 'Upper Kispiox Timber Float (KM 33 to KM 20 Rec Site)',
        distanceKm: '13 km',
        estimatedTime: '4 to 5 hours',
        suitableCraft: '14–16 ft Drift boat or inflatable raft.',
        whitewaterClass: 'Class I–II (Low gradient, heavy deadfall/sweepers)',
        putInParking: 'KM 33 (20-Mile) Rec Site Launch off Kispiox Valley Road. Gravel ramp and camping area for 6–8 rigs.',
        takeOutParking: 'KM 20 (Date Creek / 12-Mile) Rec Site. Broad gravel ramp with parking for 8+ vehicles and trailers.',
        vehicleClearance: 'High-Clearance AWD',
        hazardNotes: 'SEVERE SWEEPER HAZARD: Ancient spruce trees frequently fall across narrow river bends. Always scout blind channels before entering.'
      },
      {
        id: 'kispiox-float-2',
        name: 'Lower Kispiox Meadow Drift (KM 20 to Kispiox Village Mouth)',
        distanceKm: '20 km',
        estimatedTime: '5 to 6.5 hours',
        suitableCraft: '14–16 ft Drift boat or inflatable raft.',
        whitewaterClass: 'Class I (Gentle meandering meadow pools, classic dry-fly flats)',
        putInParking: 'KM 20 (Date Creek) Rec Site. Space for 8+ rigs.',
        takeOutParking: 'Kispiox Village River Mouth Ramp. Public gravel bar launch in village; space for 10+ rigs.',
        vehicleClearance: '2WD Paved/Gravel',
        hazardNotes: 'Braided island gravel bars with submerged rootwads. Shallow gravel bars during low October flows may require dragging.'
      }
    ],
    accessPoints: [
      {
        id: 'kispiox-mouth-ramp',
        name: 'Kispiox Village River Mouth Ramp',
        type: 'put-in',
        description: 'Gravel bar launch at the confluence of Kispiox and Skeena rivers in Kispiox Village.',
        lat: 55.3520,
        lng: -127.6980,
        googleMapsUrl: 'https://maps.google.com/?q=55.3520,-127.6980',
        roadAccess: 'Kispiox Valley Road km 5 to Village river road',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Expansive gravel bar parking for 10+ rigs.',
        vesselSuitability: 'Drift boat, raft, small jetboat',
        landTenure: 'Kispiox Band Land / Public ROW',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'kispiox-12-mile-bridge',
        name: 'KM 20 (Date Creek / 12-Mile) Rec Site & Launch',
        type: 'put-in',
        description: 'Forestry Recreation Site with excellent gravel drift boat launch and riverbank camping.',
        lat: 55.4510,
        lng: -127.7850,
        googleMapsUrl: 'https://maps.google.com/?q=55.4510,-127.7850',
        roadAccess: 'Kispiox Valley Road km 20',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Forestry rec site with 10+ campsites and boat trailer parking.',
        vesselSuitability: 'Drift boat, raft, pontoon',
        landTenure: 'Rec Sites and Trails BC',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'kispiox-20-mile-bridge',
        name: 'KM 33 (20-Mile) Bridge Rec Site & Launch',
        type: 'put-in',
        description: 'Classic drift boat launch giving access to legendary upper Kispiox timber pools and meadow reaches.',
        lat: 55.5620,
        lng: -127.8720,
        googleMapsUrl: 'https://maps.google.com/?q=55.5620,-127.8720',
        roadAccess: 'Kispiox Valley Road km 33',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Gravel parking area for 6–8 rigs with trailer turning circle.',
        vesselSuitability: 'Drift boat, raft',
        landTenure: 'Rec Sites and Trails BC',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'kispiox-potato-patch-turnout',
        name: 'KM 14 Potato Patch Meadow Bushwhack',
        type: 'walk-in',
        description: 'Unmarked willow-line pullout; 300m push through meadow grass following creek to expansive gravel bar holding seam.',
        lat: 55.4120,
        lng: -127.7450,
        googleMapsUrl: 'https://maps.google.com/?q=55.4120,-127.7450',
        roadAccess: 'Kispiox Valley Road km 14 pullout',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Roadside grassy pullout for 3 vehicles.',
        trailDistanceKm: '0.3 km',
        bushwhackDifficulty: 'Short 5-minute grassy meadow walk',
        landTenure: 'Crown Land / Road Right of Way',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'kispiox-murder-creek-bushwhack',
        name: 'KM 27 Murder Creek Confluence Foot-Track',
        type: 'bushwhack',
        description: 'Pull off at old culvert; 15-minute downhill bushwhack through hemlock timber to secluded boulder tail-out.',
        lat: 55.5120,
        lng: -127.8250,
        googleMapsUrl: 'https://maps.google.com/?q=55.5120,-127.8250',
        roadAccess: 'Kispiox Valley Road km 27.2',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Gravel culvert shoulder for 2 vehicles.',
        trailDistanceKm: '0.6 km',
        bushwhackDifficulty: 'Moderate downhill bushwhack through old timber; watch for windfalls',
        landTenure: 'Crown Forestry Land',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'kispiox-step-and-pool-old-guide-camp',
        name: 'Upper Sweetin Creek Confluence Trail',
        type: 'bushwhack',
        description: 'Historic foot trail leading into secluded upper step-and-pool reach. Crosses active bog with deep sinkholes.',
        lat: 55.7200,
        lng: -128.0100,
        googleMapsUrl: 'https://maps.google.com/?q=55.7200,-128.0100',
        roadAccess: 'Kispiox Valley FSR km 62 spur',
        vehicleClearance: 'True 4x4 (Low-Range Required)',
        parkingInfo: 'Rough overgrown spur for 2 trucks.',
        trailDistanceKm: '2.0 km',
        bushwhackDifficulty: 'Substantial muskeg bushwhack and high grizzly bear concentration; compass/GPS required',
        landTenure: 'Crown Forest Land',
        confidenceRating: 'Unverified/Anecdotal'
      }
    ],
    floatSafety: {
      rating: 'Intermediate Float with Sweeper Hazards',
      whitewaterClass: 'Class I–II (Low gradient, heavy deadfall/sweepers)',
      suitableCraft: '14–16 ft fiberglass/aluminum drift boats, inflatable rafts, pontoon boats',
      hazardWarnings: [
        'EXTREME SWEEPER HAZARD: River shifts gravel bars annually; freshly fallen spruce sweepers block entire braided channels',
        'Dense grizzly bear population feeding on salmon carcasses along narrow brushy banks',
        'Low autumn water levels can trap drift boats on shallow gravel bars'
      ],
      typicalFloatTimes: 'KM 33 (20-Mile) to KM 20 (12-Mile): 4–5 hours (13 km); KM 20 to Mouth: 5–6.5 hours (20 km)'
    },
    wadeSafety: {
      difficulty: 'Easy',
      footwearRecommendation: 'Felt boots or rubber vibram with light studs; soft gravel bars and fine cobble',
      bankAccessibility: 'Gentle grassy banks and open gravel spits; some muddy clay drops',
      wadingStaffAdvice: 'Helpful around deep clay holes and submerged log piles'
    },
    tribalProtocols: {
      nation: 'Gitxsan Nation (Kispiox House Territories / Wilp)',
      permitRequired: true,
      permitDetails: 'Class I Classified Waters License mandatory from Sept 01 to Oct 31. Strict non-resident alien booking and guide allocations apply.',
      officeLocation: 'Kispiox Band Administration Office, Kispiox, BC',
      costInfo: 'Provincial Class I Classified Waters License ($40/day non-resident)',
      etiquette: 'Treat the river with deep reverence. No littering, catch-and-release only with barbless single hooks.'
    }
  },
  'Bulkley / Morice River System': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Stations 08EE005 (Quick) & 08ED002 (Smithers), BC MoE Classified Waters Class II registry, and 70-year provincial escapement records.',
    adminTacticalIntel: {
      keyReaches: 'Moricetown/Witset Canyon pool, Quick Station gravel run, Telkwa confluence pool, Smithers Ferry Park run, Trout Creek tailout, Walcott Station pool, Morice River Bimbear reach, Morice Forks pool.',
      tacticalBiteTriggers: 'The absolute undisputed crown jewel of surface dry-fly steelhead fishing on planet earth! In September when water temps hold between 8°C and 13°C, 80%+ of hookups come on skated dry flies (Waller Waker, Pompadour, Steelhead Bomber, Foam Skater) fished on floating lines with 3.5–4.5 meter monofilament leaders. As water cools below 6°C in mid-October, switch to light sink-tips (Type 3 / 3m T-8) and swung General Practitioner or Lady Caroline hairwings.',
      waterClarityDynamics: 'Morice Lake acts as a massive 50 km turquoise settling reservoir, keeping the upper and middle system exceptionally clear even during autumn rains. Bulkley below Telkwa can pick up color from Telkwa River silt.',
      estuaryPassageNotes: 'Tyee transit: July 28 – September 05 (Peak Aug 12–25). Bulkley holds 40–50% of the entire Skeena steelhead population.',
      historicalGuideNotes: 'During bright bluebird midday skies, fish hold in broken 1–1.5 meter riffles where surface ripples diffuse sunlight. At dawn and dusk, they move onto wide, glassy tail-out flats.',
      bearSafetyNotes: 'Regular black bear and grizzly bear presence near side channels. Make your presence known when walking through cottonwood river bottoms.',
      streamEtiquette: 'Strict low-hole prohibition: Never step in downstream of an active angler. Start 50+ meters above and step down 2 paces after each swing.'
    },
    roadProtocols: [
      {
        roadName: 'Morice River FSR',
        rrChannel: 'RR-3',
        frequencyMhz: '152.960 MHz',
        callingRules: 'High-speed industrial timber transport corridor. Mandatory VHF radio. Call KM markers ascending/descending (e.g. \'Loaded truck down at KM 42\').'
      }
    ],
    suggestedFloats: [
      {
        id: 'bulkley-float-1',
        name: 'The Quick-to-Telkwa Dry Fly Classic',
        distanceKm: '22 km',
        estimatedTime: '4 to 6 hours',
        suitableCraft: '14–16 ft Drift boat or inflatable raft.',
        whitewaterClass: 'Class I–II (Gentle gravel riffles, legendary dry-fly runs)',
        putInParking: 'Quick Station Bridge Boat Launch off Quick West Road. Concrete/gravel ramp, parking for 10+ rigs.',
        takeOutParking: 'Telkwa Confluence Village Park Launch (Hankin Ave). Paved municipal launch and trailer parking for 12+ rigs.',
        vehicleClearance: '2WD Paved/Gravel',
        hazardNotes: 'Midstream gravel bar logjams between Quick and Telkwa. Watch for low-hanging branches in braided side channels.'
      },
      {
        id: 'bulkley-float-2',
        name: 'Telkwa to Smithers (Ferry Park) Drift',
        distanceKm: '18 km',
        estimatedTime: '3.5 to 5 hours',
        suitableCraft: '14–16 ft Drift boat or inflatable raft.',
        whitewaterClass: 'Class I (Wide open sweeping gravel runs)',
        putInParking: 'Telkwa Village Park. Ample paved parking and trailer stalls.',
        takeOutParking: 'Smithers Ferry Park Boat Launch (Pacific St). Paved municipal ramp with 15+ trailer stalls.',
        vehicleClearance: '2WD Paved/Gravel',
        hazardNotes: 'Gentle gradient, excellent beginner drift boat water. October morning frost can make boat ramp slippery.'
      },
      {
        id: 'bulkley-float-3',
        name: 'Upper Morice Wilderness Float (Bimbear to Morice Forks)',
        distanceKm: '24 km',
        estimatedTime: '5 to 6.5 hours',
        suitableCraft: '14–16 ft Drift boat or whitewater raft.',
        whitewaterClass: 'Class II (Crystal-clear turquoise water, swift boulder braids)',
        putInParking: 'Morice River / Bimbear Creek Rec Site at Morice FSR km 27. Gravel launch and camping area for 6 rigs.',
        takeOutParking: 'Morice River / Bulkley Forks Rec Site at Morice FSR km 4 (Houston). Gravel launch with space for 8 rigs.',
        vehicleClearance: 'High-Clearance AWD',
        hazardNotes: 'Remote wilderness float with cold lake-fed water. Carry warm layers and satellite communication.'
      }
    ],
    accessPoints: [
      {
        id: 'bulkley-witset-canyon',
        name: 'Witset (Moricetown) Canyon Viewpoint & Falls',
        type: 'hazard-canyon',
        description: 'Famous ancestral First Nations canyon and cultural fishway. Sacred dip-netting site; angling prohibited within 100m of fishway.',
        lat: 55.0310,
        lng: -127.3290,
        googleMapsUrl: 'https://maps.google.com/?q=55.0310,-127.3290',
        roadAccess: 'Hwy 16 at Witset village',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Paved cultural center parking lot.',
        vesselSuitability: 'UNRUNNABLE GORGE - EXTREME HAZARD',
        landTenure: 'Witset First Nation / BC Parks',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'bulkley-quick-bridge',
        name: 'Quick Station Bridge Boat Launch',
        type: 'put-in',
        description: 'Historic wooden bridge and public boat ramp providing access to prime middle Bulkley drift water.',
        lat: 54.6280,
        lng: -126.9020,
        googleMapsUrl: 'https://maps.google.com/?q=54.6280,-126.9020',
        roadAccess: 'Quick Station Road off Hwy 16 (between Telkwa and Houston)',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Gravel recreation site with parking for 10+ rigs.',
        vesselSuitability: 'Drift boat, raft',
        landTenure: 'Rec Sites and Trails BC / MoTI',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'bulkley-telkwa-confluence',
        name: 'Telkwa Confluence Village Park Launch',
        type: 'put-in',
        description: 'Village of Telkwa public boat ramp at the mouth of the Telkwa River into the Bulkley.',
        lat: 54.6940,
        lng: -127.0510,
        googleMapsUrl: 'https://maps.google.com/?q=54.6940,-127.0510',
        roadAccess: 'Hankin Avenue, Village of Telkwa off Hwy 16',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Paved parking with dedicated trailer stalls for 12+ vehicles.',
        vesselSuitability: 'Drift boat, raft, jetboat',
        landTenure: 'Village of Telkwa Municipal Park',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'bulkley-trout-creek',
        name: 'Trout Creek Rec Site & Drift Launch',
        type: 'put-in',
        description: 'BC Forestry recreation site and boat launch between Smithers and Moricetown.',
        lat: 54.8820,
        lng: -127.2340,
        googleMapsUrl: 'https://maps.google.com/?q=54.8820,-127.2340',
        roadAccess: 'Trout Creek Dike Road off Hwy 16 north of Smithers',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Gravel recreation site with space for 8 rigs.',
        vesselSuitability: 'Drift boat, raft',
        landTenure: 'Rec Sites and Trails BC',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'bulkley-morice-confluence-forks',
        name: 'Morice River / Bulkley Forks Rec Site',
        type: 'put-in',
        description: 'Prime junction where the gin-clear Morice River joins the Bulkley River near Houston.',
        lat: 54.3980,
        lng: -126.6850,
        googleMapsUrl: 'https://maps.google.com/?q=54.3980,-126.6850',
        roadAccess: 'Morice River FSR km 4 (Houston)',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Forestry rec site with campsite and boat launch parking for 8 rigs.',
        vesselSuitability: 'Drift boat, raft, jetboat',
        landTenure: 'Rec Sites and Trails BC',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'bulkley-walcott-railway-spur',
        name: 'Walcott Station Rail-Grade Footpath',
        type: 'walk-in',
        description: 'Cross CN tracks and follow narrow beaten game trail through cottonwoods down to legendary Walcott Run tailout.',
        lat: 54.5510,
        lng: -126.7920,
        googleMapsUrl: 'https://maps.google.com/?q=54.5510,-126.7920',
        roadAccess: 'Walcott Road off Hwy 16 south of Quick (km 9)',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Railway siding pullout for 3–4 vehicles.',
        trailDistanceKm: '0.4 km',
        bushwhackDifficulty: 'Easy 10-minute walk through open cottonwoods',
        landTenure: 'Crown Land / Rail ROW',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'morice-bimbear-rec-site',
        name: 'Morice River / Bimbear Creek Rec Site',
        type: 'put-in',
        description: 'Remote forestry campsite and drift boat slide launch into upper turquoise Morice holding pools.',
        lat: 54.2650,
        lng: -126.8850,
        googleMapsUrl: 'https://maps.google.com/?q=54.2650,-126.8850',
        roadAccess: 'Morice River FSR km 27',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Forestry rec site with campsite loops and launch parking for 6 rigs.',
        vesselSuitability: 'Drift boat, raft',
        landTenure: 'Rec Sites and Trails BC',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'morice-aspen-creek-spur',
        name: 'Morice Aspen Creek Decommissioned Spur',
        type: 'bushwhack',
        description: 'Overgrown logging track with tank-traps; 25-minute bushwhack dropping to undisturbed braided side-channel run.',
        lat: 54.1850,
        lng: -127.0200,
        googleMapsUrl: 'https://maps.google.com/?q=54.1850,-127.0200',
        roadAccess: 'Morice River FSR km 41.5 ditch-block',
        vehicleClearance: 'True 4x4 (Low-Range Required)',
        parkingInfo: 'Ditch-block pullout for 2 trucks.',
        trailDistanceKm: '1.4 km',
        bushwhackDifficulty: 'Moderate bushwhack along old skid trail; dense alder sections',
        landTenure: 'Crown Forest Land',
        confidenceRating: 'High Confidence'
      }
    ],
    floatSafety: {
      rating: 'Premier Drift Boat & Raft Friendly',
      whitewaterClass: 'Class I–II (Gentle riffles and long gravel flats)',
      suitableCraft: '14–16 ft drift boats, whitewater rafts, personal pontoon catamarans',
      hazardWarnings: [
        'Witset (Moricetown) Canyon is an impassable Class V+ waterfall gorge. ALL CRAFT MUST TAKE OUT at Trout Creek or Telkwa well above canyon.',
        'Midstream gravel bar logjams between Quick and Telkwa can create tight braids with sweepers',
        'Morning frost in October makes boat launch ramps dangerously slick for towing vehicles'
      ],
      typicalFloatTimes: 'Quick to Telkwa: 4–6 hours (22 km); Telkwa to Smithers (Ferry Park): 3.5–5 hours (18 km); Bimbear to Morice Forks: 5–6.5 hours (24 km)'
    },
    wadeSafety: {
      difficulty: 'Easy',
      footwearRecommendation: 'Felt soles with light studs or sticky rubber with carbide studs for gravel flats and rounded cobble',
      bankAccessibility: 'Premier walk-and-wade river. Miles of wide open, gently sloping gravel bars with easy access',
      wadingStaffAdvice: 'Recommended when crossing heavy tailout chutes to reach far-side gravel bars'
    },
    tribalProtocols: {
      nation: 'Wet\'suwet\'en First Nation (Witset, Moricetown) & Gitxsan Nation',
      permitRequired: true,
      permitDetails: 'Class II Classified Waters licence mandatory from Sept 01 to Oct 31. Strict Canadian resident / non-resident schedule allocations apply.',
      officeLocation: 'Wet\'suwet\'en Hereditary Chiefs Office, Smithers, BC',
      costInfo: 'Provincial Class II Classified Waters Licence ($20/day non-resident)',
      etiquette: 'Do not approach active First Nations gaffing or dip-netting scaffolds at Witset Falls.'
    }
  },
  'Babine River': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EC001 (Babine at Babine Lake Outlet), BC Parks Babine River Corridor Provincial Park gazette, and DFO Babine Counting Fence archives.',
    adminTacticalIntel: {
      keyReaches: 'Nilkitkwa Lake outlet pool, DFO Counting Fence tailout, Babine Canyon drop-pools, Silver Hilton reach, Gail Creek run, Shegisic pool, Skeena confluence junction.',
      tacticalBiteTriggers: 'Known as the "River of Giants"—holds some of the largest pure-strain summer steelhead on earth. Incredible autumn dry fly surface action (Bombers, Chernobyl Ant variants, Greased Line Spey flies). In deep canyon pools, swing weighted Muddler Minnows, purple intruders, or black Spey leeches on 12.5–14 ft 8-weight two-handed rods.',
      waterClarityDynamics: 'Protected by massive Babine and Nilkitkwa lakes settling basin. Runs crystal clear turquoise almost the entire season. Only heavy mudslides in remote tributary creeks affect lower canyon reaches.',
      estuaryPassageNotes: 'Passes Tyee: Aug 01 – Aug 30. Enters Babine River late August through October.',
      historicalGuideNotes: 'One of the most pristine wilderness rivers on earth. The DFO Babine Counting Fence records every single salmon and steelhead ascending into the lake system.',
      bearSafetyNotes: 'HIGHEST GRIZZLY CONCENTRATION IN BC: Babine River Corridor Provincial Park supports hundreds of feeding grizzlies. Bear spray on hip (never inside pack) and bear-proof food canisters mandatory.',
      streamEtiquette: 'Class I Classified Waters License strictly required. Zero tolerance for fish handling out of the water. Single barbless hooks only.'
    },
    roadProtocols: [
      {
        roadName: 'Babine Nilkitkwa FSR',
        rrChannel: 'RR-4',
        frequencyMhz: '151.100 MHz',
        callingRules: 'Remote active logging road. Mandatory VHF radio. Single-lane bridges and blind corners. Call KM markers ascending/descending.'
      }
    ],
    suggestedFloats: [
      {
        id: 'babine-float-1',
        name: 'Babine Multi-Day Wilderness Whitewater Expedition',
        distanceKm: '65 km (DFO Fence to Skeena Confluence)',
        estimatedTime: '3 to 5 Days (Self-Supported Expedition)',
        suitableCraft: 'Heavy 16–18 ft self-bailing whitewater expedition rafts with expert oarspeople. STRICTLY NO DRIFT BOATS.',
        whitewaterClass: 'Class IV–V through Babine Canyon (Remote drop-pools, violent boiling hydraulics, mandatory scouting)',
        putInParking: 'DFO Babine Salmon Counting Fence (Nilkitkwa FSR km 60). Gravel launch area and staff compound parking.',
        takeOutParking: 'Shegisic Creek Gravel Extraction Bar (Helicopter / Jetboat extraction only - NO ROAD ACCESS).',
        vehicleClearance: 'High-Clearance AWD',
        hazardNotes: 'EXTREME WILDERNESS PERIL: Lethal Class V chasm rapids in Babine Canyon. InReach satellite SOS transceivers, drysuits, and bear deterrence mandatory.'
      }
    ],
    accessPoints: [
      {
        id: 'babine-fence-launch',
        name: 'DFO Babine Counting Fence & Launch',
        type: 'put-in',
        description: 'Road-accessible drift launch at the famous DFO Babine Salmon Counting Fence at Nilkitkwa Lake outlet.',
        lat: 55.4290,
        lng: -126.6850,
        googleMapsUrl: 'https://maps.google.com/?q=55.4290,-126.6850',
        roadAccess: 'Babine Lake FSR km 60 from Smithers',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Gravel clearing near DFO fence for 6 vehicles.',
        vesselSuitability: 'Whitewater raft, heavy pontoon (NO standard drift boats below fence)',
        landTenure: 'DFO Federal Reserve / BC Parks',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'babine-nilkitkwa-rec-site',
        name: 'Nilkitkwa Lake Rec Site & Camp',
        type: 'put-in',
        description: 'Recreation site with gravel boat ramp into upper river / lake slackwater above counting fence.',
        lat: 55.3850,
        lng: -126.6200,
        googleMapsUrl: 'https://maps.google.com/?q=55.3850,-126.6200',
        roadAccess: 'Nilkitkwa FSR km 45',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Forestry rec site with campsite stalls and trailer parking for 8 rigs.',
        vesselSuitability: 'Raft, jetboat, canoe',
        landTenure: 'Rec Sites and Trails BC',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'babine-canyon-takeout-shegisic',
        name: 'Shegisic Creek Helicopter Extraction Pad',
        type: 'take-out',
        description: 'Remote wilderness helicopter gravel bar extraction point for multi-day wilderness whitewater expeditions.',
        lat: 55.7820,
        lng: -127.1850,
        googleMapsUrl: 'https://maps.google.com/?q=55.7820,-127.1850',
        roadAccess: 'NO ROAD ACCESS - Helicopter / Jetboat only',
        vehicleClearance: 'True 4x4 (Low-Range Required)',
        parkingInfo: 'Wilderness gravel bar pad (Aviation access only).',
        vesselSuitability: 'Multi-day whitewater raft extraction',
        landTenure: 'Babine River Corridor Provincial Park',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'babine-grizzly-drop-trail',
        name: 'Grizzly Drop / Nilkitkwa Confluence Trail',
        type: 'bushwhack',
        description: '500m steep hike down an active wildlife corridor to upper canyon entry. High grizzly density; group travel required.',
        lat: 55.4850,
        lng: -126.7400,
        googleMapsUrl: 'https://maps.google.com/?q=55.4850,-126.7400',
        roadAccess: 'Nilkitkwa FSR km 52 pullout',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Narrow shoulder for 2 vehicles.',
        trailDistanceKm: '0.5 km',
        bushwhackDifficulty: 'Steep timbered descent; bear spray on hip mandatory',
        landTenure: 'Babine River Wilderness Park',
        confidenceRating: 'High Confidence'
      }
    ],
    floatSafety: {
      rating: 'Expert Whitewater Expedition Rafts Only',
      whitewaterClass: 'Class IV–V through Babine Canyon (Lethal drop-pools, boulder gardens)',
      suitableCraft: 'Heavy expedition whitewater rafts (16–18 ft) with self-bailers and expert oarspeople. STRICTLY NO DRIFT BOATS.',
      hazardWarnings: [
        'EXTREME GRIZZLY BEAR DENSITY: Babine Corridor Provincial Park has one of the highest concentrations of grizzly bears in North America. Bear spray and food barrels mandatory.',
        'Babine Canyon has unrunnable Class V chasm rapids. Must scout and maintain strict expedition safety protocols.',
        'Extremely remote: No cell phone service, satellite communication (InReach/Zoleo) mandatory.'
      ],
      typicalFloatTimes: 'Multi-day expedition float: 3 to 5 days from DFO Fence to Skeena confluence (65 km)'
    },
    wadeSafety: {
      difficulty: 'Challenging / Treacherous',
      footwearRecommendation: 'Felt soles with heavy tungsten studs; slippery bedrock ledges and deep current shelves',
      bankAccessibility: 'Sheer canyon drop-offs, dense old-growth devil\'s club and alder jungle',
      wadingStaffAdvice: 'Mandatory. Powerful hydraulic surges can sweep anglers off bedrock ledges'
    },
    tribalProtocols: {
      nation: 'Lake Babine Nation & Ned\'u\'ten First Nation Traditional Territory',
      permitRequired: true,
      permitDetails: 'Class I Classified Waters License mandatory from Sept 01 to Oct 31. Babine River Corridor Provincial Park regulations apply.',
      officeLocation: 'Lake Babine Nation Band Office, Burns Lake / Fort Babine, BC',
      costInfo: 'Class I Classified Waters License ($40/day non-resident)',
      etiquette: 'Deeply sacred First Nations salmon territory. Absolutely zero tolerance for fish mishandling or litter.'
    }
  },
  'Upper Skeena & Other Tributaries': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EB005, Gitxsan territorial baseline surveys, and BC MoE Upper Skeena Classified Waters Class II gazette.',
    adminTacticalIntel: {
      keyReaches: 'Skeena Crossing railway pool, Shegunia River confluence, Slamgeesh junction, Kuldo canyon pool, Babine confluence junction eddy.',
      tacticalBiteTriggers: 'Fish in the upper Skeena mainstem are relentless travellers pushing toward the Babine, Sustut, and northern headwaters. Swing large, high-visibility intruders (black/blue, cerise/orange) through deep bedrock holding pools.',
      waterClarityDynamics: 'Clears early in autumn as glacial melt freezes in the northern Stikine and Skeena mountain ranges.',
      estuaryPassageNotes: 'Passes Tyee: July 20 – August 20. Enters upper watershed by late August.',
      historicalGuideNotes: 'Target the tailouts of deep canyon pools where ascending fish rest before tackling the next heavy whitewater chute.',
      bearSafetyNotes: 'Wilderness grizzly territory. Travel in groups, carry bear spray, and secure all food.',
      streamEtiquette: 'Strict catch-and-release. Single barbless hooks. Maintain polite distance between anglers.'
    },
    roadProtocols: [
      {
        roadName: 'Upper Kispiox / Kuldo FSR',
        rrChannel: 'RR-1',
        frequencyMhz: '153.050 MHz',
        callingRules: 'Rough forestry road with active logging and mining exploration traffic. Call KM markers past km 30.'
      }
    ],
    suggestedFloats: [
      {
        id: 'upper-skeena-float-1',
        name: 'Glen Vowell to Kispiox Confluence Jet Drift',
        distanceKm: '18 km',
        estimatedTime: '3 to 4.5 hours',
        suitableCraft: 'Heavy jetboat or 16ft+ whitewater raft.',
        whitewaterClass: 'Class II–III (Canyon chutes, large boiling eddies)',
        putInParking: 'Skeena Crossing / Glen Vowell Ramp off Hwy 62. Gravel ramp for 6 rigs.',
        takeOutParking: 'Kispiox River Mouth Ramp in Kispiox Village. Space for 10+ rigs.',
        vehicleClearance: '2WD Paved/Gravel',
        hazardNotes: 'Large standing waves in canyon chutes; keep clear of bedrock wall undercuts.'
      }
    ],
    accessPoints: [
      {
        id: 'upper-skeena-crossing',
        name: 'Skeena Crossing / Glen Vowell Ramp',
        type: 'put-in',
        description: 'Gravel river access off Hwy 62 north of Hazelton near Glen Vowell village.',
        lat: 55.3120,
        lng: -127.6580,
        googleMapsUrl: 'https://maps.google.com/?q=55.3120,-127.6580',
        roadAccess: 'Hwy 62 km 8 north of Hazelton',
        vehicleClearance: '2WD Paved/Gravel',
        parkingInfo: 'Gravel turnout for 6 vehicles with trailers.',
        vesselSuitability: 'Jetboat, raft',
        landTenure: 'Gitxsan Territory / Public ROW',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'upper-skeena-shegunia',
        name: 'Shegunia River Confluence Bar',
        type: 'walk-in',
        description: 'Foot access to major tributary confluence gravel bar along upper Skeena canyon.',
        lat: 55.4580,
        lng: -127.5920,
        googleMapsUrl: 'https://maps.google.com/?q=55.4580,-127.5920',
        roadAccess: 'Kispiox Valley FSR km 18 east spur',
        vehicleClearance: 'High-Clearance AWD',
        parkingInfo: 'Forestry turnout for 3 vehicles.',
        trailDistanceKm: '0.6 km',
        bushwhackDifficulty: 'Moderate 15-minute downhill trail',
        landTenure: 'Crown Land',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'upper-skeena-kuldo-ruins',
        name: 'Historic Kuldo Village Canyon Overlook',
        type: 'bushwhack',
        description: 'Ancient Gitxsan village site overlooking sheer canyon holding pool.',
        lat: 55.8520,
        lng: -127.9520,
        googleMapsUrl: 'https://maps.google.com/?q=55.8520,-127.9520',
        roadAccess: 'Abandoned logging spur 50 km north of Hazelton',
        vehicleClearance: 'True 4x4 (Low-Range Required)',
        parkingInfo: 'Overgrown landing for 2 trucks.',
        trailDistanceKm: '1.8 km',
        bushwhackDifficulty: 'Difficult wilderness bushwhack with steep canyon cliff drop-offs',
        landTenure: 'Gitxsan Lax Yip / Crown Reserve',
        confidenceRating: 'Moderate Confidence'
      }
    ],
    floatSafety: {
      rating: 'Intermediate Float with Hazards',
      whitewaterClass: 'Class II–III (Heavy canyon hydraulics, isolated Class IV gorges)',
      suitableCraft: 'Heavy jetboat (skilled pilot) or 16ft+ whitewater raft',
      hazardWarnings: [
        'Kuldo Canyon features powerful boiling upwellings and blind rock horns',
        'Isolated northern wilderness with no cellular reception or road access for 40+ km stretches',
        'Active timber and log jams in braided gravel bars'
      ],
      typicalFloatTimes: 'Glen Vowell to Kispiox Confluence: 3–4.5 hours (18 km); Shegunia to Hazelton: 5–6.5 hours (32 km)'
    },
    wadeSafety: {
      difficulty: 'Moderate',
      footwearRecommendation: 'Felt soles with hardened studs for slick slate rock shelves',
      bankAccessibility: 'Mix of broad cobblestone gravel bars and sheer canyon rock bluffs',
      wadingStaffAdvice: 'Recommended when wading the fast seams of the main upper Skeena'
    },
    tribalProtocols: {
      nation: 'Gitxsan Nation (Glen Vowell, Gitanmaax) & Gitanyow Hereditary Chiefs',
      permitRequired: false,
      permitDetails: 'Respect traditional Gitxsan house territories. Strictly non-retention for all wild steelhead.',
      officeLocation: 'Gitxsan Hereditary Chiefs Office, Hazelton, BC',
      etiquette: 'Leave no trace, respect ancestral village sites and grave markers.'
    }
  },
  'Sustut River': {
    confidenceRating: 'High Confidence',
    confidenceRationale: 'WSC Station 08EC002, Sustut River Provincial Park Master Plan, and DFO / MoE Sustut River Fish Counting Fence registers.',
    adminTacticalIntel: {
      keyReaches: 'Sustut Counting Fence pool, Moosevale Creek confluence, Bear Lake outflow runs, Asitka River junction pool, Sustut Lake tailout.',
      tacticalBiteTriggers: 'The absolute high-altitude headwaters of the Skeena system (450 km from the ocean at 1,000+ meter elevation). Steelhead arrive in immaculate condition with incredible endurance. World-famous dry fly fishing in gin-clear alpine waters. Skated bombers and small hairwings swung on floating lines produce heart-stopping surface takes.',
      waterClarityDynamics: 'Gin clear alpine freestone river. Sustut Lake and Bear Lake buffer the headwaters from extreme turbidity.',
      estuaryPassageNotes: 'The very first steelhead to enter the Skeena in early July are Sustut-bound. They swim 450 km in 30–45 days to reach the high alpine before winter freeze-up.',
      historicalGuideNotes: 'Due to extreme water clarity, long 4.5–5 meter fluorocarbon leaders and ultra-stealthy wading are required to avoid spooking resting fish in shallow pools.',
      bearSafetyNotes: 'High-elevation wilderness: Grizzly bears, black bears, and bull moose active throughout the corridor. Satellite SOS beacon and bear deterrents mandatory.',
      streamEtiquette: 'Class I Classified Waters sanctuary. Single barbless hooks. Absolutely zero lifting of fish out of water for photography.'
    },
    roadProtocols: [
      {
        roadName: 'Sustut FSR / Takla Forest Road',
        rrChannel: 'RR-5 / Takla Channel',
        frequencyMhz: '150.800 MHz',
        callingRules: 'Extreme remote wilderness logging road (150 km from Takla Landing). Mandatory 4x4, auxiliary fuel, 2 spare tires, and VHF radio.'
      }
    ],
    suggestedFloats: [
      {
        id: 'sustut-float-1',
        name: 'Counting Fence to Lower Camp Packraft Run',
        distanceKm: '16 km',
        estimatedTime: '4 to 6 hours',
        suitableCraft: 'Inflatable packraft, small expedition raft, or walk-and-wade. No heavy drift boats.',
        whitewaterClass: 'Class II–III (High gradient alpine freestone, shallow granite boulder gardens)',
        putInParking: 'Sustut Counting Fence Airstrip (Air charter access or Takla 4x4 route).',
        takeOutParking: 'Lower Wilderness Camp gravel bar (Helicopter / Foot extraction).',
        vehicleClearance: 'True 4x4 (Low-Range Required)',
        hazardNotes: 'Extremely remote alpine wilderness. Freezing night temperatures in September. Satellite SOS device mandatory.'
      }
    ],
    accessPoints: [
      {
        id: 'sustut-fence-airstrip',
        name: 'Sustut River Counting Fence Airstrip',
        type: 'put-in',
        description: 'Gravel bush airstrip and provincial fish counting fence station. Primary access point for authorized conservation researchers and guided anglers.',
        lat: 56.4520,
        lng: -126.9850,
        googleMapsUrl: 'https://maps.google.com/?q=56.4520,-126.9850',
        roadAccess: 'NO PUBLIC ROAD ACCESS - Bush plane / Helicopter or Sustut FSR (150 km rough 4x4 from Takla Landing)',
        vehicleClearance: 'True 4x4 (Low-Range Required)',
        parkingInfo: 'Bush airstrip apron (Aviation/Research camp only).',
        vesselSuitability: 'Raft, inflatable canoe, walk-and-wade',
        landTenure: 'Sustut Protected Area / Provincial Park',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'sustut-asitka-confluence',
        name: 'Asitka River Confluence Camp',
        type: 'walk-in',
        description: 'Wilderness confluence holding water in Sustut Provincial Park.',
        lat: 56.3850,
        lng: -126.8520,
        googleMapsUrl: 'https://maps.google.com/?q=56.3850,-126.8520',
        roadAccess: 'Helicopter drop-in or multi-day alpine trail',
        vehicleClearance: 'True 4x4 (Low-Range Required)',
        parkingInfo: 'Wilderness camp site.',
        trailDistanceKm: '5.0 km',
        bushwhackDifficulty: 'Wilderness foot travel only',
        landTenure: 'BC Provincial Park',
        confidenceRating: 'High Confidence'
      },
      {
        id: 'sustut-bear-lake-old-outpost-spur',
        name: 'Bear Lake 1960s Guide Outpost Trail',
        type: 'bushwhack',
        description: 'Overgrown packhorse trail from Bear Lake to lower Sustut canyon. Discovered in vintage 1968 hunting guide maps.',
        lat: 56.2800,
        lng: -126.7200,
        googleMapsUrl: 'https://maps.google.com/?q=56.2800,-126.7200',
        roadAccess: 'Decommissioned mining spur north of Takla Lake',
        vehicleClearance: 'True 4x4 (Low-Range Required)',
        parkingInfo: 'Overgrown trail head for 1 vehicle.',
        trailDistanceKm: '8.0 km',
        bushwhackDifficulty: 'Extreme multi-day wilderness bushwhack with no trail markers',
        landTenure: 'Crown Land / Wilderness',
        confidenceRating: 'Unverified/Anecdotal'
      }
    ],
    floatSafety: {
      rating: 'Fly-In Alpine Wilderness / Shallow Jetboat',
      whitewaterClass: 'Class II–III (High gradient alpine freestone, shallow boulder gardens)',
      suitableCraft: 'Small inflatable raft, packraft, walk-and-wade. No heavy drift boats.',
      hazardWarnings: [
        'EXTREME REMOTE WILDERNESS: 150+ km from nearest hospital or paved road. Satellite SOS beacon mandatory.',
        'High grizzly bear and bull moose concentration in alpine river valley',
        'Sub-zero freeze-up can begin as early as late September'
      ],
      typicalFloatTimes: 'Fence to Lower Camp: 4–6 hours (Packraft/Walk-and-wade)'
    },
    wadeSafety: {
      difficulty: 'Moderate',
      footwearRecommendation: 'Felt soles or studded rubber for slick alpine riverbed cobble and granite boulders',
      bankAccessibility: 'Open alpine gravel bars and willow meadows; pristine high-elevation scenery',
      wadingStaffAdvice: 'Essential in fast, crystal-clear freestone riffles'
    },
    tribalProtocols: {
      nation: 'Gitxsan & Takla First Nations Traditional Territory',
      permitRequired: true,
      permitDetails: 'Class I Classified Waters License mandatory from Sept 01 to Oct 31. Sustut River Provincial Park regulations apply. High-conservation sanctuary.',
      officeLocation: 'BC Parks Northern Region / Gitxsan Hereditary Chiefs',
      costInfo: 'Class I Classified Waters License ($40/day non-resident)',
      etiquette: 'Strict catch-and-release, single barbless hooks. Treat this pristine alpine sanctuary with supreme respect.'
    }
  }
};
