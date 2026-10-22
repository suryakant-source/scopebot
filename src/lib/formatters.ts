import { ScopeOutput } from "./schema";

export function formatScopeSummaryText(data: ScopeOutput): string {
  const s = data.scopeSummary;
  return [
    `# ${s.projectTitle}`,
    `Industry: ${s.clientIndustry}`,
    ``,
    `## Executive Summary`,
    s.executiveSummary,
    ``,
    `## Core Objectives`,
    ...s.objectives.map((o) => `- ${o}`),
    ``,
    `## Key Deliverables`,
    ...s.deliverables.map((d) => `- ${d}`),
    ``,
    `## Out of Scope (Phase 1 Boundaries)`,
    ...s.outOfScope.map((item) => `- ${item}`),
    ``,
    `## Recommended Tech Stack`,
    s.recommendedStack.join(" • "),
  ].join("\n");
}

export function formatAssumptionsAndQuestionsText(data: ScopeOutput): string {
  const aq = data.assumptionsAndQuestions;
  return [
    `## Project Assumptions`,
    ...aq.assumptions.map(
      (a) =>
        `- [${a.id} | ${a.category} | Impact: ${a.impactIfWrong}] ${a.statement}`
    ),
    ``,
    `## Clarifying Questions for Client`,
    ...aq.questionsForClient.map(
      (q) =>
        `- [${q.id} | ${q.priority}] ${q.question}\n  Why it matters: ${q.whyItMatters}`
    ),
  ].join("\n");
}

export function formatTaskBreakdownText(data: ScopeOutput): string {
  const tb = data.taskBreakdown;
  const lines = [
    `## Task Breakdown & Engineering Estimates`,
    `Total Estimated Hours: ${tb.totalHoursExpected} hrs (Range: ${tb.totalHoursMin}–${tb.totalHoursMax} hrs)`,
    ``,
    `| ID | Phase | Task | Role | Complexity | Min–Max | Expected |`,
    `|---|---|---|---|---|---|---|`,
    ...tb.tasks.map(
      (t) =>
        `| ${t.id} | ${t.phase} | ${t.task}: ${t.description} | ${t.role} | ${t.complexity} | ${t.hoursMin}–${t.hoursMax}h | ${t.hoursExpected}h |`
    ),
    ``,
    `Notes: ${tb.estimationNotes}`,
  ];
  return lines.join("\n");
}

export function formatMilestoneTimelineText(data: ScopeOutput): string {
  const mt = data.milestoneTimeline;
  return [
    `## Milestone Timeline (${mt.estimatedTotalWeeks} Weeks Total)`,
    ``,
    ...mt.milestones.flatMap((m) => [
      `### Phase ${m.phaseNumber}: ${m.title} (${m.timeframe})`,
      m.summary,
      `Deliverables:`,
      ...m.keyDeliverables.map((d) => `  - ${d}`),
      `Exit Criteria: ${m.exitCriteria}`,
      ``,
    ]),
  ].join("\n");
}

export function formatProposalEmailText(data: ScopeOutput): string {
  const pe = data.proposalEmail;
  return [
    `Subject: ${pe.subject}`,
    ``,
    pe.recipientPlaceholder,
    ``,
    pe.body,
    ``,
    pe.callToAction,
    ``,
    `Best regards,`,
    `[Your Name / Engineering Team]`,
  ].join("\n");
}

export function formatFullScopeMarkdown(data: ScopeOutput): string {
  return [
    formatScopeSummaryText(data),
    `\n---\n`,
    formatAssumptionsAndQuestionsText(data),
    `\n---\n`,
    formatTaskBreakdownText(data),
    `\n---\n`,
    formatMilestoneTimelineText(data),
    `\n---\n`,
    `## Client Proposal Email`,
    ``,
    formatProposalEmailText(data),
  ].join("\n");
}
