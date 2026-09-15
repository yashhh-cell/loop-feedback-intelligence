"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Papa from "papaparse";
import { Channel } from "@/types";
import {
  X,
  Upload,
  Sparkles,
  Zap,
  CheckCircle,
  AlertCircle,
  FileText,
  Send,
  Loader2,
} from "lucide-react";

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function IngestModal({ isOpen, onClose, onSuccess }: IngestModalProps) {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"single" | "csv" | "simulate">("single");

  // Single form state
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState<Channel>("SUPPORT_TICKET");
  const [customerLabel, setCustomerLabel] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // CSV state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvSummary, setCsvSummary] = useState<any>(null);

  const isViewer = session?.user?.role === "VIEWER";

  if (!isOpen) return null;

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isViewer) return;

    setLoading(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          channel,
          customerLabel: customerLabel.trim() || null,
          sourceRef: sourceRef.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ingest feedback");

      setFeedbackMsg({
        type: "success",
        text: `Feedback ingested & auto-classified as ${data.sentiment} (${data.sentimentScore > 0 ? "+" : ""}${data.sentimentScore})!`,
      });
      setContent("");
      setCustomerLabel("");
      setSourceRef("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile || isViewer) return;
    setLoading(true);
    setFeedbackMsg(null);
    setCsvSummary(null);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const items = results.data.map((row: any) => ({
            content: row.content || row.feedback || row.text || row.comment || "",
            channel: row.channel || "SUPPORT_TICKET",
            customerLabel: row.customer || row.customerLabel || row.user || null,
            sourceRef: row.sourceRef || row.source || row.ticket || null,
          })).filter((i) => i.content.trim().length >= 3);

          if (items.length === 0) {
            throw new Error("No valid feedback rows found in CSV. Ensure there is a 'content' column.");
          }

          const res = await fetch("/api/feedback/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Bulk upload failed");

          setCsvSummary(data);
          setFeedbackMsg({
            type: "success",
            text: `CSV processed: ${data.successCount} succeeded, ${data.failureCount} failed.`,
          });
          if (onSuccess) onSuccess();
        } catch (err: any) {
          setFeedbackMsg({ type: "error", text: err.message });
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        setFeedbackMsg({ type: "error", text: `CSV Parse error: ${err.message}` });
        setLoading(false);
      },
    });
  };

  const handleSimulate = async (presetIndex: number) => {
    if (isViewer) return;
    setLoading(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/feedback/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetIndex }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Simulation failed");

      setFeedbackMsg({
        type: "success",
        text: data.message || "Simulated feedback ingested and classified!",
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Ingest Customer Feedback</h3>
              <p className="text-xs text-slate-400">Add feedback to queue for real-time Claude classification & vector indexing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role warning for VIEWER */}
        {isViewer && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>You have <strong>VIEWER (read-only)</strong> permissions. Ingestion is restricted to ADMIN and ANALYST roles.</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          <button
            onClick={() => { setTab("single"); setFeedbackMsg(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition ${
              tab === "single"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            Single Entry Form
          </button>
          <button
            onClick={() => { setTab("csv"); setFeedbackMsg(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition ${
              tab === "csv"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="w-4 h-4" />
            Bulk CSV Upload
          </button>
          <button
            onClick={() => { setTab("simulate"); setFeedbackMsg(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition ${
              tab === "simulate"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            Simulate Channels
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedbackMsg.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
            }`}
          >
            {feedbackMsg.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {tab === "single" && (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Channel <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as Channel)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                    disabled={isViewer || loading}
                  >
                    <option value="SUPPORT_TICKET">Support Ticket</option>
                    <option value="APP_STORE">App Store Review</option>
                    <option value="NPS_SURVEY">NPS Survey</option>
                    <option value="SALES_CALL">Sales Call Note</option>
                    <option value="COMMUNITY">Community Post</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Customer Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah J. (VP Eng, ScaleFlow)"
                    value={customerLabel}
                    onChange={(e) => setCustomerLabel(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    disabled={isViewer || loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Source Reference / Ticket ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zendesk #49102 or App Store v2.4.1"
                  value={sourceRef}
                  onChange={(e) => setSourceRef(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  disabled={isViewer || loading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Feedback Content <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste verbatim customer feedback here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  minLength={5}
                  maxLength={5000}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  disabled={isViewer || loading}
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Minimum 5 characters</span>
                  <span>{content.length} / 5000</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isViewer || loading || !content.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Classifying with Claude...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Ingest & Auto-Classify
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {tab === "csv" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-indigo-500/50 transition bg-slate-950/20">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-200">
                  Select or drag a CSV file
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Columns supported: <code>content</code> (required), <code>channel</code>, <code>customerLabel</code>, <code>sourceRef</code>
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="mt-4 text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  disabled={isViewer || loading}
                />
              </div>

              {csvSummary && (
                <div className="rounded-lg bg-slate-800/60 p-4 border border-slate-700 text-xs space-y-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-300">Total Items in File:</span>
                    <span className="text-white">{csvSummary.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-400">Successfully Ingested:</span>
                    <span className="text-emerald-300 font-semibold">{csvSummary.successCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rose-400">Failed / Skipped:</span>
                    <span className="text-rose-300 font-semibold">{csvSummary.failureCount}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvUpload}
                  disabled={isViewer || loading || !csvFile}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Parsing & Classifying...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload & Ingest CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {tab === "simulate" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Simulate incoming events from real customer channels to observe real-time AI classification, theme tagging, and vector indexing:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    title: "Zendesk Support Ticket (Urgent Bug)",
                    desc: "Webhooks egress latency alert from an Enterprise SRE lead.",
                    badge: "SUPPORT TICKET",
                    color: "border-blue-500/30 hover:border-blue-500",
                    index: 0,
                  },
                  {
                    title: "iOS App Store 1-Star Crash Review",
                    desc: "User reports app freeze when opening detail drawer on iOS 17.",
                    badge: "APP STORE",
                    color: "border-purple-500/30 hover:border-purple-500",
                    index: 1,
                  },
                  {
                    title: "Delighted NPS 10/10 Score",
                    desc: "Chief Customer Officer praises instant Voice-of-Customer reports.",
                    badge: "NPS SURVEY",
                    color: "border-amber-500/30 hover:border-amber-500",
                    index: 2,
                  },
                  {
                    title: "Gong Sales Call Procurement Note",
                    desc: "Enterprise prospect requires Okta SAML SSO and SCIM before signing.",
                    badge: "SALES CALL",
                    color: "border-indigo-500/30 hover:border-indigo-500",
                    index: 3,
                  },
                  {
                    title: "Discord Community Discussion",
                    desc: "Developer compliments dark mode UI and asks for custom theme palettes.",
                    badge: "COMMUNITY",
                    color: "border-cyan-500/30 hover:border-cyan-500",
                    index: 4,
                  },
                ].map((item) => (
                  <button
                    key={item.index}
                    onClick={() => handleSimulate(item.index)}
                    disabled={isViewer || loading}
                    className={`flex items-start justify-between p-3.5 rounded-xl border bg-slate-950/40 text-left transition ${item.color} disabled:opacity-50`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">{item.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                    </div>
                    <span className="shrink-0 text-xs text-indigo-400 font-medium px-2 py-1 rounded bg-indigo-500/10 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Simulate
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}