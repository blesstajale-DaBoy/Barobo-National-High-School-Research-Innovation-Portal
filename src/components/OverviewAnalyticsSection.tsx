import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  CloudCheck,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import {
  ResearchRecord,
  ResearchDivisionId,
  ACTION_RESEARCH_THEMES,
} from '../data/bnhsTaxonomy';

interface OverviewAnalyticsSectionProps {
  researches: ResearchRecord[];
  cloudSyncState: 'synced' | 'syncing' | 'auto_saved';
  lastSyncedTime: string;
  isAuthenticated: boolean;
  onTriggerCloudSync: () => void;
  onNavigateDivision: (
    div: ResearchDivisionId,
    category?: string,
    subcategory?: string
  ) => void;
}

const THEME_PIE_COLORS = [
  '#6B1420', // Theme 1: BNHS Deep Maroon
  '#991B1B', // Theme 2: Crimson Red
  '#B45309', // Theme 3: Warm Amber Gold
  '#D97706', // Theme 4: Ochre Gold
  '#0F766E', // Theme 5: Deep Teal
  '#1D4ED8', // Theme 6: Royal Academic Blue
  '#4338CA', // Theme 7: Indigo Slate
];

export const OverviewAnalyticsSection: React.FC<OverviewAnalyticsSectionProps> = ({
  researches,
  cloudSyncState,
  lastSyncedTime,
  isAuthenticated,
  onTriggerCloudSync,
  onNavigateDivision,
}) => {
  // 1. Bar Chart Data: Number of Research Projects per Division
  const divisionChartData = React.useMemo(() => {
    const divisions: {
      id: ResearchDivisionId;
      shortName: string;
      fullName: string;
      code: string;
    }[] = [
      {
        id: 'basic',
        shortName: 'Basic Research',
        fullName: '01. Basic Research Division',
        code: 'DIV-01',
      },
      {
        id: 'action',
        shortName: 'Action Research',
        fullName: '02. Action Research (7 Themes)',
        code: 'DIV-02',
      },
      {
        id: 'tuklas',
        shortName: 'TUKLAS Fair',
        fullName: '03. TUKLAS Project Fair',
        code: 'DIV-03',
      },
    ];

    return divisions.map((div) => {
      const divRecords = researches.filter((r) => r.division === div.id);
      const approvedOrCompleted = divRecords.filter(
        (r) => r.status === 'Approved' || r.status === 'Completed'
      ).length;
      const ongoingOrPending = divRecords.length - approvedOrCompleted;

      return {
        id: div.id,
        code: div.code,
        name: div.shortName,
        fullName: div.fullName,
        totalProjects: divRecords.length,
        approvedCompleted: approvedOrCompleted,
        ongoingPending: ongoingOrPending,
      };
    });
  }, [researches]);

  // 2. Pie Chart Data: Distribution of Research across the 7 Action Research Themes
  const actionThemesChartData = React.useMemo(() => {
    const actionRecords = researches.filter((r) => r.division === 'action');
    const totalAction = actionRecords.length || 1;

    return ACTION_RESEARCH_THEMES.map((theme, idx) => {
      const count = actionRecords.filter((r) => r.category === theme.name).length;
      const shortLabel = theme.name.replace(/^Theme \d+:\s*/, '');
      const percentage = Math.round((count / totalAction) * 100);

      return {
        id: theme.id,
        themeNumber: theme.themeNumber,
        fullName: theme.name,
        shortLabel: `${theme.themeNumber}: ${shortLabel}`,
        value: count,
        percentage,
        color: THEME_PIE_COLORS[idx % THEME_PIE_COLORS.length],
      };
    });
  }, [researches]);

  const totalActionStudies = React.useMemo(
    () => researches.filter((r) => r.division === 'action').length,
    [researches]
  );

  return (
    <section
      aria-label="Research Repository Data Visualization"
      className="bg-white border border-zinc-200 p-4 sm:p-6 md:p-8 space-y-6"
    >
      {/* Top Header with Live Cloud Synced Auto-Save Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#6B1420] font-semibold">
            <BarChart3 className="w-4 h-4" />
            <span>INSTITUTIONAL RESEARCH ANALYTICS &amp; LIVE TELEMETRY</span>
          </div>
          <h2 className="text-2xl font-display font-semibold text-zinc-900 mt-1">
            Research Distribution by Division &amp; DepEd Action Research Themes
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Interactive visualizations automatically recalculate and save to the cloud whenever any research record, status, or overview item is added, edited, or deleted.
          </p>
        </div>

        {/* Cloud Synced Auto-Save Indicator & Manual Sync Trigger */}
        <div className="flex flex-wrap items-center gap-3 bg-[#FAF9F5] border border-zinc-200 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2">
            {cloudSyncState === 'syncing' ? (
              <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
            ) : (
              <CloudCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                <span>
                  {cloudSyncState === 'syncing'
                    ? 'Cloud Syncing Changes...'
                    : 'Cloud Synced · Auto-Save Active'}
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600" />
              </div>
              <div className="text-[11px] text-zinc-500">
                {isAuthenticated
                  ? `All changes saved automatically to Firebase Cloud · Last synced ${lastSyncedTime}`
                  : `Auto-saved locally & synced to live cloud feed · Last saved ${lastSyncedTime}`}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onTriggerCloudSync}
            disabled={cloudSyncState === 'syncing'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#6B1420] hover:bg-[#520E17] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                cloudSyncState === 'syncing' ? 'animate-spin' : ''
              }`}
            />
            <span>Sync Cloud Now</span>
          </button>
        </div>
      </div>

      {/* 2-Column Charts Grid: Bar Chart (Divisions) + Pie Chart (7 Action Research Themes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left 6 Cols: Bar Chart — Number of Research Projects per Division */}
        <div className="lg:col-span-6 bg-[#FAF9F5] border border-zinc-200 p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#6B1420] font-semibold">
                FIG 01 · DIVISIONAL DISTRIBUTION
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Total: {researches.length} Projects
              </span>
            </div>
            <h3 className="text-lg font-display font-semibold text-zinc-900">
              Number of Research Projects per Division
            </h3>
            <p className="text-xs text-zinc-600">
              Comparison of total indexed manuscripts and Approved/Completed studies across Basic Research, Action Research, and the TUKLAS Fair.
            </p>
          </div>

          {/* Recharts BarChart */}
          <div className="w-full h-72 bg-white border border-zinc-200 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={divisionChartData}
                margin={{ top: 16, right: 16, left: -12, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#27272A', fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: '#D4D4D8' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#52525B', fontSize: 11 }}
                  axisLine={{ stroke: '#D4D4D8' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#6B1420',
                    borderRadius: '0px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
                <Bar
                  dataKey="totalProjects"
                  name="Total Research Projects"
                  fill="#6B1420"
                  radius={[2, 2, 0, 0]}
                  cursor="pointer"
                  onClick={(data) => {
                    if (data && data.id) {
                      onNavigateDivision(data.id as ResearchDivisionId);
                    }
                  }}
                />
                <Bar
                  dataKey="approvedCompleted"
                  name="Approved / Completed"
                  fill="#D97706"
                  radius={[2, 2, 0, 0]}
                  cursor="pointer"
                  onClick={(data) => {
                    if (data && data.id) {
                      onNavigateDivision(data.id as ResearchDivisionId);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Division Breakdown Cards below Bar Chart */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {divisionChartData.map((div) => (
              <button
                key={div.id}
                type="button"
                onClick={() => onNavigateDivision(div.id)}
                className="text-left bg-white border border-zinc-200 hover:border-[#6B1420] p-3 transition-colors group"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>{div.code}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#6B1420]" />
                </div>
                <div className="text-xs font-semibold text-zinc-900 mt-0.5 truncate">
                  {div.name}
                </div>
                <div className="flex items-baseline justify-between mt-1.5">
                  <span className="text-lg font-mono font-bold text-[#6B1420]">
                    {div.totalProjects}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {div.approvedCompleted} Approved
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right 6 Cols: Pie Chart — Distribution Across the 7 Action Research Themes */}
        <div className="lg:col-span-6 bg-[#FAF9F5] border border-zinc-200 p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#6B1420] font-semibold flex items-center gap-1.5">
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>FIG 02 · DEPED ACTION RESEARCH TAXONOMY</span>
              </span>
              <span className="text-xs font-mono text-zinc-500">
                {totalActionStudies} Action Research Studies
              </span>
            </div>
            <h3 className="text-lg font-display font-semibold text-zinc-900">
              Distribution Across the 7 Action Research Themes
            </h3>
            <p className="text-xs text-zinc-600">
              Proportional breakdown of school-based practitioner inquiries across all 7 official Department of Education themes.
            </p>
          </div>

          {/* Recharts PieChart + Interactive Theme Breakdown List */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white border border-zinc-200 p-3">
            <div className="md:col-span-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={actionThemesChartData}
                    dataKey="value"
                    nameKey="shortLabel"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    onClick={(_data, index) => {
                      const target = actionThemesChartData[index];
                      if (target && target.fullName) {
                        onNavigateDivision('action', target.fullName);
                      }
                    }}
                  >
                    {actionThemesChartData.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.color}
                        className="cursor-pointer hover:opacity-85 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => {
                      const num = Number(value ?? 0);
                      return [
                        `${num} ${num === 1 ? 'Study' : 'Studies'}`,
                        String(name ?? ''),
                      ];
                    }}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#6B1420',
                      borderRadius: '0px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Interactive 7 Themes Legend & Filter List */}
            <div className="md:col-span-6 space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 pb-1 border-b border-zinc-100">
                Click any theme to filter Action Research
              </div>
              {actionThemesChartData.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateDivision('action', item.fullName)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-left text-xs hover:bg-rose-50/70 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-zinc-800 group-hover:text-[#6B1420] font-medium truncate">
                      {item.shortLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                    <span className="font-bold text-zinc-900">{item.value}</span>
                    <span className="text-[11px] text-zinc-500">
                      ({item.percentage}%)
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer status note inside Pie Chart card */}
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span className="inline-flex items-center gap-1.5 text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-Time Cloud Synced across all 7 DepEd Themes</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateDivision('action')}
              className="text-xs font-semibold text-[#6B1420] hover:underline"
            >
              View All Action Research →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
