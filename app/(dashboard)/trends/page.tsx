"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ThemeWithStats } from "@/types";
import { SentimentBadge } from "@/components/badges";
import {
  TrendingUp,
  AlertTriangle,
  Tag,
  Plus,
  ArrowRight,
  Sparkles,
  BarChart2,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function TrendsPage() {
  const { data: session } = useSession();
  const [themes, setThemes] = useState<ThemeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Theme Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isViewer = session?.user?.role === "VIEWER";

  const fetchThemes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/themes");
      const data = await res.json();
      if (data.themes) {
        setThemes(data.themes);
      }
    } catch (err) {
      console.error("Failed to load themes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleCreateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isViewer) return;

    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, color }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create theme");

      setName("");
      setDescription("");
      setCreateModalOpen(false);
      fetchThemes();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const spikeCount = themes.filter((t) => t.isSpike).length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Themes & Trend Velocity
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated semantic clusters, velocity comparison vs previous 7-day period, and spike alerts
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          disabled={isViewer}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>New Theme Cluster</span>
        </button>
      </div>

      {/* Spike Detection Summary Banner */}
      {spikeCount > 0 && (
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-slate-900 to-indigo-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Critical Theme Spikes Detected ({spikeCount})
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                  Attention Required
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Themes marked with <strong>Spike Detected</strong> experienced &gt;40% growth in customer volume over the current 7-day window.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Themes Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs">Computing theme velocities and clustering data...</p>
        </div>
      ) : themes.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <Tag className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">No themes found</p>
          <p className="text-xs text-slate-500">Create a custom theme cluster or ingest feedback to start auto-tagging.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {themes.map((theme) => {
            const sentimentLabel =
              theme.avgSentiment > 0.15
                ? "POS"
                : theme.avgSentiment < -0.15
                ? "NEG"
                : "NEU";

            return (
              <div
                key={theme.id}
                className={`rounded-2xl border bg-slate-900/60 p-6 flex flex-col justify-between backdrop-blur-xl transition hover:border-slate-700 relative overflow-hidden ${
                  theme.isSpike
                    ? "border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20"
                    : "border-slate-800"
                }`}
              >
                {/* Spike Tag */}
                {theme.isSpike && (
                  <div className="absolute top-0 right-0 rounded-bl-xl bg-amber-500/20 border-l border-b border-amber-500/40 px-3 py-1 text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Spike Detected</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Color swatch & title */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 mt-1 ring-2 ring-offset-2 ring-offset-slate-900"
                      style={{ backgroundColor: theme.color }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {theme.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {theme.description || "Automatic semantic cluster"}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total</span>
                      <span className="text-base font-bold text-white font-mono">{theme.count}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Velocity (7D)</span>
                      <span
                        className={`text-base font-bold font-mono flex items-center ${
                          theme.growthRate > 0
                            ? "text-rose-400"
                            : theme.growthRate < 0
                            ? "text-emerald-400"
                            : "text-slate-400"
                        }`}
                      >
                        {theme.growthRate > 0 ? `+${theme.growthRate}%` : `${theme.growthRate}%`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Sentiment</span>
                      <div className="mt-0.5">
                        <SentimentBadge sentiment={sentimentLabel} score={theme.avgSentiment} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* 7-Day Velocity Context */}
                  <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 flex items-center justify-between">
                    <span>Current 7 Days: <strong className="text-white font-mono">{theme.recentCount}</strong> items</span>
                    <span>Prior 7 Days: <strong className="text-slate-300 font-mono">{theme.previousCount}</strong></span>
                  </div>
                </div>

                {/* Click-through Action */}
                <div className="pt-4 mt-4 border-t border-slate-800/80">
                  <Link
                    href={`/inbox?themeId=${theme.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/60 transition group"
                  >
                    <span>View Underlying Feedback</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Theme Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white">Create Custom Theme</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTheme} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Theme Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Export & CSV Downloads"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What customer issues or feature areas does this theme cover?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Theme Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-32 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !name.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : "Create Theme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}