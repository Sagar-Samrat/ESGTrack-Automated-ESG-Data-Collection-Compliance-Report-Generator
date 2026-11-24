import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useReportingYear } from '../../context/ReportingYearContext';
import { metricsService } from '../../services/metricsService';
import {
  Bell,
  Calendar,
  Building2,
  ChevronDown,
  LogOut,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { reportingYear, setReportingYear, availableYears } = useReportingYear();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);

  const loadAlerts = async () => {
    try {
      const summary = await metricsService.getDashboardSummary(reportingYear);
      setAlerts(summary?.quality_alerts || []);
      setAlertsCount(summary?.quality_alerts_count ?? 0);
    } catch {
      // Keep quiet on navbar polling if unauthenticated/transient
    }
  };

  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user, reportingYear]);

  const handleToggleNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState && user) {
      loadAlerts();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Organization Badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-700 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg text-sm font-medium">
          <Building2 className="w-4 h-4 text-emerald-700" />
          <span className="font-semibold text-slate-800">
            {user?.companyName || 'GreenScale Technologies Corp'}
          </span>
          <span className="text-xs text-slate-400 font-mono">|</span>
          <span className="text-xs text-emerald-700 font-medium">Tier-1 Issuer</span>
        </div>
      </div>

      {/* Right Controls: Year Selector, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Reporting Year Selector */}
        <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 px-3 py-1.5 rounded-lg text-sm transition-colors">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500 font-medium">Reporting Year:</span>
          <select
            value={reportingYear}
            onChange={(e) => setReportingYear(Number(e.target.value))}
            className="bg-transparent font-semibold text-slate-800 text-sm focus:outline-none cursor-pointer"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                FY {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {alertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
            {alertsCount === 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Audit & Data Alerts
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  alertsCount > 0 ? 'text-amber-800 bg-amber-50' : 'text-emerald-700 bg-emerald-50'
                }`}>
                  {alertsCount > 0 ? `${alertsCount} Active` : 'Verified'}
                </span>
              </div>
              <div className="space-y-2 text-xs max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-2 text-slate-500 text-[11px]">
                    No pending quality alerts for FY {reportingYear}.
                  </div>
                ) : (
                  alerts.map((al, i) => {
                    const isWarn = al.severity === 'warning' || al.severity === 'error';
                    const isSuccess = al.severity === 'success';
                    return (
                      <Link
                        key={i}
                        to={al.upload_id ? `/data-management?upload_id=${al.upload_id}` : '/data-management'}
                        onClick={() => setShowNotifications(false)}
                        className={`p-2 rounded-lg border flex items-start gap-2 transition-opacity hover:opacity-90 ${
                          isWarn
                            ? 'bg-amber-50 border-amber-200/60'
                            : isSuccess
                            ? 'bg-emerald-50 border-emerald-200/60'
                            : 'bg-sky-50 border-sky-200/60'
                        }`}
                      >
                        {isWarn ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : isSuccess ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`font-medium ${
                            isWarn ? 'text-amber-900' : isSuccess ? 'text-emerald-900' : 'text-slate-900'
                          }`}>
                            {al.title}
                          </p>
                          <p className={`text-[11px] ${
                            isWarn ? 'text-amber-700' : isSuccess ? 'text-emerald-700' : 'text-slate-600'
                          }`}>
                            {al.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-100">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || 'Sustainability Auditor'}
              </div>
              <div className="text-[10px] text-slate-400 capitalize">
                {user?.role || 'Admin'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'officer@greenscale.io'}</p>
              </div>
              <div className="py-1">
                <div className="px-3 py-1.5 text-xs text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Company ID: <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">{user?.companyId?.slice(0, 10)}...</code></span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
