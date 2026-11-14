import { z } from 'zod';

const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'unknown']);

export const RiskAssessmentSchema = z.object({
  overallLevel: RiskLevelSchema,
  elfNarration: z.string().max(600),
  risks: z.array(z.object({
    category: z.string(),
    level: RiskLevelSchema,
    headline: z.string().max(120),
    explanation: z.string().max(400),
  })).min(1).max(12),
  actions: z.array(z.object({
    priority: z.enum(['urgent', 'recommended', 'optional']),
    action: z.string().max(200),
    reason: z.string().max(300),
    timeframe: z.string().optional(),
  })).min(1).max(15),
  pepRecommended: z.boolean(),
  urgentCareNeeded: z.boolean(),
  disclaimer: z.string().max(300),
});

export type RiskAssessmentFromSchema = z.infer<typeof RiskAssessmentSchema>;
