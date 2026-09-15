import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateEmbedding } from "../lib/vector-search";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting LOOP database seeding...");

  await prisma.embedding.deleteMany();
  await prisma.feedbackTheme.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const workspace = await prisma.workspace.create({
    data: { name: "Apex Cloud Technologies" },
  });
  console.log(`Created workspace: ${workspace.name}`);

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const adminUser = await prisma.user.create({
    data: {
      name: "Alex Vance (Admin)",
      email: "admin@loop.dev",
      passwordHash,
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });

  const analystUser = await prisma.user.create({
    data: {
      name: "Elena Rostova (Analyst)",
      email: "analyst@loop.dev",
      passwordHash,
      role: "ANALYST",
      workspaceId: workspace.id,
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      name: "David Chen (Viewer)",
      email: "viewer@loop.dev",
      passwordHash,
      role: "VIEWER",
      workspaceId: workspace.id,
    },
  });
  console.log("Created 3 demo users (Admin, Analyst, Viewer)");

  const themeDefs = [
    { name: "Onboarding & First-Run Experience", description: "Setup wizard and workspace flow", color: "#6366f1" },
    { name: "Billing, Invoicing & Stripe Integration", description: "Charges, seats, invoices", color: "#f59e0b" },
    { name: "Mobile App Performance & Offline Sync", description: "iOS and Android apps, sync", color: "#f43f5e" },
    { name: "Search, Indexing & Filter Latency", description: "Query execution times and timeouts", color: "#0ea5e9" },
    { name: "API Rate Limits & Webhooks", description: "REST API throughput and delivery", color: "#10b981" },
    { name: "Enterprise SSO & Security", description: "SAML, SCIM, and audit logs", color: "#8b5cf6" },
    { name: "UI Dark Mode & Accessibility", description: "Contrast, keyboard nav, ergonomics", color: "#14b8a6" },
  ];

  const themeMap = new Map<string, string>();
  for (const t of themeDefs) {
    const created = await prisma.theme.create({
      data: { name: t.name, description: t.description, color: t.color, workspaceId: workspace.id },
    });
    themeMap.set(t.name, created.id);
  }
  console.log(`Created ${themeMap.size} themes`);
  const now = new Date();
  const allFeedbackItems: any[] = [];

  const rawFeedback = [
    { content: "The search query times out every time we filter by more than 3 tags. It takes 12 seconds and often returns HTTP 504.", channel: "SUPPORT_TICKET", customer: "Marcus Vance (VP Eng, ScaleFlow)", source: "Zendesk #40192", sentiment: "NEG", score: -0.85, theme: "Search, Indexing & Filter Latency", daysAgo: 2 },
    { content: "Filtering customer feedback by date range and sentiment is taking forever since Monday release. We keep seeing the loading spinner freeze.", channel: "COMMUNITY", customer: "DevOps_Rachel", source: "Discord #platform-bugs", sentiment: "NEG", score: -0.75, theme: "Search, Indexing & Filter Latency", daysAgo: 1 },
    { content: "Major latency spike in search indexing today. Queries that used to take 200ms are taking 4.5 seconds.", channel: "SUPPORT_TICKET", customer: "Sarah Jenkins (Director of CX)", source: "Zendesk #40288", sentiment: "NEG", score: -0.92, theme: "Search, Indexing & Filter Latency", daysAgo: 3 },
    { content: "Search filters on the feedback inbox are dropping results when multiple checkboxes are active.", channel: "SUPPORT_TICKET", customer: "Alan Turing (QA Lead)", source: "Zendesk #40301", sentiment: "NEG", score: -0.65, theme: "Search, Indexing & Filter Latency", daysAgo: 2 },
    { content: "The full-text search capability is dramatically better than our previous tool, but multi-select filter performance degraded noticeably.", channel: "NPS_SURVEY", customer: "Enterprise Customer #942", source: "Delighted NPS #4819", sentiment: "NEU", score: 0.1, theme: "Search, Indexing & Filter Latency", daysAgo: 4 },
    { content: "Setting up our workspace took literally 3 minutes. The automated invitation links and quick sample seed data made product demoing effortless.", channel: "NPS_SURVEY", customer: "Claire Beaumont (Head of Growth)", source: "Delighted NPS #1029", sentiment: "POS", score: 0.95, theme: "Onboarding & First-Run Experience", daysAgo: 8 },
    { content: "The initial tutorial was clear and got our entire product triage team onboarded in a single afternoon. Excellent UX design.", channel: "COMMUNITY", customer: "ProductDan", source: "Slack #product-exchange", sentiment: "POS", score: 0.9, theme: "Onboarding & First-Run Experience", daysAgo: 14 },
    { content: "Confusing first-time setup for non-technical teammates regarding Workspace vs Organization scoping.", channel: "SALES_CALL", customer: "Procurement Officer @ HealthCorp", source: "Gong Call Note #381", sentiment: "NEU", score: -0.2, theme: "Onboarding & First-Run Experience", daysAgo: 18 },
    { content: "We were charged for 15 seats instead of 10 after removing 5 contractor accounts. Need an adjusted credit invoice.", channel: "SUPPORT_TICKET", customer: "Heather Morris (Finance Director)", source: "Zendesk #40102", sentiment: "NEG", score: -0.8, theme: "Billing, Invoicing & Stripe Integration", daysAgo: 6 },
    { content: "Stripe customer portal integration is super clean. Upgraded our tier from Growth to Enterprise with zero friction.", channel: "COMMUNITY", customer: "SaaS_Founder_Tom", source: "Twitter Mention", sentiment: "POS", score: 0.88, theme: "Billing, Invoicing & Stripe Integration", daysAgo: 12 },
    { content: "App crashes every time I open the detail view on iOS 17.5. Reinstalled twice and restarted iPhone, still freezing immediately.", channel: "APP_STORE", customer: "FrustratediOSUser_99", source: "iOS App Store v2.4.1", sentiment: "NEG", score: -0.95, theme: "Mobile App Performance & Offline Sync", daysAgo: 7 },
    { content: "Offline queueing works great when traveling! Triaged 40 support notes on an airplane and synced seamlessly upon landing.", channel: "APP_STORE", customer: "NomadProductGuy", source: "Google Play Store v2.3.9", sentiment: "POS", score: 0.92, theme: "Mobile App Performance & Offline Sync", daysAgo: 15 },
    { content: "The webhook reliability is rock solid. We piped 50,000 feedback events into our internal Slack without a dropped packet.", channel: "COMMUNITY", customer: "API_Master_Zack", source: "Discord #api-showcase", sentiment: "POS", score: 0.95, theme: "API Rate Limits & Webhooks", daysAgo: 11 },
    { content: "SAML SSO setup with Microsoft Entra ID was seamless. Role-based access mapping assigned our admins and analysts automatically.", channel: "SUPPORT_TICKET", customer: "Greg House (VP IT, BioHealth)", source: "Zendesk #39670", sentiment: "POS", score: 0.91, theme: "Enterprise SSO & Security", daysAgo: 17 },
    { content: "Dark mode implementation is sleek and easy on the eyes during late-night triage sessions. High contrast ratios make reading notes comfortable.", channel: "COMMUNITY", customer: "NightOwl_Coder", source: "Twitter Mention", sentiment: "POS", score: 0.93, theme: "UI Dark Mode & Accessibility", daysAgo: 14 }
  ];

  for (const item of rawFeedback) {
    allFeedbackItems.push({
      ...item,
      createdAt: new Date(now.getTime() - item.daysAgo * 24 * 60 * 60 * 1000),
      status: item.daysAgo < 3 ? "NEW" : item.daysAgo < 14 ? "REVIEWED" : "ACTIONED",
    });
  }
  const variations = [
    { theme: "Search, Indexing & Filter Latency", templates: [
      { t: "Search queries taking over 8 seconds during high load", s: "NEG", score: -0.75, ch: "SUPPORT_TICKET" },
      { t: "Filter combination on status and date range times out with 504 gateway error", s: "NEG", score: -0.85, ch: "SUPPORT_TICKET" },
      { t: "Search indexing speed improved dramatically after the recent cluster upgrade", s: "POS", score: 0.88, ch: "COMMUNITY" },
      { t: "Need support for wildcard and regex operators in the search input", s: "NEU", score: 0.1, ch: "NPS_SURVEY" },
      { t: "Search results are occasionally stale by 5-10 minutes on high volume accounts", s: "NEG", score: -0.6, ch: "SUPPORT_TICKET" },
      { t: "Cmd+K search modal is extremely responsive and saves so much time", s: "POS", score: 0.92, ch: "COMMUNITY" }
    ]},
    { theme: "Onboarding & First-Run Experience", templates: [
      { t: "Inviting 10 team members was seamless with the bulk CSV email invite", s: "POS", score: 0.9, ch: "COMMUNITY" },
      { t: "First-run onboarding tutorial was slightly long but very informative", s: "NEU", score: 0.2, ch: "APP_STORE" },
      { t: "Would appreciate a quick video walkthrough on how to configure custom themes", s: "NEU", score: 0.15, ch: "COMMUNITY" },
      { t: "The initial setup flow had zero hiccups. Best onboarding in B2B SaaS", s: "POS", score: 0.97, ch: "NPS_SURVEY" }
    ]},
    { theme: "Billing, Invoicing & Stripe Integration", templates: [
      { t: "Need annual invoicing support with custom purchase order numbers", s: "NEU", score: 0.05, ch: "SALES_CALL" },
      { t: "Stripe billing portal makes updating corporate cards quick and painless", s: "POS", score: 0.86, ch: "COMMUNITY" },
      { t: "Disputed duplicate seat charge took 4 days to resolve with support", s: "NEG", score: -0.7, ch: "SUPPORT_TICKET" },
      { t: "Invoice receipt PDF was emailed immediately to our finance inbox", s: "POS", score: 0.91, ch: "NPS_SURVEY" }
    ]},
    { theme: "Mobile App Performance & Offline Sync", templates: [
      { t: "App crashes when opening attachments on iOS 17.4", s: "NEG", score: -0.88, ch: "APP_STORE" },
      { t: "Offline review mode saved my team hours during the field conference", s: "POS", score: 0.94, ch: "APP_STORE" },
      { t: "Android app background battery usage is somewhat high", s: "NEG", score: -0.55, ch: "APP_STORE" },
      { t: "iPad split view layout is fantastic for triaging support feedback", s: "POS", score: 0.89, ch: "APP_STORE" }
    ]},
    { theme: "API Rate Limits & Webhooks", templates: [
      { t: "Webhook retry mechanism handled our server restart with zero lost data", s: "POS", score: 0.96, ch: "COMMUNITY" },
      { t: "Hitting API rate limits during our morning synchronization job", s: "NEG", score: -0.5, ch: "SUPPORT_TICKET" },
      { t: "Clear API documentation with interactive code snippets", s: "POS", score: 0.92, ch: "NPS_SURVEY" }
    ]},
    { theme: "Enterprise SSO & Security", templates: [
      { t: "Okta SAML 2.0 integration worked out of the box in 15 minutes", s: "POS", score: 0.95, ch: "SALES_CALL" },
      { t: "Need SCIM automated user deprovisioning for SOC 2 compliance", s: "NEU", score: 0.0, ch: "SALES_CALL" },
      { t: "Granular role-based permissions give our team total peace of mind", s: "POS", score: 0.89, ch: "COMMUNITY" }
    ]},
    { theme: "UI Dark Mode & Accessibility", templates: [
      { t: "Dark theme typography and sentiment colors look gorgeous", s: "POS", score: 0.94, ch: "COMMUNITY" },
      { t: "Keyboard shortcut navigation allows rapid triaging without touching a mouse", s: "POS", score: 0.91, ch: "NPS_SURVEY" },
      { t: "Some gray text labels have low contrast in bright sunlight", s: "NEG", score: -0.4, ch: "SUPPORT_TICKET" }
    ]}
  ];

  let idCounter = 100;
  while (allFeedbackItems.length < 130) {
    for (const v of variations) {
      if (allFeedbackItems.length >= 130) break;
      for (const t of v.templates) {
        if (allFeedbackItems.length >= 130) break;
        idCounter++;
        let daysAgo = Math.floor(Math.random() * 40) + 1;
        if (v.theme === "Search, Indexing & Filter Latency" && idCounter % 2 === 0) {
          daysAgo = Math.floor(Math.random() * 6) + 1; // spike in last 7 days!
        }
        allFeedbackItems.push({
          content: `${t.t} - Reference log #${idCounter}.`,
          channel: t.ch,
          customer: `Enterprise Client #${idCounter}`,
          source: `${t.ch} - Ref #${idCounter * 12}`,
          sentiment: t.s,
          score: t.score,
          theme: v.theme,
          daysAgo,
          createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
          status: daysAgo < 3 ? "NEW" : daysAgo < 14 ? "REVIEWED" : "ACTIONED",
        });
      }
    }
  }

  console.log(`Inserting ${allFeedbackItems.length} items with embeddings...`);

  for (let i = 0; i < allFeedbackItems.length; i++) {
    const item = allFeedbackItems[i];
    const themeId = themeMap.get(item.theme);

    const feedback = await prisma.feedback.create({
      data: {
        content: item.content,
        channel: item.channel,
        sourceRef: item.source,
        customerLabel: item.customer,
        sentiment: item.sentiment,
        sentimentScore: item.score,
        status: item.status,
        createdAt: item.createdAt,
        workspaceId: workspace.id,
      },
    });

    if (themeId) {
      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: themeId,
          confidence: Number((0.85 + Math.random() * 0.14).toFixed(2)),
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

    if ((i + 1) % 30 === 0 || i === allFeedbackItems.length - 1) {
      console.log(`Seeded ${i + 1} / ${allFeedbackItems.length} records`);
    }
  }

  // Baseline VoC Report
  const sampleReportContent = {
    executiveSummary: "This executive briefing analyzes 130 feedback items captured across customer touchpoints for Apex Cloud Technologies. Net customer sentiment is positive (+38), anchored by high satisfaction with onboarding simplicity and dark mode ergonomics. However, search latency and filter execution times have spiked by +140% this week, presenting an immediate retention risk.",
    sentimentHealth: {
      score: 38,
      label: "Moderately Positive",
      totalFeedback: 130,
      posPercent: 54,
      neuPercent: 22,
      negPercent: 24,
      deltaVsPriorPeriod: 18,
    },
    topPositiveThemes: [
      { name: "Onboarding & First-Run Experience", count: 28, sentimentScore: 0.88 },
      { name: "UI Dark Mode & Accessibility", count: 22, sentimentScore: 0.82 },
      { name: "API Rate Limits & Webhooks", count: 18, sentimentScore: 0.76 },
    ],
    topNegativeThemes: [
      { name: "Search, Indexing & Filter Latency", count: 34, sentimentScore: -0.74 },
      { name: "Mobile App Performance & Offline Sync", count: 20, sentimentScore: -0.62 },
      { name: "Billing, Invoicing & Stripe Integration", count: 12, sentimentScore: -0.45 },
    ],
    keyDriversAndFriction: [
      { title: "Search Filter Gateway Timeouts", severity: "HIGH", description: "Multi-filter queries exceed 10 seconds on large datasets, returning HTTP 504.", affectedCustomers: "Enterprise power users & CX Directors" },
      { title: "iOS 17 Mobile App Startup Crash", severity: "HIGH", description: "App freezes on startup for users on iOS 17.5 after recent v2.4 update.", affectedCustomers: "Mobile app users" },
      { title: "Invoice PDF VAT Number Omission", severity: "MEDIUM", description: "European customers cannot reconcile invoices due to missing VAT line items.", affectedCustomers: "EU Accounts Payable teams" },
    ],
    representativeQuotes: {
      positive: [
        { quote: "Setting up our workspace took literally 3 minutes. The automated invitation links and quick sample seed data made product demoing effortless.", customer: "Claire Beaumont (Head of Growth)", channel: "NPS SURVEY" },
        { quote: "Instant search autocomplete is a joy to use. Really appreciate how fast queries return when filtering single themes.", customer: "TechLeadReviewer", channel: "APP STORE" },
        { quote: "The webhook reliability is rock solid. We piped 50,000 feedback events into our internal Slack without a dropped packet.", customer: "API_Master_Zack", channel: "COMMUNITY" }
      ],
      negative: [
        { quote: "The search query times out every time we filter by more than 3 tags. It takes 12 seconds and often returns HTTP 504.", customer: "Marcus Vance (VP Eng, ScaleFlow)", channel: "SUPPORT TICKET" },
        { quote: "App crashes every time I open the detail view on iOS 17.5. Reinstalled twice and restarted iPhone, still freezing immediately.", customer: "FrustratediOSUser_99", channel: "APP STORE" },
        { quote: "We were charged for 15 seats instead of 10 after removing 5 contractor accounts. Need an adjusted credit invoice.", customer: "Heather Morris (Finance Director)", channel: "SUPPORT TICKET" }
      ]
    },
    recommendedActions: [
      { priority: "P0", action: "Deploy query index optimization and caching on multi-facet feedback search", rationale: "Mitigates the 140% spike in search timeouts and stops customer churn risk.", owner: "Platform Data Team" },
      { priority: "P1", action: "Release hotfix v2.4.2 for iOS crash on startup", rationale: "Restores mobile app store rating and enables mobile CX triage.", owner: "Mobile Engineering" },
      { priority: "P2", action: "Add customizable VAT/Tax ID fields to customer billing settings", rationale: "Unblocks European enterprise procurement renewals.", owner: "Billing & Growth Team" }
    ]
  };

  await prisma.report.create({
    data: {
      title: "Q3 Executive Voice-of-Customer Briefing",
      periodStart: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      periodEnd: now,
      contentJson: JSON.stringify(sampleReportContent),
      workspaceId: workspace.id,
      generatedById: analystUser.id,
    },
  });

  console.log("SEEDING COMPLETED SUCCESSFULLY!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });