export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole, isAuthError } from "@/lib/auth-guard";
import { ReportGenerateSchema } from "@/lib/validations";
import { computeVoCStats } from "@/lib/analytics";
import { generateVoCNarrative } from "@/lib/anthropic";

// GET: List historical reports
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const reports = await prisma.report.findMany({
      where: { workspaceId: auth.workspaceId },
      include: {
        generatedBy: {
          select: { name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

// POST: Two-stage VoC report generation
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN", "ANALYST"]);
    if (isAuthError(auth)) return auth;

    const body = await req.json().catch(() => ({}));
    const validated = ReportGenerateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid report generation parameters", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { periodDays, startDate: customStart, endDate: customEnd, title } = validated.data;
    const now = new Date();
    const endDate = customEnd ? new Date(customEnd) : now;
    const startDate = customStart
      ? new Date(customStart)
      : new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const workspace = await prisma.workspace.findUnique({
      where: { id: auth.workspaceId },
      select: { name: true },
    });
    const workspaceName = workspace?.name || "Apex Cloud Technologies";

    // STAGE 1: Deterministic Pre-computation in code (guaranteed zero hallucination of numbers)
    const verifiedStats = await computeVoCStats(auth.workspaceId, startDate, endDate);

    // STAGE 2: Claude Narrative Generation anchored on verified figures
    const narrativeContent = await generateVoCNarrative(verifiedStats, workspaceName);

    const reportTitle =
      title ||
      `Voice-of-Customer Executive Briefing (${startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${endDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })})`;

    // Store in Database
    const report = await prisma.report.create({
      data: {
        title: reportTitle,
        periodStart: startDate,
        periodEnd: endDate,
        contentJson: JSON.stringify(narrativeContent),
        workspaceId: auth.workspaceId,
        generatedById: auth.userId,
      },
      include: {
        generatedBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}