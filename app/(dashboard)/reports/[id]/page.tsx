"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { VoCReportContent } from "@/types";
import {
  FileText,
  Printer,
  Share2,
  Calendar,
  User,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Quote,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  Loader2,
} from "lucide-react";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [content, setContent] = useState<VoCReportContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setReport(data);
          try {
            setContent(JSON.parse(data.contentJson));
          } catch (e) {
            console.error(e);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading executive report...</p>
      </div>
    );
  }

  if (!report || !content) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-400 text-sm">Report not found or unavailable.</p>
        <Link href="/reports" className="text-indigo-400 hover:underline text-xs">
          Back to reports
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8 print:p-0">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex items-center justify-between no-print border-b border-slate-800 pb-4">
        <Link
          href="/reports"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all reports</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-750 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? "Link Copied!" : "Share Link"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export to PDF / Print</span>
          </button>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="space-y-8 print-card">
        {/* Document Header */}
        <div className="space-y-3 border-b border-slate-800 pb-6 print:border-slate-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 print:border print:text-black">
                Executive Voice-of-Customer Briefing
              </span>
              <span className="text-xs text-slate-500 font-mono">ID: {report.id.slice(0, 8)}</span>
            </div>
            <div className="text-xs text-slate-400">
              Generated: {new Date(report.createdAt).toLocaleDateString()}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white print:text-black">
            {report.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 print:text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Window:{" "}
                <strong className="text-slate-200 print:text-black">
                  {new Date(report.periodStart).toLocaleDateString()} -{" "}
                  {new Date(report.periodEnd).toLocaleDateString()}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Author:{" "}
                <strong className="text-slate-200 print:text-black">
                  {report.generatedBy?.name} ({report.generatedBy?.email})
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3 print:bg-white print:border-slate-300">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Executive Synthesis (Claude Sonnet Narrative)</span>
          </div>
          <div className="text-sm text-slate-200 print:text-black leading-relaxed whitespace-pre-wrap">
            {content.executiveSummary}
          </div>
        </div>

        {/* Scoreboard Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 print:border-slate-300 print:bg-white">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Analyzed</span>
            <span className="text-2xl font-bold text-white print:text-black font-mono mt-1 block">
              {content.sentimentHealth?.totalFeedback || 0}
            </span>
            <span className="text-[11px] text-slate-500">Grounded Records</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 print:border-slate-300 print:bg-white">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Net Sentiment Score</span>
            <span className="text-2xl font-bold text-indigo-400 print:text-black font-mono mt-1 block">
              {content.sentimentHealth?.score > 0 ? `+${content.sentimentHealth.score}` : content.sentimentHealth?.score}
            </span>
            <span className="text-[11px] text-slate-500">{content.sentimentHealth?.label}</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 print:border-slate-300 print:bg-white">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Positive Proportion</span>
            <span className="text-2xl font-bold text-emerald-400 print:text-black font-mono mt-1 block">
              {content.sentimentHealth?.posPercent}%
            </span>
            <span className="text-[11px] text-slate-500">Delighted Users</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 print:border-slate-300 print:bg-white">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Negative Proportion</span>
            <span className="text-2xl font-bold text-rose-400 print:text-black font-mono mt-1 block">
              {content.sentimentHealth?.negPercent}%
            </span>
            <span className="text-[11px] text-slate-500">Critical Friction</span>
          </div>
        </div>

        {/* Top Positive vs Top Negative Themes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Top Positive Themes */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 print:border-slate-300 print:bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Core Satisfaction Drivers</span>
            </h3>
            <div className="space-y-2">
              {content.topPositiveThemes?.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs print:bg-slate-50 print:border-slate-200">
                  <span className="font-semibold text-slate-200 print:text-black">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">{t.count} items</span>
                    <span className="text-emerald-400 font-mono font-bold">+{t.sentimentScore.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Negative Themes */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3 print:border-slate-300 print:bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Primary Customer Friction Points</span>
            </h3>
            <div className="space-y-2">
              {content.topNegativeThemes?.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs print:bg-slate-50 print:border-slate-200">
                  <span className="font-semibold text-slate-200 print:text-black">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">{t.count} items</span>
                    <span className="text-rose-400 font-mono font-bold">{t.sentimentScore.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Drivers and Friction Detail */}
        {content.keyDriversAndFriction && content.keyDriversAndFriction.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
              High-Impact Friction Breakdown
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {content.keyDriversAndFriction.map((df, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs space-y-1.5 print:border-slate-300 print:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white print:text-black">{df.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        df.severity === "HIGH"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : df.severity === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {df.severity} Severity
                    </span>
                  </div>
                  <p className="text-slate-300 print:text-black leading-relaxed">{df.description}</p>
                  <p className="text-[11px] text-slate-500">
                    Impacted Audience: <em>{df.affectedCustomers}</em>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Direct Customer Quotes */}
        {content.representativeQuotes && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Quote className="w-4 h-4" />
                <span>Representative Praise Quotes</span>
              </h3>
              <div className="space-y-2.5">
                {content.representativeQuotes.positive?.map((q, idx) => (
                  <div key={idx} className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5 text-xs text-slate-200 print:text-black print:bg-white space-y-1">
                    <p className="italic">"{q.quote}"</p>
                    <p className="text-[10px] text-emerald-400 font-medium">— {q.customer} ({q.channel})</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Quote className="w-4 h-4" />
                <span>Representative Complaint Quotes</span>
              </h3>
              <div className="space-y-2.5">
                {content.representativeQuotes.negative?.map((q, idx) => (
                  <div key={idx} className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-3.5 text-xs text-slate-200 print:text-black print:bg-white space-y-1">
                    <p className="italic">"{q.quote}"</p>
                    <p className="text-[10px] text-rose-400 font-medium">— {q.customer} ({q.channel})</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Prioritized Strategic Actions */}
        {content.recommendedActions && content.recommendedActions.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider">
              Prioritized Product & Engineering Roadmap
            </h3>
            <div className="space-y-2.5">
              {content.recommendedActions.map((act, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs flex items-start gap-3.5 print:border-slate-300 print:bg-white"
                >
                  <span
                    className={`shrink-0 px-2 py-1 rounded text-xs font-extrabold uppercase font-mono ${
                      act.priority === "P0"
                        ? "bg-rose-500 text-white"
                        : act.priority === "P1"
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {act.priority}
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white print:text-black">{act.action}</span>
                      <span className="text-[11px] text-slate-400 font-mono">Owner: {act.owner}</span>
                    </div>
                    <p className="text-slate-400 print:text-slate-700">{act.rationale}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}