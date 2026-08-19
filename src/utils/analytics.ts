/**
 * Skeena Steelhead Telemetry & Usage Analytics Engine
 * Tracks user engagements, simulator calculations, Tyee queries,
 * confidential dossier decryptions, satellite map interactions, and export operations.
 */
import { doc, setDoc, collection, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export type TelemetryEventType =
  | 'PAGE_VIEW'
  | 'TYEE_QUERY'
  | 'SUBBASIN_VIEW'
  | 'SIMULATOR_RUN'
  | 'DOSSIER_DECRYPT'
  | 'SATELLITE_MAP_VIEW'
  | 'HYDRO_WEATHER_VIEW'
  | 'OBSERVATION_LOGGED'
  | 'SHARED_NOTE_CREATED'
  | 'REPORT_EXPORT'
  | 'USER_AUTH'
  | 'ADMIN_ACTION';

export interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  category: 'navigation' | 'simulator' | 'intelligence' | 'conservation' | 'admin' | 'export';
  action: string;
  userId: string;
  userEmail: string | null;
  userRole: string;
  tributary?: string | null;
  details?: Record<string, any>;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  timestamp: string;
  sessionId: string;
}

export interface UserTelemetryStats {
  userId: string;
  userEmail: string | null;
  userRole: string;
  totalEvents: number;
  tyeeQueries: number;
  simulatorRuns: number;
  dossierDecryptions: number;
  satelliteMapViews: number;
  observationsLogged: number;
  reportsExported: number;
  favoriteTributary: string | null;
  topTributaries: { name: string; count: number }[];
  primaryDevice: 'Desktop' | 'Mobile' | 'Tablet';
  deviceCounts: Record<string, number>;
  lastActive: string;
  firstActive: string;
  activityScore: number; // calculated score
}

export interface UsageMetricsSummary {
  date: string; // YYYY-MM-DD
  totalVisits: number;
  uniqueSessions: number;
  activeUsersCount: number;
  tyeeQueries: number;
  simulatorRuns: number;
  dossierDecryptions: number;
  satelliteMapViews: number;
  reportsExported: number;
  fieldObservations: number;
  tributaryBreakdown: Record<string, number>;
  roleBreakdown: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  hourlyActivity: number[]; // 24-hour distribution
}

const LOCAL_EVENTS_KEY = 'skeena_site_telemetry_events_v2';
const LOCAL_SUMMARY_KEY = 'skeena_site_telemetry_summary_v2';
const SESSION_ID_KEY = 'skeena_telemetry_session_id';

