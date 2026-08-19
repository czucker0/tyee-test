import React, { useState, useMemo } from 'react';
import {
  SEASON_DAYS,
  ADULT_EXPANSION_FACTOR,
} from '../data/historicalData';
import { ProjectionModelResult } from '../types/steelhead';
import {
  Waves,
  Calendar,
  Layers,
  Sparkles,
  Info,
  TrendingUp,
  MapPin,
  Clock,
  Fish,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface SkeenaAlluvialStreamProps {
  currentDayIndex: number;
  projection: ProjectionModelResult;
  isMetricInAdults: boolean;
  selectedMonthDay: string;
}

interface StreamFlowItem {
  id: string;
  name: string;
  shortName: string;
  sharePct: number;
  color: string;
  darkColor: string;
  peakWindow: string;
  region: string;
  desc: string;
  rank: number;
  peakDayIdx: number;
  spread: number;
  status?: string;
  avgTotalAdults?: number;
}

// 7 authentic tributary streams with distinct, high-contrast accessible colors
const TRIBUTARY_FLOWS: StreamFlowItem[] = [
  {
    id: 'bulkley-morice',
    name: 'Bulkley / Morice River',
    shortName: 'Bulkley / Morice',
    sharePct: 44.0,
    color: '#D97706', // Warm Amber
    darkColor: '#B45309',
    peakWindow: 'Late Aug – Mid Sep',
    region: 'Bulkley Valley & Houston',
    desc: 'The watershed’s primary wild steelhead engine. Accounts for ~44% of total Skeena adult escapement.',
    rank: 1,
    peakDayIdx: 68, // Aug 17
    spread: 28,
    status: 'Dominant Engine',
  },
  {
    id: 'babine',
    name: 'Babine River',
    shortName: 'Babine',
    sharePct: 22.0,
    color: '#0D9488', // Deep Spruce Teal
    darkColor: '#0F766E',
    peakWindow: 'Late Aug – Early Oct',
    region: 'Upper Skeena / Nilkitkwa',
    desc: 'Home to world-renowned trophy summer wild fish, monitored at the historic Babine Lake counting weir.',
    rank: 2,
    peakDayIdx: 72, // Aug 21
    spread: 32,
    status: 'Trophy Strain',
  },
  {
    id: 'kispiox',
    name: 'Kispiox River',
    shortName: 'Kispiox',
    sharePct: 14.0,
    color: '#E11D48', // Rich Terracotta Crimson
    darkColor: '#BE123C',
    peakWindow: 'Mid Aug – Late Sep',
    region: 'Hazelton / Kispiox Valley',
    desc: 'Celebrated for legendary heavy-bodied wild steelhead. Highly sensitive to autumn rain freshets.',
    rank: 3,
    peakDayIdx: 64, // Aug 13
    spread: 26,
    status: 'World Renowned',
  },
  {
    id: 'zymoetz',
    name: 'Zymoetz (Copper) River',
    shortName: 'Zymoetz (Copper)',
    sharePct: 8.5,
    color: '#0284C7', // Glacial River Blue
    darkColor: '#0369A1',
    peakWindow: 'Early Aug – Mid Sep',
    region: 'Terrace / Coast Mountains',
    desc: 'Glacial lower-Skeena canyon river supporting distinct early summer and late summer migration pulses.',
    rank: 4,
    peakDayIdx: 58, // Aug 07
    spread: 24,
    status: 'Glacial Run',
  },
  {
    id: 'sustut',
    name: 'Sustut River',
    shortName: 'Sustut',
    sharePct: 4.5,
    color: '#8B5CF6', // Headwater Violet
    darkColor: '#7C3AED',
    peakWindow: 'Late Jul – Late Aug',
    region: 'Upper Skeena Wilderness',
    desc: 'High-elevation wilderness stock; the earliest summer arrivals in the upper river headwaters.',
    rank: 5,
    peakDayIdx: 52, // Aug 01
    spread: 22,
    status: 'Early Arrival',
  },
  {
    id: 'kalum',
    name: 'Kalum (Kitsumkalum)',
    shortName: 'Kalum',
    sharePct: 4.0,
    color: '#475569', // Deep Slate
    darkColor: '#334155',
    peakWindow: 'Year-round / Aug Surge',
    region: 'Terrace / Kalum Lake',
    desc: 'Deep lake-headed tributary with unique dual summer and spring winter-run life histories.',
    rank: 6,
    peakDayIdx: 60, // Aug 09
    spread: 30,
    status: 'Dual Season',
  },
  {
    id: 'upper-skeena',
    name: 'Upper Skeena & Tributaries',
    shortName: 'Upper Skeena Tribs',
    sharePct: 3.0,
    color: '#CA8A04', // Raw Ochre / Gold
    darkColor: '#A16207',
    peakWindow: 'Mid Aug – Late Sep',
    region: 'Kitwanga, Shegunia, Bear',
    desc: 'Includes Kitwanga, Shegunia, Bear River, and remote headwater gravels across Gitxsan territories.',
    rank: 7,
    peakDayIdx: 66, // Aug 15
    spread: 25,
    status: 'Wild Headwaters',
  },
];

// Historical Eras Flow data with biological run timing profiles
const DECADE_FLOWS: StreamFlowItem[] = [
  {
    id: '1980s',
    name: '1980s Golden Era',
    shortName: '1980s Peak',
    sharePct: 28.0,
    color: '#D97706',
    darkColor: '#B45309',
    rank: 1,
    peakDayIdx: 66, // Aug 15
    spread: 32,
    avgTotalAdults: 48500,
    peakWindow: 'Aug 08 – Aug 28',
    region: 'All-Time Record Abundance Era',
    desc: 'The historic golden era of wild steelhead returns with multi-peak summer surges exceeding 48,000 adult returns.',
    status: 'Historic High',
  },
  {
    id: '2000s',
    name: '2000s Strong Millennial Cycles',
    shortName: '2000s Strong',
    sharePct: 22.5,
    color: '#0D9488',
    darkColor: '#0F766E',
    rank: 2,
    peakDayIdx: 67, // Aug 16
    spread: 30,
    avgTotalAdults: 39400,
    peakWindow: 'Aug 12 – Aug 28',
    region: 'Banner Millennial Returns',
    desc: 'Consistently resilient runs featuring notable banner escapement years in 2004 and 2008.',
    status: 'Healthy Peak',
  },
  {
    id: '1970s',
    name: '1970s Historical Baseline',
    shortName: '1970s Baseline',
    sharePct: 19.5,
    color: '#0284C7',
    darkColor: '#0369A1',
    rank: 3,
    peakDayIdx: 64, // Aug 13
    spread: 28,
    avgTotalAdults: 34200,
    peakWindow: 'Aug 10 – Aug 25',
    region: 'Mid-Century Telemetry Baseline',
    desc: 'Stable historical baseline with strong early and mid-season returns across all mainstem Skeena tributaries.',
    status: 'Baseline Steady',
  },
  {
    id: '1990s',
    name: '1990s Post-Boom Average',
    shortName: '1990s Average',
    sharePct: 18.0,
    color: '#8B5CF6',
    darkColor: '#7C3AED',
    rank: 4,
    peakDayIdx: 65, // Aug 14
    spread: 27,
    avgTotalAdults: 32800,
    peakWindow: 'Aug 10 – Aug 24',
    region: 'Post-Boom Transition Period',
    desc: 'Moderate returns characterized by healthy Bulkley escapement but early signs of marine survival shifts.',
    status: 'Moderate',
  },
  {
    id: '2010s',
    name: '2010s Volatile "Blob" Era',
    shortName: '2010s Warming',
    sharePct: 7.0,
    color: '#E11D48',
    darkColor: '#BE123C',
    rank: 5,
    peakDayIdx: 63, // Aug 12
    spread: 24,
    avgTotalAdults: 24600,
    peakWindow: 'Aug 06 – Aug 20',
    region: 'Marine Heatwave Variability',
    desc: 'Marked by extreme Northeast Pacific marine heatwaves, compressed migration windows, and heightened climate volatility.',
    status: 'Marine Heatwaves',
  },
  {
    id: '2020s',
    name: '2020–2025 Conservation Low',
    shortName: '2020–25 Low',
    sharePct: 5.0,
    color: '#475569',
    darkColor: '#334155',
    rank: 6,
    peakDayIdx: 61, // Aug 10
    spread: 20,
    avgTotalAdults: 18100,
    peakWindow: 'Aug 04 – Aug 18',
    region: 'Emergency Closures & Protection',
    desc: 'Severe conservation concern leading to recreational emergency closures and enhanced province-wide conservation measures.',
    status: 'Depressed',
  },
];

export const SkeenaAlluvialStream: React.FC<SkeenaAlluvialStreamProps> = ({
  currentDayIndex,
  projection,
  isMetricInAdults,
  selectedMonthDay,
}) => {
  const [activeFlowMode, setActiveFlowMode] = useState<'tributary' | 'decade'>('tributary');
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [hoveredStreamId, setHoveredStreamId] = useState<string | null>(null);

  // Active highlighted stream (hover or click selection)
  const activeFocusId = hoveredStreamId || selectedStreamId;

  // Responsive milestone points along the timeline (x-axis)
  const timelineMilestones = [
    { label: 'JUN 10', dayIdx: 0, desc: 'Run Entry' },
    { label: 'JUL 01', dayIdx: 21, desc: 'Early Pulses' },
    { label: 'JUL 15', dayIdx: 35, desc: 'Sustut Peak' },
    { label: 'AUG 01', dayIdx: 52, desc: 'Run Surge' },
    { label: 'AUG 14', dayIdx: 65, desc: 'Historical Peak' },
    { label: 'AUG 30', dayIdx: 81, desc: 'Bulkley Core' },
    { label: 'SEP 15', dayIdx: 97, desc: 'Autumn Tail' },
    { label: 'SEP 30', dayIdx: 112, desc: 'Season Close' },
  ];

  // SVG Responsive Coordinates
  const svgWidth = 960;
  const svgHeight = 340;
  const margin = { top: 32, right: 24, bottom: 36, left: 24 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  // Active projection totals
  const totalProjectedAdults = projection.projectedBaselineAdults;
  const currentCumulativeAdults = Math.round(projection.currentCumulative * ADULT_EXPANSION_FACTOR);

  // Compute smooth flow ribbons across the season days
  const flowRibbons = useMemo(() => {
    const numDays = SEASON_DAYS.length;
    const dailyStacks: { [key: string]: number[] } = {};

    const gaussian = (x: number, mean: number, sigma: number) => {
      const diff = x - mean;
      return Math.exp(-(diff * diff) / (2 * sigma * sigma));
    };

    const activeStreamSource = activeFlowMode === 'tributary' ? TRIBUTARY_FLOWS : DECADE_FLOWS;

    activeStreamSource.forEach((stream) => {
      dailyStacks[stream.id] = [];
      for (let d = 0; d < numDays; d++) {
        const rawIntensity = gaussian(d, stream.peakDayIdx, stream.spread);
        dailyStacks[stream.id].push(rawIntensity * (stream.sharePct / 100));
      }
    });

    const numSteps = 28;
    const sampleIndices = Array.from({ length: numSteps }, (_, i) =>
      Math.round((i / (numSteps - 1)) * (numDays - 1))
    );

    const stackTotals: number[] = sampleIndices.map((dIdx) => {
      let sum = 0;
      activeStreamSource.forEach((stream) => {
        sum += dailyStacks[stream.id][dIdx];
      });
      return sum;
    });

    const maxStack = Math.max(...stackTotals, 0.001);

    const ribbonPaths: (StreamFlowItem & {
      pathD: string;
      currentEstAdults: number;
      projectedTotalAdults: number;
      apexPoint: { x: number; y: number };
    })[] = [];

    let currentBaselineY: number[] = sampleIndices.map(() => 0);

    activeStreamSource.forEach((stream) => {
      const topPoints: { x: number; y: number }[] = [];
      const bottomPoints: { x: number; y: number }[] = [];
      let maxStreamY = 0;
      let apexPoint = { x: margin.left + chartWidth / 2, y: margin.top + chartHeight / 2 };

      sampleIndices.forEach((dIdx, stepIdx) => {
        const x = margin.left + (stepIdx / (numSteps - 1)) * chartWidth;
        const streamVal = dailyStacks[stream.id][dIdx];
        const normalizedHeight = (streamVal / maxStack) * chartHeight * 0.94;

        const yBottom = margin.top + chartHeight - (currentBaselineY[stepIdx] / maxStack) * chartHeight * 0.94;
        const yTop = yBottom - normalizedHeight;

        bottomPoints.push({ x, y: yBottom });
        topPoints.push({ x, y: yTop });

        if (normalizedHeight > maxStreamY) {
          maxStreamY = normalizedHeight;
          apexPoint = { x, y: (yTop + yBottom) / 2 };
        }

        currentBaselineY[stepIdx] += streamVal;
      });

      let dStr = `M ${topPoints[0].x} ${topPoints[0].y}`;

      for (let i = 0; i < topPoints.length - 1; i++) {
        const p0 = topPoints[i];
        const p1 = topPoints[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 2;
        const cpX2 = p0.x + (p1.x - p0.x) / 2;
        dStr += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
      }

      const lastBottom = bottomPoints[bottomPoints.length - 1];
      dStr += ` L ${lastBottom.x} ${lastBottom.y}`;

      for (let i = bottomPoints.length - 1; i > 0; i--) {
        const p0 = bottomPoints[i];
        const p1 = bottomPoints[i - 1];
        const cpX1 = p0.x - (p0.x - p1.x) / 2;
        const cpX2 = p0.x - (p0.x - p1.x) / 2;
        dStr += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
      }

      dStr += ' Z';

      const projectedTotalAdults =
        typeof stream.avgTotalAdults === 'number'
          ? stream.avgTotalAdults
          : Math.round(totalProjectedAdults * (stream.sharePct / 100));

      const currentEstAdults =
        typeof stream.avgTotalAdults === 'number'
          ? Math.round(stream.avgTotalAdults * (Math.min(currentDayIndex + 1, SEASON_DAYS.length) / SEASON_DAYS.length))
          : Math.round(currentCumulativeAdults * (stream.sharePct / 100));

      ribbonPaths.push({
        ...stream,
        pathD: dStr,
        currentEstAdults,
        projectedTotalAdults,
        apexPoint,
      });
    });

    return ribbonPaths;
  }, [activeFlowMode, totalProjectedAdults, currentCumulativeAdults, currentDayIndex, chartHeight, chartWidth, margin.left, margin.top]);

  // Current scrubber X position on SVG
  const currentScrubberX = useMemo(() => {
    return margin.left + (currentDayIndex / (SEASON_DAYS.length - 1)) * chartWidth;
  }, [currentDayIndex, chartWidth, margin.left]);

  // Selected or hovered stream record for the deep-dive drawer
  const activeFocusData = useMemo(() => {
    if (activeFocusId) {
      const matched = flowRibbons.find((r) => r.id === activeFocusId);
      if (matched) return matched;
    }
    return flowRibbons[0];
  }, [activeFocusId, flowRibbons]);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-sm overflow-hidden transition-colors duration-200">
      {/* 1. COMPONENT HEADER & CONTROLS */}
      <div className="p-4 sm:p-6 border-b border-[var(--border-main)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)]">
                <Waves className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] tracking-wide">
                Skeena Watershed Alluvial Migration Stream
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              Estimated seasonal escapement velocity &amp; sub-basin stock dispersal over time (Jun 10 &ndash; Sep 30).
            </p>
          </div>

          {/* Mode Switcher & Metric Unit Pill */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <div className="flex items-center bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-main)] font-mono text-xs shadow-inner">
              <button
                onClick={() => {
                  setActiveFlowMode('tributary');
                  setSelectedStreamId(null);
                }}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeFlowMode === 'tributary'
                    ? 'bg-[var(--accent-amber)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tributary Streams</span>
              </button>
              <button
                onClick={() => {
                  setActiveFlowMode('decade');
                  setSelectedStreamId(null);
                }}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  activeFlowMode === 'decade'
                    ? 'bg-[var(--accent-amber)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Decade Eras</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status bar pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-[11px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--text-muted)]">Active Model:</span>
            <span className="font-bold text-[var(--text-main)]">
              {activeFlowMode === 'tributary' ? '7 Key Sub-Basin Stocks' : '6 Historical Eras (1970–2025)'}
            </span>
            <span className="text-[var(--border-main)] hidden sm:inline">&bull;</span>
            <span className="text-[var(--accent-amber)] hidden sm:inline">
              {isMetricInAdults ? 'Metric: Adult Steelhead (220×)' : 'Metric: Tyee Index Points'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">Scrubber Date:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent-amber-light)] text-[var(--accent-amber)] font-bold border border-[var(--accent-amber-border)]">
              {selectedMonthDay} (Day {currentDayIndex + 1}/113)
            </span>
          </div>
        </div>
      </div>

      {/* 2. RESPONSIVE ALLUVIAL FLOW CANVAS */}
      <div className="p-3 sm:p-5">
        <div className="relative border border-[var(--border-main)] rounded-xl bg-[var(--bg-card)] overflow-hidden shadow-inner">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto block select-none"
            style={{ shapeRendering: 'geometricPrecision' }}
          >
            <defs>
              {/* Subtle background grid pattern */}
              <pattern id="alluvial-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-[var(--border-main)] opacity-30"
                />
              </pattern>

              {/* Linear gradients for each ribbon flow */}
              {flowRibbons.map((stream) => (
                <linearGradient
                  key={`alluvial-grad-${stream.id}`}
                  id={`alluvial-grad-${stream.id}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor={stream.color} stopOpacity="0.75" />
                  <stop offset="50%" stopColor={stream.color} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={stream.darkColor} stopOpacity="0.85" />
                </linearGradient>
              ))}
            </defs>

            {/* Background Grid */}
            <rect width={svgWidth} height={svgHeight} fill="url(#alluvial-grid)" />

            {/* Timeline Vertical Guidelines & Milestone Markers */}
            {timelineMilestones.map((milestone) => {
              const xPos = margin.left + (milestone.dayIdx / (SEASON_DAYS.length - 1)) * chartWidth;
              const isPassed = currentDayIndex >= milestone.dayIdx;

              return (
                <g key={milestone.label} transform={`translate(${xPos}, 0)`}>
                  {/* Vertical dashed guideline */}
                  <line
                    x1="0"
                    y1={margin.top}
                    x2="0"
                    y2={chartHeight + margin.top}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="2,3"
                    className="text-[var(--border-main)] opacity-50"
                  />

                  {/* Top milestone capsule badge */}
                  <rect
                    x="-22"
                    y="8"
                    width="44"
                    height="16"
                    rx="8"
                    fill={isPassed ? 'var(--accent-amber)' : 'currentColor'}
                    className={`transition-colors ${isPassed ? '' : 'text-[var(--bg-subtle)] border border-[var(--border-main)]'}`}
                  />
                  <text
                    x="0"
                    y="19"
                    fill={isPassed ? '#ffffff' : 'var(--text-muted)'}
                    fontSize="8.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {milestone.label}
                  </text>
                </g>
              );
            })}

            {/* Alluvial Flow Ribbons */}
            <g>
              {flowRibbons.map((ribbon) => {
                const isSelected = selectedStreamId === ribbon.id;
                const isHovered = hoveredStreamId === ribbon.id;
                const isFocused = isSelected || isHovered;
                const isAnyFocused = activeFocusId !== null;

                return (
                  <g
                    key={`ribbon-${ribbon.id}`}
                    onMouseEnter={() => setHoveredStreamId(ribbon.id)}
                    onMouseLeave={() => setHoveredStreamId(null)}
                    onClick={() => {
                      setSelectedStreamId(selectedStreamId === ribbon.id ? null : ribbon.id);
                    }}
                    className="cursor-pointer"
                  >
                    <path
                      d={ribbon.pathD}
                      fill={`url(#alluvial-grad-${ribbon.id})`}
                      stroke={isFocused ? '#ffffff' : ribbon.darkColor}
                      strokeWidth={isFocused ? 2.5 : 0.75}
                      opacity={isAnyFocused && !isFocused ? 0.25 : 0.92}
                      className="transition-all duration-200"
                    />

                    {/* Milestone Rank Indicator Badge on Ribbon Apex */}
                    <g
                      transform={`translate(${ribbon.apexPoint.x}, ${ribbon.apexPoint.y})`}
                      opacity={isAnyFocused && !isFocused ? 0.3 : 1}
                      className="transition-opacity duration-200"
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="8"
                        fill="var(--bg-surface)"
                        stroke={ribbon.color}
                        strokeWidth="2"
                        className="shadow-sm"
                      />
                      <text
                        x="0"
                        y="3"
                        fill="var(--text-main)"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {ribbon.rank}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>

            {/* Current Scrubber Vertical Date Line */}
            <g transform={`translate(${currentScrubberX}, 0)`}>
              <line
                x1="0"
                y1={margin.top - 4}
                x2="0"
                y2={chartHeight + margin.top + 6}
                stroke="var(--accent-amber)"
                strokeWidth="2.5"
                strokeDasharray="4,2"
              />
              {/* Top Scrubber Date Badge */}
              <rect
                x="-32"
                y={margin.top - 20}
                width="64"
                height="18"
                rx="6"
                fill="var(--accent-amber)"
                className="shadow-md"
              />
              <text
                x="0"
                y={margin.top - 8}
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {selectedMonthDay}
              </text>
              {/* Bottom anchor pin */}
              <circle
                cx="0"
                cy={chartHeight + margin.top + 4}
                r="4.5"
                fill="var(--accent-amber)"
                stroke="#ffffff"
                strokeWidth="1"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* 3. RESPONSIVE TOUCH-FRIENDLY TRIBUTARY SELECTION CHIPS */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            {activeFlowMode === 'tributary' ? 'Tributary Sub-Basin Streams' : 'Historical Era Profiles'}
          </span>
          {selectedStreamId && (
            <button
              onClick={() => setSelectedStreamId(null)}
              className="text-[11px] font-mono text-[var(--accent-amber)] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Show All Streams</span>
            </button>
          )}
        </div>

        {/* Responsive Grid of Tributary Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {flowRibbons.map((stream) => {
            const isSelected = selectedStreamId === stream.id;
            const isHovered = hoveredStreamId === stream.id;
            const isFocused = isSelected || isHovered;

            return (
              <button
                key={stream.id}
                onClick={() => setSelectedStreamId(isSelected ? null : stream.id)}
                onMouseEnter={() => setHoveredStreamId(stream.id)}
                onMouseLeave={() => setHoveredStreamId(null)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  isFocused
                    ? 'bg-[var(--accent-amber-light)] border-[var(--accent-amber-border)] shadow-sm scale-[1.02]'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--border-highlight)]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: stream.color }}
                    />
                    <span className="font-mono text-xs font-bold text-[var(--text-main)] truncate">
                      {stream.shortName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[var(--accent-amber)]">
                    {stream.sharePct}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] border-t border-[var(--border-main)] pt-1">
                  <span>Rank #{stream.rank}</span>
                  <span className="font-bold text-[var(--text-secondary)] truncate">
                    {isMetricInAdults
                      ? `${(stream.projectedTotalAdults / 1000).toFixed(1)}k fish`
                      : `${(stream.projectedTotalAdults / ADULT_EXPANSION_FACTOR).toFixed(0)} pts`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ACTIVE STREAM SPOTLIGHT / TELEMETRY DRAWER */}
      {activeFocusData && (
        <div className="bg-[var(--bg-card)] border-t border-[var(--border-main)] p-4 sm:p-6 transition-all animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* River Identity & Region */}
            <div className="lg:col-span-5 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="w-3.5 h-3.5 rounded-full shadow-sm"
                  style={{ backgroundColor: activeFocusData.color }}
                />
                <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)]">
                  {activeFocusData.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] text-[var(--accent-amber)] font-mono font-bold">
                  {activeFocusData.status || `Rank #${activeFocusData.rank}`} &bull; {activeFocusData.sharePct}% of Run
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--accent-amber)] font-mono">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{activeFocusData.region}</span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed pt-1">
                {activeFocusData.desc}
              </p>
            </div>

            {/* Live Escapement Metrics */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-[var(--border-main)] pt-3 lg:pt-0 lg:pl-6 font-mono">
              {/* Est Fish Passed by Date */}
              <div className="bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-main)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-wider">
                  Passed by {selectedMonthDay}
                </span>
                <span className="text-sm sm:text-base font-extrabold text-[var(--text-main)] block">
                  {isMetricInAdults
                    ? `${activeFocusData.currentEstAdults.toLocaleString()} fish`
                    : `${(activeFocusData.currentEstAdults / ADULT_EXPANSION_FACTOR).toFixed(1)} pts`}
                </span>
                <span className="text-[10px] text-[var(--accent-amber)] block">
                  {((activeFocusData.currentEstAdults / Math.max(1, activeFocusData.projectedTotalAdults)) * 100).toFixed(0)}% of stock return
                </span>
              </div>

              {/* Projected Season Return */}
              <div className="bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-main)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-wider">
                  Projected Total Return
                </span>
                <span className="text-sm sm:text-base font-extrabold text-[var(--accent-amber)] block">
                  {isMetricInAdults
                    ? `${activeFocusData.projectedTotalAdults.toLocaleString()} fish`
                    : `${(activeFocusData.projectedTotalAdults / ADULT_EXPANSION_FACTOR).toFixed(1)} pts`}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  {activeFocusData.sharePct}% sub-basin share
                </span>
              </div>

              {/* Main River Peak Timing */}
              <div className="bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-main)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase tracking-wider">
                  Peak Run Timing
                </span>
                <span className="text-xs sm:text-sm font-bold text-[var(--text-main)] block truncate">
                  {activeFocusData.peakWindow}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Apex: Aug {Math.max(1, activeFocusData.peakDayIdx - 51)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. FOOTNOTE & CITATION */}
      <div className="p-3 sm:px-6 bg-[var(--bg-subtle)] border-t border-[var(--border-main)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-[var(--text-muted)] font-mono">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[var(--accent-amber)] shrink-0" />
          <span>
            Telemetry synthesized from DFO Tyee Test Fishery (1956–2026), mark-recapture studies, &amp; Gitxsan/Wet&rsquo;suwet&rsquo;en watershed monitoring.
          </span>
        </div>
        <span className="shrink-0 text-[var(--accent-amber)] font-bold">
          SKEENA ALLUVIAL DISPERSAL v2.0
        </span>
      </div>
    </div>
  );
};
