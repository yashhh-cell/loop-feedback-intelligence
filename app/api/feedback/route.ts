export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole, isAuthError } from "@/lib/auth-guard";
import { FeedbackIngestSchema, FeedbackQuerySchema } from "@/lib/validations";
import { classifyFeedback } from "@/lib/anthropic";
import { generateEmbedding } from "@/lib/vector-search";

// GET: Paginated list of feedback with multi-attribute filtering
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validated = FeedbackQuerySchema.safeParse(queryParams);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, channel, sentiment, themeId, status, search, startDate, endDate } =
      validated.data;

    // Strict multi-tenant isolation by workspaceId
    const whereClause: any = {
      workspaceId: auth.workspaceId,
    };

    if (channel) whereClause.channel = channel;
    if (sentiment) whereClause.sentiment = sentiment;
    if (status) whereClause.status = status;

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    if (search && search.trim().length > 0) {
      whereClause.OR = [
        { content: { contains: search.trim() } },
        { customerLabel: { contains: search.trim() } },
        { sourceRef: { contains: search.trim() } },
      ];
    }

    if (themeId) {
      whereClause.themes = {
        some: {
          themeId: themeId,
        },
      };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where: whereClause,
        include: {
          themes: {
            include: {
              theme: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.feedback.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET /api/feedback error:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

// POST: Ingest single feedback with auto-classification
export async function POST(req: NextRequest) {
  try {
    // Role guard: Only ADMIN and ANALYST can ingest feedback (VIEWER gets 403)
    const auth = await requireRole(["ADMIN", "ANALYST"]);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const validated = FeedbackIngestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { content, channel, sourceRef, customerLabel } = validated.data;

    // Fetch existing workspace themes for AI reference
    const existingThemes = await prisma.theme.findMany({
      where: { workspaceId: auth.workspaceId },
      select: { id: true, name: true },
    });

    const themeNames = existingThemes.map((t) => t.name);

    // Call Claude AI auto-classification (server-side only)
    const classification = await classifyFeedback(content, themeNames);

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        content: content.trim(),
        channel,
        sourceRef: sourceRef?.trim() || null,
        customerLabel: customerLabel?.trim() || null,
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        status: "NEW",
        workspaceId: auth.workspaceId,
      },
    });

    // Attach themes
    for (const themeName of classification.themes) {
      let theme = existingThemes.find(
        (t) => t.name.toLowerCase() === themeName.toLowerCase()
      );

      // Create new theme if not existing
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
          confidence: 0.9,
        },
      });
    }

    // Generate and save embedding vector
    const vector = generateEmbedding(content);
    await prisma.embedding.create({
      data: {
        feedbackId: feedback.id,
        vector: JSON.stringify(vector),
      },
    });

    // Return created record with attached themes
    const completeRecord = await prisma.feedback.findUnique({
      where: { id: feedback.id },
      include: {
        themes: {
          include: { theme: true },
        },
      },
    });

    return NextResponse.json(completeRecord, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/feedback error:", error);
    return NextResponse.json({ error: "Failed to ingest feedback" }, { status: 500 });
  }
}