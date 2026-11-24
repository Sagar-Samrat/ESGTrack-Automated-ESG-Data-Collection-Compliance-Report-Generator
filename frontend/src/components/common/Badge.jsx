import React from 'react';

const variants = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-800 border-rose-200',
  info: 'bg-sky-50 text-sky-800 border-sky-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  forest: 'bg-emerald-900 text-emerald-100 border-emerald-800',
};

export default function Badge({ children, variant = 'neutral', size = 'sm' }) {
  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${variants[variant] || variants.neutral} ${sizeClasses}`}
    >
      {children}
    </span>
  );
}

