import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Copy, Ban, BarChart2 } from 'lucide-react';

export default function QualityScoreWidget({
  score = 100,
  completeness = 100,
  duplicates = 0,
  missingCells = 0,
  negatives = 0,
  outliers = 0,
}) {
  let scoreColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score < 75) scoreColor = 'text-rose-700 bg-rose-50 border-rose-200';
  else if (score < 90) scoreColor = 'text-amber-700 bg-amber-50 border-amber-200';

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Data Quality Score</h4>
          <p className="text-[11px] text-slate-400">Completeness & statistical anomaly index</p>
        </div>
        <div className={`text-xl font-extrabold px-3 py-1 rounded-xl border ${scoreColor}`}>
          {score}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-600 font-medium">Completeness</span>
          </div>
          <span className="font-bold text-slate-900">{completeness}%</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-amber-500" />
            <span className="text-slate-600 font-medium">Duplicates</span>
          </div>
          <span className={`font-bold ${duplicates > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {duplicates}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-rose-500" />
            <span className="text-slate-600 font-medium">Negative Violations</span>
          </div>
          <span className={`font-bold ${negatives > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {negatives}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-sky-500" />
            <span className="text-slate-600 font-medium">IQR Outliers</span>
          </div>
          <span className={`font-bold ${outliers > 0 ? 'text-sky-600' : 'text-slate-900'}`}>
            {outliers}
          </span>
        </div>
      </div>
    </div>
  );
}

