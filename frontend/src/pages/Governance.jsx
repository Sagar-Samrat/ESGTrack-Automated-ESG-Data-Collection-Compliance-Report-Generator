import React, { useState, useEffect } from 'react';
import { useReportingYear } from '../context/ReportingYearContext';
import { metricsService } from '../services/metricsService';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ShieldCheck, Scale, Award, FileCheck2, CheckCircle2, Building, AlertCircle, AlertTriangle } from 'lucide-react';

export default function Governance() {
  const { reportingYear } = useReportingYear();
  const [gov, setGov] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGov = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await metricsService.getGovernance(reportingYear);
        setGov(res);
      } catch (err) {
        console.error('Failed to load governance metrics:', err);
        setError(err.response?.data?.detail || 'Failed to load governance metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchGov();
  }, [reportingYear]);

  if (loading) {
    return <LoadingSpinner message="Auditing board governance structure and ethics compliance..." />;
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
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
            Pillar G • Corporate Governance
          </span>
          <span className="text-xs text-slate-400">Board Oversight & Compliance Assurance</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Board Integrity, Ethics & Regulatory Compliance</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Oversight mechanisms, fiduciary independence, anti-corruption policies, and executive compliance metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Board Independence"
          value={`${gov?.board_independence_pct}%`}
          unit=""
          trend="increase"
          change={5.0}
          favorable={true}
          icon={ShieldCheck}
          subtitle={`${gov?.independent_board_members} of ${gov?.total_board_members} Independent`}
        />
        <StatCard
          title="Ethics Training Completion"
          value={`${gov?.ethics_training_completion_pct}%`}
          unit=""
          trend="increase"
          change={2.4}
          favorable={true}
          icon={Award}
          subtitle={`${gov?.ethics_training_completed} Staff Trained`}
        />
        <StatCard
          title="Anti-Corruption Policy"
          value={gov?.anti_corruption_policy || 'Adopted'}
          unit=""
          favorable={true}
          icon={Scale}
          subtitle="Annual Whistleblower Audit"
        />
        <StatCard
          title="Board Meetings Held"
          value={gov?.board_meeting_count}
          unit="Convened"
          favorable={true}
          icon={Building}
          subtitle="Quorum Established"
        />
      </div>

      {/* Governance Disclosures Matrix */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Mandatory Corporate Governance Disclosures (FY {reportingYear})
          </h3>
          <Badge variant="success">Assurance Passed</Badge>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Separate CEO & Board Chair Positions</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  The Chair of the Board is an independent non-executive director with zero operational executive roles.
                </p>
              </div>
            </div>
            <Badge variant="success">Verified</Badge>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Dedicated Sustainability Oversight Committee</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Quarterly board meetings review climate decarbonization progress and regulatory compliance filings.
                </p>
              </div>
            </div>
            <Badge variant="success">Charter Active</Badge>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Whistleblower Protection Policy (GRI 205-2)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Third-party anonymous reporting hotline active with zero whistleblower retaliation incidents logged.
                </p>
              </div>
            </div>
            <Badge variant="success">Published</Badge>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Executive Compensation Tied to ESG Metrics</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  15% of senior management annual bonus compensation is explicitly linked to verified Scope 1 & 2 emissions reduction.
                </p>
              </div>
            </div>
            <Badge variant="info">In Force</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

