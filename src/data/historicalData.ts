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
  return 68; // Default Aug 17
}

export const LATEST_RECORDED_DAY_INDEX = 68; // Aug 17 (Day 68)
export const LATEST_RECORDED_MONTH_DAY = 'Aug 17';

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
    region: 'Bulkley Valley & Houston',
    sharePct: 44.0,
    peakWindow: 'Late Aug – Mid Sep',
    description: 'The watershed’s primary wild steelhead engine. Accounts for ~44% of total Skeena adult escapement, with world-famous fly waters from Telkwa to Moricetown Canyon and Houston.',
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
    region: 'Upper Skeena / Nilkitkwa',
    sharePct: 22.0,
    peakWindow: 'Late Aug – Early Oct',
    description: 'Home to the legendary giant Skeena steelhead strain. Regulated counting fence at the Babine Lake outlet provides high-accuracy stock verification.',
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
    region: 'Hazelton / Kispiox Valley',
    sharePct: 14.0,
    peakWindow: 'Mid Aug – Late Sep',
    description: 'World-renowned for heavy-bodied wild fish. High sensitivity to autumn rain freshets and valley clay sediment.',
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
    region: 'Terrace / Coast Mountains',
    sharePct: 8.5,
    peakWindow: 'Early Aug – Mid Sep',
    description: 'Glacial-fed lower Skeena tributary with distinct early summer canyon runs and late summer headwater migrants.',
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
    region: 'Upper Skeena Wilderness',
    sharePct: 4.5,
    peakWindow: 'Late Jul – Late Aug',
    description: 'Remote high-elevation pristine wilderness stock; earliest arrival in the upper Skeena headwaters. Monitored with provincial counting weir.',
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
    region: 'Terrace / Kalum Lake',
    sharePct: 4.0,
    peakWindow: 'Year-round / Aug Peak',
    description: 'Deep glacial lake-headed system supporting both summer wild steelhead and giant spring winter-run strains.',
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
    region: 'Kitwanga, Shegunia, Bear',
    sharePct: 3.0,
    peakWindow: 'Mid Aug – Late Sep',
    description: 'Includes Kitwanga River, Shegunia, Bear River, and remote wild headwater spawning gravels across Gitxsan and Wet’suwet’en territories.',
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

