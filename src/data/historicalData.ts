import { DailyIndex, YearRunData, TributaryEscapement } from '../types/steelhead';
import { RAW_DFO_DATA, CALENDAR_DAYS } from './dfoAuthenticDatabase';

// Tyee test fishery conversion factor: ~220 adult steelhead per 1.0 cumulative index point
export const ADULT_EXPANSION_FACTOR = 220;

// Authentic DFO & Provincial biological escapement management thresholds for Tyee Steelhead index:
export const ESCAPEMENT_THRESHOLDS = {
  EXTREME_CONSERVATION: 40,  // < 40 (~8,800 fish): Severe emergency closures (e.g. 2021 was 22.3)
  PRECAUTIONARY: 75,         // 40 - 75 (~16,500 fish): Low return / cautious management (e.g. 2019, 2020, 2022, 2025)
  TARGET_HEALTHY: 110,       // 75 - 110 (~24,200 fish): Healthy sustainable escapement target
  ABUNDANT: 140,             // > 140 (~30,000+ fish): Exceptional top-tier return (e.g. 2016, 2018, 2024, 2026)
};

// Generate calendar date list from Jun 10 to Sep 30
export interface SeasonDay {
  dayIndex: number; // 0 to 112
  month: number;
  day: number;
  monthDay: string; // "Aug 16"
  isHistoricalPeakWindow: boolean;
}

export const SEASON_DAYS: SeasonDay[] = CALENDAR_DAYS.map((c) => ({
  dayIndex: c.dayIndex,
  month: c.month,
  day: c.day,
  monthDay: c.monthDay,
  isHistoricalPeakWindow: c.month === 8 && c.day >= 10 && c.day <= 20,
}));

// Current calendar date in our simulation is dynamically determined relative to current time
export const CURRENT_YEAR = new Date().getFullYear() || 2026;

// Dynamic current day helper: maps current date into season day index (Jun 10 - Sep 30)
export function getLiveTodayDayIndex(): { dayIndex: number; dateStr: string; monthDay: string; isSeasonActive: boolean } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // Find matching day in SEASON_DAYS (Jun 10 to Sep 30)
  const matched = SEASON_DAYS.find((s) => s.month === month && s.day === day);
  if (matched) {
    return {
      dayIndex: matched.dayIndex,
      dateStr: `${now.getFullYear()}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`,
      monthDay: matched.monthDay,
      isSeasonActive: true,
    };
  }

  // Default to August 16 active in-season telemetry if off-season or simulated
  return {
    dayIndex: 67, // Aug 16
    dateStr: `${CURRENT_YEAR}-08-16`,
    monthDay: 'Aug 16',
    isSeasonActive: month >= 6 && month <= 9,
  };
}

const liveDateInfo = getLiveTodayDayIndex();
export const TODAY_DAY_INDEX = liveDateInfo.dayIndex;
export const TODAY_DATE_STR = liveDateInfo.dateStr;
export const TODAY_MONTH_DAY = liveDateInfo.monthDay;

// Helper to determine the latest day with authentic published DFO test fishery data
export function getLatestRecordedSeasonDayIndex(yearsList?: YearRunData[]): number {
  const current = (yearsList || ALL_YEARS_DATA).find((y) => y.isCurrentYear || y.year === CURRENT_YEAR);
  if (current?.data?.length) {
    for (let i = current.data.length - 1; i >= 0; i--) {
      const d = current.data[i];
      if ((d as any).isRecorded === true || (d.dailyIndex > 0 && d.cumulativeIndex > 0)) {
        return i;
      }
    }
  }
  return 69; // Default Aug 18 (Day 69)
}

export const LATEST_RECORDED_DAY_INDEX = 69; // Aug 18 (Day 69)
export const LATEST_RECORDED_MONTH_DAY = 'Aug 18';

// Helper to compute previous 10 completed seasons relative to any current season
export const getPreviousDecadeYears = (currentYear: number = CURRENT_YEAR): number[] => {
  return Array.from({ length: 10 }, (_, i) => currentYear - 1 - i);
};

export const ALL_YEARS_DATA: YearRunData[] = Object.keys(RAW_DFO_DATA).map((yKey) => {
  const yr = RAW_DFO_DATA[parseInt(yKey, 10)];
  const isCurrent = yr.isCurrent;

  const records: DailyIndex[] = yr.daily.map((d) => ({
    dayOfYear: d.dayIndex + 1,
    dateStr: d.dateStr,
    monthDay: d.monthDay,
    month: d.month,
    day: d.day,
    dailyIndex: d.dailyIndex,
    cumulativeIndex: d.cumulativeIndex,
    waterTempC: d.waterTempC || 15.0,
    dischargeM3s: d.dischargeM3s || 2200,
  }));

  return {
    year: yr.year,
    isCurrentYear: isCurrent,
    totalIndex: yr.totalCumulative,
    projectedTotal: isCurrent ? yr.totalCumulative : undefined,
    peakDate: yr.peakDate,
    peakDailyIndex: yr.peakDailyIndex,
    medianDate: yr.daily[yr.medianDayIndex]?.monthDay || 'Aug 14',
    conservationStatus: yr.status as any,
    color: yr.color,
    notes: yr.notes,
    data: records,
  };
});

// Compute 10-year historical average curve (2016-2025)
export const HISTORICAL_AVERAGE_CURVE: {
  dayIndex: number;
  monthDay: string;
  avgDaily: number;
  avgCumulative: number;
  minCumulative: number;
  maxCumulative: number;
  medianCumulative: number;
  pctElapsed: number; // average % of run complete by this day
}[] = [];

(() => {
  const prevYears = ALL_YEARS_DATA.filter((y) => !y.isCurrentYear);
  const numYears = prevYears.length || 1;

  for (let d = 0; d < SEASON_DAYS.length; d++) {
    let dailySum = 0;
    let cumSum = 0;
    let minCum = Infinity;
    let maxCum = -Infinity;
    const cumList: number[] = [];

    for (const y of prevYears) {
      const r = y.data[d];
      if (r) {
        dailySum += r.dailyIndex;
        cumSum += r.cumulativeIndex;
        if (r.cumulativeIndex < minCum) minCum = r.cumulativeIndex;
        if (r.cumulativeIndex > maxCum) maxCum = r.cumulativeIndex;
        cumList.push(r.cumulativeIndex);
      }
    }

    cumList.sort((a, b) => a - b);
    const medianCum = cumList.length > 0 ? cumList[Math.floor(cumList.length / 2)] : 0;

    HISTORICAL_AVERAGE_CURVE.push({
      dayIndex: d,
      monthDay: SEASON_DAYS[d].monthDay,
      avgDaily: Math.round((dailySum / numYears) * 100) / 100,
      avgCumulative: Math.round((cumSum / numYears) * 100) / 100,
      minCumulative: minCum !== Infinity ? Math.round(minCum * 100) / 100 : 0,
      maxCumulative: maxCum !== -Infinity ? Math.round(maxCum * 100) / 100 : 0,
      medianCumulative: Math.round(medianCum * 100) / 100,
      pctElapsed: 0,
    });
  }

  const finalAvgTotal = HISTORICAL_AVERAGE_CURVE[HISTORICAL_AVERAGE_CURVE.length - 1].avgCumulative || 1;
  for (let d = 0; d < HISTORICAL_AVERAGE_CURVE.length; d++) {
    HISTORICAL_AVERAGE_CURVE[d].pctElapsed = Math.round((HISTORICAL_AVERAGE_CURVE[d].avgCumulative / finalAvgTotal) * 1000) / 10;
  }
})();

