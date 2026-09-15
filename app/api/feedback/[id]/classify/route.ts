export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, isAuthError } from "@/lib/auth-guard";
import { classifyFeedback } from "@/lib/anthropic";
import { generateEmbedding } from "@/lib/vector-search";

interface RouteParams {
  params: { id: string };
}

// POST: Trigger manual re-classification with Claude
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireRole(["ADMIN", "ANALYST"]);
    if (isAuthError(auth)) return auth;

    const feedback = await prisma.feedback.findUnique({
      where: { id: params.id },
      include: { themes: true },
    });

    if (!feedback || feedback.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    const existingThemes = await prisma.theme.findMany({
      where: { workspaceId: auth.workspaceId },
      select: { id: true, name: true },
    });
    const themeNames = existingThemes.map((t) => t.name);

    // Call Claude AI re-classification
    const classification = await classifyFeedback(feedback.content, themeNames);

    // Clear old themes
    await prisma.feedbackTheme.deleteMany({
      where: { feedbackId: feedback.id },
    });

    // Attach updated themes
    for (const themeName of classification.themes) {
      let theme = existingThemes.find(
        (t) => t.name.toLowerCase() === themeName.toLowerCase()
      );
      if (!theme) {
        theme = await prisma.theme.create({
          data: {
            name: themeName,
            color: "#6366f1",
            workspaceId: auth.workspaceId,
          },
        });
      }

      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: theme.id,
          confidence: 0.95,
        },
      });
    }

    // Refresh embedding
    const vector = generateEmbedding(feedback.content);
    await prisma.embedding.upsert({
      where: { feedbackId: feedback.id },
      create: {
        feedbackId: feedback.id,
        vector: JSON.stringify(vector),
      },
      update: {
        vector: JSON.stringify(vector),
      },
    });

    // Update feedback
    const updated = await prisma.feedback.update({
      where: { id: feedback.id },
      data: {
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
      },
      include: {
        themes: { include: { theme: true } },
      },
    });

    return NextResponse.json({
      message: "Feedback re-classified successfully",
      feedback: updated,
      classification,
    });
  } catch (error: any) {
    console.error("POST /api/feedback/[id]/classify error:", error);
    return NextResponse.json(
      { error: "Failed to re-classify feedback" },
      { status: 500 }
    );
  }
}