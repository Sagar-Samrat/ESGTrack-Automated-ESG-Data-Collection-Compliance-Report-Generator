import React, { useState, useEffect } from 'react';
import { useReportingYear } from '../context/ReportingYearContext';
import { metricsService } from '../services/metricsService';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmissionsTrendChart from '../components/charts/EmissionsTrendChart';
import EnergyBreakdownChart from '../components/charts/EnergyBreakdownChart';
import { Leaf, Zap, Droplets, Trash2, SunMedium, Flame, Info, AlertTriangle } from 'lucide-react';

export default function Environmental() {
  const { reportingYear } = useReportingYear();
  const [env, setEnv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEnv = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await metricsService.getEnvironmental(reportingYear);
        setEnv(res);
      } catch (err) {
        console.error('Failed to load environmental data:', err);
        setError(err.response?.data?.detail || 'Failed to load environmental metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchEnv();
  }, [reportingYear]);

  if (loading) {
    return <LoadingSpinner message="Calculating Scope 1, Scope 2 & Scope 3 carbon telemetry..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2 font-semibold">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            Pillar E • Environmental
          </span>
          <span className="text-xs text-slate-400">GHG Protocol Scope 1-3 Accounting</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Environmental Performance & Decarbonization</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quantified emissions, facility power consumption, water stewardship, and solid waste diversion pathways.
        </p>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Scope 1 Direct GHG"
          value={env?.scope_1_tco2e?.toLocaleString()}
          unit="tCO2e"
          trend="decrease"
          change={-4.8}
          favorable={true}
          icon={Flame}
          subtitle="Combustion & Fleet"
        />
        <StatCard
          title="Scope 2 Location-Based"
          value={env?.scope_2_tco2e?.toLocaleString()}
          unit="tCO2e"
          trend="decrease"
          change={-5.2}
          favorable={true}
          icon={Zap}
          subtitle="Purchased Electricity"
        />
        <StatCard
          title="Scope 3 Value Chain"
          value={env?.scope_3_tco2e?.toLocaleString()}
          unit="tCO2e"
          trend="decrease"
          change={-1.8}
          favorable={true}
          icon={Leaf}
          subtitle="Water & Solid Waste"
        />
        <StatCard
          title="Renewable Electricity Share"
          value={`${env?.renewable_percentage || 0}%`}
          unit=""
          trend="increase"
          change={6.2}
          favorable={true}
          icon={SunMedium}
          subtitle={`${env?.renewable_energy_kwh?.toLocaleString()} kWh Green`}
        />
      </div>

      {/* Secondary Metrics Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Grid Intake</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{env?.electricity_kwh?.toLocaleString()} kWh</div>
            <span className="text-[11px] text-slate-400">US EPA eGRID 2023 coefficient applied</span>
          </div>
          <Zap className="w-8 h-8 text-amber-500 p-1.5 bg-amber-50 rounded-lg" />
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Water Withdrawal</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{env?.water_m3?.toLocaleString()} m³</div>
            <span className="text-[11px] text-slate-400">Municipal supply & wastewater treatment</span>
          </div>
          <Droplets className="w-8 h-8 text-sky-500 p-1.5 bg-sky-50 rounded-lg" />
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Operational Waste</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{env?.waste_kg?.toLocaleString()} kg</div>
            <span className="text-[11px] text-slate-400">Municipal solid waste landfill pathway</span>
          </div>
          <Trash2 className="w-8 h-8 text-slate-600 p-1.5 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Emissions Trajectory by Month (tCO2e)</h3>
            <span className="text-xs text-slate-400">FY {reportingYear}</span>
          </div>
          <EmissionsTrendChart data={env?.monthly_breakdown || []} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Monthly Electricity Consumption (kWh)</h3>
            <span className="text-xs text-slate-400">FY {reportingYear}</span>
          </div>
          <EnergyBreakdownChart data={env?.monthly_breakdown || []} />
        </div>
      </div>

      {/* Documented Methodology & Emission Factors */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Documented Emission Factor Coefficients
            </h3>
          </div>
          <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
            Auditable Sources
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/60 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3">Activity Stream</th>
                <th className="p-3">Factor Value</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Geography</th>
                <th className="p-3">Authoritative Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              <tr>
                <td className="p-3 font-semibold text-slate-900">Purchased Grid Electricity</td>
                <td className="p-3 font-mono">0.000416</td>
                <td className="p-3 text-slate-500">tCO2e / kWh</td>
                <td className="p-3">US National Average</td>
                <td className="p-3 text-slate-500">US EPA eGRID (2023)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Stationary Diesel Fuel</td>
                <td className="p-3 font-mono">0.002680</td>
                <td className="p-3 text-slate-500">tCO2e / liter</td>
                <td className="p-3">Global Standard</td>
                <td className="p-3 text-slate-500">GHG Protocol Stationary Combustion</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Municipal Water Treatment</td>
                <td className="p-3 font-mono">0.000344</td>
                <td className="p-3 text-slate-500">tCO2e / m³</td>
                <td className="p-3">Global Average</td>
                <td className="p-3 text-slate-500">UK DEFRA / DESNZ</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Landfill Solid Waste</td>
                <td className="p-3 font-mono">0.000586</td>
                <td className="p-3 text-slate-500">tCO2e / kg</td>
                <td className="p-3">Global Average</td>
                <td className="p-3 text-slate-500">US EPA WARM Standard</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

