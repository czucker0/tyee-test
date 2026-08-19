import {
  ALL_YEARS_DATA,
  CURRENT_YEAR,
  HISTORICAL_AVERAGE_CURVE,
  SEASON_DAYS,
  ADULT_EXPANSION_FACTOR,
  ESCAPEMENT_THRESHOLDS,
  SKEENA_TRIBUTARY_BASELINES,
} from '../data/historicalData';
import {
  YearRunData,
  ProjectionModelResult,
  TributaryEscapement,
  ComparisonMetric,
} from '../types/steelhead';

export function calculateProjection(
  dayIndex: number,
  customMultiplier: number = 1.0,
  overrideCumulative?: number,
  allYears: YearRunData[] = ALL_YEARS_DATA,
  adultExpansionFactor: number = ADULT_EXPANSION_FACTOR
): ProjectionModelResult {
  const clampedDay = Math.max(0, Math.min(SEASON_DAYS.length - 1, dayIndex));
  const selectedDay = SEASON_DAYS[clampedDay];
  const histDay = HISTORICAL_AVERAGE_CURVE[clampedDay];

  const currentYearData = allYears.find((y) => y.isCurrentYear || y.year === CURRENT_YEAR) || allYears[0];

  // Find the last authentic recorded day in the current year (where daily CPUE was recorded)
  let lastRecordedDayIndex = 67; // Aug 16
  if (currentYearData && currentYearData.data && currentYearData.data.length > 0) {
    for (let i = currentYearData.data.length - 1; i >= 0; i--) {
      const d: any = currentYearData.data[i];
      if (d.dailyIndex > 0 || d.isRecorded === true) {
        lastRecordedDayIndex = i;
        break;
      }
    }
  }

  const isFutureDate = clampedDay > lastRecordedDayIndex;
  const pctElapsed = Math.max(1.0, histDay.pctElapsed);
  const anchorDayHist = HISTORICAL_AVERAGE_CURVE[lastRecordedDayIndex];
  const anchorPctElapsed = Math.max(1.0, anchorDayHist.pctElapsed);

  const anchorCumulative =
    (currentYearData?.data[lastRecordedDayIndex]?.cumulativeIndex ?? 161.93) * customMultiplier;

  // Baseline projected final season total derived from authentic recorded run pace up to last recorded date
  let rawProjected = 0;
  if (isFutureDate) {
    rawProjected = anchorCumulative / (anchorPctElapsed / 100);
  } else {
    const rawCumulative = (currentYearData?.data[clampedDay]?.cumulativeIndex ?? 0) * customMultiplier;
    rawProjected = rawCumulative / (pctElapsed / 100);
  }

  const priorMean = HISTORICAL_AVERAGE_CURVE[HISTORICAL_AVERAGE_CURVE.length - 1].avgCumulative;

  let baselineProjected = rawProjected;
  if (!isFutureDate && pctElapsed < 15) {
    const weight = pctElapsed / 15;
    baselineProjected = rawProjected * weight + priorMean * (1 - weight);
  }
  baselineProjected = Math.round(baselineProjected * 10) / 10;

  // Compute the cumulative on the date of the slider
  let currentCumulative = 0;
  if (overrideCumulative !== undefined) {
    currentCumulative = overrideCumulative;
  } else if (!isFutureDate) {
    // Actual recorded data on or before last recorded date
    const rawCumulative = currentYearData?.data[clampedDay]?.cumulativeIndex ?? 0;
    currentCumulative = Math.round(rawCumulative * customMultiplier * 100) / 100;
  } else {
    // Projected cumulative on this future date along the projection curve
    const remainingRun = Math.max(0, baselineProjected - anchorCumulative);
    const futureShare = (pctElapsed - anchorPctElapsed) / Math.max(0.1, 100 - anchorPctElapsed);
    currentCumulative = Math.round((anchorCumulative + remainingRun * Math.max(0, Math.min(1, futureShare))) * 100) / 100;
  }

  // Find closest historical analog year
  let bestFitYear = 2018;
  let minDistance = Infinity;
  const priorYears = allYears.filter((y) => !y.isCurrentYear);

  for (const y of priorYears) {
    let dist = 0;
    const compareUpTo = isFutureDate ? lastRecordedDayIndex : clampedDay;
    for (let i = 0; i <= compareUpTo; i++) {
      const yVal = y.data[i]?.cumulativeIndex ?? 0;
      const curVal = (currentYearData.data[i]?.cumulativeIndex ?? 0) * customMultiplier;
      const diff = yVal - curVal;
      dist += diff * diff;
    }
    const rmse = Math.sqrt(dist / (compareUpTo + 1));
    if (rmse < minDistance) {
      minDistance = rmse;
      bestFitYear = y.year;
    }
  }

  // Early vs Late Timing scenarios
  const effectivePct = isFutureDate ? anchorPctElapsed : pctElapsed;
  const earlyElapsed = Math.min(99.0, effectivePct * 1.16);
  const earlyProjected = Math.round((anchorCumulative / (earlyElapsed / 100)) * 10) / 10;

  const lateElapsed = Math.max(1.0, effectivePct * 0.84);
  const lateProjected = Math.round((anchorCumulative / (lateElapsed / 100)) * 10) / 10;

  // Confidence interval narrows as season progresses
  const uncertaintyFactor = Math.max(0.05, ((100 - effectivePct) / 100) * 0.35);
  const lowCI = Math.round(Math.max(anchorCumulative, baselineProjected * (1 - uncertaintyFactor * 1.645)) * 10) / 10;
  const highCI = Math.round((baselineProjected * (1 + uncertaintyFactor * 1.645)) * 10) / 10;

  // Daily projected trajectory to end of season
  const projectedDailyTrajectory: ProjectionModelResult['projectedDailyTrajectory'] = [];
  const remainingBaseline = Math.max(0, baselineProjected - anchorCumulative);
  const remainingLow = Math.max(0, lowCI - anchorCumulative);
  const remainingHigh = Math.max(0, highCI - anchorCumulative);

  let remainingHistSum = 0;
  for (let i = lastRecordedDayIndex + 1; i < SEASON_DAYS.length; i++) {
    remainingHistSum += HISTORICAL_AVERAGE_CURVE[i].avgDaily;
  }
  if (remainingHistSum <= 0) remainingHistSum = 1;

  let runningProjCum = anchorCumulative;
  let runningLowCum = anchorCumulative;
  let runningHighCum = anchorCumulative;

  for (let i = 0; i < SEASON_DAYS.length; i++) {
    const sDay = SEASON_DAYS[i];
    if (i <= lastRecordedDayIndex) {
      const dRec = currentYearData.data[i];
      projectedDailyTrajectory.push({
        dayOfYear: i + 1,
        monthDay: sDay.monthDay,
        projectedDaily: dRec?.dailyIndex ?? 0,
        projectedCumulative: (dRec?.cumulativeIndex ?? 0) * customMultiplier,
        projectedCumulativeLow: (dRec?.cumulativeIndex ?? 0) * customMultiplier,
        projectedCumulativeHigh: (dRec?.cumulativeIndex ?? 0) * customMultiplier,
      });
    } else {
      const histDayDaily = HISTORICAL_AVERAGE_CURVE[i].avgDaily;
      const share = histDayDaily / remainingHistSum;
      const dVal = Math.round(remainingBaseline * share * 100) / 100;
      const dLow = Math.round(remainingLow * share * 100) / 100;
      const dHigh = Math.round(remainingHigh * share * 100) / 100;

      runningProjCum += dVal;
      runningLowCum += dLow;
      runningHighCum += dHigh;

      projectedDailyTrajectory.push({
        dayOfYear: i + 1,
        monthDay: sDay.monthDay,
        projectedDaily: dVal,
        projectedCumulative: Math.round(runningProjCum * 10) / 10,
        projectedCumulativeLow: Math.round(runningLowCum * 10) / 10,
        projectedCumulativeHigh: Math.round(runningHighCum * 10) / 10,
      });
    }
  }

  // Conservation status categorization
  let conservationTier: ProjectionModelResult['conservationTier'] = 'Critical';
  if (baselineProjected >= ESCAPEMENT_THRESHOLDS.ABUNDANT) {
    conservationTier = 'Abundant';
  } else if (baselineProjected >= ESCAPEMENT_THRESHOLDS.TARGET_HEALTHY) {
    conservationTier = 'Healthy';
  } else if (baselineProjected >= ESCAPEMENT_THRESHOLDS.PRECAUTIONARY) {
    conservationTier = 'Moderate';
  } else if (baselineProjected >= ESCAPEMENT_THRESHOLDS.EXTREME_CONSERVATION) {
    conservationTier = 'Precautionary';
  }

  return {
    selectedDate: selectedDay.monthDay,
    dayIndex: clampedDay,
    percentElapsedHistorical: pctElapsed,
    currentCumulative,
    projectedBaselineIndex: baselineProjected,
    projectedBaselineAdults: Math.round(baselineProjected * adultExpansionFactor),
    projectedLowCI: lowCI,
    projectedHighCI: highCI,
    confidenceLevel: Math.min(95, Math.round(50 + pctElapsed * 0.45)),
    bestFitAnalogYear: bestFitYear,
    scenarios: {
      earlyPeak: {
        name: 'Early Run (Early Peak Passed)',
        description: 'Assumes run peak occurred early. Remaining run will taper quickly.',
        projectedIndex: earlyProjected,
        projectedAdults: Math.round(earlyProjected * adultExpansionFactor),
        timingOffsetDays: -5,
        confidencePct: 30,
      },
      averageTiming: {
        name: 'Normal 10-Yr Timing Model',
        description: 'Standard timing baseline with migration pulses tracking historical shape.',
        projectedIndex: baselineProjected,
        projectedAdults: Math.round(baselineProjected * adultExpansionFactor),
        timingOffsetDays: 0,
        confidencePct: 50,
      },
      lateRunSurge: {
        name: 'Late Run Surge (Delayed Peak)',
        description: 'Assumes cooler water or freshet delayed migration; strong late August/September push expected.',
        projectedIndex: lateProjected,
        projectedAdults: Math.round(lateProjected * adultExpansionFactor),
        timingOffsetDays: 5,
        confidencePct: 20,
      },
    },
    projectedDailyTrajectory,
    conservationTier,
    escapementTargetPct: Math.round((baselineProjected / ESCAPEMENT_THRESHOLDS.TARGET_HEALTHY) * 100),
  };
}

