import React, { useState, useMemo } from 'react';
import {
  SEASON_DAYS,
  CURRENT_YEAR,
  ADULT_EXPANSION_FACTOR,
  SKEENA_TRIBUTARY_BASELINES,
} from '../data/historicalData';
import { ProjectionModelResult } from '../types/steelhead';
import {
  Fish,
  Layers,
  Calendar,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Flame,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface SkeenaAlluvialStreamProps {
  currentDayIndex: number;
  projection: ProjectionModelResult;
  isMetricInAdults: boolean;
  selectedMonthDay: string;
}

// 7 tributary streams with authentic aesthetic colors matching the infographic
const TRIBUTARY_FLOWS = [
  {
    id: 'bulkley-morice',
    name: 'Bulkley / Morice',
    shortName: 'Bulkley / Morice',
    sharePct: 44.0,
    color: '#D09B42', // Ochre Amber
    darkColor: '#B67F28',
    peakWindow: 'Late Aug - Mid Sep',
    region: 'Bulkley Valley & Houston',
    desc: 'The watershed’s primary steelhead engine. Holds ~44% of total Skeena escapement.',
    rank: 1,
    startOffsetPct: 0.05,
    peakDayIdx: 68, // Aug 17
    spread: 28,
  },
  {
    id: 'babine',
    name: 'Babine',
    shortName: 'Babine',
    sharePct: 22.0,
    color: '#366D5E', // Deep Spruce
    darkColor: '#285347',
    peakWindow: 'Late Aug - Early Oct',
    region: 'Upper Skeena / Nilkitkwa',
    desc: 'Home to the legendary trophy summer strain. Monitored at the Babine Lake counting weir.',
    rank: 2,
    startOffsetPct: 0.12,
    peakDayIdx: 72, // Aug 21
    spread: 32,
  },
  {
    id: 'kispiox',
    name: 'Kispiox',
    shortName: 'Kispiox',
    sharePct: 14.0,
    color: '#C1624F', // Terracotta Rust
    darkColor: '#A54937',
    peakWindow: 'Mid Aug - Late Sep',
    region: 'Hazelton / Kispiox Valley',
    desc: 'World-renowned for heavy-bodied wild fish. High sensitivity to autumn freshets.',
    rank: 3,
    startOffsetPct: 0.1,
    peakDayIdx: 64, // Aug 13
    spread: 26,
  },
  {
    id: 'zymoetz',
    name: 'Zymoetz (Copper)',
    shortName: 'Zymoetz (Copper)',
    sharePct: 8.5,
    color: '#4E9A92', // Glacial Teal
    darkColor: '#3A7C75',
    peakWindow: 'Early Aug - Mid Sep',
    region: 'Terrace / Coast Range',
    desc: 'Glacial lower-Skeena tributary supporting distinct early summer and late summer runs.',
    rank: 4,
    startOffsetPct: 0.04,
    peakDayIdx: 58, // Aug 07
    spread: 24,
  },
  {
    id: 'sustut',
    name: 'Sustut',
    shortName: 'Sustut',
    sharePct: 4.5,
    color: '#7E7497', // Dusk Lavender
    darkColor: '#63597D',
    peakWindow: 'Late Jul - Late Aug',
    region: 'Upper Skeena Wilderness',
    desc: 'High-elevation pristine wilderness stock; earliest arrival in the upper basin.',
    rank: 5,
    startOffsetPct: 0.02,
    peakDayIdx: 52, // Aug 01
    spread: 22,
  },
  {
    id: 'kalum',
    name: 'Kalum',
    shortName: 'Kalum',
    sharePct: 4.0,
    color: '#3E5C76', // Deep Marine Slate
    darkColor: '#2C4459',
    peakWindow: 'Year-round / Aug Peak',
    region: 'Terrace / Kalum Lake',
    desc: 'Deep glacial lake-headed system supporting both summer and spring winter steelhead runs.',
    rank: 6,
    startOffsetPct: 0.08,
    peakDayIdx: 60, // Aug 09
    spread: 30,
  },
  {
    id: 'upper-skeena',
    name: 'Upper Skeena & Tribs',
    shortName: 'Upper Skeena & Tribs',
    sharePct: 3.0,
    color: '#CBB58C', // Warm Sand / Raw Ochre
    darkColor: '#AE9669',
    peakWindow: 'Mid Aug - Sep',
    region: 'Kitwanga, Shegunia, Bear',
    desc: 'Kitwanga River, Shegunia, Bear River, and remote wild headwater spawning gravels.',
    rank: 7,
    startOffsetPct: 0.15,
    peakDayIdx: 66, // Aug 15
    spread: 25,
  },
];

// Historical Eras Flow data with run timing profiles
const DECADE_FLOWS = [
  {
    id: '1970s',
    name: '1970s Baseline',
    shortName: '1970s',
    sharePct: 17.5,
    color: '#4E9A92',
    darkColor: '#3A7C75',
    rank: 4,
    peakDayIdx: 64, // Aug 13
    spread: 28,
    avgTotalAdults: 34200,
    peakWindow: 'Aug 10 - Aug 25',
    region: 'Historical Mid-Century Baseline',
    desc: 'Stable historical baseline with strong early and mid-season returns across all mainstem Skeena tribs.',
  },
  {
    id: '1980s',
    name: '1980s Peak Boom',
    shortName: '1980s',
    sharePct: 25.0,
    color: '#D09B42',
    darkColor: '#B67F28',
    rank: 1,
    peakDayIdx: 66, // Aug 15
    spread: 32,
    avgTotalAdults: 48500,
    peakWindow: 'Aug 08 - Aug 28',
    region: 'All-Time Record Abundance Era',
    desc: 'Golden era of Skeena wild steelhead abundance with multi-peak summer surges exceeding 48,000 adult returns.',
  },
  {
    id: '1990s',
    name: '1990s Average Era',
    shortName: '1990s',
    sharePct: 17.0,
    color: '#366D5E',
    darkColor: '#285347',
    rank: 5,
    peakDayIdx: 65, // Aug 14
    spread: 27,
    avgTotalAdults: 32800,
    peakWindow: 'Aug 10 - Aug 24',
    region: 'Steady Post-Boom Transition',
    desc: 'Moderate runs characterized by healthy Bulkley escapement but early signs of marine survival shifts.',
  },
  {
    id: '2000s',
    name: '2000s Strong Era',
    shortName: '2000s',
    sharePct: 20.5,
    color: '#C1624F',
    darkColor: '#A54937',
    rank: 2,
    peakDayIdx: 67, // Aug 16
    spread: 30,
    avgTotalAdults: 39400,
    peakWindow: 'Aug 12 - Aug 28',
    region: 'Resilient Millennial Cycles',
    desc: 'Consistently strong returns featuring notable banner escapement years in 2004 and 2008.',
  },
  {
    id: '2010s',
    name: '2010s Volatile Era',
    shortName: '2010s',
    sharePct: 12.5,
    color: '#7E7497',
    darkColor: '#63597D',
    rank: 6,
    peakDayIdx: 63, // Aug 12
    spread: 24,
    avgTotalAdults: 24600,
    peakWindow: 'Aug 06 - Aug 20',
    region: 'Warming Ocean "Blob" Era',
    desc: 'Marked by extreme marine heatwaves, compressed migration windows, and heightened climate variability.',
  },
  {
    id: '2020s',
    name: '2020–2025 Depression',
    shortName: '2020-25',
    sharePct: 7.5,
    color: '#3E5C76',
    darkColor: '#2C4459',
    rank: 7,
    peakDayIdx: 61, // Aug 10
    spread: 20,
    avgTotalAdults: 18100,
    peakWindow: 'Aug 04 - Aug 18',
    region: 'Historic Low Escapement & Closures',
    desc: 'Severe conservation concern leading to recreational emergency closures and enhanced conservation measures.',
  },
];

export const SkeenaAlluvialStream: React.FC<SkeenaAlluvialStreamProps> = ({
  currentDayIndex,
  projection,
  isMetricInAdults,
  selectedMonthDay,
}) => {
  const [activeFlowMode, setActiveFlowMode] = useState<'tributary' | 'decade'>('tributary');
  const [hoveredTributary, setHoveredTributary] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Milestone points along the timeline (x-axis)
  const timelineMilestones = [
    { label: 'JUN 10', dayIdx: 0, desc: 'Run Initiation' },
    { label: 'JUL 01', dayIdx: 21, desc: 'Early Pulses' },
    { label: 'JUL 15', dayIdx: 35, desc: 'Sustut Peak' },
    { label: 'AUG 01', dayIdx: 52, desc: 'Run Surge' },
    { label: 'AUG 14', dayIdx: 65, desc: 'Historical Apex' },
    { label: 'AUG 30', dayIdx: 81, desc: 'Bulkley Core' },
    { label: 'SEP 15', dayIdx: 97, desc: 'Autumn Tail' },
    { label: 'SEP 30', dayIdx: 112, desc: 'Season Close' },
  ];

  // SVG Coordinates
  const svgWidth = 1040;
  const svgHeight = 420;
  const margin = { top: 40, right: 36, bottom: 40, left: 240 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  // Active projection values
  const totalProjectedAdults = projection.projectedBaselineAdults;
  const currentCumulativeAdults = Math.round(projection.currentCumulative * ADULT_EXPANSION_FACTOR);

  // Compute flow ribbon geometries across the 113 season days based on active flow mode
  const flowRibbons = useMemo(() => {
    const numDays = SEASON_DAYS.length;
    const dailyStacks: { [key: string]: number[] } = {};

    // Gaussian bell distribution helper for natural biological run timing
    const gaussian = (x: number, mean: number, sigma: number) => {
      const diff = x - mean;
      return Math.exp(-(diff * diff) / (2 * sigma * sigma));
    };

    const activeStreamSource = activeFlowMode === 'tributary' ? TRIBUTARY_FLOWS : DECADE_FLOWS;

    // Calculate daily flow intensity for each stream / era
    activeStreamSource.forEach((stream) => {
      dailyStacks[stream.id] = [];
      for (let d = 0; d < numDays; d++) {
        const rawIntensity = gaussian(d, stream.peakDayIdx, stream.spread);
        dailyStacks[stream.id].push(rawIntensity * (stream.sharePct / 100));
      }
    });

    // Compute stacked ribbons along timeline
    const numSteps = 24; // sampling intervals for super smooth bezier curves
    const sampleIndices = Array.from({ length: numSteps }, (_, i) =>
      Math.round((i / (numSteps - 1)) * (numDays - 1))
    );

    // Calculate total stack height at each sample point
    const stackTotals: number[] = sampleIndices.map((dIdx) => {
      let sum = 0;
      activeStreamSource.forEach((stream) => {
        sum += dailyStacks[stream.id][dIdx];
      });
      return sum;
    });

    const maxStack = Math.max(...stackTotals, 0.001);

    // Calculate upper and lower bounds for each stream
    const ribbonPaths: {
      id: string;
      name: string;
      sharePct: number;
      color: string;
      darkColor: string;
      rank: number;
      pathD: string;
      centerPoints: { x: number; y: number; dIdx: number }[];
      currentEstAdults: number;
      projectedTotalAdults: number;
      region: string;
      desc: string;
      peakWindow: string;
    }[] = [];

    let currentBaselineY: number[] = sampleIndices.map(() => 0);

    activeStreamSource.forEach((stream) => {
      const topPoints: { x: number; y: number }[] = [];
      const bottomPoints: { x: number; y: number }[] = [];
      const centerPoints: { x: number; y: number; dIdx: number }[] = [];

      sampleIndices.forEach((dIdx, stepIdx) => {
        const x = margin.left + (stepIdx / (numSteps - 1)) * chartWidth;
        const streamVal = dailyStacks[stream.id][dIdx];
        const normalizedHeight = (streamVal / maxStack) * chartHeight * 0.92;

        const yBottom = margin.top + chartHeight - (currentBaselineY[stepIdx] / maxStack) * chartHeight * 0.92;
        const yTop = yBottom - normalizedHeight;

        bottomPoints.push({ x, y: yBottom });
        topPoints.push({ x, y: yTop });
        centerPoints.push({ x, y: (yTop + yBottom) / 2, dIdx });

        currentBaselineY[stepIdx] += streamVal;
      });

      // Construct cubic Bezier SVG path (forward top, backward bottom)
      let dStr = `M ${topPoints[0].x} ${topPoints[0].y}`;

      // Smooth top curve
      for (let i = 0; i < topPoints.length - 1; i++) {
        const p0 = topPoints[i];
        const p1 = topPoints[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 2;
        const cpX2 = p0.x + (p1.x - p0.x) / 2;
        dStr += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
      }

      // Line to bottom right
      const lastBottom = bottomPoints[bottomPoints.length - 1];
      dStr += ` L ${lastBottom.x} ${lastBottom.y}`;

      // Smooth bottom curve backward
      for (let i = bottomPoints.length - 1; i > 0; i--) {
        const p0 = bottomPoints[i];
        const p1 = bottomPoints[i - 1];
        const cpX1 = p0.x - (p0.x - p1.x) / 2;
        const cpX2 = p0.x - (p0.x - p1.x) / 2;
        dStr += ` C ${cpX1} ${p0.y}, ${cpX2} ${p1.y}, ${p1.x} ${p1.y}`;
      }

      dStr += ' Z';

      const projectedTotalAdults =
        'avgTotalAdults' in stream && typeof stream.avgTotalAdults === 'number'
          ? stream.avgTotalAdults
          : Math.round(totalProjectedAdults * (stream.sharePct / 100));

      const currentEstAdults =
        'avgTotalAdults' in stream && typeof stream.avgTotalAdults === 'number'
          ? Math.round(stream.avgTotalAdults * (Math.min(currentDayIndex + 1, SEASON_DAYS.length) / SEASON_DAYS.length))
          : Math.round(currentCumulativeAdults * (stream.sharePct / 100));

      ribbonPaths.push({
        id: stream.id,
        name: stream.name,
        sharePct: stream.sharePct,
        color: stream.color,
        darkColor: stream.darkColor,
        rank: stream.rank,
        pathD: dStr,
        centerPoints,
        currentEstAdults,
        projectedTotalAdults,
        region: stream.region,
        desc: stream.desc,
        peakWindow: stream.peakWindow,
      });
    });

    return ribbonPaths;
  }, [activeFlowMode, totalProjectedAdults, currentCumulativeAdults, currentDayIndex, chartHeight, chartWidth, margin.left, margin.top]);

  // Current scrubber X position on SVG
  const currentScrubberX = useMemo(() => {
    return margin.left + (currentDayIndex / (SEASON_DAYS.length - 1)) * chartWidth;
  }, [currentDayIndex, chartWidth, margin.left]);

  const activeHoverData = useMemo(() => {
    if (!hoveredTributary) return null;
    return flowRibbons.find((r) => r.id === hoveredTributary);
  }, [hoveredTributary, flowRibbons]);

  return (
    <div
      className={`bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${
        isExpanded ? 'p-6 lg:p-8 space-y-6' : 'p-4 sm:p-6 space-y-5'
      }`}
    >
      {/* 1. EDITORIAL INFOGRAPHIC MASTHEAD (Directly inspired by Wired Infoporn) */}
      <div className="border-b border-[var(--border-main)] pb-5 space-y-4">
        {/* Top Folio Header Stamp */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] tracking-wider">
          <div className="flex items-center gap-2">
            <span className="stamp-badge stamp-amber">BKLYNFLY FIELD DATA</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline">DFO TYEE ALLUVIAL MIGRATION STREAM</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse Full Width' : 'Expand Editorial View'}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Headline & Multi-Column Magazine Lede Text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Headline */}
          <div className="lg:col-span-5 space-y-1.5">
            <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight uppercase text-[var(--text-main)]">
              Migratory Measurements
            </h2>
            <p className="text-xs sm:text-sm text-[var(--accent-amber)] font-medium leading-snug">
              Estimated seasonal escapement distribution and run timing across major Skeena watershed tributaries.
            </p>
          </div>

          {/* Editorial Column 1 */}
          <div className="lg:col-span-4 text-xs text-[var(--text-secondary)] leading-relaxed space-y-2">
            <p>
              <strong className="font-bold uppercase tracking-wider text-[var(--text-main)] text-[11px] block mb-0.5">
                Run Timing &amp; Distribution
              </strong>
              Steelhead entering the Skeena estuary disperse into distinct sub-basin stocks. Early summer arrivals push toward headwater systems like the Sustut and Babine, while the Bulkley/Morice run forms the primary mid-to-late summer volume.
            </p>
          </div>

          {/* Editorial Column 2 & Mode Switcher */}
          <div className="lg:col-span-3 text-xs text-[var(--text-secondary)] leading-relaxed space-y-3">
            <p className="hidden lg:block">
              Tributary proportions reflect historical watershed baseline averages established through provincial mark-recapture studies, radio telemetry, and tributary counting weirs.
            </p>

            {/* View Mode Pill Switcher */}
            <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-main)] font-mono text-[11px]">
              <button
                onClick={() => setActiveFlowMode('tributary')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                  activeFlowMode === 'tributary'
                    ? 'bg-[var(--accent-amber)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <span>Tributary Streams</span>
              </button>
              <button
                onClick={() => setActiveFlowMode('decade')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                  activeFlowMode === 'decade'
                    ? 'bg-[var(--accent-amber)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <span>Decade Eras</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CAPSULE BADGE AXIS BAR (Inspired by Infographic's POPULATION / HOMICIDES / YEAR Pills) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left Side Capsule Labels */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-black text-white font-bold text-[10px] tracking-wider uppercase shadow-sm">
            WATERSHED SHARE
          </span>
          <span className="px-2.5 py-1 rounded-full bg-black text-white font-bold text-[10px] tracking-wider uppercase shadow-sm">
            ESCAPEMENT VOLUME
          </span>
          <span className="px-2.5 py-1 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-main)] font-semibold text-[10px]">
            {isMetricInAdults ? 'ADULT STEELHEAD (220×)' : 'TYEE CPUE INDEX'}
          </span>
        </div>

        {/* Right Side Date Scrubber Info */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[var(--text-muted)]">Selected Timeline:</span>
          <span className="font-bold text-[var(--accent-amber)] text-sm">{selectedMonthDay}</span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--accent-amber-light)] text-[var(--accent-amber)] font-bold text-[10px] border border-[var(--accent-amber-border)]">
            Day {currentDayIndex + 1}/113
          </span>
        </div>
      </div>

      {/* 3. MAIN ALLUVIAL FLOW CHART CANVAS */}
      <div className="relative border border-[var(--border-main)] rounded-2xl bg-[var(--bg-subtle)] overflow-hidden shadow-inner">
        {/* SVG Stream Visualization */}
        <div className="w-full overflow-x-auto no-scrollbar">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[760px] h-auto block select-none"
            style={{ shapeRendering: 'geometricPrecision' }}
          >
            <defs>
              {/* Subtle background striping pattern */}
              <pattern id="grid-subtle" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[var(--border-main)] opacity-30" />
              </pattern>

              {/* Gradient for ribbons */}
              {(activeFlowMode === 'tributary' ? TRIBUTARY_FLOWS : DECADE_FLOWS).map((t) => (
                <linearGradient key={`grad-${t.id}`} id={`grad-${t.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={t.color} stopOpacity="0.82" />
                  <stop offset="50%" stopColor={t.color} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={t.darkColor} stopOpacity="0.88" />
                </linearGradient>
              ))}
            </defs>

            {/* Background Grid */}
            <rect width={svgWidth} height={svgHeight} fill="url(#grid-subtle)" />

            {/* Top Date Timeline Capsule Nodes (like 2000, 2001, 2002... in the image) */}
            {timelineMilestones.map((milestone) => {
              const xPos = margin.left + (milestone.dayIdx / (SEASON_DAYS.length - 1)) * chartWidth;
              const isPassed = currentDayIndex >= milestone.dayIdx;

              return (
                <g key={milestone.label} transform={`translate(${xPos}, 20)`}>
                  {/* Vertical guideline */}
                  <line
                    x1="0"
                    y1="12"
                    x2="0"
                    y2={chartHeight + margin.top}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="2,3"
                    className="text-[var(--border-main)] opacity-60"
                  />
                  {/* Black capsule pill */}
                  <rect
                    x="-24"
                    y="-12"
                    width="48"
                    height="18"
                    rx="9"
                    fill={isPassed ? '#1c1917' : '#57534e'}
                    className="transition-colors"
                  />
                  <text
                    x="0"
                    y="0"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {milestone.label}
                  </text>
                </g>
              );
            })}

            {/* Dedicated Legend Sidebar Column */}
            <g transform={`translate(8, ${margin.top - 20})`}>
              {/* Column Header */}
              <text
                x="6"
                y="6"
                fill="currentColor"
                fontSize="8.5"
                fontWeight="bold"
                fontFamily="monospace"
                className="text-[var(--text-muted)] uppercase tracking-wider"
              >
                {activeFlowMode === 'tributary' ? 'TRIBUTARY STOCK' : 'HISTORICAL ERA'}
              </text>
              <text
                x="192"
                y="6"
                fill="currentColor"
                fontSize="8.5"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="end"
                className="text-[var(--text-muted)] uppercase tracking-wider"
              >
                {activeFlowMode === 'tributary' ? 'SHARE' : 'AVG TOTAL'}
              </text>

              {/* Vertical Divider Line separating column from the flow chart */}
              <line
                x1="208"
                y1="-4"
                x2="208"
                y2={chartHeight + 24}
                stroke="currentColor"
                strokeWidth="1"
                className="text-[var(--border-main)] opacity-70"
              />

              {flowRibbons.map((ribbon, idx) => {
                const yPos = idx * (chartHeight / flowRibbons.length) + 26;
                const isHovered = hoveredTributary === ribbon.id;
                const isAnyHovered = hoveredTributary !== null;

                return (
                  <g
                    key={`legend-${ribbon.id}`}
                    className="cursor-pointer transition-opacity duration-200"
                    opacity={isAnyHovered && !isHovered ? 0.3 : 1}
                    onMouseEnter={() => setHoveredTributary(ribbon.id)}
                    onMouseLeave={() => setHoveredTributary(null)}
                  >
                    {/* Hover highlight background pill */}
                    {isHovered && (
                      <rect
                        x="0"
                        y={yPos - 12}
                        width="198"
                        height="24"
                        rx="5"
                        fill="currentColor"
                        className="text-[var(--accent-amber)] opacity-10"
                      />
                    )}

                    {/* Rank Circle Badge filled with the tributary infographic color */}
                    <circle cx="12" cy={yPos} r="8.5" fill={ribbon.color} />
                    <text
                      x="12"
                      y={yPos + 3}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {ribbon.rank}
                    </text>

                    {/* Tributary Name */}
                    <text
                      x="28"
                      y={yPos + 3.5}
                      fill="currentColor"
                      fontSize="10.5"
                      fontWeight={isHovered ? 'bold' : '600'}
                      fontFamily="ui-sans-serif, system-ui, -apple-system"
                      className="text-[var(--text-main)]"
                    >
                      {ribbon.name}
                    </text>

                    {/* Percentage share or Avg Total */}
                    <text
                      x="192"
                      y={yPos + 3.5}
                      fill="currentColor"
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="end"
                      className="text-[var(--accent-amber)]"
                    >
                      {activeFlowMode === 'tributary'
                        ? `${ribbon.sharePct}%`
                        : `${(ribbon.projectedTotalAdults / 1000).toFixed(1)}k`}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* ALLUVIAL FLOW STREAM RIBBONS */}
            <g>
              {flowRibbons.map((ribbon) => {
                const isHovered = hoveredTributary === ribbon.id;
                const isAnyHovered = hoveredTributary !== null;

                return (
                  <g
                    key={`flow-${ribbon.id}`}
                    onMouseEnter={() => setHoveredTributary(ribbon.id)}
                    onMouseLeave={() => setHoveredTributary(null)}
                    className="cursor-pointer"
                  >
                    {/* Ribbon Path */}
                    <path
                      d={ribbon.pathD}
                      fill={`url(#grad-${ribbon.id})`}
                      stroke={isHovered ? '#ffffff' : ribbon.darkColor}
                      strokeWidth={isHovered ? 2 : 0.75}
                      opacity={isAnyHovered && !isHovered ? 0.25 : 0.92}
                      className="transition-all duration-200"
                    />

                    {/* Milestone Number Pins on Stream Flow (like the numbered black nodes in the image) */}
                    {ribbon.centerPoints.length > 12 && (
                      <g
                        transform={`translate(${ribbon.centerPoints[12].x}, ${ribbon.centerPoints[12].y})`}
                        opacity={isAnyHovered && !isHovered ? 0.3 : 1}
                      >
                        <circle cx="0" cy="0" r="7" fill="#1c1917" stroke="#ffffff" strokeWidth="1" />
                        <text
                          x="0"
                          y="3"
                          fill="#ffffff"
                          fontSize="8"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {ribbon.rank}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Current Scrubber Vertical Date Line */}
            <g transform={`translate(${currentScrubberX}, 0)`}>
              <line
                x1="0"
                y1={margin.top - 8}
                x2="0"
                y2={chartHeight + margin.top + 8}
                stroke="var(--accent-amber)"
                strokeWidth="2"
                strokeDasharray="4,2"
              />
              {/* Pulsing indicator pill at top */}
              <rect x="-30" y={margin.top - 24} width="60" height="18" rx="6" fill="var(--accent-amber)" />
              <text
                x="0"
                y={margin.top - 12}
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {selectedMonthDay}
              </text>
              <circle cx="0" cy={chartHeight + margin.top + 4} r="4" fill="var(--accent-amber)" />
            </g>

            {/* Bottom-Right Folio Stamp */}
            <g transform={`translate(${svgWidth - 14}, ${svgHeight - 16})`}>
              <text
                x="0"
                y="0"
                fill="currentColor"
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="end"
                className="text-[var(--text-muted)] uppercase tracking-widest opacity-70"
              >
                SKEENA WATERSHED ALLUVIAL FLOW STREAM &bull; DFO TELEMETRY
              </text>
            </g>
          </svg>
        </div>

        {/* 5. INTERACTIVE HOVER / DETAILS DRAWER */}
        {activeHoverData ? (
          <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-main)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: activeHoverData.color }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-extrabold text-sm text-[var(--text-main)]">
                    {activeHoverData.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--accent-amber)] font-bold">
                    Rank #{activeHoverData.rank} &bull; {activeHoverData.sharePct}% of Skeena Run
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">{activeHoverData.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-[var(--border-main)] pt-2 sm:pt-0 sm:pl-4">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Estimated on {selectedMonthDay}</span>
                <span className="font-bold text-sm text-[var(--text-main)]">
                  {isMetricInAdults
                    ? `${activeHoverData.currentEstAdults.toLocaleString()} fish`
                    : `${(activeHoverData.currentEstAdults / ADULT_EXPANSION_FACTOR).toFixed(1)} pts`}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Projected Total Return</span>
                <span className="font-bold text-sm text-[var(--accent-amber)]">
                  {isMetricInAdults
                    ? `${activeHoverData.projectedTotalAdults.toLocaleString()} fish`
                    : `${(activeHoverData.projectedTotalAdults / ADULT_EXPANSION_FACTOR).toFixed(1)} pts`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[var(--bg-surface)] border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              <span>Hover over any tributary ribbon to isolate migration velocity and escapement volume.</span>
            </div>
            <span className="hidden sm:inline text-[11px]">
              Peak Window: <strong className="text-[var(--text-main)]">Aug 10 – Aug 20</strong>
            </span>
          </div>
        )}
      </div>

      {/* 6. EDITORIAL FOOTNOTE & SCIENTIFIC CITATION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--border-main)] pt-3">
        <p>
          Data reconstructed from Fisheries and Oceans Canada (DFO) Tyee Test Fishery telemetry records (1956–2026), in cooperation with BC Ministry of Water, Land and Resource Stewardship and Gitxsan &amp; Wet&rsquo;suwet&rsquo;en watershed monitoring.
        </p>
        <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-[var(--accent-amber)] font-bold">
          FIGURE 4.2 &bull; ALLUVIAL WATERSHED ESCAPEMENT
        </span>
      </div>
    </div>
  );
};
