"use client";

import React, { useState } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleBadge } from "@/components/badges";
import { IngestModal } from "@/components/ingest-modal";
import {
  LayoutDashboard,
  Inbox,
  TrendingUp,
  MessageSquareText,
  FileText,
  Users,
  Plus,
  Zap,
  LogOut,
  Building2,
  Sparkles,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Feedback Inbox", href: "/inbox", icon: Inbox },
    { name: "Themes & Trends", href: "/trends", icon: TrendingUp },
    { name: "Ask LOOP (Q&A)", href: "/ask", icon: MessageSquareText },
    { name: "VoC Reports", href: "/reports", icon: FileText },
    { name: "Team & Roles", href: "/team", icon: Users },
  ];

  const quickSwitchRole = async (targetEmail: string) => {
    setRoleMenuOpen(false);
    await signIn("credentials", {
      redirect: false,
      email: targetEmail,
      password: "Password123!",
    });
    window.location.reload();
  };

  const userRole = session?.user?.role || "VIEWER";
  const workspaceName = session?.user?.workspaceName || "Apex Cloud Technologies";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl select-none">
        {/* Workspace Brand Header */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-600/30 font-black tracking-tight">
              L
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">LOOP</span>
                <span className="text-[10px] px-1 rounded bg-indigo-500/20 text-indigo-300 font-mono font-semibold">
                  AI
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[170px]">
                <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">{workspaceName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Ingest Button */}
        <div className="p-3">
          <button
            onClick={() => setIngestModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Feedback</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Role Switcher & User Profile Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
          {/* Quick RBAC Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-[11px] text-slate-300 transition"
            >
              <div className="flex items-center gap-1.5 truncate">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-slate-400">Role:</span>
                <RoleBadge role={userRole} />
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl space-y-1 text-xs z-50">
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test RBAC Roles
                </div>
                <button
                  onClick={() => quickSwitchRole("admin@loop.dev")}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-[11px] transition ${
                    userRole === "ADMIN" ? "bg-amber-500/20 text-amber-300" : "hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <span>Alex (ADMIN)</span>
                  <span className="text-[10px] text-slate-500">Full Access</span>
                </button>
                <button
                  onClick={() => quickSwitchRole("analyst@loop.dev")}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-[11px] transition ${
                    userRole === "ANALYST" ? "bg-indigo-500/20 text-indigo-300" : "hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <span>Elena (ANALYST)</span>
                  <span className="text-[10px] text-slate-500">Ingest & Edit</span>
                </button>
                <button
                  onClick={() => quickSwitchRole("viewer@loop.dev")}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-[11px] transition ${
                    userRole === "VIEWER" ? "bg-slate-700/50 text-white" : "hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <span>David (VIEWER)</span>
                  <span className="text-[10px] text-slate-500">Read-Only</span>
                </button>
              </div>
            )}
          </div>

          {/* User & Sign Out */}
          <div className="flex items-center justify-between pt-1">
            <div className="truncate pr-2">
              <p className="text-xs font-medium text-slate-200 truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {session?.user?.email || "user@loop.dev"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>

      {/* Global Ingestion Modal */}
      <IngestModal
        isOpen={ingestModalOpen}
        onClose={() => setIngestModalOpen(false)}
        onSuccess={() => {
          // If on inbox or dashboard, trigger soft refresh
          if (pathname === "/inbox" || pathname === "/dashboard") {
            window.location.reload();
          }
        }}
      />
    </div>
  );
}