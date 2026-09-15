export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/auth-guard";
import { AskQuestionSchema } from "@/lib/validations";
import { searchSimilarFeedback } from "@/lib/vector-search";
import { answerGroundedQuestion } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const validated = AskQuestionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid question input", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { question, topK } = validated.data;

    // 1. Retrieve top-K vector citations strictly filtered by workspaceId
    const citations = await searchSimilarFeedback(auth.workspaceId, question, topK);

    // Fetch workspace name for AI branding
    const workspace = await prisma.workspace.findUnique({
      where: { id: auth.workspaceId },
      select: { name: true },
    });
    const workspaceName = workspace?.name || "Apex Cloud Technologies";

    // 2. Pass grounded context to Claude (server-side only)
    const answer = await answerGroundedQuestion(question, citations, workspaceName);

    return NextResponse.json({
      answer,
      citations,
      grounded: citations.length > 0,
    });
  } catch (error: any) {
    console.error("POST /api/ask error:", error);
    return NextResponse.json(
      { error: "Failed to process Q&A question" },
      { status: 500 }
    );
  }
}