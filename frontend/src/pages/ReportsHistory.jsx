import React, { useState, useEffect } from 'react';
import { useReportingYear } from '../context/ReportingYearContext';
import { reportService } from '../services/reportService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import { FileText, Download, FileSpreadsheet, Calendar, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReportsHistory() {
  const { reportingYear } = useReportingYear();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const list = await reportService.getReports(null);
        setReports(list || []);
      } catch (err) {
        console.error('Failed to load reports history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [reportingYear]);

  const handleDownloadPdf = async (report) => {
    try {
      setDownloadingId(report.report_id);
      await reportService.downloadPdf(report.report_id, report.content, report.reporting_year);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving institutional report archive..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional ESG Report Archive</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit history, published PDF disclosures, and verifiable quantitative metric workbooks.
          </p>
        </div>

        <Link
          to="/reports/generate"
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span>Generate New Report</span>
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto my-8">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 mb-1">No Published Reports</h3>
          <p className="text-xs text-slate-500 mb-4">
            You have not generated any corporate ESG reports yet. Navigate to the AI Report Generator to create your first report.
          </p>
          <Link
            to="/reports/generate"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate FY Report</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Published Corporate Reports & Audit Ledgers
            </h3>
            <span className="text-xs text-slate-500">{reports.length} Total Editions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/60 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Report Edition</th>
                  <th className="p-3">Reporting Period</th>
                  <th className="p-3">Framework Standard</th>
                  <th className="p-3">Generation Date</th>
                  <th className="p-3">Audit Status</th>
                  <th className="p-3 text-right">Downloads & Artifacts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reports.map((rep) => (
                  <tr key={rep.report_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{rep.company_name} ESG Report</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {rep.report_id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-semibold text-slate-800">
                      FY {rep.reporting_year}
                    </td>

                    <td className="p-3">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        {rep.framework}
                      </span>
                    </td>

                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(rep.generated_at).toLocaleString()}
                    </td>

                    <td className="p-3">
                      <Badge variant={rep.report_status === 'approved' ? 'success' : 'neutral'}>
                        {rep.report_status || 'draft'}
                      </Badge>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadPdf(rep)}
                          disabled={downloadingId === rep.report_id}
                          className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-colors disabled:opacity-50"
                        >
                          {downloadingId === rep.report_id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>PDF</span>
                        </button>

                        <button
                          onClick={() => reportService.downloadExcel(rep.reporting_year)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                          <span>XLSX</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