// Skeena Major Tributaries baseline shares (based on Fisheries & Oceans Canada & BC Ministry genetic stock data)
export const SKEENA_TRIBUTARY_BASELINES = [
  {
    name: 'Bulkley / Morice River System',
    region: 'Bulkley Valley & Morice Lake Sub-Basin',
    sharePct: 44.0,
    peakWindow: 'Late Aug – Mid Sep',
    description: 'The watershed’s primary wild steelhead production engine. Accounts for ~44% of total Skeena adult escapement, draining ~12,400 km² across the Bulkley Valley and high-elevation Morice Lake watershed.',
    scientificProfile: {
      basinAreaKm2: '12,400 km²',
      migrationDistanceKm: '220 km (Witset Canyon) to 340 km (Morice Lake)',
      meanTravelVelocity: '14–18 km/day mean swimming speed through mainstem Skeena',
      lakeBuffering: 'Morice Lake lacustrine reservoir provides high hydrological and thermal damping to upper basin.',
      thermalRegime: 'Summer: 12°C–16°C; Autumn: 6°C–10°C; low-gradient mainstem cooling rapidly with autumn freeze.',
      conservationPriority: 'High. Primary population index for Skeena watershed wild summer steelhead escapement targets.',
      habitatEcology: 'Pristine spawning gravels in upper Morice and Nanika rivers; juvenile rearing in lower Bulkley tributary braids.',
      provincialRegulations: 'Class II Classified Waters (Sep 1 – Oct 31). Strict single barbless hook, 100% wild catch-and-release only.',
      monitoringMethodology: 'Witset (Moricetown) Canyon First Nations tagging and provincial radio-telemetry program.',
    },
    floatSafety: {
      rating: 'Personal Raft Friendly' as const,
      whitewaterClass: 'Class I–II (Upper Bulkley & Morice) | Class IV+ Hazard (Witset & Telkwa Canyons)',
      suitableCraft: '10–14ft personal rafts, pontoon craft, and drift boats on upper runs. Mandatory takeout before canyons.',
      hazardWarnings: [
        'Mandatory Take-Out at Quick Bridge or Walcott — DO NOT float below Quick without scouting Telkwa/Witset Canyons.',
        'Morice River: Watch for log strainers and sweepers between Bimb Bridge and Owen FSR.',
        'Witset (Moricetown) Canyon is an impassable Class V gorge. Never attempt to float.'
      ],
      typicalFloatTimes: 'Walcott to Quick: 4.5–6 hrs | Quick to Telkwa: 3.5–5 hrs | Morice Bimb to km 27: 5–7 hrs',
    },
    wadeSafety: {
      difficulty: 'Easy' as const,
      footwearRecommendation: 'Felt soles with carbide cleats. Wide gravel bars with gentle gradient.',
      bankAccessibility: 'Superb public access along Highway 16 pullouts, CN rail grade paths, and municipal park launches.',
      wadingStaffAdvice: 'Staff helpful when crossing side braids, but wading is generally accessible for all skill levels.',
    },
    tribalProtocols: {
      nation: "Wet'suwet'en Nation (Witset First Nation)",
      permitRequired: false,
      permitDetails: 'No formal river pass required for general public Crown lands along Highway 16, but Witset Canyon is a designated traditional First Nations gaff and dip-net fishery.',
      officeLocation: 'Witset Band Office, 205 Beaver Rd, Witset, BC',
      costInfo: 'Free public access on Crown lands; respect reserve boundaries and traditional fish camp areas.',
      etiquette: 'Do not fish within 100m of traditional dip-net platforms or fish ladders at Witset Canyon. Respect private reserve signage around Moricetown village.',
    },
    accessPoints: [
      {
        id: 'bulkley-quick',
        name: 'Quick Bridge Public Launch & Gravel Bar',
        type: 'put-in' as const,
        description: 'Premier public drift boat & personal raft launch. Concrete ramp with wide gravel bar staging area.',
        lat: 54.6288,
        lng: -126.9038,
        roadAccess: 'Paved access off Highway 16 onto Quick Station Rd',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.6288,-126.9038',
        vesselSuitability: 'Rafts, Drift Boats, Pontoons',
        landTenure: 'Public Road Allowance & Provincial Crown Land',
        bushwhackDifficulty: 'Zero bushwhack — direct vehicle ramp access',
      },
      {
        id: 'bulkley-quick-bushpath',
        name: 'Quick Station Downstream Goat Path',
        type: 'bushwhack' as const,
        description: 'Informal angler trail through willow and alder bench leading to the secluded lower braided island run.',
        lat: 54.6340,
        lng: -126.9120,
        roadAccess: 'Quick Station Rd railway crossing pullout (do not block gate)',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.6340,-126.9120',
        vesselSuitability: 'Walk-and-Wade Only',
        landTenure: 'Provincial Crown Riparian Reserve',
        bushwhackDifficulty: '🌿 Light 180m bush trail along willow flats',
      },
      {
        id: 'bulkley-telkwa',
        name: 'Telkwa Municipal Boat Launch & Confluence',
        type: 'take-out' as const,
        description: 'Major municipal boat ramp and junction with Telkwa River. Excellent gravel bar walk-and-wade.',
        lat: 54.6938,
        lng: -127.0503,
        roadAccess: 'Tyhee Lake / Telkwa village park ramp',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.6938,-127.0503',
        vesselSuitability: 'All vessels & Walk-in',
        landTenure: 'Municipal Park & Public Reserve',
        bushwhackDifficulty: 'Zero bushwhack — paved municipal park access',
      },
      {
        id: 'bulkley-walcott',
        name: 'Walcott Bridge Public Launch',
        type: 'put-in' as const,
        description: 'Upper Bulkley put-in. Scenic 5-hour float down to Quick. Ample public gravel parking.',
        lat: 54.5126,
        lng: -126.7820,
        roadAccess: 'Walcott Station Rd off Hwy 16',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.5126,-126.7820',
        vesselSuitability: 'Personal Rafts & Drift Boats',
        landTenure: 'Public Road Right-of-Way',
        bushwhackDifficulty: 'Easy 30m gravel walk down to water edge',
      },
      {
        id: 'bulkley-walcott-spur',
        name: 'Walcott Telegraph Spur Trail',
        type: 'railway-easement' as const,
        description: 'Informal trail branching off CN railway right-of-way down to a secluded bedrock tailout.',
        lat: 54.5240,
        lng: -126.8010,
        roadAccess: 'Walcott Station railway maintenance turnout',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.5240,-126.8010',
        vesselSuitability: 'Walk-and-Wade Only',
        landTenure: 'CN Rail Easement & Provincial Crown Land',
        bushwhackDifficulty: '🥾 150m bushwhack down steep gravel embankment',
      },
      {
        id: 'bulkley-bymac',
        name: 'Bymac Public Crown Turnout & Scramble',
        type: 'crown-land' as const,
        description: 'Unpaved 4x4 forestry turnout with a worn foot scramble down to prime bedrock holding ledges.',
        lat: 54.8120,
        lng: -127.1850,
        roadAccess: 'Highway 16 pullout between Smithers and Witset (km 14)',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.8120,-127.1850',
        vesselSuitability: 'Walk-and-Wade Only',
        landTenure: 'BC Crown Land Highway Reserve',
        bushwhackDifficulty: '🥾 Moderate 100m descent through spruce woods',
      },
      {
        id: 'morice-bimb',
        name: 'Morice River Bimb Bridge & Forestry Access',
        type: 'bridge-access' as const,
        description: 'Classic Morice River put-in. Crystal-clear water, exceptional walk-and-wade gravel runs.',
        lat: 54.2690,
        lng: -127.0250,
        roadAccess: 'Morice River FSR km 27.5 (Houston)',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.2690,-127.0250',
        vesselSuitability: 'Personal Rafts & Walk-and-Wade',
        landTenure: 'Crown Forestry Road Allowance',
        bushwhackDifficulty: 'Zero bushwhack — direct bridge gravel bar',
      },
      {
        id: 'morice-km38-spur',
        name: 'Morice River km 38 Cutline Trail',
        type: 'crown-land' as const,
        description: 'Overgrown forestry cutline leading to an undisturbed braided side channel with deep holding slots.',
        lat: 54.2180,
        lng: -127.1420,
        roadAccess: 'Morice River FSR km 38.2 old logging spur',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.2180,-127.1420',
        vesselSuitability: 'Walk-and-Wade & Packrafts',
        landTenure: 'Provincial Crown Forestry Land',
        bushwhackDifficulty: '🌲 300m walk through overgrown alder cutline',
      },
      {
        id: 'bulkley-smithers',
        name: 'Smithers Riverside Municipal Park',
        type: 'take-out' as const,
        description: 'Main take-out for floats coming from Telkwa. Good bank wading upstream and downstream.',
        lat: 54.7865,
        lng: -127.1524,
        roadAccess: 'Riverside Municipal Park, Smithers',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.7865,-127.1524',
        vesselSuitability: 'Take-out & Walk-in',
        landTenure: 'Municipal Park',
        bushwhackDifficulty: 'Zero bushwhack — paved municipal ramp',
      },
      {
        id: 'bulkley-witset-hazard',
        name: 'Witset (Moricetown) Canyon Hazard & Fish Ladder',
        type: 'hazard-canyon' as const,
        description: 'DANGER: Impassable Class V gorge and First Nations traditional gaff fishery. No floating permitted.',
        lat: 55.0270,
        lng: -127.3294,
        roadAccess: 'Witset First Nation viewpoint off Hwy 16',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.0270,-127.3294',
        vesselSuitability: 'DANGER: DO NOT FLOAT',
        landTenure: 'Witset First Nation Traditional Territory',
        bushwhackDifficulty: 'Viewpoint path only — impassable gorge',
      },
    ],
    adminTacticalIntel: {
      keyReaches: 'Moricetown (Witset) Canyon pool, Telkwa confluence, Quick Station, Bymac, Morice River / Nanika junction.',
      tacticalBiteTriggers: 'First crisp autumn frosts drop river water temperature into the optimal 8°C–12°C swinging zone. Post-rain drop-and-clear triggers aggressive bites.',
      waterClarityDynamics: 'Lake-headed Morice keeps the upper river gin-clear. Lower Bulkley vulnerable to clay silt from Telkwa River during heavy rains.',
      estuaryPassageNotes: 'Tyee peak: Aug 12 – Aug 28. Heavy sustained volume continues into September.',
      historicalGuideNotes: 'Optimal greased-line and dry fly action mid-September through late October.',
    },
    timingTips: {
      estuaryPassage: 'Tyee peak: Aug 12 – Aug 28. Heavy sustained volume continues into September.',
      travelTimeFromTyee: '12–18 days to Moricetown Canyon (~220 km upriver); 20–28 days to Telkwa and Morice River (~310 km).',
      primeHoldingWindow: 'Mid-September through late October. Upper Morice holds fish through winter into spring.',
      waterClarityNotes: 'Lake-headed Morice keeps the upper river gin-clear. Lower Bulkley vulnerable to clay silt from Telkwa River during heavy rains.',
      weatherTrigger: 'First crisp autumn frosts drop river water temperature into the optimal 8°C–12°C swinging zone. Post-rain drop-and-clear triggers aggressive bites.',
      keyReaches: 'Moricetown (Witset) Canyon pool, Telkwa confluence, Quick Station, Bymac, Morice River / Nanika junction.',
      regulations: 'Class II Classified Waters (Sep 1 – Oct 31). Strict single barbless hook, catch-and-release only. Non-resident guide restrictions apply.',
    },
  },
  {
    name: 'Babine River',
    region: 'Upper Skeena / Nilkitkwa Sub-Basin',
    sharePct: 22.0,
    peakWindow: 'Late Aug – Early Oct',
    description: 'Home to the legendary high-latitude Skeena steelhead strain (average spawner age 5–6 years). Sustained by Nilkitkwa and Babine Lakes with continuous provincial counting fence escapement validation.',
    scientificProfile: {
      basinAreaKm2: '10,000 km²',
      migrationDistanceKm: '340 km (confluence) to 380 km (Babine Lake outlet counting fence)',
      meanTravelVelocity: '12–16 km/day ascending the Upper Skeena canyon network',
      lakeBuffering: 'Extreme stability; buffered by Babine Lake (150 km long), dampening freshets and sediment spikes.',
      thermalRegime: 'Stable discharge and moderate thermal lag from lake outflow through late autumn (7°C–11°C in Oct).',
      conservationPriority: 'Critical. Strict escapement objective monitored at Babine Counting Weir (target >5,000 wild spawners).',
      habitatEcology: 'High-energy bedrock rapids, gravel-riffle complexes, and rich sockeye smolt/salmon nutrient marine subsidy.',
      provincialRegulations: 'Class I Classified Waters. Ultra-restricted non-resident rod day allocations, mandatory catch-and-release.',
      monitoringMethodology: 'Babine River Counting Fence (continuous 24/7 video and biometric weir enumeration).',
    },
    floatSafety: {
      rating: 'Intermediate Float with Hazards' as const,
      whitewaterClass: 'Class II–III (Upper Fence) | Class IV+ Hazard (Babine Canyons downstream)',
      suitableCraft: '12–16ft self-bailing whitewater rafts with heavy oar frames. Extreme caution required.',
      hazardWarnings: [
        'Extreme wilderness river with no cell service. Grizzly bear concentration is among the highest in North America.',
        'Babine Canyon downstream of Silver Hilton contains Class IV+ boulder drops and severe undercut ledges.',
        'Weir fence structure at Nilkitkwa outlet must be navigated with extreme care or portaged.'
      ],
      typicalFloatTimes: 'Nilkitkwa outlet to Babine Fence: 2–3 hrs | Fence to Gail Creek: 4–6 hrs',
    },
    wadeSafety: {
      difficulty: 'Challenging / Treacherous' as const,
      footwearRecommendation: 'Studded felt boots and mandatory wading staff. Heavy pushy current over slick bedrock shelves.',
      bankAccessibility: 'Limited road access; rough forestry roads, 4x4 trails, and thick alder/bear brush between pools.',
      wadingStaffAdvice: 'Mandatory. Strong river volume will sweep unsecured waders off bedrock ledges.',
    },
    tribalProtocols: {
      nation: "Lake Babine Nation (Witsuwit'en / Ned'u'ten)",
      permitRequired: false,
      permitDetails: 'Crown classified water license required. Respect Lake Babine Nation traditional sustenance fishing weir sites and cultural lands at Fort Babine.',
      officeLocation: 'Lake Babine Nation Band Office, Burns Lake / Fort Babine, BC',
      costInfo: 'Provincial Class I Classified Waters Stamp ($40/day non-resident). No additional band toll on open forestry roads.',
      etiquette: 'Do not approach First Nations traditional fish traps or processing smokehouses. Maintain wide clearance from active salmon harvesting.',
    },
    accessPoints: [
      {
        id: 'babine-fence',
        name: 'Babine River Counting Fence & Launch',
        type: 'put-in' as const,
        description: 'DFO/Provincial counting weir. Key access point for upper Class I classified waters.',
        lat: 55.4540,
        lng: -126.6345,
        roadAccess: 'Babine River FSR (4x4 required north of Smithers)',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.4540,-126.6345',
        vesselSuitability: 'Whitewater Rafts & Walk-in',
        landTenure: 'Provincial Park & Crown Land Reserve',
        bushwhackDifficulty: 'Zero bushwhack — gated road access to fence launch',
      },
      {
        id: 'babine-nilkitkwa',
        name: 'Nilkitkwa Lake Bridge & Outlet',
        type: 'bridge-access' as const,
        description: 'Lake outlet put-in for personal rafts. Calm initial drift transitioning into wilderness canyon.',
        lat: 55.3850,
        lng: -126.5920,
        roadAccess: 'Babine Lake FSR km 48',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.3850,-126.5920',
        vesselSuitability: 'Rafts & Pontoons',
        landTenure: 'Crown Land Forestry Road',
        bushwhackDifficulty: 'Easy 40m trail to lake outlet gravel',
      },
      {
        id: 'babine-gail-creek',
        name: 'Gail Creek Overgrown Skidder Spur Trail',
        type: 'bushwhack' as const,
        description: 'Overgrown wilderness skidder cutline branching down into an isolated middle canyon boulder pool.',
        lat: 55.5120,
        lng: -126.8950,
        roadAccess: 'Gail Creek wilderness spur (high clearance 4WD)',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.5120,-126.8950',
        vesselSuitability: 'Walk-and-Wade Only',
        landTenure: 'Provincial Wilderness Crown Land',
        bushwhackDifficulty: '🌿 600m wilderness bushwhack through dense devil\'s club and spruce',
      },
      {
        id: 'babine-nichyesk',
        name: 'Nichyeskwa Creek Confluence Hike-In',
        type: 'crown-land' as const,
        description: 'Wilderness forestry cutline terminating at the mouth of Nichyeskwa Creek. High-density holding water.',
        lat: 55.4200,
        lng: -126.6100,
        roadAccess: 'Nichyeskwa Spur 100 off Nilkitkwa FSR',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.4200,-126.6100',
        vesselSuitability: 'Walk-and-Wade Only',
        landTenure: 'Crown Land Forestry Tenure',
        bushwhackDifficulty: '🥾 350m rough foot path down steep timber slope',
      },
      {
        id: 'babine-canyon-hazard',
        name: 'Babine Lower Canyon Hazard (Class IV+)',
        type: 'hazard-canyon' as const,
        description: 'DANGER: Multi-mile Class IV+ canyon. Non-commercial personal rafts must not proceed without expedition whitewater gear.',
        lat: 55.5600,
        lng: -127.1000,
        roadAccess: 'Wilderness gorge (no road access)',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.5600,-127.1000',
        vesselSuitability: 'DANGER: CLASS IV+ WHITEWATER',
        landTenure: 'Babine River Corridor Provincial Park',
        bushwhackDifficulty: 'Extreme vertical canyon walls',
      },
    ],
    adminTacticalIntel: {
      keyReaches: 'Nilkitkwa Lake outlet, Babine Fence, Silver Hilton reaches, Nichyeskwa Creek, Gail Creek confluence.',
      tacticalBiteTriggers: 'Active holding fish respond strongly to stable autumn barometric pressure and low afternoon sun.',
      waterClarityDynamics: 'Exceptional stability; buffered by Nilkitkwa Lake and Babine Lake. Rarely blows out even during massive coastal downpours.',
      estuaryPassageNotes: 'Tyee peak: Aug 15 – Sep 05. Steady high-latitude late summer push.',
      historicalGuideNotes: 'Late September through October. Iconic autumn dry fly and greased-line fishery.',
    },
    timingTips: {
      estuaryPassage: 'Tyee peak: Aug 15 – Sep 05. Steady high-latitude late summer push.',
      travelTimeFromTyee: '22–32 days to Babine confluence (~340 km upriver); 30–40 days to Nilkitkwa / Babine counting weir.',
      primeHoldingWindow: 'Late September through October. Iconic autumn dry fly and greased-line fishery.',
      waterClarityNotes: 'Exceptional stability; buffered by Nilkitkwa Lake and Babine Lake. Rarely blows out even during massive coastal downpours.',
      weatherTrigger: 'Active holding fish respond strongly to stable autumn barometric pressure and low afternoon sun.',
      keyReaches: 'Nilkitkwa Lake outlet, Babine Fence, Silver Hilton reaches, Nichyeskwa Creek, Gail Creek confluence.',
      regulations: 'Class I Classified Waters. Highly limited non-guided non-resident rod days. Strict catch-and-release wild steelhead protocols.',
    },
  },
  {
    name: 'Kispiox River',
    region: 'Hazelton / Kispiox Valley Sub-Basin',
    sharePct: 14.0,
    peakWindow: 'Mid Aug – Late Sep',
    description: 'Renowned for exceptionally large individual body mass and high repeat spawner ratios. Drains unbuffered coastal transition rainforest with high sensitivity to fine clay sediment pulses.',
    scientificProfile: {
      basinAreaKm2: '2,080 km²',
      migrationDistanceKm: '240 km (Hazelton confluence) to 290 km (Upper Sweetin junction)',
      meanTravelVelocity: '16–20 km/day ascending middle Skeena into low-gradient valley holding pools',
      lakeBuffering: 'Unbuffered river system. Highly responsive to localized precipitation and snowpack melting.',
      thermalRegime: 'Early cooling: drops below 8°C by early October, causing metabolic slowdown in holding adults.',
      conservationPriority: 'High. Susceptible to sediment deposition from logging forestry roads and seasonal high-water scour.',
      habitatEcology: 'Low-gradient valley meandering, deep clay holding pools, and rich riparian logjam cover structures.',
      provincialRegulations: 'Class II Classified Waters (Sep 1 – Oct 31). Bait ban, single barbless hook, mandatory wild release.',
      monitoringMethodology: 'Provincial tributary index sampling, angler creel surveys, and telemetry receivers.',
    },
    floatSafety: {
      rating: 'Personal Raft Friendly' as const,
      whitewaterClass: 'Class I–II (Low-gradient valley meanders)',
      suitableCraft: '8–14ft personal rafts, Watermaster craft, pontoon boats, and drift boats.',
      hazardWarnings: [
        'Severe sweeper and logjam hazards on outside bends after autumn rainstorms.',
        'Unbuffered clay banks can slide into the river, creating sudden localized strainers.'
      ],
      typicalFloatTimes: 'Sweetin to 20-Mile: 4–6 hrs | 20-Mile to 12-Mile: 3.5–5 hrs | 12-Mile to Mouth: 4–5.5 hrs',
    },
    wadeSafety: {
      difficulty: 'Moderate' as const,
      footwearRecommendation: 'Cleated wading boots. Soft clay mud on bank entries; firm cobble once in river current.',
      bankAccessibility: 'Excellent along Kispiox Valley Road with numerous forestry turnouts, bridge crossings, and gravel bars.',
      wadingStaffAdvice: 'Recommended for deep clay pools and when negotiating submerged deadfall.',
    },
    tribalProtocols: {
      nation: "Gitxsan Nation / Kispiox Band (Anspay'axw)",
      permitRequired: true,
      permitDetails: 'Gitxsan Watershed Authorities & Kispiox Band Access Permit is REQUIRED for non-members accessing riverbanks, traditional gravel bars, boat launches, and reserve lands within the Kispiox Valley. Permit sticker must be visibly displayed on vehicle front dashboard.',
      officeLocation: 'Kispiox Band Administration Office (1254 Mary Green Way, Kispiox Village, BC) or purchased at the Kispiox Valley Store & Gas Bar (Hwy 62 junction).',
      costInfo: '~$50 / Day or Seasonal Permit. Funds directly support Gitxsan river stewardship, fisheries guardians, water monitoring, and community services.',
      etiquette: 'Strictly respect private First Nations reserve lands, ancestral fishing sites, and gaffing platforms. Never park where logging or emergency vehicles could be blocked. Pack out all trash. 100% wild catch-and-release only.',
    },
    accessPoints: [
      {
        id: 'kispiox-20mile',
        name: '20-Mile Bridge Public Launch & Pool',
        type: 'put-in' as const,
        description: 'Primary middle-river boat launch and bridge pool. Ideal staging for day floats down to 12-Mile.',
        lat: 55.5342,
        lng: -127.8105,
        roadAccess: 'Kispiox Valley Road km 32 bridge approach',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.5342,-127.8105',
        vesselSuitability: 'Personal Rafts & Drift Boats',
        landTenure: 'Public Road Right-of-Way & Crown Riverbed',
        bushwhackDifficulty: 'Zero bushwhack — gravel boat slope under bridge',
      },
      {
        id: 'kispiox-16mile-club',
        name: 'Club Creek / 16-Mile Crown Reserve Path',
        type: 'bushwhack' as const,
        description: 'Overgrown historic logging skidder track leading down through tall spruce to a secluded clay-bank pool.',
        lat: 55.4920,
        lng: -127.7850,
        roadAccess: 'Kispiox Valley Rd km 26.5 unmarked forestry pullout',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.4920,-127.7850',
        vesselSuitability: 'Walk-and-Wade & Packrafts',
        landTenure: 'Provincial Crown Forest Reserve',
        bushwhackDifficulty: '🌿 250m bushwhack through light brush and mossy timber',
      },
      {
        id: 'kispiox-12mile',
        name: '12-Mile Gravel Bar & Launch',
        type: 'take-out' as const,
        description: 'Popular take-out for 20-Mile floats or put-in for lower river. Wide gravel bar with easy bank wading.',
        lat: 55.4410,
        lng: -127.7550,
        roadAccess: 'Kispiox Valley Rd km 19 pullout',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.4410,-127.7550',
        vesselSuitability: 'Take-out & Walk-in',
        landTenure: 'Public Road Allowance & Crown Land',
        bushwhackDifficulty: 'Easy 50m flat gravel walk',
      },
      {
        id: 'kispiox-stephens',
        name: 'Stephens Creek Public Bank Cutout',
        type: 'bushwhack' as const,
        description: 'Angler footpath through alder bench opening into a productive riffle and boulder tailout.',
        lat: 55.4120,
        lng: -127.7380,
        roadAccess: 'Kispiox Valley Rd km 14.2 timber turnout',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.4120,-127.7380',
        vesselSuitability: 'Walk-and-Wade Only',
        landTenure: 'Public Road Allowance & Crown Riparian',
        bushwhackDifficulty: '🌿 120m angler path through alder thicket',
      },
      {
        id: 'kispiox-8mile',
        name: '8-Mile Bridge Bank Scramble',
        type: 'bridge-access' as const,
        description: 'Steep path under the Highway 62 bridge abutment into classic swing water.',
        lat: 55.3850,
        lng: -127.7120,
        roadAccess: 'Highway 62 bridge shoulder (park well off paved line)',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.3850,-127.7120',
        vesselSuitability: 'Walk-and-Wade Only',
        landTenure: 'Highway Right-of-Way',
        bushwhackDifficulty: '🥾 Steep 40m bank scramble with loose gravel',
      },
      {
        id: 'kispiox-hazelton-mouth',
        name: 'Hazelton Mouth Confluence (Gitxsan Anspay\'axw)',
        type: 'tribal-access' as const,
        description: 'Confluence with Skeena River. Final take-out for all lower floats. Located within Kispiox Reserve (IR #1).',
        lat: 55.3524,
        lng: -127.6942,
        roadAccess: 'Kispiox Village Rd off Highway 62 (Display Gitxsan Permit)',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.3524,-127.6942',
        vesselSuitability: 'All Vessels & Walk-in',
        landTenure: 'Gitxsan Nation (Anspay\'axw Band IR #1)',
        bushwhackDifficulty: 'Zero bushwhack — village gravel ramp (Tribal Permit Required)',
      },
      {
        id: 'kispiox-sweetin',
        name: 'Sweetin River Upper Wilderness FSR',
        type: 'crown-land' as const,
        description: 'Upper wilderness valley put-in. Isolated water, smaller water volume, exceptional early season dry fly.',
        lat: 55.6780,
        lng: -127.9100,
        roadAccess: 'Upper Kispiox FSR km 54 bridge crossing',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.6780,-127.9100',
        vesselSuitability: 'Small Rafts, Pontoons & Walk-in',
        landTenure: 'Provincial Crown Forestry Land',
        bushwhackDifficulty: '🥾 100m rocky trail under forestry bridge',
      },
    ],
    adminTacticalIntel: {
      keyReaches: 'Hazelton mouth, 20-Mile bridge, Sweetin River confluence, Club Creek, upper forest bridge runs.',
      tacticalBiteTriggers: 'Timing the "green drop"—the exact 24-hour window when swollen water drops from brown to emerald green—yields the most explosive fishing.',
      waterClarityDynamics: 'High clay content. Vulnerable to fast blowouts after moderate rains; typically needs 2–4 days of clear weather to regain fishable visibility.',
      estuaryPassageNotes: 'Tyee peak: Aug 08 – Aug 24.',
      historicalGuideNotes: 'Mid-September to mid-October. Peak surface skating and damp fly action.',
    },
    timingTips: {
      estuaryPassage: 'Tyee peak: Aug 08 – Aug 24.',
      travelTimeFromTyee: '14–22 days to Kispiox mouth at Hazelton (~240 km upriver); 18–26 days to middle/upper valley beats.',
      primeHoldingWindow: 'Mid-September to mid-October. Peak surface skating and damp fly action.',
      waterClarityNotes: 'High clay content. Vulnerable to fast blowouts after moderate rains; typically needs 2–4 days of clear weather to regain fishable visibility.',
      weatherTrigger: 'Timing the "green drop"—the exact 24-hour window when swollen water drops from brown to emerald green—yields the most explosive fishing.',
      keyReaches: 'Hazelton mouth, 20-Mile bridge, Sweetin River confluence, Club Creek, upper forest bridge runs.',
      regulations: 'Class II Classified Waters (Sep 1 – Oct 31). Bait ban, barbless hooks, mandatory release of all wild steelhead.',
    },
  },
  {
    name: 'Zymoetz (Copper) River',
    region: 'Coast Mountains / Terrace Sub-Basin',
    sharePct: 8.5,
    peakWindow: 'Early Aug – Mid Sep',
    description: 'Glacial-fed lower Skeena tributary with dual run segments (early canyon summer strain and late headwater migrants). Characterized by dramatic mountain gorges and cold glacial meltwater.',
    scientificProfile: {
      basinAreaKm2: '3,000 km²',
      migrationDistanceKm: '65 km (lower canyon) to 120 km (upper Clore River junction)',
      meanTravelVelocity: '10–14 km/day (coastal migrant with short estuary-to-river transit window)',
      lakeBuffering: 'Upper McDonell lake system provides localized buffering; lower mainstem heavily influenced by glacial Clore River.',
      thermalRegime: 'Cold glacial hydrology in summer (8°C–11°C), moderating in autumn as glacial melt ceases.',
      conservationPriority: 'High. Essential thermal refuge and early spawning habitat for lower Skeena watershed.',
      habitatEcology: 'Confined bedrock canyon reaches, boulder garden holding pockets, and upper lake-outlet gravel beds.',
      provincialRegulations: 'Class II Classified Waters (Jul 24 – Oct 31). Steelhead stamp mandatory. Resident priority management.',
      monitoringMethodology: 'Provincial helicopter escapement redd counts and lower canyon acoustic telemetry.',
    },
    floatSafety: {
      rating: 'Extreme Whitewater Canyon' as const,
      whitewaterClass: 'Class III–IV+ (Lower Red Canyon) | Class I–II (Upper Copper above Clore)',
      suitableCraft: 'Expert whitewater kayakers or walk-in only on lower canyon. Personal rafts only suitable on Upper Copper.',
      hazardWarnings: [
        'DANGER: Lower Zymoetz Red Canyon is a violent Class IV–V gorge with lethal boulder sieves. DO NOT raft the lower canyon.',
        'Glacial flash freshets can double river volume within 6 hours during warm rain events.'
      ],
      typicalFloatTimes: 'Upper Copper (McDonell to Clore): 4–6 hrs (Personal raft) | Lower Canyon: DO NOT FLOAT',
    },
    wadeSafety: {
      difficulty: 'Challenging / Treacherous' as const,
      footwearRecommendation: 'Studded felt boots with aluminum cleats and mandatory wading staff.',
      bankAccessibility: 'Steep canyon trails, railway grades, and Copper River FSR pullouts. Requires strong physical fitness.',
      wadingStaffAdvice: 'Crucial. Fast glacial water reduces visibility of slippery boulder dropoffs.',
    },
    tribalProtocols: {
      nation: 'Kitselas First Nation (Tsimshian)',
      permitRequired: false,
      permitDetails: 'Provincial Classified Waters license required. Respect Kitselas traditional territory and cultural heritage markers in lower canyon reaches.',
      officeLocation: 'Kitselas Band Administration, 2225 Gitaus Rd, Terrace, BC',
      costInfo: 'Provincial Class II stamp required ($20/day). No tribal road fee on public Copper River FSR.',
      etiquette: 'Stay on established trails; respect ancient petroglyph and cultural sites along canyon walls.',
    },
    accessPoints: [
      {
        id: 'copper-mouth',
        name: 'Lower Skeena Confluence & Hwy 16 Bar',
        type: 'take-out' as const,
        description: 'Mouth pool and expansive lower gravel bars. Walk-and-wade friendly at confluence.',
        lat: 54.5185,
        lng: -128.4550,
        roadAccess: 'Highway 16 bridge 8 km east of Terrace',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.5185,-128.4550',
        vesselSuitability: 'Walk-and-Wade & Take-out',
        landTenure: 'Public Highway Right-of-Way & Crown Gravel Bar',
        bushwhackDifficulty: 'Zero bushwhack — flat gravel bar access from highway turnout',
      },
      {
        id: 'copper-railway-tunnel',
        name: 'Railway Tunnel Rock Cut Footpath',
        type: 'railway-easement' as const,
        description: 'Historic railway grade scramble down to a deep, swirling canyon holding pool with pristine bedrock current seams.',
        lat: 54.5310,
        lng: -128.4200,
        roadAccess: 'Railway service turnout off Copper River Rd',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.5310,-128.4200',
        vesselSuitability: 'Walk-and-Wade Only',
        landTenure: 'CN Rail Easement & Crown Land',
        bushwhackDifficulty: '🥾 180m steep rock scramble down historic railway cut',
      },
      {
        id: 'copper-red-canyon',
        name: 'Red Canyon Bridge & Viewpoint (DANGER GORGE)',
        type: 'hazard-canyon' as const,
        description: 'Spectacular bedrock canyon pool with steep trail access. DO NOT BOAT through this canyon.',
        lat: 54.5510,
        lng: -128.3850,
        roadAccess: 'Copper River FSR km 7.5',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.5510,-128.3850',
        vesselSuitability: 'DANGER: DO NOT FLOAT (Walk-in only)',
        landTenure: 'Provincial Crown Forest Land',
        bushwhackDifficulty: '🥾 Steep 90m trail down canyon timber',
      },
      {
        id: 'copper-clore-junction',
        name: 'Clore River FSR Confluence & Spur',
        type: 'crown-land' as const,
        description: 'Boundary between glacial lower river and gin-clear upper Zymoetz. Excellent holding seams.',
        lat: 54.5750,
        lng: -128.1500,
        roadAccess: 'Copper-Clore Mainline FSR km 28',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.5750,-128.1500',
        vesselSuitability: 'Walk-and-Wade & Small Rafts',
        landTenure: 'Crown Forestry Road Allowance',
        bushwhackDifficulty: '🌲 300m rough 4x4 overgrown track to confluence gravel',
      },
      {
        id: 'copper-mcdonell',
        name: 'McDonell Lake Road Upper Bridge',
        type: 'put-in' as const,
        description: 'Upper Zymoetz put-in for personal rafts. Crystal-clear water, gentle gradient, remote wilderness.',
        lat: 54.6200,
        lng: -127.9000,
        roadAccess: 'McDonell Lake FSR km 42',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.6200,-127.9000',
        vesselSuitability: 'Personal Rafts & Pontoons',
        landTenure: 'Crown Land Forestry Bridge',
        bushwhackDifficulty: 'Zero bushwhack — gravel slope beside bridge',
      },
    ],
    adminTacticalIntel: {
      keyReaches: 'Lower Skeena confluence, Red Canyon, Zymoetz Canyon bridge, Clore River junction, McDonell Lake outlet.',
      tacticalBiteTriggers: 'Cool cloudy days reduce glacial melt, causing the river to clear rapidly. Early morning low-light swinging is optimal.',
      waterClarityDynamics: 'Glacial tributary (Clore River) colors the lower river milky turquoise during warm sunny days. Upper Zymoetz above Clore remains crystal clear.',
      estuaryPassageNotes: 'Tyee peak: Jul 28 – Aug 18.',
      historicalGuideNotes: 'Late August through early October across lower/canyon pools.',
    },
    timingTips: {
      estuaryPassage: 'Tyee peak: Jul 28 – Aug 18.',
      travelTimeFromTyee: '5–10 days to lower canyon (~65 km from estuary); 12–18 days to upper canyon and Clore River.',
      primeHoldingWindow: 'Late August through early October across lower/canyon pools.',
      waterClarityNotes: 'Glacial tributary (Clore River) colors the lower river milky turquoise during warm sunny days. Upper Zymoetz above Clore remains crystal clear.',
      weatherTrigger: 'Cool cloudy days reduce glacial melt, causing the river to clear rapidly. Early morning low-light swinging is optimal.',
      keyReaches: 'Lower Skeena confluence, Red Canyon, Zymoetz Canyon bridge, Clore River junction, McDonell Lake outlet.',
      regulations: 'Class II Classified Waters (Jul 24 – Oct 31). Steelhead stamp mandatory. Specific non-resident weekend restrictions in Class II section.',
    },
  },
  {
    name: 'Sustut River',
    region: 'Upper Skeena Wilderness Sub-Basin',
    sharePct: 4.5,
    peakWindow: 'Late Jul – Late Aug',
    description: 'Remote high-elevation wilderness stock; the earliest arriving summer-run strain in the upper watershed. Monitored continuously via the BC provincial Sustut counting weir.',
    scientificProfile: {
      basinAreaKm2: '3,500 km²',
      migrationDistanceKm: '420 km (longest migration route of any Skeena summer steelhead stock)',
      meanTravelVelocity: '15–22 km/day through high Skeena canyons to beat high-altitude freeze',
      lakeBuffering: 'Oligotrophic sub-alpine headwater lakes maintain gin-clear wilderness water quality.',
      thermalRegime: 'High elevation cold water (4°C–9°C in autumn). Early freeze-up by late October.',
      conservationPriority: 'Extreme. Benchmark pristine ecosystem with zero road access or industrial logging footprint.',
      habitatEcology: 'High-gradient alpine gravels, pristine wilderness pools, fragile overwinter holding basins.',
      provincialRegulations: 'Class I Classified Waters. Strict quota allocation and fly-fishing only catch-and-release regulations.',
      monitoringMethodology: 'BC Ministry of Environment Sustut Counting Weir (complete adult count and biometric sampling).',
    },
    floatSafety: {
      rating: 'Walk-In / Jetboat Only' as const,
      whitewaterClass: 'Class I–II (Remote wilderness alpine river)',
      suitableCraft: 'Packrafts for walk-in anglers; fly-in guided jetboats or floatplanes.',
      hazardWarnings: [
        'Zero road access. Evacuation by helicopter/floatplane only.',
        'Sub-alpine water temperatures drop rapidly; hypothermia risk is extreme in late autumn.'
      ],
      typicalFloatTimes: 'Weir to Asitka junction: 6–8 hrs (Packraft expedition)',
    },
    wadeSafety: {
      difficulty: 'Moderate' as const,
      footwearRecommendation: 'Felt wading boots with studs. Clean alpine gravel and clear bedrock.',
      bankAccessibility: 'Wilderness game trails and Ministry of Environment weir footpath.',
      wadingStaffAdvice: 'Recommended for high-gradient boulder chutes.',
    },
    tribalProtocols: {
      nation: 'Gitxsan & Tahltan First Nations (Traditional Territories)',
      permitRequired: false,
      permitDetails: 'Provincial Class I Classified Waters quota license mandatory. Strictly unroaded wilderness.',
      officeLocation: 'Provincial Fish & Wildlife Branch, Smithers, BC',
      costInfo: 'Class I Classified Waters stamp ($40/day non-resident).',
      etiquette: 'Strict wilderness leave-no-trace protocol. Respect provincial ecological research weir.',
    },
    accessPoints: [
      {
        id: 'sustut-weir',
        name: 'Sustut Counting Weir & Camp',
        type: 'walk-in' as const,
        description: 'Provincial research weir. World-class gin-clear dry fly runs.',
        lat: 56.5870,
        lng: -126.9800,
        roadAccess: 'Fly-in only (Floatplane to Johanson Lake, then bush trail / river craft)',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=56.5870,-126.9800',
        vesselSuitability: 'Fly-in / Packraft / Walk-in',
        landTenure: 'Provincial Ecological Reserve & Crown Wilderness',
        bushwhackDifficulty: 'Wilderness foot trail from airstrip',
      },
      {
        id: 'sustut-johanson',
        name: 'Johanson Lake Floatplane Base',
        type: 'put-in' as const,
        description: 'Staging lake for Sustut fly-in expeditions and upper headwater packrafts.',
        lat: 56.6000,
        lng: -126.2100,
        roadAccess: 'Omineca Mining Road (extreme 4WD from Prince George) or floatplane',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=56.6000,-126.2100',
        vesselSuitability: 'Floatplanes & Expeditions',
        landTenure: 'Crown Land Mining Corridor',
        bushwhackDifficulty: 'Rough 4x4 road to lake staging area',
      },
      {
        id: 'sustut-asitka',
        name: 'Asitka River Confluence Wild Pool',
        type: 'walk-in' as const,
        description: 'Major wilderness junction holding pool. Key early-run staging area.',
        lat: 56.4900,
        lng: -127.0500,
        roadAccess: 'Wilderness trail / packraft transit only',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=56.4900,-127.0500',
        vesselSuitability: 'Wilderness Walk-and-Wade',
        landTenure: 'Crown Land Wilderness',
        bushwhackDifficulty: 'Wilderness game trails along river corridor',
      },
    ],
    adminTacticalIntel: {
      keyReaches: 'Sustut counting weir, Johanson Lake outlet, Asitka River junction, Moose Valley pools.',
      tacticalBiteTriggers: 'Early autumn frost and Indian Summer sunshine trigger aggressive rises to waking dry flies.',
      waterClarityDynamics: 'Pristine gin-clear wilderness gravel. High visibility requires long fluorocarbon leaders and stealthy low-profile presentations.',
      estuaryPassageNotes: 'Tyee peak: Jul 15 – Aug 05 (the earliest major tributary stock passing through the estuary).',
      historicalGuideNotes: 'September 1 – October 10. High-elevation cold water makes early autumn the exclusive window before winter freeze.',
    },
    timingTips: {
      estuaryPassage: 'Tyee peak: Jul 15 – Aug 05 (the earliest major tributary stock passing through the estuary).',
      travelTimeFromTyee: '28–42 days to Sustut weir (~420 km upriver into the sub-alpine wilderness).',
      primeHoldingWindow: 'September 1 – October 10. High-elevation cold water makes early autumn the exclusive window before winter freeze.',
      waterClarityNotes: 'Pristine gin-clear wilderness gravel. High visibility requires long fluorocarbon leaders and stealthy low-profile presentations.',
      weatherTrigger: 'Early autumn frost and Indian Summer sunshine trigger aggressive rises to waking dry flies.',
      keyReaches: 'Sustut counting weir, Johanson Lake outlet, Asitka River junction, Moose Valley pools.',
      regulations: 'Class I Classified Waters. Strict quota allocation and fly-fishing only catch-and-release regulations.',
    },
  },
  {
    name: 'Kalum (Kitsumkalum) River',
    region: 'Lower Skeena / Kalum Lake Sub-Basin',
    sharePct: 4.0,
    peakWindow: 'Year-round / Aug Peak',
    description: 'Deep glacial lake-headed system supporting both summer wild steelhead and giant spring winter-run strains. Lake buffering creates hydrological stability during heavy coastal storms.',
    scientificProfile: {
      basinAreaKm2: '2,200 km²',
      migrationDistanceKm: '40 km (lower Skeena confluence near Terrace) to 80 km (Upper Kalum)',
      meanTravelVelocity: '8–12 km/day short-distance coastal transit',
      lakeBuffering: 'Kitsumkalum Lake creates strong hydrological and thermal buffering against rain events.',
      thermalRegime: 'Mild maritime temperature curve (10°C–14°C in summer, 5°C–8°C through late autumn).',
      conservationPriority: 'High. Crucial genetic biodiversity repository with overlapping summer-run and winter-run life histories.',
      habitatEcology: 'Glacial-lacustrine delta, deep canyon holding water, and spring-fed side-channel spawning gravels.',
      provincialRegulations: 'Class II Classified Waters (various seasonal zones). Steelhead stamp required. Single barbless hook only.',
      monitoringMethodology: 'Provincial radio-tagging, angler diary programs, and electronic river temperature loggers.',
    },
    floatSafety: {
      rating: 'Intermediate Float with Hazards' as const,
      whitewaterClass: 'Class II–III (Kalum Canyon) | Class I–II (Lower River)',
      suitableCraft: '12–14ft rafts with experienced oarsman, heavy drift boats, or guided jetboats.',
      hazardWarnings: [
        'Kalum Canyon contains heavy pushy water, boily wave trains, and sharp bedrock corners.',
        'Sweepers and wood jams shift frequently after heavy Pacific autumn storms.'
      ],
      typicalFloatTimes: 'Deep Creek to Terrace Skeena Confluence: 4–5.5 hrs | Lake Outlet to Deep Creek: 3–4 hrs',
    },
    wadeSafety: {
      difficulty: 'Moderate' as const,
      footwearRecommendation: 'Cleated boots with studs. Deep powerful currents require deliberate wading.',
      bankAccessibility: 'Good road access via Nisga\'a Highway (Hwy 113) and Deep Creek park.',
      wadingStaffAdvice: 'Strongly recommended due to heavy push of the river.',
    },
    tribalProtocols: {
      nation: 'Kitsumkalum First Nation (Tsimshian)',
      permitRequired: false,
      permitDetails: 'Provincial Class II Classified Waters license required. Respect Kitsumkalum reserve lands near confluence and village boundaries.',
      officeLocation: 'Kitsumkalum Band Office, 3514 West Kalum Rd, Terrace, BC',
      costInfo: 'Provincial Class II stamp. Public boat ramps free to use.',
      etiquette: 'Do not trespass on private reserve roads near lower village. Pack out all tackle and waste.',
    },
    accessPoints: [
      {
        id: 'kalum-deep-creek',
        name: 'Deep Creek Public Boat Launch & Park',
        type: 'put-in' as const,
        description: 'Main public launch below the canyon. Premier put-in for day floats to Terrace.',
        lat: 54.5850,
        lng: -128.6700,
        roadAccess: 'Nisga\'a Highway 113 km 12',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.5850,-128.6700',
        vesselSuitability: 'Rafts, Drift Boats & Jetboats',
        landTenure: 'Provincial Park / Public Launch',
        bushwhackDifficulty: 'Zero bushwhack — concrete public boat ramp',
      },
      {
        id: 'kalum-hatchery-path',
        name: 'Hatchery Creek Public Crown Bank Path',
        type: 'crown-land' as const,
        description: 'Foot trail through old-growth hemlock leading to an exceptionally productive holding tailout.',
        lat: 54.6100,
        lng: -128.6900,
        roadAccess: 'Highway 113 turnout at Hatchery Creek bridge',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.6100,-128.6900',
        vesselSuitability: 'Walk-and-Wade Only',
        landTenure: 'Provincial Crown Land Reserve',
        bushwhackDifficulty: '🚶 200m scenic foot trail through timber',
      },
      {
        id: 'kalum-mayo-railway',
        name: 'Mayo Creek Railway Cutline Access',
        type: 'railway-easement' as const,
        description: 'Informal angler scramble down railway easement to middle canyon traveling seam.',
        lat: 54.6400,
        lng: -128.7100,
        roadAccess: 'Highway 113 pullout at Mayo Creek rail crossing',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.6400,-128.7100',
        vesselSuitability: 'Walk-and-Wade Only',
        landTenure: 'CN Rail Easement & Crown Land',
        bushwhackDifficulty: '🥾 150m steep scramble down railway embankment',
      },
      {
        id: 'kalum-lake-outlet',
        name: 'Kitsumkalum Lake Provincial Park Launch',
        type: 'put-in' as const,
        description: 'Upper lake outlet launch. Scenic float through upper braids above the canyon.',
        lat: 54.7200,
        lng: -128.7500,
        roadAccess: 'Kitsumkalum Provincial Park off Hwy 113',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.7200,-128.7500',
        vesselSuitability: 'Personal Rafts & Pontoons',
        landTenure: 'Provincial Park',
        bushwhackDifficulty: 'Zero bushwhack — park campground launch',
      },
      {
        id: 'kalum-terrace-ramp',
        name: 'Terrace Municipal Ramp & Confluence',
        type: 'take-out' as const,
        description: 'Standard take-out for all lower Kalum floats. Concrete launch on the Skeena.',
        lat: 54.5150,
        lng: -128.6100,
        roadAccess: 'Kalum River Road / Skeena confluence, Terrace',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.5150,-128.6100',
        vesselSuitability: 'All Vessels (Take-out)',
        landTenure: 'Municipal Public Ramp',
        bushwhackDifficulty: 'Zero bushwhack — paved municipal ramp',
      },
    ],
    adminTacticalIntel: {
      keyReaches: 'Lower Skeena confluence, Canyon run, Deep Creek, Kalum Lake outlet, Mayo Creek.',
      tacticalBiteTriggers: 'Consistent water levels make the Kalum the premier "insurance river" when rain storms blow out the Kispiox and Bulkley.',
      waterClarityDynamics: 'Kitsumkalum Lake buffers the river, providing stable moderate-green visibility even during coastal storm systems.',
      estuaryPassageNotes: 'Tyee peak: Aug 01 – Aug 20 (summer strain); winter-run strain enters throughout winter/spring.',
      historicalGuideNotes: 'August through October for summer fish; March through May for spring winter steelhead.',
    },
    timingTips: {
      estuaryPassage: 'Tyee peak: Aug 01 – Aug 20 (summer strain); winter-run strain enters throughout winter/spring.',
      travelTimeFromTyee: '3–7 days to lower river near Terrace (~40 km from estuary).',
      primeHoldingWindow: 'August through October for summer fish; March through May for spring winter steelhead.',
      waterClarityNotes: 'Kitsumkalum Lake buffers the river, providing stable moderate-green visibility even during coastal storm systems.',
      weatherTrigger: 'Consistent water levels make the Kalum the premier "insurance river" when rain storms blow out the Kispiox and Bulkley.',
      keyReaches: 'Lower Skeena confluence, Canyon run, Deep Creek, Kalum Lake outlet, Mayo Creek.',
      regulations: 'Class II Classified Waters (various seasonal zones). Steelhead stamp required. Single barbless hook only.',
    },
  },
  {
    name: 'Upper Skeena & Other Tributaries',
    region: 'Kitwanga, Shegunia, Bear & Mainstem',
    sharePct: 3.0,
    peakWindow: 'Mid Aug – Late Sep',
    description: 'Encompasses Kitwanga River, Shegunia River, Bear River, and remote wild headwater spawning gravels across Gitxsan and Wet’suwet’en traditional territories.',
    scientificProfile: {
      basinAreaKm2: '15,000 km² combined upper watershed drainage',
      migrationDistanceKm: '180 km (Kitwanga) to 480 km (Bear River headwaters)',
      meanTravelVelocity: '14–20 km/day traveling along mainstem migration corridor',
      lakeBuffering: 'Mixed; small headwater lakes with high unbuffered tributary contribution.',
      thermalRegime: 'Mainstem cooling curve heavily influenced by mountain snowmelt and cold night temperatures.',
      conservationPriority: 'Critical for Indigenous food security, cultural heritage, and biodiversity of minor stocks.',
      habitatEcology: 'Mainstem holding gravel bars, canyon confluences, and small pristine tributary spawning streams.',
      provincialRegulations: 'Skeena mainstem and tributary provincial regulations apply. 100% wild steelhead catch-and-release.',
      monitoringMethodology: 'First Nations fisheries monitoring, provincial index assessments, and environmental DNA (eDNA).',
    },
    floatSafety: {
      rating: 'Personal Raft Friendly' as const,
      whitewaterClass: 'Class I–II (Large open river with wide braid channels)',
      suitableCraft: '10–16ft rafts, jetboats, and pontoon craft. Large river volume requiring powerful oars.',
      hazardWarnings: [
        'Massive volume: currents are heavy and cold. Do not get caught on bridge pilings or root wads.',
        'Usk and Kitwanga rapids require keeping to main channel navigation lines.'
      ],
      typicalFloatTimes: 'Hazelton to Kitwanga: 5–7 hrs | Kitwanga to Cedarvale: 4–6 hrs | Cedarvale to Usk: 5–7 hrs',
    },
    wadeSafety: {
      difficulty: 'Easy' as const,
      footwearRecommendation: 'Felt or vibram with studs. Vast expansive gravel bars with gentle wading slopes.',
      bankAccessibility: 'Excellent access off Highway 16, railway grade turnouts, and bridge approaches.',
      wadingStaffAdvice: 'Helpful when testing edge of deep mainstem traveling lanes.',
    },
    tribalProtocols: {
      nation: 'Gitxsan Nation (Gitwangak, Gitsegukla, Gitanmaax & Glen Vowell bands)',
      permitRequired: false,
      permitDetails: 'Crown gravel bars along Highway 16 do not require a separate permit, but respect reserve village lands at Gitwangak, Gitsegukla, and Gitanmaax.',
      officeLocation: 'Gitxsan Hereditary Chiefs Office, 1650 Snyder St, Hazelton, BC',
      costInfo: 'Standard BC Fishing License. No fee for public highway turnouts.',
      etiquette: 'Do not disturb traditional salmon smokehouses, drying racks, or set nets on mainstem Skeena gravel bars.',
    },
    accessPoints: [
      {
        id: 'skeena-usk',
        name: 'Usk Cable Ferry & Expansive Gravel Bar',
        type: 'take-out' as const,
        description: 'Legendary gravel bar and cable ferry landing. Wide expansive swing water and easy launch.',
        lat: 54.6350,
        lng: -128.4100,
        roadAccess: 'Usk Ferry Rd off Highway 16',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.6350,-128.4100',
        vesselSuitability: 'Rafts, Jetboats & Walk-and-Wade',
        landTenure: 'Public Ferry Landing & Crown Gravel Bar',
        bushwhackDifficulty: 'Zero bushwhack — direct vehicle gravel bar access',
      },
      {
        id: 'skeena-cedarvale',
        name: 'Cedarvale Public Crown Gravel Bar',
        type: 'crown-land' as const,
        description: 'Massive gravel bar with classic mainstem traveling seam. Gentle wade entry and vast swing runs.',
        lat: 54.9580,
        lng: -128.2500,
        roadAccess: 'Cedarvale Ferry Rd turnout off Hwy 16',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=54.9580,-128.2500',
        vesselSuitability: 'Walk-and-Wade & Raft Takeout',
        landTenure: 'BC Crown Land Reserve',
        bushwhackDifficulty: 'Zero bushwhack — flat gravel bar walk',
      },
      {
        id: 'skeena-kitwanga',
        name: 'Kitwanga Wooden Bridge & Launch',
        type: 'bridge-access' as const,
        description: 'Historic wooden bridge and river launch. Prime confluence holding pools for Kitwanga & Skeena runs.',
        lat: 55.1050,
        lng: -128.0100,
        roadAccess: 'Highway 37 / Kitwanga junction',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.1050,-128.0100',
        vesselSuitability: 'All Vessels & Walk-in',
        landTenure: 'Public Highway 37 Right-of-Way',
        bushwhackDifficulty: 'Easy 30m path under wooden bridge',
      },
      {
        id: 'skeena-carnaby-rail',
        name: 'Carnaby Railway Easement Seam',
        type: 'railway-easement' as const,
        description: 'Public walk-in along CN right-of-way down to a deep rocky traveling seam above Hazelton.',
        lat: 55.2200,
        lng: -127.7500,
        roadAccess: 'Carnaby rail siding pullout off Hwy 16',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.2200,-127.7500',
        vesselSuitability: 'Walk-and-Wade Only',
        landTenure: 'CN Rail Right-of-Way & Crown Land',
        bushwhackDifficulty: '🥾 250m walk along track shoulder + rock descent',
      },
      {
        id: 'skeena-hazelton-bulkley',
        name: 'Hazelton Historic Paddlewheeler Confluence Landing',
        type: 'put-in' as const,
        description: 'Historic paddlewheeler landing where Bulkley joins Skeena. Excellent staging for big river floats.',
        lat: 55.2500,
        lng: -127.6700,
        roadAccess: 'Old Hazelton waterfront park',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.2500,-127.6700',
        vesselSuitability: 'Put-in for Big River Floats',
        landTenure: 'Municipal Heritage Park',
        bushwhackDifficulty: 'Zero bushwhack — park waterfront launch',
      },
      {
        id: 'skeena-glen-vowell',
        name: 'Glen Vowell Skeena Gravel Bar',
        type: 'crown-land' as const,
        description: 'Productive upper Skeena gravel bar run with deep traveling seam.',
        lat: 55.3100,
        lng: -127.7000,
        roadAccess: 'Glen Vowell Band access road (respect local signage)',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=55.3100,-127.7000',
        vesselSuitability: 'Walk-and-Wade Only',
        landTenure: 'Gitxsan Traditional Territory & Crown Bar',
        bushwhackDifficulty: 'Easy 60m gravel walk',
      },
    ],
    adminTacticalIntel: {
      keyReaches: 'Kitwanga confluence & wooden bridge, Shegunia canyon mouth, Bear River, Skeena mainstem gravel bars.',
      tacticalBiteTriggers: 'Skeena mainstem gravel bar fishing excels when river levels drop below 1,500 m³/s at Usk gauging station.',
      waterClarityDynamics: 'Highly variable depending on local tributary source and gravel bar stability.',
      estuaryPassageNotes: 'Tyee peak: Aug 10 – Sep 01.',
      historicalGuideNotes: 'September through October in mainstem holding seams and canyon mouths.',
    },
    timingTips: {
      estuaryPassage: 'Tyee peak: Aug 10 – Sep 01.',
      travelTimeFromTyee: '15–28 days depending on sub-basin distance (Kitwanga ~180 km, Bear/Motase ~450 km).',
      primeHoldingWindow: 'September through October in mainstem holding seams and canyon mouths.',
      waterClarityNotes: 'Highly variable depending on local tributary source and gravel bar stability.',
      weatherTrigger: 'Skeena mainstem gravel bar fishing excels when river levels drop below 1,500 m³/s at Usk gauging station.',
      keyReaches: 'Kitwanga confluence & wooden bridge, Shegunia canyon mouth, Bear River, Skeena mainstem gravel bars.',
      regulations: 'Skeena mainstem and tributary provincial regulations apply. 100% wild steelhead catch-and-release.',
    },
  },
];

