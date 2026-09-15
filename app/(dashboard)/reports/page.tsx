"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
  Loader2,
  TrendingUp,
  X,
} from "lucide-react";

interface ReportSummary {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  generatedBy: {
    name: string;
    email: string;
  };
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [periodDays, setPeriodDays] = useState(30);
  const [customTitle, setCustomTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isViewer = session?.user?.role === "VIEWER";

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodDays,
          title: customTitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");

      setModalOpen(false);
      setCustomTitle("");
      fetchReports();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Voice-of-Customer (VoC) Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Two-stage verified synthesis: deterministic metrics pre-computed in code + Claude executive narrative
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          disabled={isViewer}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate VoC Report</span>
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs">Loading historical reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-20 text-center space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
          <FileText className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-200">No VoC Reports Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Generate your first executive Voice-of-Customer report to summarize key sentiment drivers and recommendations.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            disabled={isViewer}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition mt-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between backdrop-blur-xl hover:border-slate-700 transition space-y-4 shadow-xl group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                    Executive Briefing
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition leading-snug">
                  {report.title}
                </h3>

                <div className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {new Date(report.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                      -{" "}
                      {new Date(report.periodEnd).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Generated by {report.generatedBy?.name || "System"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <Link
                  href={`/reports/${report.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700/60 transition group-hover:bg-indigo-600 group-hover:border-indigo-500 group-hover:text-white"
                >
                  <span>Read Executive Report</span>
                  <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generator Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Generate VoC Report</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Analysis Time Window
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "7 Days", val: 7 },
                    { label: "14 Days", val: 14 },
                    { label: "30 Days", val: 30 },
                    { label: "90 Days", val: 90 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setPeriodDays(p.val)}
                      className={`py-2 text-xs font-medium rounded-xl border transition ${
                        periodDays === p.val
                          ? "bg-indigo-600 border-indigo-500 text-white font-semibold"
                          : "border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Report Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Customer Satisfaction & Retention Review"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-3 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-indigo-300 block">Deterministic Two-Stage Pipeline:</span>
                <p>1. Code calculates exact metrics, sentiment deltas, and extracts top quotes.</p>
                <p>2. Claude drafts the executive narrative around verified numbers with zero hallucination.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Synthesizing VoC Narrative...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}