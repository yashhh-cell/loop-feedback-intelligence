"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { FeedbackRecord, FeedbackStatus } from "@/types";
import { SentimentBadge, ChannelBadge, StatusBadge } from "@/components/badges";
import {
  X,
  Sparkles,
  RefreshCw,
  Clock,
  User,
  Tag,
  Hash,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";

interface FeedbackDrawerProps {
  feedback: FeedbackRecord | null;
  onClose: () => void;
  onUpdate: (updated: FeedbackRecord) => void;
}

export function FeedbackDrawer({
  feedback,
  onClose,
  onUpdate,
}: FeedbackDrawerProps) {
  const { data: session } = useSession();
  const [reclassifying, setReclassifying] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!feedback) return null;

  const isViewer = session?.user?.role === "VIEWER";

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    if (isViewer || feedback.status === newStatus) return;
    setStatusLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      onUpdate(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleReclassify = async () => {
    if (isViewer) return;
    setReclassifying(true);
    setError(null);

    try {
      const res = await fetch(`/api/feedback/${feedback.id}/classify`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to re-classify");

      onUpdate(data.feedback);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReclassifying(false);
    }
  };

  // Calculate score meter percentage (score -1..1 to 0..100)
  const scorePercent = Math.round(((feedback.sentimentScore + 1) / 2) * 100);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChannelBadge channel={feedback.channel} />
            <StatusBadge status={feedback.status} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewer Notice */}
        {isViewer && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Viewer permissions: Status changes and AI re-classification are disabled.</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Feedback Content */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Customer Feedback
            </h4>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
              "{feedback.content}"
            </div>
          </div>

          {/* AI Intelligence Block */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  AI Auto-Classification (Claude Sonnet)
                </h4>
              </div>
              <button
                onClick={handleReclassify}
                disabled={isViewer || reclassifying}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium hover:bg-indigo-500/25 transition disabled:opacity-50"
                title="Re-run Claude classification on this item"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reclassifying ? "animate-spin" : ""}`} />
                {reclassifying ? "Re-classifying..." : "Re-classify"}
              </button>
            </div>

            {/* Sentiment Meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Sentiment Classification:</span>
                <SentimentBadge sentiment={feedback.sentiment} score={feedback.sentimentScore} />
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    feedback.sentiment === "POS"
                      ? "bg-emerald-500"
                      : feedback.sentiment === "NEG"
                      ? "bg-rose-500"
                      : "bg-slate-400"
                  }`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Critical (-1.00)</span>
                <span>Neutral (0.00)</span>
                <span>Delighted (+1.00)</span>
              </div>
            </div>

            {/* Assigned Themes */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 block">Assigned Themes & Clustering:</span>
              <div className="flex flex-wrap gap-2">
                {feedback.themes && feedback.themes.length > 0 ? (
                  feedback.themes.map((ft) => (
                    <span
                      key={ft.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                      style={{
                        backgroundColor: `${ft.theme.color}15`,
                        borderColor: `${ft.theme.color}40`,
                        color: ft.theme.color,
                      }}
                    >
                      <Tag className="w-3 h-3" />
                      <span>{ft.theme.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        {Math.round(ft.confidence * 100)}%
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No themes tagged</span>
                )}
              </div>
            </div>
          </div>

          {/* Workflow Status Progression */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workflow Status Transition
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {(["NEW", "REVIEWED", "ACTIONED"] as FeedbackStatus[]).map((st) => {
                const isActive = feedback.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    disabled={isViewer || statusLoading || isActive}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition ${
                      isActive
                        ? "bg-indigo-600 border-indigo-500 text-white font-semibold"
                        : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    } disabled:opacity-50`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5" />}
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3 text-xs">
            <h4 className="font-semibold uppercase tracking-wider text-slate-400">
              Metadata & Provenance
            </h4>
            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Customer:</span>
                <span className="font-medium text-white truncate">
                  {feedback.customerLabel || "Anonymous"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Source Ref:</span>
                <span className="font-mono text-white truncate">
                  {feedback.sourceRef || "None"}
                </span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Captured At:</span>
                <span className="text-white">
                  {new Date(feedback.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}