import React, { useState } from 'react';
import { useReportingYear } from '../context/ReportingYearContext';
import { reportService } from '../services/reportService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import {
  Sparkles,
  Download,
  FileText,
  FileSpreadsheet,
  Check,
  Edit3,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Info,
  Loader2
} from 'lucide-react';

export default function AIReportGenerator() {
  const { reportingYear } = useReportingYear();
  const [framework, setFramework] = useState('GRI Standards');
  const [categories, setCategories] = useState(['Environmental', 'Social', 'Governance']);
  const [generating, setGenerating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [report, setReport] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setSaveSuccess(false);
      const res = await reportService.generateReport(reportingYear, framework, categories);
      setReport(res);
      setEditableContent(res.content || {});
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate AI report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleContentChange = (section, value) => {
    setEditableContent((prev) => ({
      ...prev,
      [section]: value,
    }));
  };

  const handleSaveNarrative = async () => {
    if (!report) return;
    try {
      const updated = await reportService.updateReport(report.report_id, {
        executive_summary: editableContent.executive_summary,
        environmental_narrative: editableContent.environmental_performance,
        social_narrative: editableContent.social_performance,
        governance_narrative: editableContent.governance_performance,
        limitations: editableContent.missing_data_and_limitations,
        status: 'approved',
      });
      setReport(updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Failed to save updated narrative.');
    }
  };

  const handleDownloadPdf = async (reportId) => {
    try {
      setDownloadingPdf(true);
      await reportService.downloadPdf(reportId, editableContent, report?.reporting_year || reportingYear);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Gemini AI Assurance Core
          </span>
          <span className="text-xs text-slate-400">Zero-Hallucination Quantitative Synthesis</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI-Powered Corporate ESG Report Publisher</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate an institutional-grade ESG disclosure report synthesizing validated activity metrics into audit-ready narrative.
        </p>
      </div>

      {/* Generator Configuration Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Framework Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Reporting Standard / Framework
            </label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="GRI Standards">GRI Standards (Global Reporting Initiative)</option>
              <option value="IFRS S1">IFRS S1 (General Sustainability Disclosures)</option>
              <option value="IFRS S2">IFRS S2 (Climate-Related Disclosures)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Configures specific mandatory disclosure indices</p>
          </div>

          {/* Reporting Period */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Reporting Period
            </label>
            <div className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
              Fiscal Year {reportingYear} (Jan 01 – Dec 31)
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Controlled via global navigation selector</p>
          </div>

          {/* Target Categories */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Included Pillars
            </label>
            <div className="flex items-center gap-3 pt-2 text-xs">
              {['Environmental', 'Social', 'Governance'].map((c) => (
                <span key={c} className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Strict assurance rules: Strictly verified metrics are used; unmeasured fields are marked as limitations.</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-300" />}
            <span>{generating ? 'Synthesizing Report with Gemini...' : 'Generate AI ESG Report'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2 font-semibold">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Report modifications saved and marked as Approved.</span>
        </div>
      )}

      {/* Report Preview & Editor Container */}
      {generating ? (
        <LoadingSpinner message="Consulting Gemini API, validating JSON schema, and composing executive sections..." />
      ) : report ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
          {/* Top Bar with Export Options */}
          <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                  {report.framework} Aligned
                </span>
                <span className="text-xs text-slate-300 font-mono">FY {report.reporting_year}</span>
              </div>
              <h2 className="text-lg font-bold">
                {report.company_name} — Sustainability Performance Report
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit Token: <code className="text-emerald-400">{report.report_id}</code> | Status: <b className="capitalize text-emerald-300">{report.report_status}</b>
              </p>
            </div>

            {/* Export & Edit Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                  isEditing
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Editing Narrative' : 'Edit Narrative'}</span>
              </button>

              {isEditing && (
                <button
                  onClick={handleSaveNarrative}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Approve</span>
                </button>
              )}

              <button
                onClick={() => handleDownloadPdf(report.report_id)}
                disabled={downloadingPdf}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{downloadingPdf ? 'Exporting PDF...' : 'Export PDF'}</span>
              </button>

              <button
                onClick={() => reportService.downloadExcel(report.reporting_year)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Metrics (XLSX)</span>
              </button>
            </div>
          </div>

          {/* Report Content Body */}
          <div className="p-8 space-y-6 text-sm text-slate-800 max-w-4xl mx-auto">
            {/* 1. Executive Summary */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-100 pb-1">
                1. Executive Summary
              </h3>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={editableContent?.executive_summary || ''}
                  onChange={(e) => handleContentChange('executive_summary', e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed"
                />
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {editableContent?.executive_summary}
                </p>
              )}
            </section>

            {/* 2. Environmental Performance */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-100 pb-1">
                2. Environmental Performance & Emissions Inventory
              </h3>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={editableContent?.environmental_performance || ''}
                  onChange={(e) => handleContentChange('environmental_performance', e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed"
                />
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {editableContent?.environmental_performance}
                </p>
              )}
            </section>

            {/* 3. Social Performance */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-100 pb-1">
                3. Social & Labor Practices
              </h3>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={editableContent?.social_performance || ''}
                  onChange={(e) => handleContentChange('social_performance', e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed"
                />
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {editableContent?.social_performance}
                </p>
              )}
            </section>

            {/* 4. Governance Performance */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-100 pb-1">
                4. Corporate Governance & Anti-Corruption
              </h3>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={editableContent?.governance_performance || ''}
                  onChange={(e) => handleContentChange('governance_performance', e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed"
                />
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {editableContent?.governance_performance}
                </p>
              )}
            </section>

            {/* 5. Key Findings & Strategic Priorities */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-100 pb-1">
                5. Key Findings & Improvement Opportunities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Key Quantitative Insights</span>
                  <ul className="space-y-1 text-slate-600 list-disc list-inside">
                    {editableContent?.key_findings?.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  <span className="font-bold text-emerald-900 block mb-1">Strategic Priorities</span>
                  <ul className="space-y-1 text-emerald-800 list-disc list-inside">
                    {editableContent?.areas_for_improvement?.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* 6. Missing Data & Limitations */}
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">
                6. Data Limitations & Assurance Notice
              </h3>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={editableContent?.missing_data_and_limitations || ''}
                  onChange={(e) => handleContentChange('missing_data_and_limitations', e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed"
                />
              ) : (
                <p className="text-xs text-slate-500 italic leading-relaxed">
                  {editableContent?.missing_data_and_limitations}
                </p>
              )}
            </section>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">No Active Report Generated</h3>
          <p className="text-xs text-slate-500 mb-4">
            Select your target framework above and click 'Generate AI ESG Report' to build a comprehensive disclosure draft.
          </p>
        </div>
      )}
    </div>
  );
}