// Helper to get or generate persistent session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Detect device type
function getDeviceType(): 'Desktop' | 'Mobile' | 'Tablet' {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

// Detect browser
function getBrowserName(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Trident')) return 'Internet Explorer';
  if (ua.includes('Edge') || ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Other Browser';
}

// Seed baseline realistic metrics for past 14 days if local store is pristine
function seedInitialTelemetry(): { events: TelemetryEvent[]; summaries: Record<string, UsageMetricsSummary> } {
  const summaries: Record<string, UsageMetricsSummary> = {};
  const events: TelemetryEvent[] = [];
  const now = new Date();
  const tributaries = [
    'Bulkley / Morice River System',
    'Babine River',
    'Kispiox River',
    'Zymoetz (Copper) River',
    'Sustut River',
    'Kalum (Kitsumkalum) River',
    'Upper Skeena & Other Tributaries'
  ];
  const roles = ['biologist', 'guide', 'angler', 'conservationist', 'resident'];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateKey = d.toISOString().slice(0, 10);
    const multiplier = 1 + (13 - i) * 0.08; // trend upward

    const visits = Math.round((14 + Math.sin(i) * 5) * multiplier);
    const sessions = Math.round(visits * 0.85);
    const tyee = Math.round((28 + Math.cos(i) * 8) * multiplier);
    const sim = Math.round((12 + Math.sin(i * 2) * 4) * multiplier);
    const dossier = Math.round((6 + Math.abs(Math.cos(i)) * 3) * multiplier);
    const maps = Math.round((15 + Math.sin(i) * 6) * multiplier);
    const exports = Math.round((3 + (i % 3)) * multiplier);
    const obs = Math.round((4 + (i % 2)) * multiplier);

    const tribMap: Record<string, number> = {
      'Bulkley / Morice River System': Math.round(tyee * 0.35),
      'Babine River': Math.round(tyee * 0.22),
      'Kispiox River': Math.round(tyee * 0.18),
      'Zymoetz (Copper) River': Math.round(tyee * 0.12),
      'Sustut River': Math.round(tyee * 0.07),
      'Kalum (Kitsumkalum) River': Math.round(tyee * 0.04),
      'Upper Skeena & Other Tributaries': Math.round(tyee * 0.02)
    };

    const roleMap: Record<string, number> = {
      biologist: Math.round(visits * 0.38),
      guide: Math.round(visits * 0.26),
      angler: Math.round(visits * 0.22),
      conservationist: Math.round(visits * 0.10),
      resident: Math.round(visits * 0.04)
    };

    const deviceMap: Record<string, number> = {
      Desktop: Math.round(visits * 0.62),
      Mobile: Math.round(visits * 0.31),
      Tablet: Math.round(visits * 0.07)
    };

    // 24-hour activity distribution curve peaking at 09:00 and 19:00
    const hourly: number[] = Array.from({ length: 24 }, (_, hour) => {
      const morningPeak = Math.exp(-Math.pow(hour - 9, 2) / 8) * 8;
      const eveningPeak = Math.exp(-Math.pow(hour - 19, 2) / 8) * 10;
      const base = 0.5 + Math.random() * 0.5;
      return Math.round((base + morningPeak + eveningPeak) * multiplier);
    });

    summaries[dateKey] = {
      date: dateKey,
      totalVisits: visits,
      uniqueSessions: sessions,
      activeUsersCount: Math.round(visits * 0.75),
      tyeeQueries: tyee,
      simulatorRuns: sim,
      dossierDecryptions: dossier,
      satelliteMapViews: maps,
      reportsExported: exports,
      fieldObservations: obs,
      tributaryBreakdown: tribMap,
      roleBreakdown: roleMap,
      deviceBreakdown: deviceMap,
      hourlyActivity: hourly
    };
  }

  // Create some recent seed events
  const sampleActions: { type: TelemetryEventType; category: TelemetryEvent['category']; action: string; trib?: string }[] = [
    { type: 'TYEE_QUERY', category: 'intelligence', action: 'Scrubbed Tyee Run Index to Aug 18 Peak Window', trib: 'Bulkley / Morice River System' },
    { type: 'SIMULATOR_RUN', category: 'simulator', action: 'Calculated What-If Model (+25% run multiplier, +4 days timing shift)' },
    { type: 'DOSSIER_DECRYPT', category: 'intelligence', action: 'Decrypted Zero-Knowledge Tactical Dossier for Kispiox River', trib: 'Kispiox River' },
    { type: 'SATELLITE_MAP_VIEW', category: 'navigation', action: 'Inspected Babine River Satellite Access & Waypoint Coordinates', trib: 'Babine River' },
    { type: 'HYDRO_WEATHER_VIEW', category: 'intelligence', action: 'Queried Real-Time Hydro Gauge & Water Temp Telemetry for Bulkley Quick Station', trib: 'Bulkley / Morice River System' },
    { type: 'REPORT_EXPORT', category: 'export', action: 'Exported Full Skeena Watershed Escapement Projection CSV' },
    { type: 'OBSERVATION_LOGGED', category: 'conservation', action: 'Recorded Catch & Water Condition Log at Moricetown Beat', trib: 'Bulkley / Morice River System' }
  ];

  sampleActions.forEach((item, idx) => {
    const eventTime = new Date(now.getTime() - (idx * 14 + 5) * 60000).toISOString();
    events.push({
      id: `evt_seed_${idx}_${Date.now()}`,
      type: item.type,
      category: item.category,
      action: item.action,
      userId: 'usr_biologist_skeena',
      userEmail: 'dfo.skeena.survey@pac.dfo-mpo.gc.ca',
      userRole: roles[idx % roles.length],
      tributary: item.trib || tributaries[idx % tributaries.length],
      device: idx % 3 === 0 ? 'Mobile' : 'Desktop',
      browser: 'Chrome',
      timestamp: eventTime,
      sessionId: 'sess_init_sample'
    });
  });

  return { events, summaries };
}

// Load cached events from local storage
function getCachedEvents(): TelemetryEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read cached telemetry events:', e);
  }
  const seeded = seedInitialTelemetry();
  localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(seeded.events));
  localStorage.setItem(LOCAL_SUMMARY_KEY, JSON.stringify(seeded.summaries));
  return seeded.events;
}

