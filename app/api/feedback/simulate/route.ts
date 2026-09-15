export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, isAuthError } from "@/lib/auth-guard";
import { classifyFeedback } from "@/lib/anthropic";
import { generateEmbedding } from "@/lib/vector-search";

const SIMULATED_PRESETS = [
  {
    channel: "SUPPORT_TICKET",
    customerLabel: "Enterprise SRE Lead (FinScale)",
    sourceRef: "Zendesk Escalation #94812",
    content: "Our monitoring alerted to 10-second latency on the feedback export webhook. Please check your egress queue.",
  },
  {
    channel: "APP_STORE",
    customerLabel: "iOS User (v2.4.2)",
    sourceRef: "App Store 1-Star Review",
    content: "The app crashed three times today while trying to open a customer sentiment card. Please fix this bug!",
  },
  {
    channel: "NPS_SURVEY",
    customerLabel: "Chief Customer Officer (HyperSaaS)",
    sourceRef: "Delighted NPS Score 10/10",
    content: "LOOP has completely transformed our product meetings. The Voice-of-Customer reports provide instant clarity.",
  },
  {
    channel: "SALES_CALL",
    customerLabel: "VP Technology @ GlobalRetail",
    sourceRef: "Gong Sales Call Note",
    content: "The prospect loves the theme clustering, but says Okta SAML SSO and SCIM provisioning are mandatory for closing.",
  },
  {
    channel: "COMMUNITY",
    customerLabel: "FrontendDev_Sam",
    sourceRef: "Discord #feedback-channel",
    content: "The dark mode contrast on the inbox table is super clean! Could we also get customizable color themes?",
  },
];

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN", "ANALYST"]);
    if (isAuthError(auth)) return auth;

    const body = await req.json().catch(() => ({}));
    const presetIndex = typeof body.presetIndex === "number" ? body.presetIndex % SIMULATED_PRESETS.length : Math.floor(Math.random() * SIMULATED_PRESETS.length);
    const template = SIMULATED_PRESETS[presetIndex];

    const existingThemes = await prisma.theme.findMany({
      where: { workspaceId: auth.workspaceId },
      select: { id: true, name: true },
    });
    const themeNames = existingThemes.map((t) => t.name);

    // AI Classification
    const classification = await classifyFeedback(template.content, themeNames);

    const feedback = await prisma.feedback.create({
      data: {
        content: template.content,
        channel: template.channel,
        sourceRef: template.sourceRef,
        customerLabel: template.customerLabel,
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
      }

      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: theme.id,
          confidence: 0.92,
        },
      });
    }

    const vector = generateEmbedding(template.content);
    await prisma.embedding.create({
      data: {
        feedbackId: feedback.id,
        vector: JSON.stringify(vector),
      },
    });

    const fullRecord = await prisma.feedback.findUnique({
      where: { id: feedback.id },
      include: { themes: { include: { theme: true } } },
    });

    return NextResponse.json({
      message: `Simulated incoming ${template.channel.replace(/_/g, " ")} received and auto-classified!`,
      feedback: fullRecord,
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/feedback/simulate error:", error);
    return NextResponse.json({ error: "Failed to simulate feedback" }, { status: 500 });
  }
}