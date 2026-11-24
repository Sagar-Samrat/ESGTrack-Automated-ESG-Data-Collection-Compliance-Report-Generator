import React from 'react';
import { Eye, FileCheck, Layers } from 'lucide-react';

export default function DataPreviewTable({ previewData }) {
  if (!previewData || !previewData.sample_rows || previewData.sample_rows.length === 0) {
    return null;
  }

  const columns = previewData.columns || [];
  const rows = previewData.sample_rows || [];
  const dtypes = previewData.dtypes || {};
  const missing = previewData.missing_counts || {};

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden space-y-3">
      {/* Table Top Stats */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-700" />
          <span className="font-bold text-slate-800">Dataset Preview</span>
          <span className="text-slate-400">({previewData.filename})</span>
        </div>
        <div className="flex items-center gap-4 text-slate-600 font-medium">
          <span>Total Rows: <b className="text-slate-900">{previewData.total_rows}</b></span>
          <span>Columns: <b className="text-slate-900">{previewData.total_columns}</b></span>
          <span>Sample Displayed: <b className="text-slate-900">{rows.length} rows</b></span>
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600">
              <th className="p-2.5 font-bold uppercase tracking-wider text-[10px] text-slate-400 w-12 text-center">
                #
              </th>
              {columns.map((col) => (
                <th key={col} className="p-2.5 font-semibold text-slate-700">
                  <div className="flex flex-col">
                    <span className="font-mono text-slate-900 font-bold">{col}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {dtypes[col] || 'text'} {missing[col] > 0 && `• ${missing[col]} missing`}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-2.5 text-center text-[11px] text-slate-400 font-mono">
                  {idx + 1}
                </td>
                {columns.map((col) => {
                  const val = row[col];
                  const isNull = val === null || val === undefined;
                  const isNegative = typeof val === 'number' && val < 0;

                  return (
                    <td key={col} className="p-2.5 font-mono text-xs">
                      {isNull ? (
                        <span className="text-amber-500 italic bg-amber-50 px-1 rounded text-[10px]">null</span>
                      ) : isNegative ? (
                        <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded">{val}</span>
                      ) : (
                        <span>{String(val)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

