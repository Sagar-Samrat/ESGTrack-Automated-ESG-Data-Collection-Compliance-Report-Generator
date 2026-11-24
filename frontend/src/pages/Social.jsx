import React, { useState, useEffect } from 'react';
import { useReportingYear } from '../context/ReportingYearContext';
import { metricsService } from '../services/metricsService';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DiversityDonutChart from '../components/charts/DiversityDonutChart';
import { Users, UserCheck, ShieldAlert, GraduationCap, HeartHandshake, Briefcase, AlertTriangle } from 'lucide-react';

export default function Social() {
  const { reportingYear } = useReportingYear();
  const [soc, setSoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSoc = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await metricsService.getSocial(reportingYear);
        setSoc(res);
      } catch (err) {
        console.error('Failed to load social metrics:', err);
        setError(err.response?.data?.detail || 'Failed to load social & labor metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchSoc();
  }, [reportingYear]);

  if (loading) {
    return <LoadingSpinner message="Aggregating workforce DEI, safety incidents, and human capital records..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2 font-semibold">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const deptDist = soc?.department_distribution || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800">
            Pillar S • Social & Labor
          </span>
          <span className="text-xs text-slate-400">GRI 400 Series & Human Capital Accounting</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workforce Diversity, Health & Labor Practices</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Workforce demographics, gender representation, turnover indices, and occupational health and safety metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workforce Headcount"
          value={soc?.total_employees}
          unit="Active Staff"
          trend="increase"
          change={8.5}
          favorable={true}
          icon={Users}
          subtitle="Full-Time & Part-Time"
        />
        <StatCard
          title="Gender Diversity Ratio"
          value={`${soc?.gender_diversity_pct}%`}
          unit=""
          trend="increase"
          change={3.2}
          favorable={true}
          icon={UserCheck}
          subtitle={`${soc?.female_employees} Female Leaders/Staff`}
        />
        <StatCard
          title="Annual Turnover Rate"
          value={`${soc?.turnover_rate_pct}%`}
          unit=""
          trend="decrease"
          change={-1.5}
          favorable={true}
          icon={Briefcase}
          subtitle="Voluntary & Involuntary"
        />
        <StatCard
          title="Lost-Time Accident Frequency"
          value={soc?.accident_frequency_rate}
          unit="per 1M hrs"
          trend="decrease"
          change={-10.0}
          favorable={true}
          icon={ShieldAlert}
          subtitle={`${soc?.workplace_accidents} Reportable Incidents`}
        />
      </div>

      {/* Diversity Breakdown & Health/Safety Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diversity Donut */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Workforce Gender Distribution</h3>
            <span className="text-xs text-slate-400">FY {reportingYear} Census</span>
          </div>
          <DiversityDonutChart
            female={soc?.female_employees}
            male={soc?.male_employees}
            other={soc?.other_employees}
          />
        </div>

        {/* Safety & Training Details */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Occupational Health & Training Telemetry</h3>
            <span className="text-xs text-slate-400">OSHA 300 Alignment</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-slate-500 font-medium">Workplace Accidents</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{soc?.workplace_accidents}</div>
              <span className="text-[10px] text-emerald-700 font-semibold">Zero Fatalities</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-slate-500 font-medium">Lost Workdays</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{soc?.lost_work_days} Days</div>
              <span className="text-[10px] text-slate-400">Post-Incident Recovery</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-slate-500 font-medium">Safety Training Hours</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{soc?.safety_training_hours} hrs</div>
              <span className="text-[10px] text-emerald-700 font-semibold">100% Mandatory Attended</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-slate-500 font-medium">Avg Training / Employee</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {(soc?.safety_training_hours / (soc?.total_employees || 1)).toFixed(1)} hrs
              </div>
              <span className="text-[10px] text-slate-400">Compliance Modules</span>
            </div>
          </div>

          {/* Department Headcount Breakdown */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Departmental Headcount Allocation
            </span>
            <div className="space-y-1.5 text-xs">
              {Object.entries(deptDist).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">{dept}</span>
                  <span className="font-mono text-slate-600">{count} Employees</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

