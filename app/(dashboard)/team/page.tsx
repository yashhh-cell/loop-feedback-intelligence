"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Role } from "@/types";
import { RoleBadge } from "@/components/badges";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Calendar,
  Building2,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  Loader2,
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Invite Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [role, setRole] = useState<Role>("ANALYST");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentUserRole = session?.user?.role || "VIEWER";
  const isAdmin = currentUserRole === "ADMIN";

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspace/members");
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !name.trim() || !email.trim()) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      const res = await fetch("/api/workspace/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite member");

      setSuccessMsg(`User ${data.name} (${data.email}) created with role ${data.role}!`);
      setName("");
      setEmail("");
      setInviteModalOpen(false);
      fetchMembers();
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!isAdmin) return;

    try {
      const res = await fetch("/api/workspace/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");

      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
      );
      setSuccessMsg("Member role updated successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Team & Role-Based Access Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage workspace members, assign RBAC permissions (Admin, Analyst, Viewer), and audit access
          </p>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          disabled={!isAdmin}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-40"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Role explanation / Viewer notice */}
      {!isAdmin ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-center gap-3">
          <Lock className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Member Management Restricted</p>
            <p className="text-amber-400/80 text-[11px] mt-0.5">
              You are signed in as <strong>{currentUserRole}</strong>. Only users with the <strong>ADMIN</strong> role can invite members or modify permissions.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/10 p-4 text-xs text-indigo-300 flex items-center gap-3">
          <Shield className="w-5 h-5 shrink-0 text-indigo-400" />
          <div>
            <p className="font-semibold">Administrator Access Active</p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              You can invite teammates, assign roles, and revoke member access across this workspace.
            </p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* RBAC Permission Matrix Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="rounded-xl border border-amber-500/30 bg-slate-900/60 p-4 space-y-1.5">
          <RoleBadge role="ADMIN" />
          <p className="font-bold text-slate-200">Full Workspace Management</p>
          <p className="text-slate-400 text-[11px]">
            Manage team roles, delete records, trigger auto-classification, ingest feedback, generate reports.
          </p>
        </div>
        <div className="rounded-xl border border-indigo-500/30 bg-slate-900/60 p-4 space-y-1.5">
          <RoleBadge role="ANALYST" />
          <p className="font-bold text-slate-200">Feedback Operations & Triage</p>
          <p className="text-slate-400 text-[11px]">
            Ingest customer feedback, update workflow status, re-classify with AI, generate VoC executive reports.
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-1.5">
          <RoleBadge role="VIEWER" />
          <p className="font-bold text-slate-200">Read-Only Analytics</p>
          <p className="text-slate-400 text-[11px]">
            Access dashboard charts, browse inbox, query Ask LOOP, view historical VoC reports. Cannot mutate data.
          </p>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Active Workspace Members ({members.length})</h3>
          <span className="text-xs text-slate-500 font-mono">
            Tenant: {session?.user?.workspaceName || "Apex Cloud"}
          </span>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <span className="text-xs">Loading members...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6">Assigned Role</th>
                  <th className="py-3 px-6">Joined Date</th>
                  {isAdmin && <th className="py-3 px-6 text-right">Role Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-medium text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                        {m.name.charAt(0)}
                      </div>
                      <span>{m.name}</span>
                      {m.id === session?.user?.id && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          You
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono">{m.email}</td>
                    <td className="py-4 px-6">
                      <RoleBadge role={m.role} />
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-6 text-right">
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value as Role)}
                          className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="ANALYST">ANALYST</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="jordan@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Temporary Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ANALYST">ANALYST (Ingest & Triage)</option>
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                  <option value="ADMIN">ADMIN (Full Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  {inviteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add Member
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