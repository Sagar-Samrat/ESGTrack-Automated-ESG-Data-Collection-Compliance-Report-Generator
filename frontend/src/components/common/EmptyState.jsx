import React from 'react';
import { Database, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  title = 'No Data Available',
  description = 'No activity records have been ingested for the selected period.',
  actionText = 'Upload Dataset',
  actionLink = '/upload',
  icon: Icon = Database,
}) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mx-auto mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
      {actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{actionText}</span>
        </Link>
      )}
    </div>
  );
}

