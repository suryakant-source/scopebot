import { z } from "zod";

export const AssumptionSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  statement: z.string().min(1),
  impactIfWrong: z.enum(["Low", "Medium", "High"]),
});

export const ClientQuestionSchema = z.object({
  id: z.string().min(1),
  priority: z.enum(["Critical", "Important", "Nice-to-know"]),
  question: z.string().min(1),
  whyItMatters: z.string().min(1),
});

export const TaskItemSchema = z.object({
  id: z.string().min(1),
  phase: z.string().min(1),
  task: z.string().min(1),
  description: z.string().min(1),
  role: z.string().min(1),
  hoursMin: z.number().nonnegative(),
  hoursMax: z.number().nonnegative(),
  hoursExpected: z.number().nonnegative(),
  complexity: z.enum(["Low", "Medium", "High"]),
});

export const MilestoneItemSchema = z.object({
  phaseNumber: z.number().int().positive(),
  title: z.string().min(1),
  timeframe: z.string().min(1),
  summary: z.string().min(1),
  keyDeliverables: z.array(z.string().min(1)).min(1),
  exitCriteria: z.string().min(1),
});

export const ScopeOutputSchema = z.object({
  scopeSummary: z.object({
    projectTitle: z.string().min(1),
    clientIndustry: z.string().min(1),
    executiveSummary: z.string().min(10),
    objectives: z.array(z.string().min(1)).min(2),
    deliverables: z.array(z.string().min(1)).min(2),
    outOfScope: z.array(z.string().min(1)).min(2),
    recommendedStack: z.array(z.string().min(1)).min(2),
  }),
  assumptionsAndQuestions: z.object({
    assumptions: z.array(AssumptionSchema).min(3),
    questionsForClient: z.array(ClientQuestionSchema).min(3),
  }),
  taskBreakdown: z.object({
    tasks: z.array(TaskItemSchema).min(4),
    totalHoursMin: z.number().nonnegative(),
    totalHoursMax: z.number().nonnegative(),
    totalHoursExpected: z.number().nonnegative(),
    estimationNotes: z.string().min(1),
  }),
  milestoneTimeline: z.object({
    estimatedTotalWeeks: z.number().positive(),
    milestones: z.array(MilestoneItemSchema).min(3),
  }),
  proposalEmail: z.object({
    subject: z.string().min(1),
    recipientPlaceholder: z.string().min(1),
    body: z.string().min(20),
    callToAction: z.string().min(1),
  }),
});

export type ScopeOutput = z.infer<typeof ScopeOutputSchema>;
export type TaskItem = z.infer<typeof TaskItemSchema>;
export type MilestoneItem = z.infer<typeof MilestoneItemSchema>;
export type AssumptionItem = z.infer<typeof AssumptionSchema>;
export type ClientQuestionItem = z.infer<typeof ClientQuestionSchema>;

export interface ScopeValidationResult {
  success: boolean;
  data?: ScopeOutput;
  errorSummary?: string;
  rawExtracted?: string;
}

/**
 * Extracts JSON from an LLM response that may include <think>...</think> blocks
 * or markdown code fences, then validates against ScopeOutputSchema.
 */
export function parseAndValidateScopeJson(rawContent: string): ScopeValidationResult {
  if (!rawContent || typeof rawContent !== "string") {
    return {
      success: false,
      errorSummary: "Empty or non-string model response.",
    };
  }

  // 1. Strip any <think>...</think> reasoning blocks emitted by Qwen models
  let cleaned = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 2. Extract from ```json ... ``` or ``` ... ``` code fences if present
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  } else {
    // 3. Otherwise extract outermost JSON object { ... }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown JSON parse error";
    return {
      success: false,
      errorSummary: `Invalid JSON syntax: ${message}`,
      rawExtracted: cleaned.slice(0, 1000),
    };
  }

  const validation = ScopeOutputSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = validation.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    return {
      success: false,
      errorSummary: `Schema validation failed: ${issues}`,
      rawExtracted: cleaned.slice(0, 1000),
    };
  }

  // Ensure task hour totals are consistent with the sum of individual tasks
  const data = validation.data;
  const computedMin = data.taskBreakdown.tasks.reduce((acc, t) => acc + t.hoursMin, 0);
  const computedMax = data.taskBreakdown.tasks.reduce((acc, t) => acc + t.hoursMax, 0);
  const computedExpected = data.taskBreakdown.tasks.reduce((acc, t) => acc + t.hoursExpected, 0);

  data.taskBreakdown.totalHoursMin = computedMin;
  data.taskBreakdown.totalHoursMax = computedMax;
  data.taskBreakdown.totalHoursExpected = computedExpected;

  return {
    success: true,
    data,
  };
}
