export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole, isAuthError } from "@/lib/auth-guard";
import { UserInviteSchema, UserRoleUpdateSchema } from "@/lib/validations";

// GET: List workspace members
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const members = await prisma.user.findMany({
      where: { workspaceId: auth.workspaceId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error("GET /api/workspace/members error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

// POST: Add new member to workspace (ADMIN ONLY)
export async function POST(req: NextRequest) {
  try {
    // Role guard: Only ADMIN can manage team members
    const auth = await requireRole(["ADMIN"]);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const validated = UserInviteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, role } = validated.data;
    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role,
        workspaceId: auth.workspaceId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/workspace/members error:", error);
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
  }
}

// PATCH: Update member role (ADMIN ONLY)
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN"]);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    const roleValidated = UserRoleUpdateSchema.safeParse({ role });
    if (!roleValidated.success) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    // Verify target user belongs to this workspace
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser || targetUser.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: "User not found in workspace" }, { status: 404 });
    }

    // Prevent demoting self if sole admin
    if (targetUser.id === auth.userId && role !== "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { workspaceId: auth.workspaceId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the sole workspace administrator" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/workspace/members error:", error);
    return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
  }
}