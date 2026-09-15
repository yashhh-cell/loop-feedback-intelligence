export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { UserRegisterSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = UserRegisterSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, workspaceName } = validated.data;
    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create Workspace and User in a transaction (Creator becomes ADMIN)
    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName.trim(),
        },
      });

      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          passwordHash,
          role: "ADMIN",
          workspaceId: workspace.id,
        },
      });

      // Also seed default standard themes for the new workspace
      const defaultThemes = [
        { name: "Onboarding & First-Run Experience", color: "#6366f1" },
        { name: "Billing, Invoicing & Stripe Integration", color: "#f59e0b" },
        { name: "Mobile App Performance & Offline Sync", color: "#f43f5e" },
        { name: "Search, Indexing & Filter Latency", color: "#0ea5e9" },
        { name: "API Rate Limits & Webhooks", color: "#10b981" },
        { name: "Enterprise SSO & Security", color: "#8b5cf6" },
        { name: "UI Dark Mode & Accessibility", color: "#14b8a6" },
      ];

      for (const t of defaultThemes) {
        await tx.theme.create({
          data: {
            name: t.name,
            color: t.color,
            workspaceId: workspace.id,
          },
        });
      }

      return { user, workspace };
    });

    return NextResponse.json(
      {
        message: "Workspace and Admin created successfully",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}