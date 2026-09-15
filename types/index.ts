export type Role = "ADMIN" | "ANALYST" | "VIEWER";

export type Channel =
  | "SUPPORT_TICKET"
  | "APP_STORE"
  | "NPS_SURVEY"
  | "SALES_CALL"
  | "COMMUNITY";

export type Sentiment = "POS" | "NEU" | "NEG";

export type FeedbackStatus = "NEW" | "REVIEWED" | "ACTIONED";

export interface FeedbackThemeItem {
  id: string;
  themeId: string;
  confidence: number;
  theme: {
    id: string;
    name: string;
    description: string | null;
    color: string;
  };
}

export interface FeedbackRecord {
  id: string;
  content: string;
  channel: Channel;
  sourceRef: string | null;
  customerLabel: string | null;
  sentiment: Sentiment;
  sentimentScore: number;
  status: FeedbackStatus;
  createdAt: string | Date;
  workspaceId: string;
  themes?: FeedbackThemeItem[];
}

export interface ThemeWithStats {
  id: string;
  name: string;
  description: string | null;
  color: string;
  count: number;
  avgSentiment: number;
  recentCount: number;
  previousCount: number;
  growthRate: number; // percentage change
  isSpike: boolean; // true if growthRate >= 40% and count >= 3
}

export interface VoCReportContent {
  executiveSummary: string;
  sentimentHealth: {
    score: number; // -100 to 100
    label: string;
    totalFeedback: number;
    posPercent: number;
    neuPercent: number;
    negPercent: number;
    deltaVsPriorPeriod: number;
  };
  topPositiveThemes: Array<{ name: string; count: number; sentimentScore: number }>;
  topNegativeThemes: Array<{ name: string; count: number; sentimentScore: number }>;
  keyDriversAndFriction: Array<{
    title: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    description: string;
    affectedCustomers: string;
  }>;
  representativeQuotes: {
    positive: Array<{ quote: string; customer: string; channel: string }>;
    negative: Array<{ quote: string; customer: string; channel: string }>;
  };
  recommendedActions: Array<{
    priority: "P0" | "P1" | "P2";
    action: string;
    rationale: string;
    owner: string;
  }>;
}

export interface AskCitation {
  id: string;
  customerLabel: string | null;
  channel: Channel;
  sentiment: Sentiment;
  contentSnippet: string;
  similarity: number;
}

export interface AskResponse {
  answer: string;
  citations: AskCitation[];
  grounded: boolean;
}