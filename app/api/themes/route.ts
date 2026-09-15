export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole, isAuthError } from "@/lib/auth-guard";
import { ThemeCreateSchema } from "@/lib/validations";
import { getThemeTrends } from "@/lib/analytics";

// GET: Themes with counts, trend velocity, and spike detection
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const themes = await getThemeTrends(auth.workspaceId);
    return NextResponse.json({ themes });
  } catch (error: any) {
    console.error("GET /api/themes error:", error);
    return NextResponse.json({ error: "Failed to fetch themes" }, { status: 500 });
  }
}

// POST: Create custom theme
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN", "ANALYST"]);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const validated = ThemeCreateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, color } = validated.data;

    // Check duplicate
    const existing = await prisma.theme.findFirst({
      where: {
        workspaceId: auth.workspaceId,
        name: { equals: name.trim() },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A theme with this name already exists in this workspace" },
        { status: 409 }
      );
    }

    const created = await prisma.theme.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color,
        workspaceId: auth.workspaceId,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/themes error:", error);
    return NextResponse.json({ error: "Failed to create theme" }, { status: 500 });
  }
}