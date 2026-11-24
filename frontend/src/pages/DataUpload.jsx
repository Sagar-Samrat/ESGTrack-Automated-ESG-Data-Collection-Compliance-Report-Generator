import React, { useState, useEffect } from 'react';
import { useReportingYear } from '../context/ReportingYearContext';
import { uploadService } from '../services/uploadService';
import FileDropzone from '../components/upload/FileDropzone';
import ColumnMapperModal from '../components/upload/ColumnMapperModal';
import DataPreviewTable from '../components/upload/DataPreviewTable';
import Badge from '../components/common/Badge';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  Database,
  LayoutDashboard,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DataUpload() {
  const { reportingYear, setReportingYear, availableYears } = useReportingYear();
  const [uploads, setUploads] = useState([]);
  const [yearFilter, setYearFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [isMapperOpen, setIsMapperOpen] = useState(false);
  const [activeUploadId, setActiveUploadId] = useState(null);
  const [uploadBanner, setUploadBanner] = useState(null);
  const navigate = useNavigate();

  const fetchUploads = async (filterVal = yearFilter) => {
    try {
      setLoading(true);
      const yrParam = filterVal === 'all' ? null : Number(filterVal);
      const res = await uploadService.getUploads(null, yrParam);
      setUploads(res || []);
    } catch (err) {
      console.error('Failed to list uploads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads(yearFilter);
  }, [yearFilter]);

  const buildSuccessBanner = (processedList, customTitle = null) => {
    const items = Array.isArray(processedList) ? processedList : [processedList];
    const totalRows = items.reduce((acc, u) => acc + (u.total_rows || 0), 0);
    const avgScore = items.length > 0
      ? (items.reduce((acc, u) => acc + (u.data_quality_score ?? 100), 0) / items.length).toFixed(1)
      : '100.0';
    const yearSet = new Set();
    items.forEach((u) => {
      if (Array.isArray(u.ingested_years) && u.ingested_years.length > 0) {
        u.ingested_years.forEach((y) => yearSet.add(y));
      } else if (u.reporting_year) {
        yearSet.add(u.reporting_year);
      }
    });
    const years = Array.from(yearSet).sort((a, b) => b - a);
    const primaryTargetYear = years.includes(reportingYear) ? reportingYear : (years[0] || reportingYear);

    return {
      type: 'success',
      title: customTitle || `${items.length} ${items.length === 1 ? 'Dataset' : 'Datasets'} Validated, Normalized & Ingested`,
      detail: `${totalRows.toLocaleString()} standardized records ready in the ESG metrics engine (Avg Quality: ${avgScore}%${years.length ? ` • Covers FY ${years.join(', ')}` : ''}).`,
      uploadId: items[0]?.upload_id,
      targetYear: primaryTargetYear,
    };
  };

  const handleFileUpload = async (file, department, year) => {
    try {
      setIsUploading(true);
      setUploadBanner(null);
      const uploadRes = await uploadService.uploadFile(file, department, year, true);
      setActiveUploadId(uploadRes.upload_id);

      // Immediately fetch preview to let user inspect or refine Column Mappings
      const previewRes = await uploadService.getPreview(uploadRes.upload_id);
      setSelectedPreview(previewRes);
      setIsMapperOpen(true);
      setUploadBanner(buildSuccessBanner([uploadRes]));

      await fetchUploads(yearFilter);
      return true;
    } catch (err) {
      setUploadBanner({
        type: 'error',
        title: 'Upload Failed',
        detail: err.response?.data?.detail || err.message || 'Failed to upload dataset.',
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleBatchUpload = async (queuedFiles) => {
    try {
      setIsUploading(true);
      setUploadBanner(null);
      const results = await uploadService.uploadFilesBatch(queuedFiles, true);
      if (results && results.length > 0) {
        const firstUpload = results[0];
        setActiveUploadId(firstUpload.upload_id);
        const previewRes = await uploadService.getPreview(firstUpload.upload_id);
        setSelectedPreview(previewRes);
        setUploadBanner(buildSuccessBanner(results));

        if (results.length === 1) {
          setIsMapperOpen(true);
        }
      }
      await fetchUploads(yearFilter);
      return true;
    } catch (err) {
      setUploadBanner({
        type: 'error',
        title: 'Batch Upload Failed',
        detail: err.response?.data?.detail || err.message || 'Failed to complete batch upload.',
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewPreview = async (uploadId) => {
    try {
      setActiveUploadId(uploadId);
      const preview = await uploadService.getPreview(uploadId);
      setSelectedPreview(preview);
    } catch (err) {
      setUploadBanner({
        type: 'error',
        title: 'Preview Unavailable',
        detail: err.response?.data?.detail || 'Failed to load dataset preview.',
      });
    }
  };

  const handleConfirmMapping = async (mappings) => {
    if (!activeUploadId) return;
    try {
      setIsUploading(true);
      const fixRes = await uploadService.applyFixes(activeUploadId, {
        remove_duplicates: true,
        fix_negative_values: true,
        impute_missing_median: true,
        drop_missing_rows: false,
        column_mappings: mappings,
      });
      const previewRes = await uploadService.getPreview(activeUploadId);
      setSelectedPreview(previewRes);
      await fetchUploads(yearFilter);

      const yrs = fixRes.ingested_years || [];
      const primaryYr = yrs.includes(reportingYear) ? reportingYear : (yrs[0] || reportingYear);
      setUploadBanner({
        type: 'success',
        title: 'Column Mappings Applied & Dataset Re-Ingested',
        detail: `${fixRes.records_ingested} normalized records synced to live metrics (Quality: ${fixRes.quality_score ?? 100}%).`,
        uploadId: activeUploadId,
        targetYear: primaryYr,
      });
    } catch (err) {
      setUploadBanner({
        type: 'error',
        title: 'Column Mapping Failed',
        detail: err.response?.data?.detail || 'Failed to apply custom column mappings.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (uploadId) => {
    if (!window.confirm('Are you sure you want to delete this dataset and remove its ingested ESG records?')) return;
    try {
      await uploadService.deleteUpload(uploadId);
      if (selectedPreview?.upload_id === uploadId) {
        setSelectedPreview(null);
      }
      await fetchUploads(yearFilter);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete upload.');
    }
  };

  // Quick synthetic dataset test loader (generates a client-side synthetic file for immediate zero-friction testing)
  const handleLoadDemoEnvironmentalData = async () => {
    const csvContent =
`date,electricity_consumption,water_consumption,total_waste,renewable_energy,fuel_liters
${reportingYear}-01-01,48500,1420,3800,9200,2850
${reportingYear}-02-01,47200,1390,3650,9400,2780
${reportingYear}-03-01,46000,1410,3900,9600,2650
${reportingYear}-04-01,49100,1450,4100,9800,2900
${reportingYear}-05-01,52000,1520,4300,10500,3100
${reportingYear}-06-01,54000,1580,48500,11000,3200
${reportingYear}-07-01,56500,1620,4400,11800,3350
${reportingYear}-08-01,55000,1600,4250,11500,3280
${reportingYear}-09-01,51000,1490,4050,10200,2950
${reportingYear}-10-01,48000,1430,3900,9500,2800
${reportingYear}-11-01,47000,,3750,9100,2700
${reportingYear}-12-01,49500,-420,4150,9700,2900`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], `environmental_facilities_fy${reportingYear}.csv`, { type: 'text/csv' });
    await handleFileUpload(file, 'Environmental', reportingYear);
  };

  const handleOpenDashboard = (targetYear) => {
    if (targetYear && targetYear !== reportingYear) {
      setReportingYear(targetYear);
    }
    navigate('/');
  };

  const handleOpenReportGenerator = (targetYear) => {
    if (targetYear && targetYear !== reportingYear) {
      setReportingYear(targetYear);
    }
    navigate('/reports/generate');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">ESG Data Intake & Ingestion</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect departmental activity files (.xlsx, .csv). Validate formatting, map custom fields, and compute audit metrics.
          </p>
        </div>

        {/* Demo Data Quick Trigger */}
        <button
          onClick={handleLoadDemoEnvironmentalData}
          disabled={isUploading}
          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Quick Ingest Sample Environmental Data</span>
        </button>
      </div>

      {/* Processing Status / Completion Banner */}
      {uploadBanner && (
        <div
          className={`p-4 rounded-xl border text-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
            uploadBanner.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {uploadBanner.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm">{uploadBanner.title}</p>
              <p className="text-xs opacity-90 mt-0.5">{uploadBanner.detail}</p>
            </div>
          </div>

          {uploadBanner.type === 'success' && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenDashboard(uploadBanner.targetYear)}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>View Dashboard (FY {uploadBanner.targetYear})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {uploadBanner.uploadId && (
                <button
                  type="button"
                  onClick={() => navigate(`/data-management?upload_id=${uploadBanner.uploadId}`)}
                  className="px-3 py-2 bg-white hover:bg-emerald-100/60 text-emerald-900 border border-emerald-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Review Quality</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenReportGenerator(uploadBanner.targetYear)}
                className="px-3 py-2 bg-white hover:bg-emerald-100/60 text-emerald-900 border border-emerald-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Report</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload Dropzone */}
      <FileDropzone
        onFileUpload={handleFileUpload}
        onBatchUpload={handleBatchUpload}
        isUploading={isUploading}
      />

      {/* Dataset Preview Section */}
      {selectedPreview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Active Dataset Inspection</h3>
            <button
              onClick={() => setIsMapperOpen(true)}
              className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Modify Column Mappings</span>
            </button>
          </div>
          <DataPreviewTable previewData={selectedPreview} />
        </div>
      )}

      {/* Column Mapping Modal */}
      <ColumnMapperModal
        isOpen={isMapperOpen}
        onClose={() => setIsMapperOpen(false)}
        previewData={selectedPreview}
        onConfirmMapping={handleConfirmMapping}
      />

      {/* Upload History Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Department Ingestion History ({yearFilter === 'all' ? 'All Fiscal Years' : `FY ${yearFilter}`})
            </h3>
            <p className="text-[11px] text-slate-400">Maintains complete provenance and audit chain of uploaded files</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Fiscal Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>FY {yr}</option>
              ))}
            </select>
            <span className="text-xs font-semibold text-slate-500">{uploads.length} Ingested Datasets</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading ingested datasets...</div>
        ) : uploads.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No datasets uploaded yet{yearFilter !== 'all' ? ` for FY ${yearFilter}` : ''}. Use the dropzone above or click 'Quick Ingest'.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/60 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Filename</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Fiscal Period</th>
                  <th className="p-3">Rows / Cols</th>
                  <th className="p-3">Data Quality</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Uploaded At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {uploads.map((up) => (
                  <tr key={up.upload_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="truncate max-w-xs" title={up.filename}>{up.filename}</span>
                    </td>
                    <td className="p-3 font-medium text-slate-600">{up.department}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {Array.isArray(up.ingested_years) && up.ingested_years.length > 1
                          ? `FY ${up.ingested_years[0]}–${up.ingested_years[up.ingested_years.length - 1]}`
                          : `FY ${up.ingested_years?.[0] || up.reporting_year}`}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {up.total_rows} r × {up.total_columns} c
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 text-[11px]">
                        {up.data_quality_score ?? 100}%
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge variant={up.status === 'cleaned' ? 'success' : up.status === 'validated' ? 'info' : 'neutral'}>
                        {up.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {new Date(up.uploaded_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewPreview(up.upload_id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                          title="Preview dataset"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/data-management?upload_id=${up.upload_id}`)}
                          className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded"
                          title="Validate and Clean"
                        >
                          <Database className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(up.upload_id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete dataset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

