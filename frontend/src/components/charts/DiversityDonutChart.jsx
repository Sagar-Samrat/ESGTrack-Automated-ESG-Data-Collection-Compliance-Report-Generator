import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function DiversityDonutChart({ female = 0, male = 0, other = 0 }) {
  const numFemale = Number(female) || 0;
  const numMale = Number(male) || 0;
  const numOther = Number(other) || 0;
  const total = numFemale + numMale + numOther;

  const femalePct = total > 0 ? ((numFemale / total) * 100).toFixed(1) : '0.0';
  const malePct = total > 0 ? ((numMale / total) * 100).toFixed(1) : '0.0';
  const otherPct = total > 0 ? ((numOther / total) * 100).toFixed(1) : '0.0';

  const data = [
    { name: 'Female', value: numFemale, color: '#10b981' },
    { name: 'Male', value: numMale, color: '#3b82f6' },
    { name: 'Non-Binary / Undisclosed', value: numOther, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        No workforce demographic data found.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-200 text-xs min-w-[150px]">
          <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-100">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.payload.color }}
            />
            <span className="font-bold text-slate-800">{item.name}</span>
          </div>
          <div className="text-slate-600 flex items-baseline justify-between gap-3">
            <span className="text-sm font-extrabold text-slate-900">
              {item.value} <span className="text-xs font-medium text-slate-500">Employees</span>
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {pct}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-3">
      {/* Donut Chart with Center Total */}
      <div className="relative h-48 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              innerRadius={54}
              outerRadius={78}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Count Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            {total}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Total Staff
          </span>
        </div>
      </div>

      {/* High-Visibility Metrics Breakdown Badges */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-lg p-2 transition-all hover:bg-emerald-50">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-800 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            Female
          </div>
          <div className="text-lg font-black text-slate-900">{numFemale}</div>
          <div className="text-[10px] font-semibold text-emerald-700">{femalePct}% of staff</div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/90 rounded-lg p-2 transition-all hover:bg-blue-50">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-blue-800 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            Male
          </div>
          <div className="text-lg font-black text-slate-900">{numMale}</div>
          <div className="text-[10px] font-semibold text-blue-700">{malePct}% of staff</div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/90 rounded-lg p-2 transition-all hover:bg-amber-50">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-800 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            Other
          </div>
          <div className="text-lg font-black text-slate-900">{numOther}</div>
          <div className="text-[10px] font-semibold text-amber-700">{otherPct}% of staff</div>
        </div>
      </div>
    </div>
  );
}
