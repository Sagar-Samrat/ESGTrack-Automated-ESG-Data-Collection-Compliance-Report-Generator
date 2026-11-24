import React, { useState, useEffect } from 'react';
import { complianceService } from '../services/complianceService';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Paperclip,
  Check,
  X,
  UploadCloud,
  HelpCircle,
  Search,
  Filter
} from 'lucide-react';

export default function ComplianceCenter() {
  const [framework, setFramework] = useState('GRI Standards');
  const [gapReport, setGapReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDisclosure, setSelectedDisclosure] = useState(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceName, setEvidenceName] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchCompliance = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await complianceService.getGapReport(framework);
      setGapReport(data);
    } catch (err) {
      console.error('Failed to load compliance data:', err);
      setError(err.response?.data?.detail || 'Failed to load regulatory compliance checklists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, [framework]);

  const handleUpdateStatus = async (disclosureId, approvalStatus, evidenceStatus) => {
    try {
      await complianceService.updateDisclosureStatus(disclosureId, {
        approval_status: approvalStatus,
        evidence_status: evidenceStatus,
      });
      setActionSuccess(`Disclosure status updated to ${approvalStatus}.`);
      setTimeout(() => setActionSuccess(''), 3000);
      await fetchCompliance();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleAttachEvidence = async (e) => {
    e.preventDefault();
    if (!selectedDisclosure || !evidenceName) return;

    try {
      await complianceService.attachEvidence(
        selectedDisclosure.disclosure_id,
        evidenceName,
        'Policy/Audit Log',
        evidenceNotes
      );
      setIsEvidenceModalOpen(false);
      setEvidenceName('');
      setEvidenceNotes('');
      setActionSuccess(`Evidence document "${evidenceName}" successfully linked.`);
      setTimeout(() => setActionSuccess(''), 3000);
      await fetchCompliance();
    } catch (err) {
      alert('Failed to attach evidence.');
    }
  };

  const items = gapReport?.items || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              Audit Readiness Center
            </span>
            <span className="text-xs text-slate-400">Standard-Specific Disclosure Tracking</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Regulatory Compliance & Evidence Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track mandatory disclosures, link verified audit documentation, and evaluate compliance readiness gaps.
          </p>
        </div>

        {/* Framework Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {['GRI Standards', 'IFRS S1', 'IFRS S2'].map((fw) => (
            <button
              key={fw}
              onClick={() => setFramework(fw)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                framework === fw
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {fw}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2 font-semibold">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message={`Compiling ${framework} audit gap analysis...`} />
      ) : (
        <div className="space-y-6">
          {/* Compliance Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Requirements</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{gapReport?.total_disclosures}</div>
              <span className="text-[11px] text-slate-500">{framework} Metrics</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Approved & Verified</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{gapReport?.approved_count}</div>
              <span className="text-[11px] text-emerald-600">Audit Ready</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">Under Review</span>
              <div className="text-2xl font-bold text-sky-700 mt-1">{gapReport?.under_review_count}</div>
              <span className="text-[11px] text-sky-600">Awaiting Auditor</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Evidence Pending</span>
              <div className="text-2xl font-bold text-amber-700 mt-1">{gapReport?.pending_evidence_count}</div>
              <span className="text-[11px] text-amber-600">Missing Attachments</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Completion Rate</span>
              <div className="text-2xl font-bold text-indigo-800 mt-1">{gapReport?.completion_percentage}%</div>
              <span className="text-[11px] text-indigo-600">Overall Standard</span>
            </div>
          </div>

          {/* Regulatory Disclaimer Banner (Prompt 9 requirement) */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Regulatory Review Notice:</span> ESGTrack tracks disclosure mappings aligned with published {framework} guidelines.
              This platform does not claim automated legal certification. Final compliance submissions must be reviewed by qualified internal sustainability officers and registered external assurance providers.
            </div>
          </div>

          {/* Disclosures Checklist Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {framework} Standard Checklist Registry
                </h3>
                <p className="text-[11px] text-slate-400">Examine required evidence, link supporting documents, and sign off</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">{items.length} Tracked Disclosures</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {items.map((item) => (
                <div key={item.disclosure_id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        {item.code}
                      </span>
                      <span className="font-semibold text-slate-900">{item.title}</span>
                      <Badge variant={item.category === 'Environmental' ? 'success' : item.category === 'Social' ? 'info' : 'neutral'}>
                        {item.category}
                      </Badge>
                    </div>

                    <p className="text-slate-600 text-[11px]">{item.description}</p>

                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                      <span>Required Evidence: <b className="text-slate-600">{item.required_evidence}</b></span>
                      {item.reviewer_notes && (
                        <span>Notes: <i className="text-slate-600">{item.reviewer_notes}</i></span>
                      )}
                    </div>

                    {item.evidence_files && item.evidence_files.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] text-slate-500 font-medium">
                          Attached: {item.evidence_files.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Badge
                      variant={
                        item.approval_status === 'Approved'
                          ? 'success'
                          : item.evidence_status === 'Under Review'
                          ? 'info'
                          : item.evidence_status === 'Evidence Pending'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {item.approval_status === 'Approved' ? 'Approved' : item.evidence_status}
                    </Badge>

                    {/* Attach Evidence */}
                    <button
                      onClick={() => {
                        setSelectedDisclosure(item);
                        setIsEvidenceModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center gap-1"
                      title="Attach supporting document"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Attach</span>
                    </button>

                    {/* Approve / Reject */}
                    {item.approval_status !== 'Approved' ? (
                      <button
                        onClick={() => handleUpdateStatus(item.disclosure_id, 'Approved', 'Approved')}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200"
                        title="Approve Disclosure"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(item.disclosure_id, 'Pending', 'Under Review')}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200"
                        title="Revoke Approval"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Attach Evidence Modal */}
      {isEvidenceModalOpen && selectedDisclosure && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Attach Supporting Evidence ({selectedDisclosure.code})
              </h3>
              <button
                onClick={() => setIsEvidenceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAttachEvidence} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title / Reference
                </label>
                <input
                  type="text"
                  required
                  value={evidenceName}
                  onChange={(e) => setEvidenceName(e.target.value)}
                  placeholder="e.g. FY2024_Q4_Utility_Meter_Receipts.pdf"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auditor Notes / Methodology Reference
                </label>
                <textarea
                  rows={3}
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  placeholder="Verified against direct facility submeter logs by lead sustainability engineer."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEvidenceModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Link Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

