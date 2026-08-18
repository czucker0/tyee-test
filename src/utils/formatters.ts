// Standard fisheries formatting helpers for Skeena River Tyee Test Fishery
export const ADULT_EXPANSION_FACTOR = 50;

/**
 * Formats a Tyee CPUE index with expanded adult steelhead in parentheses
 * Example: "582.4 (~29,120 fish)"
 */
export function formatTyeeWithAdults(index: number, options?: { decimals?: number; showFishLabel?: boolean }): string {
  if (index === undefined || index === null || isNaN(index)) return '--';
  const decimals = options?.decimals ?? 1;
  const indexStr = Number(index).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const adults = Math.round(index * ADULT_EXPANSION_FACTOR).toLocaleString();
  const fishLabel = options?.showFishLabel ?? true ? ' fish' : '';
  return `${indexStr} (~${adults}${fishLabel})`;
}

/**
 * Formats daily index rate with daily adult fish in parentheses
 * Example: "14.2/day (~710 fish/day)"
 */
export function formatDailyTyeeWithAdults(index: number): string {
  if (index === undefined || index === null || isNaN(index)) return '--';
  const indexStr = Number(index).toFixed(1);
  const adults = Math.round(index * ADULT_EXPANSION_FACTOR).toLocaleString();
  return `${indexStr}/day (~${adults} fish/day)`;
}

/**
 * Formats a delta value with expanded adult fish in parentheses
 * Example: "+62.4 (+3,120 fish)" or "-18.0 (-900 fish)"
 */
export function formatDeltaTyeeWithAdults(deltaIndex: number): string {
  if (deltaIndex === undefined || deltaIndex === null || isNaN(deltaIndex)) return '--';
  const sign = deltaIndex >= 0 ? '+' : '';
  const deltaStr = `${sign}${deltaIndex.toFixed(1)}`;
  const adultsDelta = Math.round(deltaIndex * ADULT_EXPANSION_FACTOR);
  const adultsStr = `${adultsDelta >= 0 ? '+' : ''}${adultsDelta.toLocaleString()} fish`;
  return `${deltaStr} (${adultsStr})`;
}
