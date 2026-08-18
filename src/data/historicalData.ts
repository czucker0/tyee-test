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
    peakWindow: 'Late Aug - Mid Sep',
    description: 'Largest summer steelhead producer in the Skeena watershed. World-famous fly-fishing waters from Telkwa to Moricetown canyon and Houston.',
  },
  {
    name: 'Babine River',
    region: 'Upper Skeena / Nilkitkwa',
    sharePct: 22.0,
    peakWindow: 'Late Aug - Early Oct',
    description: 'Home to the legendary giant Skeena steelhead strain. Regulated counting fence at Babine Lake outlet provides definitive stock verification.',
  },
  {
    name: 'Kispiox River',
    region: 'Hazelton / Kispiox Valley',
    sharePct: 14.0,
    peakWindow: 'Mid Aug - Late Sep',
    description: 'Renowned for world-record class trophy steelhead. Highly sensitive to autumn rain freshets and water clarity.',
  },
  {
    name: 'Zymoetz (Copper) River',
    region: 'Terrace / Coast Mountains',
    sharePct: 8.5,
    peakWindow: 'Early Aug - Mid Sep',
    description: 'Glacial fed lower Skeena tributary with distinct early summer and late summer runs.',
  },
  {
    name: 'Sustut River',
    region: 'Upper Skeena Wilderness',
    sharePct: 4.5,
    peakWindow: 'Late Jul - Late Aug',
    description: 'Remote high-elevation pristine wilderness tributary. Monitored annually with high-precision adult fish counting weir.',
  },
  {
    name: 'Kalum (Kitsumkalum) River',
    region: 'Terrace / Kalum Lake',
    sharePct: 4.0,
    peakWindow: 'Year-round / Aug Peak',
    description: 'Deep lake-headed system supporting both summer and spring winter steelhead runs.',
  },
  {
    name: 'Upper Skeena Mainstem & Other Tributaries',
    region: 'Kitwanga, Bear, Sustut, Motase',
    sharePct: 3.0,
    peakWindow: 'Mid Aug - Sep',
    description: 'Kitwanga River, Shegunia, Skeena mainstem gravel bars, and small wild headwater streams.',
  },
];
