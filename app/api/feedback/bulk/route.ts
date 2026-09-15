export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, isAuthError } from "@/lib/auth-guard";
import { BulkFeedbackSchema } from "@/lib/validations";
import { classifyFeedback } from "@/lib/anthropic";
import { generateEmbedding } from "@/lib/vector-search";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN", "ANALYST"]);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const validated = BulkFeedbackSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid bulk payload format", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { items } = validated.data;
    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ index: number; reason: string }> = [];

    const existingThemes = await prisma.theme.findMany({
      where: { workspaceId: auth.workspaceId },
      select: { id: true, name: true },
    });
    const themeNames = existingThemes.map((t) => t.name);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (!item.content || item.content.trim().length < 3) {
          throw new Error("Content too short");
        }

        const classification = await classifyFeedback(item.content, themeNames);

        const feedback = await prisma.feedback.create({
          data: {
            content: item.content.trim(),
            channel: item.channel,
            sourceRef: item.sourceRef?.trim() || `CSV Upload - Row #${i + 1}`,
            customerLabel: item.customerLabel?.trim() || `Bulk User #${i + 1}`,
            sentiment: classification.sentiment,
            sentimentScore: classification.sentimentScore,
            status: "NEW",
            workspaceId: auth.workspaceId,
          },
        });

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
            existingThemes.push({ id: theme.id, name: theme.name });
            themeNames.push(theme.name);
          }

          await prisma.feedbackTheme.create({
            data: {
              feedbackId: feedback.id,
              themeId: theme.id,
              confidence: 0.9,
            },
          });
        }

        const vector = generateEmbedding(item.content);
        await prisma.embedding.create({
          data: {
            feedbackId: feedback.id,
            vector: JSON.stringify(vector),
          },
        });

        successCount++;
      } catch (err: any) {
        failureCount++;
        errors.push({ index: i + 1, reason: err.message || "Processing error" });
      }
    }

    return NextResponse.json({
      message: `Bulk processing complete. ${successCount} succeeded, ${failureCount} failed.`,
      total: items.length,
      successCount,
      failureCount,
      errors,
    });
  } catch (error: any) {
    console.error("POST /api/feedback/bulk error:", error);
    return NextResponse.json({ error: "Failed to process bulk upload" }, { status: 500 });
  }
}