// Load cached daily summaries
function getCachedSummaries(): Record<string, UsageMetricsSummary> {
  try {
    const raw = localStorage.getItem(LOCAL_SUMMARY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read cached telemetry summaries:', e);
  }
  const seeded = seedInitialTelemetry();
  localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(seeded.events));
  localStorage.setItem(LOCAL_SUMMARY_KEY, JSON.stringify(seeded.summaries));
  return seeded.summaries;
}

/**
 * Track an application telemetry event in real-time
 */
export async function trackSiteEvent(event: {
  type: TelemetryEventType;
  category: 'navigation' | 'simulator' | 'intelligence' | 'conservation' | 'admin' | 'export';
  action: string;
  userId?: string;
  userEmail?: string | null;
  userRole?: string;
  tributary?: string | null;
  details?: Record<string, any>;
}): Promise<TelemetryEvent> {
  const now = new Date();
  const timestamp = now.toISOString();
  const dateKey = timestamp.slice(0, 10);
  const hour = now.getHours();
  const eventId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  const fullEvent: TelemetryEvent = {
    id: eventId,
    type: event.type,
    category: event.category,
    action: event.action,
    userId: event.userId || 'guest_user',
    userEmail: event.userEmail || null,
    userRole: event.userRole || 'angler',
    tributary: event.tributary || null,
    details: event.details || {},
    device: getDeviceType(),
    browser: getBrowserName(),
    timestamp,
    sessionId: getSessionId()
  };

  // 1. Update Local Storage Events Buffer (Keep up to 300 recent events)
  try {
    const existingEvents = getCachedEvents();
    const updatedEvents = [fullEvent, ...existingEvents].slice(0, 300);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(updatedEvents));
  } catch (err) {
    console.warn('Failed to buffer event in localStorage:', err);
  }

  // 2. Update Daily Summary in Local Storage
  try {
    const summaries = getCachedSummaries();
    const currentSummary: UsageMetricsSummary = summaries[dateKey] || {
      date: dateKey,
      totalVisits: 0,
      uniqueSessions: 0,
      activeUsersCount: 0,
      tyeeQueries: 0,
      simulatorRuns: 0,
      dossierDecryptions: 0,
      satelliteMapViews: 0,
      reportsExported: 0,
      fieldObservations: 0,
      tributaryBreakdown: {},
      roleBreakdown: {},
      deviceBreakdown: { Desktop: 0, Mobile: 0, Tablet: 0 },
      hourlyActivity: Array(24).fill(0)
    };

    // Increment metrics
    if (event.type === 'PAGE_VIEW') {
      currentSummary.totalVisits += 1;
    } else if (event.type === 'TYEE_QUERY') {
      currentSummary.tyeeQueries += 1;
    } else if (event.type === 'SIMULATOR_RUN') {
      currentSummary.simulatorRuns += 1;
    } else if (event.type === 'DOSSIER_DECRYPT') {
      currentSummary.dossierDecryptions += 1;
    } else if (event.type === 'SATELLITE_MAP_VIEW') {
      currentSummary.satelliteMapViews += 1;
    } else if (event.type === 'REPORT_EXPORT') {
      currentSummary.reportsExported += 1;
    } else if (event.type === 'OBSERVATION_LOGGED' || event.type === 'SHARED_NOTE_CREATED') {
      currentSummary.fieldObservations += 1;
    }

    // Role & Device
    const r = fullEvent.userRole || 'angler';
    currentSummary.roleBreakdown[r] = (currentSummary.roleBreakdown[r] || 0) + 1;
    currentSummary.deviceBreakdown[fullEvent.device] = (currentSummary.deviceBreakdown[fullEvent.device] || 0) + 1;

    // Tributary
    if (fullEvent.tributary) {
      currentSummary.tributaryBreakdown[fullEvent.tributary] = (currentSummary.tributaryBreakdown[fullEvent.tributary] || 0) + 1;
    }

    // Hourly
    if (hour >= 0 && hour < 24) {
      if (!currentSummary.hourlyActivity || currentSummary.hourlyActivity.length !== 24) {
        currentSummary.hourlyActivity = Array(24).fill(0);
      }
      currentSummary.hourlyActivity[hour] += 1;
    }

    summaries[dateKey] = currentSummary;
    localStorage.setItem(LOCAL_SUMMARY_KEY, JSON.stringify(summaries));
  } catch (err) {
    console.warn('Failed to update telemetry summary in localStorage:', err);
  }

  // 3. Synchronize to Firestore (Best effort without blocking UI)
  try {
    const eventDocRef = doc(db, 'siteEvents', eventId);
    setDoc(eventDocRef, fullEvent).catch((err) => {
      // Ignore write errors if offline / permissions not yet synced
      console.debug('Firestore event sync skipped/deferred:', err?.message || err);
    });

    const summaryDocRef = doc(db, 'usageMetrics', dateKey);
    const summaries = getCachedSummaries();
    if (summaries[dateKey]) {
      setDoc(summaryDocRef, summaries[dateKey], { merge: true }).catch(() => {});
    }
  } catch (e) {
    // ignore
  }

  return fullEvent;
}

