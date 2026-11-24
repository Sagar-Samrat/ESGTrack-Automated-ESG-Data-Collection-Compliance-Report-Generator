import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { uploadService } from '../services/uploadService';
import QualityScoreWidget from '../components/upload/QualityScoreWidget';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import {
  CheckCircle2,
  AlertTriangle,
  Ban,
  BarChart2,
  Sliders,
  RefreshCw,
  FileCheck,
  LayoutDashboard,
  FileText,
  ArrowRight
} from 'lucide-react';

export default function DataManagement() {
  const [searchParams] = useSearchParams();
  const [uploads, setUploads] = useState([]);
  const [selectedUploadId, setSelectedUploadId] = useState(searchParams.get('upload_id') || '');
  const [validationReport, setValidationReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cleaningInProgress, setCleaningInProgress] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Cleaning options
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [fixNegatives, setFixNegatives] = useState(true);
  const [imputeMedian, setImputeMedian] = useState(true);
  const [dropMissing, setDropMissing] = useState(false);

  const loadUploads = async (preserveSelection = true) => {
    try {
      const list = await uploadService.getUploads(null, null);
      setUploads(list || []);
      const paramId = searchParams.get('upload_id');
      if (paramId && list?.some((u) => u.upload_id === paramId)) {
        setSelectedUploadId(paramId);
      } else if ((!preserveSelection || !selectedUploadId) && list && list.length > 0) {
        setSelectedUploadId(list[0].upload_id);
      }
    } catch (err) {
      console.error('Failed to load uploads:', err);
    }
  };

  useEffect(() => {
    loadUploads(false);
  }, []);

  const loadValidationReport = async (uploadId, clearSuccess = true) => {
    if (!uploadId) return;
    try {
      setLoading(true);
      setErrorMessage('');
      if (clearSuccess) setSuccessMessage('');
      const report = await uploadService.validateUpload(uploadId);
      setValidationReport(report);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to generate validation report for this dataset.');
      setValidationReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUploadId) {
      loadValidationReport(selectedUploadId, true);
    }
  }, [selectedUploadId]);

  const handleApplyFixes = async () => {
    if (!selectedUploadId) return;
    try {
      setCleaningInProgress(true);
      setSuccessMessage('');
      setErrorMessage('');
      const res = await uploadService.applyFixes(selectedUploadId, {
        remove_duplicates: removeDuplicates,
        fix_negative_values: fixNegatives,
        impute_missing_median: imputeMedian,
        drop_missing_rows: dropMissing,
      });
      if (res.validation_report) {
        setValidationReport(res.validation_report);
      }
      await loadUploads(true);
      setSuccessMessage(
        `Dataset cleaned & normalized! ${res.records_ingested} standardized records ingested into the ESG metrics engine (Post-clean Quality: ${res.quality_score ?? 100}%).`
      );
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to apply cleaning fixes.');
    } finally {
      setCleaningInProgress(false);
    }
  };

  const selectedUpload = uploads.find((u) => u.upload_id === selectedUploadId);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data Quality & Validation Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical anomaly screening, non-negative constraint verification, and transparent data quality auditing.
          </p>
        </div>

        {/* Dataset Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-semibold text-slate-500">Active Dataset:</label>
          <select
            value={selectedUploadId}
            onChange={(e) => setSelectedUploadId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {uploads.map((u) => (
              <option key={u.upload_id} value={u.upload_id}>
                {u.filename} ({u.department} • FY {u.reporting_year})
              </option>
            ))}
          </select>
          {selectedUpload && (
            <Badge variant={selectedUpload.status === 'cleaned' ? 'success' : selectedUpload.status === 'validated' ? 'info' : 'neutral'}>
              {selectedUpload.status}
            </Badge>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>View Dashboard</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to="/reports/generate"
              className="px-3 py-1.5 bg-white hover:bg-emerald-100/60 text-emerald-900 border border-emerald-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Report</span>
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Scanning dataset for outliers, missing cells, and negative constraints..." />
      ) : validationReport ? (
        <div className="space-y-6">
          {/* Quality Scorecard Grid */}
          <QualityScoreWidget
            score={validationReport.quality_score}
            completeness={validationReport.completeness_percentage}
            duplicates={validationReport.duplicates_count}
            missingCells={validationReport.missing_cells_count}
            negatives={validationReport.negative_values_count}
            outliers={validationReport.outliers_count}
          />

          {/* Cleaning Controls Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <span>Auditor-Approved Normalization Policies</span>
              </h3>
              <span className="text-[11px] text-slate-400">Zero data discarded without explicit authorization</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <label className="flex items-start gap-2 p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={removeDuplicates}
                  onChange={(e) => setRemoveDuplicates(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Deduplicate Rows</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Purges exact duplicate records ({validationReport.duplicates_count} detected)</p>
                </div>
              </label>

              <label className="flex items-start gap-2 p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={fixNegatives}
                  onChange={(e) => setFixNegatives(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Enforce Non-Negative</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Converts negative consumption to positive absolute ({validationReport.negative_values_count} detected)</p>
                </div>
              </label>

              <label className="flex items-start gap-2 p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={imputeMedian}
                  disabled={dropMissing}
                  onChange={(e) => setImputeMedian(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Impute Median Values</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Fills null numerical gaps with monthly median ({validationReport.missing_cells_count} detected)</p>
                </div>
              </label>

              <label className="flex items-start gap-2 p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={dropMissing}
                  onChange={(e) => {
                    setDropMissing(e.target.checked);
                    if (e.target.checked) setImputeMedian(false);
                  }}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-semibold text-slate-800">Drop Incomplete Rows</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Removes rows with missing cells entirely</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleApplyFixes}
                disabled={cleaningInProgress}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {cleaningInProgress ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                <span>{cleaningInProgress ? 'Cleaning & Ingesting...' : 'Approve & Standardize Records'}</span>
              </button>
            </div>
          </div>

          {/* Detected Anomalies Checklist */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Detailed Validation Issue Registry
              </h3>
              <span className="text-xs font-semibold text-slate-500">{validationReport.issues?.length || 0} Issues Detected</span>
            </div>

            {(!validationReport.issues || validationReport.issues.length === 0) ? (
              <div className="p-8 text-center text-xs text-emerald-700 bg-emerald-50/30 font-medium">
                No data anomalies found! This dataset meets 100% of corporate schema standards.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {validationReport.issues.map((iss, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70">
                    <div className="flex items-center gap-3">
                      {iss.severity === 'error' ? (
                        <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : iss.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <BarChart2 className="w-4 h-4 text-sky-500 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 capitalize">
                            {iss.issue_type.replace('_', ' ')}
                          </span>
                          {iss.column && (
                            <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                              {iss.column}
                            </span>
                          )}
                          {iss.row_index !== null && (
                            <span className="text-[10px] text-slate-400">Row #{iss.row_index + 1}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{iss.suggested_action}</p>
                      </div>
                    </div>

                    <Badge variant={iss.severity === 'error' ? 'danger' : iss.severity === 'warning' ? 'warning' : 'info'}>
                      {iss.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
          No dataset selected. Upload a file from the Data Upload module to begin validation.
        </div>
      )}
    </div>
  );
}

