import { z } from "zod";

export const ChannelEnum = z.enum([
  "SUPPORT_TICKET",
  "APP_STORE",
  "NPS_SURVEY",
  "SALES_CALL",
  "COMMUNITY",
]);

export const SentimentEnum = z.enum(["POS", "NEU", "NEG"]);

export const FeedbackStatusEnum = z.enum(["NEW", "REVIEWED", "ACTIONED"]);

export const RoleEnum = z.enum(["ADMIN", "ANALYST", "VIEWER"]);

// Single Feedback Ingestion Schema
export const FeedbackIngestSchema = z.object({
  content: z
    .string()
    .min(5, "Feedback content must be at least 5 characters")
    .max(5000, "Feedback content cannot exceed 5000 characters"),
  channel: ChannelEnum,
  sourceRef: z.string().max(255).optional().nullable(),
  customerLabel: z.string().max(255).optional().nullable(),
});

// Bulk CSV Feedback Schema
export const BulkFeedbackItemSchema = z.object({
  content: z.string().min(3),
  channel: ChannelEnum.default("SUPPORT_TICKET"),
  sourceRef: z.string().max(255).optional().nullable(),
  customerLabel: z.string().max(255).optional().nullable(),
});

export const BulkFeedbackSchema = z.object({
  items: z.array(BulkFeedbackItemSchema).min(1, "Must provide at least 1 item").max(500, "Batch limit is 500 items"),
});

// Feedback Filter & Query Schema
export const FeedbackQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  channel: ChannelEnum.optional(),
  sentiment: SentimentEnum.optional(),
  themeId: z.string().optional(),
  status: FeedbackStatusEnum.optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Feedback Status Update
export const FeedbackStatusUpdateSchema = z.object({
  status: FeedbackStatusEnum,
});

// Theme Creation Schema
export const ThemeCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid hex color").default("#6366f1"),
});

// Ask LOOP Q&A Question Schema
export const AskQuestionSchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters").max(1000),
  topK: z.coerce.number().int().min(1).max(20).default(5),
});

// Voice-of-Customer Report Generation Schema
export const ReportGenerateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  periodDays: z.coerce.number().int().positive().max(365).default(30),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// User Registration Schema
export const UserRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workspaceName: z.string().min(2, "Workspace name must be at least 2 characters"),
});

// User Invite / Create Schema
export const UserInviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: RoleEnum.default("ANALYST"),
});

// User Role Update Schema
export const UserRoleUpdateSchema = z.object({
  role: RoleEnum,
});

// AI Auto-Classification Output Schema
export const ClassificationResultSchema = z.object({
  sentiment: SentimentEnum,
  sentimentScore: z.number().min(-1.0).max(1.0),
  themes: z.array(z.string()).default([]),
  featureArea: z.string().default("General"),
  summary: z.string().default(""),
});

export type FeedbackIngestInput = z.infer<typeof FeedbackIngestSchema>;
export type BulkFeedbackInput = z.infer<typeof BulkFeedbackSchema>;
export type FeedbackQueryInput = z.infer<typeof FeedbackQuerySchema>;
export type AskQuestionInput = z.infer<typeof AskQuestionSchema>;
export type ReportGenerateInput = z.infer<typeof ReportGenerateSchema>;
export type UserRegisterInput = z.infer<typeof UserRegisterSchema>;
export type UserInviteInput = z.infer<typeof UserInviteSchema>;
export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;