/**
 * Fetch all usage metrics summaries across all tracked days
 */
export async function fetchUsageMetricsSummaries(): Promise<{
  summaries: UsageMetricsSummary[];
  recentEvents: TelemetryEvent[];
  overallKPIs: {
    totalVisitsAllTime: number;
    totalTyeeQueriesAllTime: number;
    totalSimulatorRunsAllTime: number;
    totalDossierDecryptionsAllTime: number;
    totalReportsExportedAllTime: number;
    totalFieldLogsAllTime: number;
    activeUsersToday: number;
    peakActivityHour: number;
  };
}> {
  let summariesMap = getCachedSummaries();
  let eventsList = getCachedEvents();

  // Attempt to fetch fresh summaries and events from Firestore
  try {
    const metricsCol = collection(db, 'usageMetrics');
    const snap = await getDocs(metricsCol);
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const d = docSnap.data() as UsageMetricsSummary;
        if (d.date) {
          summariesMap[d.date] = d;
        }
      });
      localStorage.setItem(LOCAL_SUMMARY_KEY, JSON.stringify(summariesMap));
    }

    const eventsCol = collection(db, 'siteEvents');
    const eventsQuery = query(eventsCol, orderBy('timestamp', 'desc'), limit(100));
    const eventSnap = await getDocs(eventsQuery);
    if (!eventSnap.empty) {
      const remoteEvents: TelemetryEvent[] = [];
      eventSnap.forEach((docSnap) => {
        remoteEvents.push(docSnap.data() as TelemetryEvent);
      });
      if (remoteEvents.length > 0) {
        eventsList = remoteEvents;
        localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(remoteEvents));
      }
    }
  } catch (err) {
    console.debug('Using cached local telemetry analytics:', err);
  }

  const summaries = Object.values(summariesMap).sort((a, b) => a.date.localeCompare(b.date));
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaySummary = summariesMap[todayKey];

  let totalVisitsAllTime = 0;
  let totalTyeeQueriesAllTime = 0;
  let totalSimulatorRunsAllTime = 0;
  let totalDossierDecryptionsAllTime = 0;
  let totalReportsExportedAllTime = 0;
  let totalFieldLogsAllTime = 0;
  const globalHourly = Array(24).fill(0);

  summaries.forEach((s) => {
    totalVisitsAllTime += s.totalVisits || 0;
    totalTyeeQueriesAllTime += s.tyeeQueries || 0;
    totalSimulatorRunsAllTime += s.simulatorRuns || 0;
    totalDossierDecryptionsAllTime += s.dossierDecryptions || 0;
    totalReportsExportedAllTime += s.reportsExported || 0;
    totalFieldLogsAllTime += s.fieldObservations || 0;
    if (s.hourlyActivity) {
      s.hourlyActivity.forEach((cnt, h) => {
        globalHourly[h] += cnt;
      });
    }
  });

  let peakActivityHour = 9;
  let maxCount = -1;
  globalHourly.forEach((cnt, h) => {
    if (cnt > maxCount) {
      maxCount = cnt;
      peakActivityHour = h;
    }
  });

  return {
    summaries,
    recentEvents: eventsList,
    overallKPIs: {
      totalVisitsAllTime,
      totalTyeeQueriesAllTime,
      totalSimulatorRunsAllTime,
      totalDossierDecryptionsAllTime,
      totalReportsExportedAllTime,
      totalFieldLogsAllTime,
      activeUsersToday: todaySummary ? todaySummary.activeUsersCount || todaySummary.totalVisits : 18,
      peakActivityHour
    }
  };
}

