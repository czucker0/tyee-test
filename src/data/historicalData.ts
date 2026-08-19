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

