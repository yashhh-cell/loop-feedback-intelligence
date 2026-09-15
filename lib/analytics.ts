import { prisma } from "@/lib/db";
import { ThemeWithStats } from "@/types";

export interface DashboardStats {
  totalCount: number;
  totalDelta: number;
  posPercent: number;
  neuPercent: number;
  negPercent: number;
  avgSentimentScore: number;
  newThisWeek: number;
  timeline: Array<{
    date: string;
    pos: number;
    neu: number;
    neg: number;
    total: number;
  }>;
  sentimentDistribution: Array<{
    name: string;
    value: number;
    color: string;
    percent: number;
  }>;
  topThemes: Array<{
    name: string;
    count: number;
    color: string;
    avgSentiment: number;
  }>;
  channelBreakdown: Array<{
    channel: string;
    count: number;
  }>;
}

export async function getDashboardStats(
  workspaceId: string,
  days: number = 30
): Promise<DashboardStats> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const comparativeCutoff = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

  // Fetch feedback in current window
  const items = await prisma.feedback.findMany({
    where: {
      workspaceId,
      createdAt: { gte: cutoff },
    },
    include: {
      themes: {
        include: { theme: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Fetch feedback in previous comparative window for delta
  const priorItems = await prisma.feedback.findMany({
    where: {
      workspaceId,
      createdAt: {
        gte: comparativeCutoff,
        lt: cutoff,
      },
    },
  });

  const totalCount = items.length;
  const priorCount = priorItems.length;
  const totalDelta = priorCount > 0 ? Math.round(((totalCount - priorCount) / priorCount) * 100) : 0;

  const posCount = items.filter((i) => i.sentiment === "POS").length;
  const neuCount = items.filter((i) => i.sentiment === "NEU").length;
  const negCount = items.filter((i) => i.sentiment === "NEG").length;

  const posPercent = totalCount > 0 ? Math.round((posCount / totalCount) * 100) : 0;
  const neuPercent = totalCount > 0 ? Math.round((neuCount / totalCount) * 100) : 0;
  const negPercent = totalCount > 0 ? Math.round((negCount / totalCount) * 100) : 0;

  const totalScore = items.reduce((acc, curr) => acc + curr.sentimentScore, 0);
  const avgSentimentScore = totalCount > 0 ? Number((totalScore / totalCount).toFixed(2)) : 0;

  const newThisWeek = items.filter((i) => i.status === "NEW" && new Date(i.createdAt) >= oneWeekAgo).length;

  // Group by Date for timeline
  const dayBuckets: Record<string, { pos: number; neu: number; neg: number; total: number }> = {};
  for (let d = 0; d < days; d++) {
    const dt = new Date(cutoff.getTime() + d * 24 * 60 * 60 * 1000);
    const key = dt.toISOString().slice(5, 10); // MM-DD
    dayBuckets[key] = { pos: 0, neu: 0, neg: 0, total: 0 };
  }

  items.forEach((item) => {
    const key = new Date(item.createdAt).toISOString().slice(5, 10);
    if (!dayBuckets[key]) {
      dayBuckets[key] = { pos: 0, neu: 0, neg: 0, total: 0 };
    }
    dayBuckets[key].total++;
    if (item.sentiment === "POS") dayBuckets[key].pos++;
    else if (item.sentiment === "NEU") dayBuckets[key].neu++;
    else if (item.sentiment === "NEG") dayBuckets[key].neg++;
  });

  const timeline = Object.entries(dayBuckets).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  const sentimentDistribution = [
    { name: "Positive", value: posCount, color: "#10b981", percent: posPercent },
    { name: "Neutral", value: neuCount, color: "#94a3b8", percent: neuPercent },
    { name: "Negative", value: negCount, color: "#ef4444", percent: negPercent },
  ];

  // Theme distribution
  const themeCounts: Record<string, { count: number; color: string; scoreSum: number }> = {};
  items.forEach((item) => {
    item.themes.forEach((ft) => {
      const name = ft.theme.name;
      if (!themeCounts[name]) {
        themeCounts[name] = { count: 0, color: ft.theme.color, scoreSum: 0 };
      }
      themeCounts[name].count++;
      themeCounts[name].scoreSum += item.sentimentScore;
    });
  });

  const topThemes = Object.entries(themeCounts)
    .map(([name, data]) => ({
      name,
      count: data.count,
      color: data.color,
      avgSentiment: Number((data.scoreSum / data.count).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  // Channel breakdown
  const channelMap: Record<string, number> = {};
  items.forEach((item) => {
    channelMap[item.channel] = (channelMap[item.channel] || 0) + 1;
  });

  const channelBreakdown = Object.entries(channelMap).map(([channel, count]) => ({
    channel: channel.replace(/_/g, " "),
    count,
  }));

  return {
    totalCount,
    totalDelta,
    posPercent,
    neuPercent,
    negPercent,
    avgSentimentScore,
    newThisWeek,
    timeline,
    sentimentDistribution,
    topThemes,
    channelBreakdown,
  };
}

/**
 * Calculates themes with trend velocity and spike detection.
 */
export async function getThemeTrends(workspaceId: string): Promise<ThemeWithStats[]> {
  const now = new Date();
  const currentWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const themes = await prisma.theme.findMany({
    where: { workspaceId },
    include: {
      feedback: {
        include: {
          feedback: {
            select: {
              id: true,
              sentimentScore: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  return themes.map((theme) => {
    const all = theme.feedback.map((f) => f.feedback);
    const count = all.length;
    const avgSentiment =
      count > 0 ? Number((all.reduce((acc, curr) => acc + curr.sentimentScore, 0) / count).toFixed(2)) : 0;

    const recentCount = all.filter((f) => new Date(f.createdAt) >= currentWeek).length;
    const previousCount = all.filter(
      (f) => new Date(f.createdAt) >= previousWeek && new Date(f.createdAt) < currentWeek
    ).length;

    let growthRate = 0;
    if (previousCount === 0) {
      growthRate = recentCount > 0 ? 100 : 0;
    } else {
      growthRate = Math.round(((recentCount - previousCount) / previousCount) * 100);
    }

    // Spike detected if growth >= 40% and recent volume is significant (>= 3 items)
    const isSpike = growthRate >= 40 && recentCount >= 3;

    return {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      color: theme.color,
      count,
      avgSentiment,
      recentCount,
      previousCount,
      growthRate,
      isSpike,
    };
  }).sort((a, b) => b.recentCount - a.recentCount);
}

/**
 * Pre-computes exact deterministic figures for Voice-of-Customer report generation.
 */
export async function computeVoCStats(
  workspaceId: string,
  startDate: Date,
  endDate: Date
) {
  const periodDuration = endDate.getTime() - startDate.getTime();
  const priorStart = new Date(startDate.getTime() - periodDuration);
  const priorEnd = new Date(startDate.getTime());

  const items = await prisma.feedback.findMany({
    where: {
      workspaceId,
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      themes: { include: { theme: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const priorItems = await prisma.feedback.findMany({
    where: {
      workspaceId,
      createdAt: { gte: priorStart, lte: priorEnd },
    },
  });

  const totalCount = items.length;
  const priorCount = priorItems.length;
  const deltaVsPriorPeriod =
    priorCount > 0 ? Math.round(((totalCount - priorCount) / priorCount) * 100) : 0;

  const posItems = items.filter((i) => i.sentiment === "POS");
  const neuItems = items.filter((i) => i.sentiment === "NEU");
  const negItems = items.filter((i) => i.sentiment === "NEG");

  const posPercent = totalCount > 0 ? Math.round((posItems.length / totalCount) * 100) : 0;
  const neuPercent = totalCount > 0 ? Math.round((neuItems.length / totalCount) * 100) : 0;
  const negPercent = totalCount > 0 ? Math.round((negItems.length / totalCount) * 100) : 0;

  const rawScore = totalCount > 0 ? items.reduce((acc, c) => acc + c.sentimentScore, 0) / totalCount : 0;
  const sentimentScoreInt = Math.round(rawScore * 100);
  let sentimentLabel = "Neutral";
  if (sentimentScoreInt > 25) sentimentLabel = "Strongly Positive";
  else if (sentimentScoreInt > 0) sentimentLabel = "Moderately Positive";
  else if (sentimentScoreInt < -25) sentimentLabel = "Critical / Negative";
  else if (sentimentScoreInt < 0) sentimentLabel = "Moderately Negative";

  // Themes
  const themeMap: Record<string, { name: string; count: number; scoreSum: number }> = {};
  items.forEach((item) => {
    item.themes.forEach((ft) => {
      const name = ft.theme.name;
      if (!themeMap[name]) themeMap[name] = { name, count: 0, scoreSum: 0 };
      themeMap[name].count++;
      themeMap[name].scoreSum += item.sentimentScore;
    });
  });

  const themeBreakdown = Object.values(themeMap).map((t) => ({
    name: t.name,
    count: t.count,
    avgSentiment: t.count > 0 ? t.scoreSum / t.count : 0,
  }));

  const topPositiveThemes = themeBreakdown
    .filter((t) => t.avgSentiment > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((t) => ({ name: t.name, count: t.count, sentimentScore: t.avgSentiment }));

  const topNegativeThemes = themeBreakdown
    .filter((t) => t.avgSentiment < 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((t) => ({ name: t.name, count: t.count, sentimentScore: t.avgSentiment }));

  const representativeQuotes = {
    positive: posItems.slice(0, 3).map((i) => ({
      quote: i.content,
      customer: i.customerLabel || "Verified Customer",
      channel: i.channel.replace(/_/g, " "),
    })),
    negative: negItems.slice(0, 3).map((i) => ({
      quote: i.content,
      customer: i.customerLabel || "Verified Customer",
      channel: i.channel.replace(/_/g, " "),
    })),
  };

  return {
    totalCount,
    deltaVsPriorPeriod,
    posPercent,
    neuPercent,
    negPercent,
    sentimentScoreInt,
    sentimentLabel,
    themeBreakdown,
    topPositiveThemes,
    topNegativeThemes,
    representativeQuotes,
  };
}