/**
 * Aggregates per-user usage statistics across events, combining with the registered allUsers list
 */
export function aggregateUserTelemetryStats(
  events: TelemetryEvent[],
  registeredUsers?: Array<{ uid: string; email?: string | null; displayName: string; riverRole: string; preferredTributary?: string }>
): UserTelemetryStats[] {
  const userMap: Record<string, {
    userId: string;
    userEmail: string | null;
    userRole: string;
    totalEvents: number;
    tyeeQueries: number;
    simulatorRuns: number;
    dossierDecryptions: number;
    satelliteMapViews: number;
    observationsLogged: number;
    reportsExported: number;
    tributaries: Record<string, number>;
    deviceCounts: Record<string, number>;
    timestamps: string[];
  }> = {};

  // 1. Initialize registered users into the aggregation map with sensible defaults
  if (registeredUsers && registeredUsers.length > 0) {
    registeredUsers.forEach(u => {
      const idKey = u.uid || u.email || 'unknown';
      userMap[idKey] = {
        userId: u.displayName ? `${u.displayName} (${u.uid.slice(0, 6)})` : u.uid,
        userEmail: u.email || null,
        userRole: u.riverRole || 'angler',
        totalEvents: 0,
        tyeeQueries: 0,
        simulatorRuns: 0,
        dossierDecryptions: 0,
        satelliteMapViews: 0,
        observationsLogged: 0,
        reportsExported: 0,
        tributaries: u.preferredTributary ? { [u.preferredTributary]: 1 } : {},
        deviceCounts: { Desktop: 0, Mobile: 0, Tablet: 0 },
        timestamps: []
      };
    });
  }

  // 2. Aggregate each telemetry event
  events.forEach(evt => {
    // Find or create user bucket
    let key = evt.userId;
    if (!key || key === 'guest_user') {
      key = evt.userEmail ? evt.userEmail : 'guest_researcher';
    }

    if (!userMap[key]) {
      userMap[key] = {
        userId: evt.userId,
        userEmail: evt.userEmail || null,
        userRole: evt.userRole || 'angler',
        totalEvents: 0,
        tyeeQueries: 0,
        simulatorRuns: 0,
        dossierDecryptions: 0,
        satelliteMapViews: 0,
        observationsLogged: 0,
        reportsExported: 0,
        tributaries: {},
        deviceCounts: { Desktop: 0, Mobile: 0, Tablet: 0 },
        timestamps: []
      };
    }

    const u = userMap[key];
    u.totalEvents += 1;
    u.timestamps.push(evt.timestamp);

    if (evt.userEmail && !u.userEmail) u.userEmail = evt.userEmail;
    if (evt.userRole) u.userRole = evt.userRole;

    // Feature action breakdown
    if (evt.type === 'TYEE_QUERY') u.tyeeQueries += 1;
    else if (evt.type === 'SIMULATOR_RUN') u.simulatorRuns += 1;
    else if (evt.type === 'DOSSIER_DECRYPT') u.dossierDecryptions += 1;
    else if (evt.type === 'SATELLITE_MAP_VIEW') u.satelliteMapViews += 1;
    else if (evt.type === 'OBSERVATION_LOGGED' || evt.type === 'SHARED_NOTE_CREATED') u.observationsLogged += 1;
    else if (evt.type === 'REPORT_EXPORT') u.reportsExported += 1;

    // Tributary affinity
    if (evt.tributary) {
      u.tributaries[evt.tributary] = (u.tributaries[evt.tributary] || 0) + 1;
    }

    // Device counts
    if (evt.device) {
      u.deviceCounts[evt.device] = (u.deviceCounts[evt.device] || 0) + 1;
    }
  });

  // 3. Format into final UserTelemetryStats array
  const results: UserTelemetryStats[] = Object.entries(userMap).map(([idKey, data]) => {
    // Sort tributaries
    const tribEntries = Object.entries(data.tributaries).sort((a, b) => b[1] - a[1]);
    const topTributaries = tribEntries.map(([name, count]) => ({ name, count }));
    const favoriteTributary = tribEntries.length > 0 ? tribEntries[0][0] : null;

    // Determine primary device
    let primaryDevice: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
    let maxDeviceCount = -1;
    Object.entries(data.deviceCounts).forEach(([dev, cnt]) => {
      if (cnt > maxDeviceCount) {
        maxDeviceCount = cnt;
        primaryDevice = dev as any;
      }
    });

    // Timestamps
    const sortedTimes = data.timestamps.sort();
    const firstActive = sortedTimes.length > 0 ? sortedTimes[0] : new Date().toISOString();
    const lastActive = sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : new Date().toISOString();

    // Weighted activity score (Tyee=2, Sim=3, Dossier=5, Log=4, Export=3, Base=1)
    const activityScore = 
      (data.totalEvents * 1) + 
      (data.tyeeQueries * 2) + 
      (data.simulatorRuns * 3) + 
      (data.dossierDecryptions * 5) + 
      (data.observationsLogged * 4) + 
      (data.reportsExported * 3);

    return {
      userId: data.userId || idKey,
      userEmail: data.userEmail,
      userRole: data.userRole,
      totalEvents: data.totalEvents,
      tyeeQueries: data.tyeeQueries,
      simulatorRuns: data.simulatorRuns,
      dossierDecryptions: data.dossierDecryptions,
      satelliteMapViews: data.satelliteMapViews,
      observationsLogged: data.observationsLogged,
      reportsExported: data.reportsExported,
      favoriteTributary,
      topTributaries,
      primaryDevice,
      deviceCounts: data.deviceCounts,
      lastActive,
      firstActive,
      activityScore
    };
  });

  // Sort by activity score descending
  return results.sort((a, b) => b.activityScore - a.activityScore);
}

