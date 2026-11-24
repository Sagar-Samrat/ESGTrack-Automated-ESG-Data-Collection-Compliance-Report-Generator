import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReportingYear } from '../context/ReportingYearContext';
import { Building2, Shield, Sliders, CheckCircle2, Save, Cpu, Database } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { reportingYear, setReportingYear } = useReportingYear();
  const [companyName, setCompanyName] = useState(user?.companyName || 'GreenScale Technologies Corp');
  const [industry, setIndustry] = useState('Technology & Manufacturing');
  const [country, setCountry] = useState('United States');
  const [emissionStandard, setEmissionStandard] = useState('US EPA eGRID (2023)');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Organization Profile & Assurance Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure corporate identifiers, calculation methodologies, and institutional audit preferences.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Organization settings successfully updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* Company Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>Corporate Entity Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Legal Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operating Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Jurisdiction / Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Reporting Period</label>
              <select
                value={reportingYear}
                onChange={(e) => setReportingYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value={2024}>FY 2024 (Active Cycle)</option>
                <option value={2023}>FY 2023</option>
                <option value={2022}>FY 2022</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calculation Preferences */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <span>Calculation & Methodological Parameters</span>
          </h3>

          <div className="text-xs space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Electricity Grid Emission Factor Standard</label>
              <select
                value={emissionStandard}
                onChange={(e) => setEmissionStandard(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="US EPA eGRID (2023)">US EPA eGRID 2023 (0.000416 tCO2e/kWh)</option>
                <option value="UK DEFRA / DESNZ (2023)">UK DEFRA / DESNZ 2023 (0.000207 tCO2e/kWh)</option>
                <option value="European EEA Mix">European Environment Agency (EEA) Mix</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Diagnostics Status */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Cpu className="w-4 h-4 text-emerald-700" />
            <span>System Connectivity & AI Engine Status</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-emerald-950">AI Synthesis Core</span>
                <p className="text-[11px] text-emerald-800">Google Gemini API / Deterministic Engine</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded">
                Operational
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900">Document Publisher</span>
                <p className="text-[11px] text-slate-500">ReportLab Corporate PDF Engine</p>
              </div>
              <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                Active
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </form>
    </div>
  );
}