export function getTributaryBreakdown(
  totalProjectedAdults: number,
  currentAdultsToDate: number
): TributaryEscapement[] {
  return SKEENA_TRIBUTARY_BASELINES.map((trib) => {
    const proj = Math.round((totalProjectedAdults * trib.sharePct) / 100);
    const est = Math.round((currentAdultsToDate * trib.sharePct) / 100);

    let status: TributaryEscapement['status'] = 'Strong';
    if (proj < 1500 && trib.sharePct > 10) status = 'Critical';
    else if (proj < 4000 && trib.sharePct > 20) status = 'Concern';
    else if (proj < 8000 && trib.sharePct > 20) status = 'Fair';

    return {
      name: trib.name,
      region: trib.region,
      sharePct: trib.sharePct,
      estimatedAdults: est,
      projectedAdults: proj,
      description: trib.description,
      peakWindow: trib.peakWindow,
      status,
      scientificProfile: trib.scientificProfile,
      adminTacticalIntel: trib.adminTacticalIntel,
      timingTips: trib.timingTips,
      floatSafety: trib.floatSafety,
      wadeSafety: trib.wadeSafety,
      accessPoints: trib.accessPoints,
      tribalProtocols: trib.tribalProtocols,
    };
  });
}

export function getComparisonMetricsOnDate(
  dayIndex: number,
  allYears: YearRunData[] = ALL_YEARS_DATA
): ComparisonMetric[] {
  const currentYearData = allYears.find((y) => y.isCurrentYear || y.year === CURRENT_YEAR) || allYears[0];
  const curOnDate = currentYearData.data[dayIndex]?.cumulativeIndex ?? 0;

  const rows: ComparisonMetric[] = allYears.map((y) => {
    const cumOnDate = y.data[dayIndex]?.cumulativeIndex ?? 0;
    const delta = curOnDate > 0 ? Math.round(((cumOnDate - curOnDate) / curOnDate) * 1000) / 10 : 0;
    return {
      year: y.year,
      cumulativeOnDate: cumOnDate,
      deltaFromCurrentPct: delta,
      totalSeasonIndex: y.totalIndex,
      peakDate: y.peakDate,
      peakDailyIndex: y.peakDailyIndex,
      rankOnDate: 0,
    };
  });

  const sorted = [...rows].sort((a, b) => b.cumulativeOnDate - a.cumulativeOnDate);
  sorted.forEach((r, idx) => {
    const orig = rows.find((x) => x.year === r.year);
    if (orig) orig.rankOnDate = idx + 1;
  });

  return rows;
}
