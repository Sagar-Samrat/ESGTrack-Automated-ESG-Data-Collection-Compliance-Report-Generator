import React, { useState, useEffect } from 'react';
import { useReportingYear } from '../context/ReportingYearContext';
import { metricsService } from '../services/metricsService';
import { uploadService } from '../services/uploadService';
import { reportService } from '../services/reportService';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmissionsTrendChart from '../components/charts/EmissionsTrendChart';
import DiversityDonutChart from '../components/charts/DiversityDonutChart';
import YoYComparisonChart from '../components/charts/YoYComparisonChart';
import {
  Leaf,
  Zap,
  Droplets,
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  UploadCloud,
  FileText,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Download,
  Loader2,
  Calendar,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { reportingYear, setReportingYear } = useReportingYear();
  const [data, setData] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingReportId, setDownloadingReportId] = useState(null);
  const [quickGenerating, setQuickGenerating] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, uploadsRes, reportsRes] = await Promise.all([
        metricsService.getDashboardSummary(reportingYear),
        uploadService.getUploads(null, null),
        reportService.getReports(null),
      ]);
      setData(dashRes);
      setUploads(uploadsRes || []);
      setReports(reportsRes || []);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      setError(err.response?.data?.detail || 'Unable to load live ESG telemetry. Please verify connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [reportingYear]);

  const handleDownloadPdf = async (report) => {
    try {
      setDownloadingReportId(report.report_id);
      await reportService.downloadPdf(report.report_id, report.content, report.reporting_year);
    } catch (err) {
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingReportId(null);
    }
  };

  const handleQuickGenerateReport = async () => {
    try {
      setQuickGenerating(true);
      await reportService.generateReport(reportingYear, 'GRI Standards', ['Environmental', 'Social', 'Governance']);
      const updatedReports = await reportService.getReports(null);
      setReports(updatedReports || []);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate compliance report.');
    } finally {
      setQuickGenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Calculating FY metrics and assembling dashboard..." />;
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
        <button
          type="button"
          onClick={fetchDashboardData}
          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const env = data?.environmental || {};
  const soc = data?.social || {};
  const gov = data?.governance || {};
  const yoy = data?.yoy_comparison?.metrics || [];
  const qualityAlerts = data?.quality_alerts || [];

  const getYoyMetric = (name) => yoy.find((m) => m.metric_name === name);
  const ghgYoy = getYoyMetric('Total GHG Emissions');
  const elecYoy = getYoyMetric('Electricity Consumption');
  const waterYoy = getYoyMetric('Water Consumption');
  const diversityYoy = getYoyMetric('Gender Diversity');

  const ingestedYearSet = new Set();
  uploads.forEach((u) => {
    if (Array.isArray(u.ingested_years) && u.ingested_years.length > 0) {
      u.ingested_years.forEach((y) => ingestedYearSet.add(Number(y)));
    } else if (u.reporting_year) {
      ingestedYearSet.add(Number(u.reporting_year));
    }
  });
  const ingestedYearsList = Array.from(ingestedYearSet).sort((a, b) => b - a);

  const latestUploadTime = uploads.length > 0 ? new Date(uploads[0].uploaded_at).getTime() : 0;
  const latestReportTime = reports.length > 0 ? new Date(reports[0].generated_at).getTime() : 0;
  const hasNewerUploadsThanReport = uploads.length > 0 && (reports.length === 0 || latestUploadTime > latestReportTime);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              FY {reportingYear} ESG Intelligence
            </span>
            <span className="text-xs text-slate-300 font-mono">GHG Protocol Verified</span>
            {ingestedYearsList.length > 0 && (
              <div className="flex items-center gap-1 ml-1">
                <span className="text-[10px] text-emerald-200/80">Live Data:</span>
                {ingestedYearsList.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setReportingYear(yr)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      yr === reportingYear
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-white/10 hover:bg-white/20 text-emerald-100'
                    }`}
                    title={`Switch dashboard to FY ${yr}`}
                  >
                    FY {yr}
                  </button>
                ))}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {data?.company_name || 'Enterprise'} Sustainability Command Center
          </h1>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
            Automated telemetry from multi-departmental activity data. Track emissions reductions, workforce DEI targets, and board governance disclosures.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/upload"
            className="px-4 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Data</span>
          </Link>
          <Link
            to="/reports/generate"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Generate Report</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Carbon Footprint"
          value={env.total_ghg_tco2e || 0}
          unit="tCO2e"
          trend={ghgYoy?.trend}
          change={ghgYoy?.percentage_change}
          favorable={ghgYoy?.favorable ?? true}
          icon={Leaf}
          subtitle="Scope 1, 2 & 3"
        />
        <StatCard
          title="Grid Electricity"
          value={Math.round((env.electricity_kwh || 0) / 1000)}
          unit="k kWh"
          trend={elecYoy?.trend}
          change={elecYoy?.percentage_change}
          favorable={elecYoy?.favorable ?? true}
          icon={Zap}
          subtitle={`${env.renewable_percentage || 0}% Renewable`}
        />
        <StatCard
          title="Water Consumption"
          value={(env.water_m3 || 0).toLocaleString()}
          unit="m³"
          trend={waterYoy?.trend}
          change={waterYoy?.percentage_change}
          favorable={waterYoy?.favorable ?? true}
          icon={Droplets}
          subtitle="Municipal & Well"
        />
        <StatCard
          title="Workforce Diversity"
          value={`${soc.gender_diversity_pct || 0}%`}
          unit=""
          trend={diversityYoy?.trend}
          change={diversityYoy?.percentage_change}
          favorable={diversityYoy?.favorable ?? true}
          icon={Users}
          subtitle={`${soc.total_employees || 0} Total Staff`}
        />
        <StatCard
          title="ESG Data Completeness"
          value={`${data?.data_completeness_pct ?? 0}%`}
          unit=""
          trend="increase"
          change={undefined}
          favorable={true}
          icon={CheckCircle}
          subtitle={`${data?.recent_uploads_count ?? uploads.length} Active Datasets`}
        />
      </div>

      {/* Primary Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environmental GHG Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>Monthly GHG Emissions Trajectory (FY {reportingYear})</span>
              </h3>
              <p className="text-xs text-slate-400">Total monthly footprint (tCO2e) across facilities</p>
            </div>
            <Link to="/environmental" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">
              <span>Detailed Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <EmissionsTrendChart data={env.monthly_breakdown || []} />
        </div>

        {/* Social Diversity Donut */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Gender Diversity Distribution</span>
              </h3>
              <p className="text-xs text-slate-400">{soc.total_employees || 0} total headcount</p>
            </div>
            <Link to="/social" className="text-xs font-semibold text-sky-700 hover:underline">
              View HR
            </Link>
          </div>
          <DiversityDonutChart
            female={soc.female_employees}
            male={soc.male_employees}
            other={soc.other_employees}
          />
        </div>
      </div>

      {/* Secondary Section: Year-over-Year & Governance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* YoY Comparative Performance */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Year-over-Year Comparative Analysis (FY {reportingYear} vs {reportingYear - 1})</span>
              </h3>
              <p className="text-xs text-slate-400">Standardized variance against historical corporate baseline</p>
            </div>
            <Link to="/analytics" className="text-xs font-semibold text-emerald-700 hover:underline">
              Full Analytics
            </Link>
          </div>
          <YoYComparisonChart metrics={yoy} />
        </div>

        {/* Governance & Compliance Overview */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Governance & Oversight</span>
              </h3>
              <p className="text-xs text-slate-400">Board integrity & compliance posture</p>
            </div>
            <Link to="/governance" className="text-xs font-semibold text-indigo-700 hover:underline">
              Review
            </Link>
          </div>

          <div className="space-y-3 text-xs pt-1">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Board Independence</p>
                <p className="text-[11px] text-slate-400">{gov.independent_board_members} of {gov.total_board_members} Directors</p>
              </div>
              <span className="text-sm font-bold text-slate-900">{gov.board_independence_pct}%</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Ethics & Anti-Bribery Training</p>
                <p className="text-[11px] text-slate-400">{gov.ethics_training_completed} of {gov.ethics_training_eligible} Staff</p>
              </div>
              <span className="text-sm font-bold text-slate-900">{gov.ethics_training_completion_pct}%</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Anti-Corruption Whistleblower</p>
                <p className="text-[11px] text-slate-400">Formal Policy Adopted</p>
              </div>
              <Badge variant={String(gov.anti_corruption_policy || '').toLowerCase() === 'yes' ? 'success' : 'warning'}>
                {String(gov.anti_corruption_policy || '').toLowerCase() === 'yes' ? 'Active' : (gov.anti_corruption_policy || 'Pending')}
              </Badge>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Annual Board Meetings</p>
                <p className="text-[11px] text-slate-400">Quorum verified</p>
              </div>
              <span className="text-sm font-bold text-slate-900">{gov.board_meeting_count} Meetings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Section: Recent Ingested Datasets & Recent Compliance Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-700" />
                <span>Recent Ingested Datasets</span>
              </h3>
              <p className="text-xs text-slate-400">Live departmental uploads across reporting cycles</p>
            </div>
            <Link to="/upload" className="text-xs font-semibold text-emerald-700 hover:underline">
              Upload Files
            </Link>
          </div>

          {uploads.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No departmental files uploaded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {uploads.slice(0, 5).map((up) => {
                const targetYr = up.ingested_years?.[up.ingested_years.length - 1] || up.reporting_year;
                return (
                  <div key={up.upload_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {up.department.charAt(0)}
                      </div>
                      <div className="truncate">
                        <Link
                          to={`/data-management?upload_id=${up.upload_id}`}
                          className="font-semibold text-slate-800 hover:text-emerald-700 hover:underline truncate block"
                          title={up.filename}
                        >
                          {up.filename}
                        </Link>
                        <p className="text-[11px] text-slate-400">
                          {up.department} • {up.total_rows} records • {new Date(up.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setReportingYear(Number(targetYr))}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 transition-colors"
                        title={`View dashboard metrics for FY ${targetYr}`}
                      >
                        {Array.isArray(up.ingested_years) && up.ingested_years.length > 1
                          ? `FY ${up.ingested_years[0]}–${up.ingested_years[up.ingested_years.length - 1]}`
                          : `FY ${up.ingested_years?.[0] || up.reporting_year}`}
                      </button>
                      <Badge variant={up.status === 'cleaned' ? 'success' : 'info'}>
                        {up.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Generated Reports */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Recent Generated Reports</span>
              </h3>
              <p className="text-xs text-slate-400">Published ESG compliance disclosures & exports</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleQuickGenerateReport}
                disabled={quickGenerating}
                className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {quickGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>{quickGenerating ? 'Generating...' : `Quick FY ${reportingYear} Report`}</span>
              </button>
              <Link to="/reports/history" className="text-xs font-semibold text-emerald-700 hover:underline">
                Reports History
              </Link>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-slate-400">No ESG compliance reports generated yet.</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickGenerateReport}
                  disabled={quickGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {quickGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate FY {reportingYear} Report</span>
                </button>
                <Link
                  to="/reports/generate"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <span>Custom Builder</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {hasNewerUploadsThanReport && (
                <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-lg text-[11px] flex items-center justify-between gap-2 text-amber-900">
                  <span>New datasets uploaded since last report. Regenerate to reflect updated FY {reportingYear} figures.</span>
                  <button
                    type="button"
                    onClick={handleQuickGenerateReport}
                    disabled={quickGenerating}
                    className="font-bold text-emerald-800 hover:underline shrink-0 disabled:opacity-50"
                  >
                    {quickGenerating ? 'Updating...' : 'Update Now →'}
                  </button>
                </div>
              )}
              <div className="divide-y divide-slate-100 text-xs">
                {reports.slice(0, 5).map((rep) => (
                  <div key={rep.report_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0">
                        <FileText className="w-4 h-4 text-sky-700" />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-slate-800 truncate">
                          {rep.framework} Annual ESG Disclosure
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>FY {rep.reporting_year}</span>
                          <span>•</span>
                          <span>{new Date(rep.generated_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={rep.report_status === 'approved' ? 'success' : 'info'}>
                        {rep.report_status || 'Draft'}
                      </Badge>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(rep)}
                        disabled={downloadingReportId === rep.report_id}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-md font-semibold text-[11px] flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                        title="Download PDF"
                      >
                        {downloadingReportId === rep.report_id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                        ) : (
                          <Download className="w-3 h-3 text-emerald-700" />
                        )}
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Data Quality & Integrity Alerts */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Data Quality & Integrity Alerts</span>
            </h3>
            <p className="text-xs text-slate-400">Live schema validation & anomaly detection across uploaded datasets</p>
          </div>
          <Link to="/data-management" className="text-xs font-semibold text-amber-700 hover:underline">
            Review in Data Engine →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {qualityAlerts.map((al, idx) => {
            const isWarn = al.severity === 'warning' || al.severity === 'error';
            const isSuccess = al.severity === 'success';
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                  isWarn
                    ? 'bg-amber-50/70 border-amber-200/70'
                    : isSuccess
                    ? 'bg-emerald-50/70 border-emerald-200/70'
                    : 'bg-sky-50/60 border-sky-200/70'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {isWarn ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isSuccess ? 'text-emerald-600' : 'text-sky-600'}`} />
                  )}
                  <div>
                    <p className={`font-semibold ${isWarn ? 'text-amber-900' : isSuccess ? 'text-emerald-900' : 'text-slate-900'}`}>
                      {al.title}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{al.description}</p>
                  </div>
                </div>
                {al.upload_id && (
                  <Link
                    to={`/data-management?upload_id=${al.upload_id}`}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline shrink-0"
                  >
                    Inspect
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
