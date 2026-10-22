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

export const ScopeSummarySchema = z.object({
  projectTitle: z.string().min(1),
  clientIndustry: z.string().min(1),
  executiveSummary: z.string().min(10),
  objectives: z.array(z.string().min(1)).min(2),
  deliverables: z.array(z.string().min(1)).min(2),
  outOfScope: z.array(z.string().min(1)).min(2),
  recommendedStack: z.array(z.string().min(1)).min(2),
});

export const AssumptionsAndQuestionsSchema = z.object({
  assumptions: z.array(AssumptionSchema).min(3),
  questionsForClient: z.array(ClientQuestionSchema).min(3),
});

export const TaskBreakdownSchema = z.object({
  tasks: z.array(TaskItemSchema).min(3),
  totalHoursMin: z.number().nonnegative(),
  totalHoursMax: z.number().nonnegative(),
  totalHoursExpected: z.number().nonnegative(),
  estimationNotes: z.string().min(1),
});

export const MilestoneTimelineSchema = z.object({
  estimatedTotalWeeks: z.number().positive(),
  milestones: z.array(MilestoneItemSchema).min(2),
});

export const ProposalEmailSchema = z.object({
  subject: z.string().min(1),
  recipientPlaceholder: z.string().min(1),
  body: z.string().min(20),
  callToAction: z.string().min(1),
});

// Part A: Scope Summary + Assumptions & Questions
export const ScopePartASchema = z.object({
  scopeSummary: ScopeSummarySchema,
  assumptionsAndQuestions: AssumptionsAndQuestionsSchema,
});

// Part B: Task Breakdown + Milestone Timeline + Proposal Email
export const ScopePartBSchema = z.object({
  taskBreakdown: TaskBreakdownSchema,
  milestoneTimeline: MilestoneTimelineSchema,
  proposalEmail: ProposalEmailSchema,
});

// Full Output Schema
export const ScopeOutputSchema = z.object({
  scopeSummary: ScopeSummarySchema,
  assumptionsAndQuestions: AssumptionsAndQuestionsSchema,
  taskBreakdown: TaskBreakdownSchema,
  milestoneTimeline: MilestoneTimelineSchema,
  proposalEmail: ProposalEmailSchema,
});

export type ScopeOutput = z.infer<typeof ScopeOutputSchema>;
export type ScopePartA = z.infer<typeof ScopePartASchema>;
export type ScopePartB = z.infer<typeof ScopePartBSchema>;
export type TaskItem = z.infer<typeof TaskItemSchema>;
export type MilestoneItem = z.infer<typeof MilestoneItemSchema>;
export type AssumptionItem = z.infer<typeof AssumptionSchema>;
export type ClientQuestionItem = z.infer<typeof ClientQuestionSchema>;

export interface ScopeValidationResult<T = ScopeOutput> {
  success: boolean;
  data?: T;
  errorSummary?: string;
  rawExtracted?: string;
}

/**
 * Extracts and cleans JSON string from an LLM response.
 * Strips <think>...</think> reasoning traces and code block wrappers.
 */
export function extractJsonString(rawContent: string): { cleaned: string; error?: string } {
  if (!rawContent || typeof rawContent !== "string") {
    return { cleaned: "", error: "Empty or non-string model response." };
  }

  // 1. Strip any <think>...</think> reasoning blocks
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

  return { cleaned };
}

/**
 * Parses and validates Part A (Scope Summary + Assumptions/Questions).
 */
export function parseAndValidatePartAJson(rawContent: string): ScopeValidationResult<ScopePartA> {
  const { cleaned, error } = extractJsonString(rawContent);
  if (error || !cleaned) {
    return { success: false, errorSummary: error || "Empty JSON content." };
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

  const validation = ScopePartASchema.safeParse(parsed);
  if (!validation.success) {
    const issues = validation.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    return {
      success: false,
      errorSummary: `Part A schema validation failed: ${issues}`,
      rawExtracted: cleaned.slice(0, 1000),
    };
  }

  return {
    success: true,
    data: validation.data,
  };
}

/**
 * Parses and validates Part B (Task Breakdown + Timeline + Proposal Email).
 * Caps tasks to max 8 and milestones to max 5 defensively, and recalculates totals.
 */
export function parseAndValidatePartBJson(rawContent: string): ScopeValidationResult<ScopePartB> {
  const { cleaned, error } = extractJsonString(rawContent);
  if (error || !cleaned) {
    return { success: false, errorSummary: error || "Empty JSON content." };
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

  const validation = ScopePartBSchema.safeParse(parsed);
  if (!validation.success) {
    const issues = validation.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    return {
      success: false,
      errorSummary: `Part B schema validation failed: ${issues}`,
      rawExtracted: cleaned.slice(0, 1000),
    };
  }

  const data = validation.data;

  // Defensively cap tasks to at most 8 and milestones to at most 5 if the model slightly exceeded
  if (data.taskBreakdown.tasks.length > 8) {
    data.taskBreakdown.tasks = data.taskBreakdown.tasks.slice(0, 8);
  }
  if (data.milestoneTimeline.milestones.length > 5) {
    data.milestoneTimeline.milestones = data.milestoneTimeline.milestones.slice(0, 5);
  }

  // Ensure task hour totals are strictly consistent with the sum of individual tasks
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

/**
 * Combines Part A and Part B into a complete ScopeOutput.
 */
export function mergeScopeParts(partA: ScopePartA, partB: ScopePartB): ScopeOutput {
  return {
    scopeSummary: partA.scopeSummary,
    assumptionsAndQuestions: partA.assumptionsAndQuestions,
    taskBreakdown: partB.taskBreakdown,
    milestoneTimeline: partB.milestoneTimeline,
    proposalEmail: partB.proposalEmail,
  };
}

/**
 * Extracts JSON from an LLM response that may include <think>...</think> blocks
 * or markdown code fences, then validates against ScopeOutputSchema.
 */
export function parseAndValidateScopeJson(rawContent: string): ScopeValidationResult {
  const { cleaned, error } = extractJsonString(rawContent);
  if (error || !cleaned) {
    return { success: false, errorSummary: error || "Empty JSON content." };
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

  const data = validation.data;
  if (data.taskBreakdown.tasks.length > 8) {
    data.taskBreakdown.tasks = data.taskBreakdown.tasks.slice(0, 8);
  }
  if (data.milestoneTimeline.milestones.length > 5) {
    data.milestoneTimeline.milestones = data.milestoneTimeline.milestones.slice(0, 5);
  }

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
