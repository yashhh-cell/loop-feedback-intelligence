export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole, isAuthError } from "@/lib/auth-guard";

interface RouteParams {
  params: { id: string };
}

// GET: Retrieve single report
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        generatedBy: { select: { name: true, email: true, role: true } },
      },
    });

    if (!report || report.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("GET /api/reports/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

// DELETE: Delete single report
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (isAuthError(auth)) return auth;

    const report = await prisma.report.findUnique({
      where: { id: params.id },
    });

    if (!report || report.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await prisma.report.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/reports/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}