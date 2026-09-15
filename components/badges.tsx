import React from "react";
import { Channel, Sentiment, FeedbackStatus, Role } from "@/types";

export function SentimentBadge({
  sentiment,
  score,
  size = "md",
}: {
  sentiment: Sentiment;
  score?: number;
  size?: "sm" | "md";
}) {
  const config = {
    POS: {
      label: "Positive",
      bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      dot: "bg-emerald-400",
    },
    NEU: {
      label: "Neutral",
      bg: "bg-slate-500/10 border-slate-500/20 text-slate-300",
      dot: "bg-slate-400",
    },
    NEG: {
      label: "Negative",
      bg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      dot: "bg-rose-400",
    },
  }[sentiment] || {
    label: sentiment,
    bg: "bg-slate-500/10 border-slate-500/20 text-slate-400",
    dot: "bg-slate-400",
  };

  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${pad}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
      {typeof score === "number" && (
        <span className="opacity-75 text-[10px] font-mono">
          {score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}
        </span>
      )}
    </span>
  );
}

export function ChannelBadge({ channel }: { channel: Channel | string }) {
  const map: Record<string, { label: string; color: string }> = {
    SUPPORT_TICKET: { label: "Support Ticket", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    APP_STORE: { label: "App Store", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    NPS_SURVEY: { label: "NPS Survey", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    SALES_CALL: { label: "Sales Call", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    COMMUNITY: { label: "Community", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  };

  const conf = map[channel] || { label: channel, color: "bg-slate-500/10 text-slate-300 border-slate-500/20" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${conf.color}`}>
      {conf.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: FeedbackStatus | string }) {
  const map: Record<string, { label: string; color: string }> = {
    NEW: { label: "New", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    REVIEWED: { label: "Reviewed", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    ACTIONED: { label: "Actioned", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  };

  const conf = map[status] || { label: status, color: "bg-slate-500/10 text-slate-300 border-slate-500/20" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${conf.color}`}>
      {conf.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role | string }) {
  const map: Record<string, { label: string; color: string }> = {
    ADMIN: { label: "Admin", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
    ANALYST: { label: "Analyst", color: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" },
    VIEWER: { label: "Viewer", color: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  };

  const conf = map[role] || { label: role, color: "bg-slate-500/15 text-slate-300 border-slate-500/30" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-semibold tracking-wide uppercase ${conf.color}`}>
      {conf.label}
    </span>
  );
}