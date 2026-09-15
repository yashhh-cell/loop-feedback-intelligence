"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Inbox,
  AlertTriangle,
  Smile,
  Frown,
  Activity,
  Calendar,
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  FileText,
} from "lucide-react";
import { IngestModal } from "@/components/ingest-modal";

export default function DashboardPage() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ingestModalOpen, setIngestModalOpen] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${days}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [days]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Feedback Intelligence Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time sentiment aggregation, theme clustering, and spike telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            {[
              { label: "7D", val: 7 },
              { label: "14D", val: 14 },
              { label: "30D", val: 30 },
              { label: "90D", val: 90 },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => setDays(p.val)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  days === p.val
                    ? "bg-indigo-600 text-white font-semibold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIngestModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ingest Feedback</span>
          </button>
        </div>
      </div>

      {/* Spike Alert Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Spike Alert Detected
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                +140% Volume
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Customer complaints regarding <strong>Search, Indexing & Filter Latency</strong> spiked sharply over the past 7 days.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/trends"
            className="text-xs font-medium text-amber-300 hover:text-amber-200 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition flex items-center gap-1"
          >
            <span>Investigate Trend</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !data ? (
        <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">Calculating customer intelligence metrics...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Feedback */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Total Feedback</span>
                <Inbox className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {data?.totalCount || 0}
                </span>
                <span
                  className={`text-xs font-medium flex items-center ${
                    data?.totalDelta >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {data?.totalDelta >= 0 ? "+" : ""}
                  {data?.totalDelta}% vs prior
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">In last {days} days</p>
            </div>

            {/* % Negative Feedback */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>% Negative</span>
                <Frown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-400 tracking-tight">
                  {data?.negPercent || 0}%
                </span>
                <span className="text-[11px] text-slate-400">of total volume</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Requires customer review</p>
            </div>

            {/* % Positive Feedback */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>% Positive</span>
                <Smile className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                  {data?.posPercent || 0}%
                </span>
                <span className="text-[11px] text-slate-400">delighted users</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Promoter sentiment</p>
            </div>

            {/* New This Week */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Pending Review</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-400 tracking-tight">
                  {data?.newThisWeek || 0}
                </span>
                <span className="text-xs text-slate-400">in NEW status</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Awaiting triage</p>
            </div>

            {/* Net Sentiment Index */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Net Sentiment Index</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {data ? (data.posPercent - data.negPercent > 0 ? `+${data.posPercent - data.negPercent}` : data.posPercent - data.negPercent) : 0}
                </span>
                <span className="text-xs text-indigo-400 font-mono">Index (-100..100)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Avg score: {data?.avgSentimentScore || 0}</p>
            </div>
          </div>

          {/* Charts Row 1: Volume Over Time & Sentiment Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Volume Over Time (2 cols) */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Feedback Volume & Sentiment Over Time</h3>
                  <p className="text-xs text-slate-400">Daily frequency grouped by positive, neutral, and negative classification</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400"/> POS</span>
                  <span className="flex items-center gap-1 text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-400"/> NEU</span>
                  <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-400"/> NEG</span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                    <Area type="monotone" dataKey="pos" stroke="#10b981" fillOpacity={1} fill="url(#colorPos)" strokeWidth={2} name="Positive" />
                    <Area type="monotone" dataKey="neg" stroke="#ef4444" fillOpacity={1} fill="url(#colorNeg)" strokeWidth={2} name="Negative" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sentiment Breakdown Donut (1 col) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Sentiment Distribution</h3>
                <p className="text-xs text-slate-400">Classified proportion of customer feedback</p>
              </div>

              <div className="h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.sentimentDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(data?.sentimentDistribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center score display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white">{data?.posPercent || 0}%</span>
                  <span className="text-[10px] uppercase font-semibold text-emerald-400">Positive</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                {(data?.sentimentDistribution || []).map((s: any) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-mono text-slate-400 font-medium">
                      {s.value} items ({s.percent}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts Row 2: Top Themes & Channel Ingestion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Themes Distribution */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Top Themes by Feedback Volume</h3>
                  <p className="text-xs text-slate-400">Highest frequency clusters tagged across feedback</p>
                </div>
                <Link
                  href="/trends"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <span>All Themes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.topThemes || []}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      width={120}
                      tickFormatter={(v) => v.length > 18 ? `${v.slice(0, 16)}...` : v}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} name="Feedback Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ingestion Channels Breakdown */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Ingestion Channel Distribution</h3>
                  <p className="text-xs text-slate-400">Breakdown across support tickets, app store, surveys, and calls</p>
                </div>
                <Link
                  href="/inbox"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <span>Go to Inbox</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.channelBreakdown || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="channel" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Items" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Global Ingest Modal */}
      <IngestModal
        isOpen={ingestModalOpen}
        onClose={() => setIngestModalOpen(false)}
        onSuccess={() => fetchStats()}
      />
    </div>
  );
}