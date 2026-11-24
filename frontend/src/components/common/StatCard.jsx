import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function StatCard({
  title,
  value,
  unit,
  change,
  trend = 'stable',
  favorable = true,
  icon: Icon,
  subtitle,
  onClick,
}) {
  const isPositive = trend === 'increase';
  const isNegative = trend === 'decrease';

  let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
  if (change !== undefined && change !== null) {
    if (favorable) {
      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    } else {
      badgeColor = 'bg-rose-50 text-rose-700 border-rose-200/80';
    }
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer hover:border-emerald-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-800 border border-emerald-100/80">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
      </div>

      <div className="flex items-center justify-between text-xs">
        {change !== undefined && change !== null ? (
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${badgeColor}`}>
            {isPositive && <ArrowUpRight className="w-3 h-3" />}
            {isNegative && <ArrowDownRight className="w-3 h-3" />}
            {trend === 'stable' && <Minus className="w-3 h-3" />}
            <span>
              {change > 0 ? `+${change}` : change}% YoY
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400">Verified Activity Data</div>
        )}

        {subtitle && <span className="text-[11px] text-slate-400 font-medium">{subtitle}</span>}
      </div>
    </div>
  );
}

