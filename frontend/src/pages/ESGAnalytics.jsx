import React, { useState, useEffect } from 'react';
import { useReportingYear } from '../context/ReportingYearContext';
import { metricsService } from '../services/metricsService';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import YoYComparisonChart from '../components/charts/YoYComparisonChart';
import EmissionsTrendChart from '../components/charts/EmissionsTrendChart';
import EnergyBreakdownChart from '../components/charts/EnergyBreakdownChart';
import { BarChart3, TrendingUp, TrendingDown, Filter, Calendar, Download, AlertTriangle } from 'lucide-react';
import Badge from '../components/common/Badge';

export default function ESGAnalytics() {
  const { reportingYear } = useReportingYear();
  const [yoyData, setYoyData] = useState(null);
  const [envData, setEnvData] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const [yoy, env] = await Promise.all([
          metricsService.getYoY(reportingYear),
          metricsService.getEnvironmental(reportingYear),
        ]);
        setYoyData(yoy);
        setEnvData(env);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError(err.response?.data?.detail || 'Failed to load comparative ESG analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [reportingYear]);

  if (loading) {
    return <LoadingSpinner message="Calculating multi-year variance and trend regression..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2 font-semibold">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const metrics = yoyData?.metrics || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">ESG Performance Analytics & YoY Variance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare fiscal year {reportingYear} against prior period {reportingYear - 1}. Examine absolute & percentage trends across all pillars.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {['All', 'Environmental', 'Social', 'Governance'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                categoryFilter === cat
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main YoY Comparison Visual */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <span>Comparative Indicator Matrix (FY {reportingYear} vs FY {reportingYear - 1})</span>
            </h3>
            <p className="text-xs text-slate-400">Green bars denote current year; gray bars denote previous benchmark</p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            Base Year: {reportingYear - 1}
          </span>
        </div>
        <YoYComparisonChart metrics={metrics} />
      </div>

      {/* Detailed Variance Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Year-over-Year Metric Variance Breakdown
          </h3>
          <span className="text-xs text-slate-500 font-medium">{metrics.length} Tracked Core Disclosures</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/60 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Tracked ESG Indicator</th>
                <th className="p-3">FY {reportingYear - 1} (Prior)</th>
                <th className="p-3">FY {reportingYear} (Current)</th>
                <th className="p-3">Absolute Delta</th>
                <th className="p-3">% Change</th>
                <th className="p-3">Trajectory</th>
                <th className="p-3 text-right">Target Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {metrics.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">{m.metric_name}</td>
                  <td className="p-3 font-mono text-slate-500">
                    {m.previous_value?.toLocaleString()} {m.unit}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">
                    {m.current_value?.toLocaleString()} {m.unit}
                  </td>
                  <td className="p-3 font-mono text-slate-600">
                    {m.absolute_change > 0 ? `+${m.absolute_change}` : m.absolute_change} {m.unit}
                  </td>
                  <td className="p-3">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        m.favorable
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {m.percentage_change > 0 ? `+${m.percentage_change}` : m.percentage_change}%
                    </span>
                  </td>
                  <td className="p-3 capitalize font-medium text-slate-600 flex items-center gap-1.5">
                    {m.trend === 'increase' ? (
                      <TrendingUp className={`w-3.5 h-3.5 ${m.favorable ? 'text-emerald-600' : 'text-rose-600'}`} />
                    ) : (
                      <TrendingDown className={`w-3.5 h-3.5 ${m.favorable ? 'text-emerald-600' : 'text-rose-600'}`} />
                    )}
                    <span>{m.trend}</span>
                  </td>
                  <td className="p-3 text-right">
                    <Badge variant={m.favorable ? 'success' : 'danger'}>
                      {m.favorable ? 'Favorable' : 'Requires Attention'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

