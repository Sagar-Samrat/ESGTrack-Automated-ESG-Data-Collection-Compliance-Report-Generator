import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  Trash2,
  PlusCircle,
  Layers
} from 'lucide-react';
import { useReportingYear, AVAILABLE_YEARS } from '../../context/ReportingYearContext';

const DEPARTMENTS = [
  { value: 'Environmental', label: 'Environmental & Facilities' },
  { value: 'Human Resources', label: 'Human Resources & Workforce' },
  { value: 'Operations', label: 'Operations & Health / Safety' },
  { value: 'Finance', label: 'Finance & Energy Accounting' },
  { value: 'Governance', label: 'Corporate Governance & Legal' },
  { value: 'Emission Factors', label: 'Emission Factors & Reference Data' }
];

function autoDetectDepartment(fileName) {
  const fn = (fileName || '').toLowerCase();
  if (fn.includes('emission_factor') || fn.includes('emission-factor') || fn.includes('factor')) {
    return 'Emission Factors';
  }
  if (fn.includes('employee') || fn.includes('hr') || fn.includes('workforce') || fn.includes('census') || fn.includes('headcount')) {
    return 'Human Resources';
  }
  if (fn.includes('safety') || fn.includes('accident') || fn.includes('incident') || fn.includes('osha') || fn.includes('ops') || fn.includes('labor')) {
    return 'Operations';
  }
  if (fn.includes('gov') || fn.includes('board') || fn.includes('ethics') || fn.includes('director') || fn.includes('legal')) {
    return 'Governance';
  }
  if (fn.includes('finance') || fn.includes('spend') || fn.includes('cost') || fn.includes('accounting')) {
    return 'Finance';
  }
  return 'Environmental';
}

export default function FileDropzone({ onFileUpload, onBatchUpload, isUploading = false }) {
  const { reportingYear } = useReportingYear();
  const [isDragOver, setIsDragOver] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
    }
    // Reset file input value so re-selecting same files triggers change
    if (e.target) e.target.value = '';
  };

  const addFilesToQueue = (filesList) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const newItems = [];

    filesList.forEach((file) => {
      const fileName = file.name.toLowerCase();
      const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

      if (!isValid) {
        alert(`Skipping '${file.name}': Only Excel (.xlsx, .xls) and CSV (.csv) files are supported.`);
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        alert(`Skipping '${file.name}': File exceeds the 50MB size limit.`);
        return;
      }

      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        sizeKb: (file.size / 1024).toFixed(1),
        department: autoDetectDepartment(file.name),
        reportingYear: reportingYear || 2024,
      });
    });

    setQueuedFiles((prev) => [...prev, ...newItems]);
  };

  const handleRemoveFile = (id) => {
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItemDept = (id, dept) => {
    setQueuedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, department: dept } : item))
    );
  };

  const handleUpdateItemYear = (id, yr) => {
    setQueuedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, reportingYear: Number(yr) } : item))
    );
  };

  const handleClearAll = () => {
    setQueuedFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (queuedFiles.length === 0 || isUploading) return;

    let succeeded = false;
    if (onBatchUpload) {
      succeeded = await onBatchUpload(queuedFiles);
    } else if (onFileUpload && queuedFiles.length === 1) {
      const item = queuedFiles[0];
      succeeded = await onFileUpload(item.file, item.department, item.reportingYear);
    }

    if (succeeded) {
      setQueuedFiles([]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-5">
      {/* Drag & Drop Input Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/10'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          multiple
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 mx-auto mb-3">
          <UploadCloud className="w-6 h-6 text-emerald-700" />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">
            <span className="font-semibold text-emerald-700 hover:underline">Click to browse multiple files</span> or drag and drop files here
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Upload multiple Excel (.xlsx, .xls) and CSV (.csv) files simultaneously up to 50MB each.
          </p>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full mt-2 font-medium">
            <Layers className="w-3 h-3 text-emerald-600" /> Multi-File & Multi-Department Batch Ingestion Enabled
          </span>
        </div>
      </div>

      {/* Queued Files Staging Area */}
      {queuedFiles.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Upload Queue ({queuedFiles.length} {queuedFiles.length === 1 ? 'File' : 'Files'})
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded">
                Departments Auto-Detected
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors"
            >
              Clear Queue
            </button>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {queuedFiles.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                {/* File info */}
                <div className="flex items-center gap-2.5 min-w-[200px]">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold text-slate-900 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{item.sizeKb} KB</p>
                  </div>
                </div>

                {/* Department & Reporting Year Selectors */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-0.5">
                      Department
                    </label>
                    <select
                      value={item.department}
                      onChange={(e) => handleUpdateItemDept(item.id, e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-0.5">
                      Fiscal Year
                    </label>
                    <select
                      value={item.reportingYear}
                      onChange={(e) => handleUpdateItemYear(item.id, e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {AVAILABLE_YEARS.map((yr) => (
                        <option key={yr} value={yr}>
                          FY {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-white transition-colors mt-3"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Add More Files
            </button>

            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {isUploading
                  ? `Ingesting & Validating ${queuedFiles.length} Files...`
                  : `Upload & Validate ${queuedFiles.length} ${queuedFiles.length === 1 ? 'File' : 'Files'}`}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
