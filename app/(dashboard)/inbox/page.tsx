"use client";

import React, { useEffect, useState, useTransition, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FeedbackRecord, Channel, Sentiment, FeedbackStatus } from "@/types";
import { SentimentBadge, ChannelBadge, StatusBadge } from "@/components/badges";
import { FeedbackDrawer } from "@/components/feedback-drawer";
import { IngestModal } from "@/components/ingest-modal";
import {
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Inbox as InboxIcon,
  CheckCircle2,
  Clock,
  Tag,
  Loader2,
  X,
} from "lucide-react";

function InboxContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialThemeId = searchParams.get("themeId") || "";

  // Filter states
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<string>("");
  const [sentiment, setSentiment] = useState<string>("");
  const [themeId, setThemeId] = useState<string>(initialThemeId);
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  // Data states
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [themesList, setThemesList] = useState<Array<{ id: string; name: string }>>([]);

  // Drawer & Modal states
  const [selectedItem, setSelectedItem] = useState<FeedbackRecord | null>(null);
  const [ingestModalOpen, setIngestModalOpen] = useState(false);

  const isViewer = session?.user?.role === "VIEWER";

  // Fetch available themes for the dropdown filter
  useEffect(() => {
    fetch("/api/themes")
      .then((res) => res.json())
      .then((data) => {
        if (data.themes) {
          setThemesList(data.themes.map((t: any) => ({ id: t.id, name: t.name })));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch feedback items
  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search.trim()) params.set("search", search.trim());
      if (channel) params.set("channel", channel);
      if (sentiment) params.set("sentiment", sentiment);
      if (themeId) params.set("themeId", themeId);
      if (status) params.set("status", status);

      const res = await fetch(`/api/feedback?${params.toString()}`);
      const data = await res.json();

      if (data.items) {
        setItems(data.items);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to load feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [page, channel, sentiment, themeId, status]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchFeedback();
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Handle inline status toggle
  const handleInlineStatus = async (item: FeedbackRecord, newStatus: FeedbackStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isViewer || item.status === newStatus) return;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
    );

    try {
      const res = await fetch(`/api/feedback/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error);

      if (selectedItem?.id === item.id) {
        setSelectedItem(updated);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchFeedback(); // rollback on failure
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Feedback Inbox
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-medium">
              {total} items
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Triaged customer feedback items, AI sentiment scores, and inline workflow management
          </p>
        </div>

        <button
          onClick={() => setIngestModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ingest Feedback</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search feedback content, customer name, ticket ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700/80 bg-slate-800/60 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Channel Select */}
          <select
            value={channel}
            onChange={(e) => { setChannel(e.target.value); setPage(1); }}
            className="w-full md:w-44 px-3 py-2 rounded-xl border border-slate-700/80 bg-slate-800/60 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Channels</option>
            <option value="SUPPORT_TICKET">Support Ticket</option>
            <option value="APP_STORE">App Store</option>
            <option value="NPS_SURVEY">NPS Survey</option>
            <option value="SALES_CALL">Sales Call</option>
            <option value="COMMUNITY">Community</option>
          </select>

          {/* Sentiment Select */}
          <select
            value={sentiment}
            onChange={(e) => { setSentiment(e.target.value); setPage(1); }}
            className="w-full md:w-36 px-3 py-2 rounded-xl border border-slate-700/80 bg-slate-800/60 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Sentiment</option>
            <option value="POS">Positive</option>
            <option value="NEU">Neutral</option>
            <option value="NEG">Negative</option>
          </select>

          {/* Theme Select */}
          <select
            value={themeId}
            onChange={(e) => { setThemeId(e.target.value); setPage(1); }}
            className="w-full md:w-52 px-3 py-2 rounded-xl border border-slate-700/80 bg-slate-800/60 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none truncate"
          >
            <option value="">All Themes</option>
            {themesList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Workflow Status Filter Tabs */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 mr-2 text-[11px] font-medium uppercase tracking-wider">Status:</span>
            {[
              { label: "All Items", val: "" },
              { label: "New", val: "NEW" },
              { label: "Reviewed", val: "REVIEWED" },
              { label: "Actioned", val: "ACTIONED" },
            ].map((st) => (
              <button
                key={st.val}
                onClick={() => { setStatus(st.val); setPage(1); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  status === st.val
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {(channel || sentiment || themeId || status || search) && (
            <button
              onClick={() => {
                setSearch("");
                setChannel("");
                setSentiment("");
                setThemeId("");
                setStatus("");
                setPage(1);
              }}
              className="text-xs text-slate-400 hover:text-indigo-400 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Feedback Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl shadow-xl">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-xs">Loading feedback items...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <InboxIcon className="w-10 h-10 mx-auto text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-300">No feedback items found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No customer feedback matches the current search and filter criteria. Try clearing filters or ingesting new items.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Customer / Source</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Content</th>
                  <th className="py-3.5 px-4">AI Sentiment</th>
                  <th className="py-3.5 px-4">Themes</th>
                  <th className="py-3.5 px-4">Workflow Status</th>
                  <th className="py-3.5 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    {/* Customer & Source */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-white truncate max-w-[160px]">
                        {item.customerLabel || "Anonymous"}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">
                        {item.sourceRef || "Direct"}
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <ChannelBadge channel={item.channel} />
                    </td>

                    {/* Content Snippet */}
                    <td className="py-3.5 px-4">
                      <p className="line-clamp-2 text-slate-300 group-hover:text-white transition leading-relaxed">
                        {item.content}
                      </p>
                    </td>

                    {/* AI Sentiment */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SentimentBadge sentiment={item.sentiment} score={item.sentimentScore} size="sm" />
                    </td>

                    {/* Themes */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {item.themes && item.themes.length > 0 ? (
                          item.themes.slice(0, 2).map((ft) => (
                            <span
                              key={ft.id}
                              className="px-2 py-0.5 rounded text-[10px] font-medium border truncate max-w-[120px]"
                              style={{
                                backgroundColor: `${ft.theme.color}15`,
                                borderColor: `${ft.theme.color}35`,
                                color: ft.theme.color,
                              }}
                            >
                              {ft.theme.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-600">—</span>
                        )}
                        {item.themes && item.themes.length > 2 && (
                          <span className="text-[10px] text-slate-500">+{item.themes.length - 2}</span>
                        )}
                      </div>
                    </td>

                    {/* Inline Status Dropdown */}
                    <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex rounded-lg bg-slate-950/60 border border-slate-800 p-0.5 text-[10px]">
                        {(["NEW", "REVIEWED", "ACTIONED"] as FeedbackStatus[]).map((st) => (
                          <button
                            key={st}
                            disabled={isViewer}
                            onClick={(e) => handleInlineStatus(item, st, e)}
                            className={`px-2 py-1 rounded font-medium transition ${
                              item.status === st
                                ? "bg-indigo-600 text-white font-semibold"
                                : "text-slate-400 hover:text-slate-200"
                            } disabled:opacity-50`}
                          >
                            {st === "NEW" ? "New" : st === "REVIEWED" ? "Rev" : "Done"}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{items.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{" "}
            <span className="font-semibold text-white">{Math.min(page * limit, total)}</span> of{" "}
            <span className="font-semibold text-white">{total}</span> items
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Detail Drawer */}
      <FeedbackDrawer
        feedback={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdate={(updated) => {
          setSelectedItem(updated);
          setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        }}
      />

      {/* Ingestion Modal */}
      <IngestModal
        isOpen={ingestModalOpen}
        onClose={() => setIngestModalOpen(false)}
        onSuccess={() => fetchFeedback()}
      />
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs">Loading inbox and filters...</p>
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}