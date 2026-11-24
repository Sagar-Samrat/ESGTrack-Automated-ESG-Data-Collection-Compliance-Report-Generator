import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function YoYComparisonChart({ metrics = [] }) {
  const [activeView, setActiveView] = useState('normalized'); // 'normalized' | 'raw_all' | metric_name

  const availableMetrics = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];
    return metrics.slice(0, 6);
  }, [metrics]);

  if (!availableMetrics || availableMetrics.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        No comparative period data available.
      </div>
    );
  }

  // Pre-formatted chart data based on active view mode
  const { chartData, yAxisUnit, isNormalized } = useMemo(() => {
    if (activeView === 'normalized') {
      const data = availableMetrics.map((m) => {
        const prev = Number(m.previous_value) || 0;
        const curr = Number(m.current_value) || 0;
        const normCurr = prev > 0 ? Number(((curr / prev) * 100).toFixed(1)) : 100;
        return {
          name: m.metric_name,
          shortName: m.metric_name.replace(' Consumption', '').replace(' Share', '').replace(' Emissions', ''),
          Previous: 100,
          Current: normCurr,
          rawPrevious: prev,
          rawCurrent: curr,
          unit: m.unit,
          pctChange: m.percentage_change ?? Number((((curr - prev) / (prev || 1)) * 100).toFixed(1)),
          favorable: m.favorable,
        };
      });
      return { chartData: data, yAxisUnit: '%', isNormalized: true };
    }

    if (activeView === 'raw_all') {
      const data = availableMetrics.map((m) => ({
        name: m.metric_name,
        shortName: m.metric_name.replace(' Consumption', '').replace(' Share', '').replace(' Emissions', ''),
        Previous: Number(m.previous_value) || 0,
        Current: Number(m.current_value) || 0,
        rawPrevious: Number(m.previous_value) || 0,
        rawCurrent: Number(m.current_value) || 0,
        unit: m.unit,
        pctChange: m.percentage_change ?? 0,
        favorable: m.favorable,
      }));
      return { chartData: data, yAxisUnit: '', isNormalized: false };
    }

    // Single selected metric focus (e.g. Renewable Energy Share)
    const metric = availableMetrics.find((m) => m.metric_name === activeView) || availableMetrics[0];
    const prev = Number(metric.previous_value) || 0;
    const curr = Number(metric.current_value) || 0;
    const data = [{
      name: metric.metric_name,
      shortName: metric.metric_name,
      Previous: prev,
      Current: curr,
      rawPrevious: prev,
      rawCurrent: curr,
      unit: metric.unit,
      pctChange: metric.percentage_change ?? Number((((curr - prev) / (prev || 1)) * 100).toFixed(1)),
      favorable: metric.favorable,
    }];
    return { chartData: data, yAxisUnit: metric.unit, isNormalized: false };
  }, [activeView, availableMetrics]);

  // Selected single metric details for contextual badge
  const selectedSingleMetric = useMemo(() => {
    if (activeView === 'normalized' || activeView === 'raw_all') return null;
    return availableMetrics.find((m) => m.metric_name === activeView);
  }, [activeView, availableMetrics]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-200 text-xs min-w-[220px]">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between gap-2">
            <span className="truncate">{item.name}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                item.favorable ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {item.pctChange > 0 ? `+${item.pctChange}%` : `${item.pctChange}%`} YoY
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 shrink-0" />
                Previous Year:
              </span>
              <span className="font-bold text-slate-800">
                {item.rawPrevious?.toLocaleString()} {item.unit}
                {isNormalized && <span className="text-[10px] text-slate-400 ml-1 font-normal">(100% Base)</span>}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 shrink-0" />
                Current Year:
              </span>
              <span className="font-bold text-emerald-800">
                {item.rawCurrent?.toLocaleString()} {item.unit}
                {isNormalized && (
                  <span className="text-[10px] text-emerald-600 ml-1 font-semibold">
                    ({item.Current}% of Base)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-3">
      {/* Metric Focus & Mode Selection Pills */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveView('normalized')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'normalized'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            All (% Indexed)
          </button>

          {availableMetrics.map((m) => (
            <button
              key={m.metric_name}
              type="button"
              onClick={() => setActiveView(m.metric_name)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeView === m.metric_name
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {m.metric_name.replace(' Consumption', '').replace(' Share', '').replace(' Total', '')} ({m.unit})
            </button>
          ))}
        </div>

        {/* View Mode note */}
        {isNormalized && (
          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            Baseline: 100% Prior Year
          </span>
        )}
      </div>

      {/* Selected Metric Callout (when focused on a specific indicator like Renewable Energy) */}
      {selectedSingleMetric && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50/80 border border-emerald-200/70 rounded-lg text-xs">
          <span className="font-semibold text-emerald-950">
            {selectedSingleMetric.metric_name}:
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">
              {Number(selectedSingleMetric.previous_value).toLocaleString()} {selectedSingleMetric.unit} →{' '}
              <strong className="text-slate-900 font-bold">
                {Number(selectedSingleMetric.current_value).toLocaleString()} {selectedSingleMetric.unit}
              </strong>
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                selectedSingleMetric.favorable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {selectedSingleMetric.percentage_change > 0
                ? `+${selectedSingleMetric.percentage_change}%`
                : `${selectedSingleMetric.percentage_change}%`}{' '}
              YoY
            </span>
          </div>
        </div>
      )}

      {/* Bar Chart Container */}
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="shortName"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(v) => {
                if (isNormalized || yAxisUnit === '%') return `${v}%`;
                if (v >= 1000) return `${Math.round(v / 1000)}k`;
                return v;
              }}
              domain={isNormalized ? [0, 130] : [0, 'auto']}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(241, 245, 249, 0.45)', radius: 4 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
            />
            <Bar
              dataKey="Previous"
              name="Previous Year"
              fill="#94a3b8"
              radius={[4, 4, 0, 0]}
              barSize={activeView !== 'normalized' && activeView !== 'raw_all' ? 48 : undefined}
            />
            <Bar
              dataKey="Current"
              name="Current Year"
              fill="#059669"
              radius={[4, 4, 0, 0]}
              barSize={activeView !== 'normalized' && activeView !== 'raw_all' ? 48 : undefined}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
