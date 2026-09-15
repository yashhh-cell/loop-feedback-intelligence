export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth-guard";
import { getDashboardStats } from "@/lib/analytics";

// GET: Aggregated dashboard metrics & time-series
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const url = new URL(req.url);
    const daysParam = url.searchParams.get("days");
    const days = daysParam ? Math.min(365, Math.max(1, parseInt(daysParam, 10) || 30)) : 30;

    const stats = await getDashboardStats(auth.workspaceId, days);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}