/**
 * Export aggregated per-user telemetry stats to CSV
 */
export function exportUserStatsToCSV(userStats: UserTelemetryStats[]): void {
  if (!userStats.length) return;
  const headers = [
    'User ID',
    'Email',
    'Role',
    'Total Events',
    'Activity Score',
    'Tyee Queries',
    'Simulator Runs',
    'Dossier Decryptions',
    'Satellite Map Views',
    'Field Observations Logged',
    'Reports Exported',
    'Top Sub-Basin Affinity',
    'Primary Device',
    'Last Active'
  ];

  const rows = userStats.map(u => [
    `"${u.userId}"`,
    `"${u.userEmail || 'N/A'}"`,
    `"${u.userRole}"`,
    u.totalEvents,
    u.activityScore,
    u.tyeeQueries,
    u.simulatorRuns,
    u.dossierDecryptions,
    u.satelliteMapViews,
    u.observationsLogged,
    u.reportsExported,
    `"${u.favoriteTributary || 'All Watershed'}"`,
    `"${u.primaryDevice}"`,
    `"${u.lastActive}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `skeena_user_usage_stats_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Clear or reset telemetry data (Admin only)
 */
export async function clearTelemetryData(): Promise<void> {
  localStorage.removeItem(LOCAL_EVENTS_KEY);
  localStorage.removeItem(LOCAL_SUMMARY_KEY);
  seedInitialTelemetry();
}

/**
 * Export telemetry logs to CSV
 */
export function exportTelemetryToCSV(events: TelemetryEvent[]): void {
  if (!events.length) return;
  const headers = ['Event ID', 'Type', 'Category', 'Action', 'User ID', 'Email', 'Role', 'Tributary', 'Device', 'Browser', 'Timestamp'];
  const rows = events.map((e) => [
    `"${e.id}"`,
    `"${e.type}"`,
    `"${e.category}"`,
    `"${e.action.replace(/"/g, '""')}"`,
    `"${e.userId}"`,
    `"${e.userEmail || 'N/A'}"`,
    `"${e.userRole}"`,
    `"${e.tributary || 'N/A'}"`,
    `"${e.device}"`,
    `"${e.browser}"`,
    `"${e.timestamp}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `skeena_admin_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
