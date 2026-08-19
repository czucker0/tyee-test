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

export interface TributaryScientificProfile {
  basinAreaKm2: string;
  migrationDistanceKm: string;
  meanTravelVelocity: string;
  lakeBuffering: string;
  thermalRegime: string;
  conservationPriority: string;
  habitatEcology: string;
  provincialRegulations: string;
  monitoringMethodology: string;
}

export interface RiverAccessPoint {
  id: string;
  name: string;
  type: 'put-in' | 'take-out' | 'walk-in' | 'hazard-canyon' | 'bridge-access' | 'bushwhack' | 'crown-land' | 'railway-easement' | 'tribal-access';
  description: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
  roadAccess: string;
  vesselSuitability?: string;
  bushwhackDifficulty?: string;
  landTenure?: string;
}

export interface TribalAccessProtocol {
  nation: string;
  permitRequired: boolean;
  permitDetails: string;
  officeLocation: string;
  costInfo?: string;
  etiquette: string;
}

export interface FloatSafetyProfile {
  rating: 'Personal Raft Friendly' | 'Intermediate Float with Hazards' | 'Extreme Whitewater Canyon' | 'Walk-In / Jetboat Only';
  whitewaterClass: string;
  suitableCraft: string;
  hazardWarnings: string[];
  typicalFloatTimes: string;
}

export interface WadeSafetyProfile {
  difficulty: 'Easy' | 'Moderate' | 'Challenging / Treacherous';
  footwearRecommendation: string;
  bankAccessibility: string;
  wadingStaffAdvice: string;
}

export interface TributaryAdminTacticalIntel {
  keyReaches: string;
  tacticalBiteTriggers: string;
  waterClarityDynamics: string;
  estuaryPassageNotes: string;
  historicalGuideNotes?: string;
  floatSafety?: FloatSafetyProfile;
  wadeSafety?: WadeSafetyProfile;
  accessPoints?: RiverAccessPoint[];
  tribalProtocols?: TribalAccessProtocol;
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
  scientificProfile: TributaryScientificProfile;
  adminTacticalIntel?: TributaryAdminTacticalIntel;
  floatSafety?: FloatSafetyProfile;
  wadeSafety?: WadeSafetyProfile;
  accessPoints?: RiverAccessPoint[];
  tribalProtocols?: TribalAccessProtocol;
  timingTips?: {
    estuaryPassage: string;
    travelTimeFromTyee: string;
    primeHoldingWindow: string;
    waterClarityNotes: string;
    weatherTrigger: string;
    keyReaches: string;
    regulations: string;
  };
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

export type MainTabType = 'overview' | 'alluvial' | 'forecast' | 'compare' | 'tributaries' | 'biologist' | 'field-notes';

