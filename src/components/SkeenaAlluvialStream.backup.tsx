// BACKUP OF ORIGINAL SKEENA ALLUVIAL STREAM INFOGRAPHIC (BOOKMARK)
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

const TRIBUTARY_FLOWS = [
  {
    id: 'bulkley-morice',
    name: 'Bulkley / Morice',
    shortName: 'Bulkley / Morice',
    sharePct: 44.0,
    color: '#D09B42',
    darkColor: '#B67F28',
    peakWindow: 'Late Aug - Mid Sep',
    region: 'Bulkley Valley & Houston',
    desc: 'The watershed’s primary steelhead engine. Holds ~44% of total Skeena escapement.',
    rank: 1,
    startOffsetPct: 0.05,
    peakDayIdx: 68,
    spread: 28,
  },
  {
    id: 'babine',
    name: 'Babine',
    shortName: 'Babine',
    sharePct: 22.0,
    color: '#366D5E',
    darkColor: '#285347',
    peakWindow: 'Late Aug - Early Oct',
    region: 'Upper Skeena / Nilkitkwa',
    desc: 'Home to the legendary trophy summer strain. Monitored at the Babine Lake counting weir.',
    rank: 2,
    startOffsetPct: 0.12,
    peakDayIdx: 72,
    spread: 32,
  },
  {
    id: 'kispiox',
    name: 'Kispiox',
    shortName: 'Kispiox',
    sharePct: 14.0,
    color: '#C1624F',
    darkColor: '#A54937',
    peakWindow: 'Mid Aug - Late Sep',
    region: 'Hazelton / Kispiox Valley',
    desc: 'World-renowned for heavy-bodied wild fish. High sensitivity to autumn freshets.',
    rank: 3,
    startOffsetPct: 0.1,
    peakDayIdx: 64,
    spread: 26,
  },
  {
    id: 'zymoetz',
    name: 'Zymoetz (Copper)',
    shortName: 'Zymoetz (Copper)',
    sharePct: 8.5,
    color: '#4E9A92',
    darkColor: '#3A7C75',
    peakWindow: 'Early Aug - Mid Sep',
    region: 'Terrace / Coast Range',
    desc: 'Glacial lower-Skeena tributary supporting distinct early summer and late summer runs.',
    rank: 4,
    startOffsetPct: 0.04,
    peakDayIdx: 58,
    spread: 24,
  },
  {
    id: 'sustut',
    name: 'Sustut',
    shortName: 'Sustut',
    sharePct: 4.5,
    color: '#7E7497',
    darkColor: '#63597D',
    peakWindow: 'Late Jul - Late Aug',
    region: 'Upper Skeena Wilderness',
    desc: 'High-elevation pristine wilderness stock; earliest arrival in the upper basin.',
    rank: 5,
    startOffsetPct: 0.02,
    peakDayIdx: 52,
    spread: 22,
  },
  {
    id: 'kalum',
    name: 'Kalum',
    shortName: 'Kalum',
    sharePct: 4.0,
    color: '#3E5C76',
    darkColor: '#2C4459',
    peakWindow: 'Year-round / Aug Peak',
    region: 'Terrace / Kalum Lake',
    desc: 'Deep glacial lake-headed system supporting both summer and spring winter steelhead runs.',
    rank: 6,
    startOffsetPct: 0.08,
    peakDayIdx: 60,
    spread: 30,
  },
  {
    id: 'upper-skeena',
    name: 'Upper Skeena & Tribs',
    shortName: 'Upper Skeena & Tribs',
    sharePct: 3.0,
    color: '#CBB58C',
    darkColor: '#AE9669',
    peakWindow: 'Mid Aug - Sep',
    region: 'Kitwanga, Shegunia, Bear',
    desc: 'Kitwanga River, Shegunia, Bear River, and remote wild headwater spawning gravels.',
    rank: 7,
    startOffsetPct: 0.15,
    peakDayIdx: 66,
    spread: 25,
  },
];

const DECADE_FLOWS = [
  {
    id: '1970s',
    name: '1970s Baseline',
    shortName: '1970s',
    sharePct: 17.5,
    color: '#4E9A92',
    darkColor: '#3A7C75',
    rank: 4,
    peakDayIdx: 64,
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
    peakDayIdx: 66,
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
    peakDayIdx: 65,
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
    peakDayIdx: 67,
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
    peakDayIdx: 63,
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
    peakDayIdx: 61,
    spread: 20,
    avgTotalAdults: 18100,
    peakWindow: 'Aug 04 - Aug 18',
    region: 'Historic Low Escapement & Closures',
    desc: 'Severe conservation concern leading to recreational emergency closures and enhanced conservation measures.',
  },
];

export const SkeenaAlluvialStreamBackup: React.FC<SkeenaAlluvialStreamProps> = ({
  currentDayIndex,
  projection,
  isMetricInAdults,
  selectedMonthDay,
}) => {
  const [activeFlowMode, setActiveFlowMode] = useState<'tributary' | 'decade'>('tributary');
  const [hoveredTributary, setHoveredTributary] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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

  const svgWidth = 1040;
  const svgHeight = 420;
  const margin = { top: 40, right: 36, bottom: 40, left: 240 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  const totalProjectedAdults = projection.projectedBaselineAdults;
  const currentCumulativeAdults = Math.round(projection.currentCumulative * ADULT_EXPANSION_FACTOR);

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

    const numSteps = 24;
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

    const ribbonPaths: any[] = [];
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

  const currentScrubberX = useMemo(() => {
    return margin.left + (currentDayIndex / (SEASON_DAYS.length - 1)) * chartWidth;
  }, [currentDayIndex, chartWidth, margin.left]);

  const activeHoverData = useMemo(() => {
    if (!hoveredTributary) return null;
    return flowRibbons.find((r) => r.id === hoveredTributary);
  }, [hoveredTributary, flowRibbons]);

  return (
    <div className={`bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-sm overflow-hidden p-4`}>
      <div className="text-xs text-[var(--text-muted)]">Alluvial Stream Backup</div>
    </div>
  );
};
