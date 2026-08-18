export interface DailyIndex {
  dayOfYear: number; // 1 = June 10, ...
  dateStr: string; // "YYYY-MM-DD"
  monthDay: string; // "Jun 10", "Aug 17"
  month: number; // 6 = Jun, 7 = Jul, 8 = Aug, 9 = Sep
  day: number; // 1-31
  dailyIndex: number; // CPUE daily index
  cumulativeIndex: number; // Cumulative index to this day
  waterTempC?: number; // Skeena water temperature
  dischargeM3s?: number; // Skeena river flow at Usk (m3/s)
}

export interface YearRunData {
  year: number;
  isCurrentYear: boolean;
  totalIndex: number; // Final or current recorded total
  projectedTotal?: number; // Projected final for current year
  peakDate: string;
  peakDailyIndex: number;
  medianDate: string; // Date 50% reached
  data: DailyIndex[];
  notes: string;
  conservationStatus: 'Critical' | 'Precautionary' | 'Moderate' | 'Healthy' | 'Abundant';
  color: string;
}

export interface ProjectionScenario {
  name: string;
  description: string;
  projectedIndex: number;
  projectedAdults: number;
  timingOffsetDays: number; // e.g. -5 for early, 0 for average, +5 for late
  confidencePct: number;
}

export interface ProjectionModelResult {
  selectedDate: string;
  dayIndex: number;
  percentElapsedHistorical: number; // e.g. 64.5%
  currentCumulative: number;
  projectedBaselineIndex: number;
  projectedBaselineAdults: number;
  projectedLowCI: number; // 10th percentile / conservative
  projectedHighCI: number; // 90th percentile / optimistic
  confidenceLevel: number;
  bestFitAnalogYear: number;
  scenarios: {
    earlyPeak: ProjectionScenario;
    averageTiming: ProjectionScenario;
    lateRunSurge: ProjectionScenario;
  };
  projectedDailyTrajectory: {
    dayOfYear: number;
    monthDay: string;
    projectedDaily: number;
    projectedCumulative: number;
    projectedCumulativeLow: number;
    projectedCumulativeHigh: number;
  }[];
  conservationTier: 'Critical' | 'Precautionary' | 'Moderate' | 'Healthy' | 'Abundant';
  escapementTargetPct: number; // vs 45,000 fish target (900 index)
}

export interface TributaryEscapement {
  name: string;
  region: string;
  sharePct: number; // % of Skeena run
  estimatedAdults: number;
  projectedAdults: number;
  description: string;
  peakWindow: string;
  status: 'Critical' | 'Concern' | 'Fair' | 'Strong';
}

export interface ComparisonMetric {
  year: number;
  cumulativeOnDate: number;
  deltaFromCurrentPct: number;
  totalSeasonIndex: number;
  peakDate: string;
  peakDailyIndex: number;
  rankOnDate: number;
}
