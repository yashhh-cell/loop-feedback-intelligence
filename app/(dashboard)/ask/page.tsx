"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AskCitation, AskResponse, FeedbackRecord } from "@/types";
import { SentimentBadge, ChannelBadge } from "@/components/badges";
import { FeedbackDrawer } from "@/components/feedback-drawer";
import {
  MessageSquareText,
  Sparkles,
  Send,
  Loader2,
  FileCheck2,
  ExternalLink,
  Bot,
  User,
  Quote,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: AskCitation[];
  grounded?: boolean;
}

export default function AskLoopPage() {
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am **LOOP Intelligence**, your customer feedback analyst. Ask any question about your customer sentiment, recurring friction points, or feature requests. My answers are **strictly grounded in your workspace's vectorized customer feedback**, with full source citations and zero hallucination.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<FeedbackRecord | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetQuestions = [
    "What are the top customer complaints this week?",
    "Why are users experiencing search and filter timeouts?",
    "What are enterprise customers saying about Okta SAML and SCIM?",
    "How is the mobile app performing on iOS 17?",
    "What feedback exists regarding blockchain support?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, topK: 5 }),
      });

      const data: AskResponse = await res.json();
      if (!res.ok) throw new Error((data as any).error || "Failed to query");

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        citations: data.citations,
        grounded: data.grounded,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${err.message || "Failed to retrieve feedback context."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-1px)] max-w-5xl mx-auto w-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Ask LOOP — Grounded Q&A
              </h1>
              <p className="text-xs text-slate-400">
                Retrieval-Augmented Generation (RAG) powered by Claude Sonnet & vector similarity
              </p>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <ShieldCheck className="w-4 h-4" />
          <span>Strict Evidence Grounding Active</span>
        </div>
      </div>

      {/* Preset Questions Chips */}
      <div className="space-y-1.5 mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Suggested Explorations
        </span>
        <div className="flex flex-wrap gap-2">
          {presetQuestions.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(pq)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-indigo-500/40 text-slate-300 transition text-left disabled:opacity-50"
            >
              {pq}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-5 space-y-3 shadow-lg ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none font-medium text-sm"
                  : "bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none text-sm"
              }`}
            >
              <div className="prose prose-invert prose-xs max-w-none leading-relaxed whitespace-pre-wrap">
                {m.content}
              </div>

              {/* Citations Box */}
              {m.citations && m.citations.length > 0 && (
                <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Grounded Evidence Citations ({m.citations.length})</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {m.citations.map((c, idx) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1.5 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-500">#{idx + 1}</span>
                            <span className="font-semibold text-white">
                              {c.customerLabel || "Anonymous Customer"}
                            </span>
                            <ChannelBadge channel={c.channel} />
                          </div>
                          <div className="flex items-center gap-2">
                            <SentimentBadge sentiment={c.sentiment} size="sm" />
                            <span className="text-[10px] font-mono text-indigo-400">
                              sim: {Math.round(c.similarity * 100)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-300 italic text-[11px] leading-relaxed">
                          "{c.contentSnippet}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {m.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 p-4 text-xs text-slate-400 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Retrieving vector embeddings and synthesizing grounded answer...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            placeholder="Ask anything about customer sentiment, bugs, or feature requests..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-slate-700/80 bg-slate-900/90 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none shadow-xl"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2.5 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-500 text-center mt-2">
          Strictly grounded in tenant customer feedback. No outside hallucination or invention of data.
        </p>
      </div>

      {/* Drawer for citation click */}
      <FeedbackDrawer
        feedback={selectedCitation}
        onClose={() => setSelectedCitation(null)}
        onUpdate={() => {}}
      />
    </div>
  );
}