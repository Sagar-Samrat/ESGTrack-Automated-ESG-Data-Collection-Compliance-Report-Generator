import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Database,
  Leaf,
  Users,
  ShieldCheck,
  BarChart3,
  Sparkles,
  CheckCircle2,
  FileText,
  Settings,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Data Upload', path: '/upload', icon: UploadCloud },
  { name: 'Data Management', path: '/data-management', icon: Database, badge: 'Quality' },
  { name: 'Environmental', path: '/environmental', icon: Leaf },
  { name: 'Social', path: '/social', icon: Users },
  { name: 'Governance', path: '/governance', icon: ShieldCheck },
  { name: 'ESG Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'AI Report Generator', path: '/reports/generate', icon: Sparkles, highlight: true },
  { name: 'Compliance Center', path: '/compliance', icon: CheckCircle2 },
  { name: 'Reports History', path: '/reports/history', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-800 flex items-center justify-center text-white shadow-sm shadow-emerald-900/20">
          <Leaf className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
            ESG<span className="text-emerald-700">Track</span>
          </span>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 uppercase tracking-wider block -mt-0.5">
            Enterprise Core
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Platform Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm shadow-emerald-900/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-emerald-300'
                          : item.highlight
                          ? 'text-emerald-600 group-hover:text-emerald-700'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-emerald-700 text-emerald-100'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-900">Assurance Standard</span>
            <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
              GRI / IFRS
            </span>
          </div>
          <p className="text-[11px] text-emerald-800/80 leading-relaxed">
            GHG Protocol Corporate Accounting Standard v2.4
          </p>
        </div>
      </div>
    </aside>
  );
}

