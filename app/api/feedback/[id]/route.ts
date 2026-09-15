export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole, isAuthError } from "@/lib/auth-guard";
import { FeedbackStatusUpdateSchema } from "@/lib/validations";

interface RouteParams {
  params: { id: string };
}

// GET: Single feedback detail with workspace scoping
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const feedback = await prisma.feedback.findUnique({
      where: { id: params.id },
      include: {
        themes: {
          include: { theme: true },
        },
      },
    });

    // Multi-tenant isolation: verify workspace
    if (!feedback || feedback.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    return NextResponse.json(feedback);
  } catch (error: any) {
    console.error("GET /api/feedback/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update feedback status (NEW -> REVIEWED -> ACTIONED)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    // Role guard: Only ADMIN and ANALYST can update status (VIEWER gets 403)
    const auth = await requireRole(["ADMIN", "ANALYST"]);
    if (isAuthError(auth)) return auth;

    const existing = await prisma.feedback.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    const body = await req.json();
    const validated = FeedbackStatusUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.feedback.update({
      where: { id: params.id },
      data: { status: validated.data.status },
      include: {
        themes: { include: { theme: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/feedback/[id] error:", error);
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
  }
}

// DELETE: Delete feedback record
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    // Role guard: Only ADMIN can delete feedback (VIEWER and ANALYST get 403)
    const auth = await requireRole(["ADMIN"]);
    if (isAuthError(auth)) return auth;

    const existing = await prisma.feedback.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    await prisma.feedback.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Feedback deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/feedback/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 });
  }
}