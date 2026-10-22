"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  FileText,
  HelpCircle,
  Layers,
  Mail,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import type { ScopeOutput, ScopePartA } from "@/lib/schema";
import {
  formatAssumptionsAndQuestionsText,
  formatFullScopeMarkdown,
  formatMilestoneTimelineText,
  formatProposalEmailText,
  formatScopeSummaryText,
  formatTaskBreakdownText,
} from "@/lib/formatters";
import { CopyButton } from "./CopyButton";

type TabId = "scope" | "estimate" | "risks";

interface ResultsViewProps {
  data?: ScopeOutput | null;
  partialPartA?: ScopePartA | null;
  isWaitingPartB?: boolean;
}

export function ResultsView({
  data,
  partialPartA,
  isWaitingPartB,
}: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("scope");

  const partA = data || partialPartA;
  const partB = data;

  if (!partA) return null;

  const { scopeSummary, assumptionsAndQuestions } = partA;
  const taskBreakdown = partB?.taskBreakdown;
  const milestoneTimeline = partB?.milestoneTimeline;
  const proposalEmail = partB?.proposalEmail;

  // Compute text for the active tab for the "Copy Tab" button
  const getActiveTabMarkdown = () => {
    if (!data) {
      if (activeTab === "scope") return formatScopeSummaryText(partA as ScopeOutput);
      if (activeTab === "risks") return formatAssumptionsAndQuestionsText(partA as ScopeOutput);
      return "";
    }
    switch (activeTab) {
      case "scope":
        return formatScopeSummaryText(data);
      case "estimate":
        return `${formatTaskBreakdownText(data)}\n\n---\n\n${formatMilestoneTimelineText(data)}`;
      case "risks":
        return `${formatAssumptionsAndQuestionsText(data)}\n\n---\n\n${formatProposalEmailText(data)}`;
      default:
        return formatFullScopeMarkdown(data);
    }
  };

  const getFullMarkdown = () => {
    if (data) return formatFullScopeMarkdown(data);
    return `${formatScopeSummaryText(partA as ScopeOutput)}\n\n---\n\n${formatAssumptionsAndQuestionsText(partA as ScopeOutput)}`;
  };

  const complexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case "high":
        return "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400";
      case "medium":
      case "med":
        return "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400";
      default:
        return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400";
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400";
      case "important":
        return "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400";
      default:
        return "text-zinc-600 bg-zinc-500/10 border-zinc-500/20 dark:text-zinc-400";
    }
  };

  return (
    <div className="space-y-4">
      {/* Dev-tool Tab Strip & Global Actions Header */}
      <div className="panel p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-[6px] border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("scope")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[4px] transition-colors duration-150 ${
              activeTab === "scope"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100 font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Scope</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("estimate")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[4px] transition-colors duration-150 ${
              activeTab === "estimate"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100 font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Estimate</span>
            {isWaitingPartB && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("risks")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[4px] transition-colors duration-150 ${
              activeTab === "risks"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100 font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Risks &amp; Proposal</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <CopyButton
            text={getActiveTabMarkdown()}
            label="Copy tab"
            variant="default"
            size="sm"
          />
          <CopyButton
            text={getFullMarkdown()}
            label="Copy all (Markdown)"
            variant="primary"
            size="sm"
          />
        </div>
      </div>

      {/* TAB 1: SCOPE */}
      {activeTab === "scope" && (
        <div className="space-y-4">
          {/* Executive Header */}
          <div className="panel p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  Project Title
                </span>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-0.5">
                  {scopeSummary.projectTitle}
                </h2>
              </div>
              <span className="inline-flex items-center rounded-[4px] border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 font-mono">
                {scopeSummary.clientIndustry}
              </span>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                Executive Summary
              </h3>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {scopeSummary.executiveSummary}
              </p>
            </div>
          </div>

          {/* Objectives and Deliverables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Objectives */}
            <div className="panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-zinc-500" />
                  Core Objectives
                </h3>
                <span className="text-xs font-mono text-zinc-500">
                  {scopeSummary.objectives.length} targets
                </span>
              </div>
              <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {scopeSummary.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-xs font-mono text-zinc-400 mt-0.5 shrink-0">
                      {(i + 1).toString().padStart(2, "0")}
                    </span>
                    <span className="leading-snug">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Deliverables */}
            <div className="panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-zinc-500" />
                  Key Deliverables
                </h3>
                <span className="text-xs font-mono text-zinc-500">
                  {scopeSummary.deliverables.length} items
                </span>
              </div>
              <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {scopeSummary.deliverables.map((del, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <span className="leading-snug">{del}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Boundaries & Tech Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Out of Scope */}
            <div className="panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-zinc-500" />
                  Out of Scope (Phase 1)
                </h3>
                <span className="text-xs font-mono text-zinc-500">Guardrails</span>
              </div>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                {scopeSummary.outOfScope.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-zinc-400 font-mono text-xs">✕</span>
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Stack */}
            <div className="panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-zinc-500" />
                  Recommended Architecture
                </h3>
                <span className="text-xs font-mono text-zinc-500">Tech Stack</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {scopeSummary.recommendedStack.map((tech, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-[4px] border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-mono text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ESTIMATE */}
      {activeTab === "estimate" && (
        <div className="space-y-4">
          {!partB || !taskBreakdown || !milestoneTimeline ? (
            <div className="panel p-8 text-center space-y-3">
              <Clock className="h-6 w-6 text-blue-500 animate-spin mx-auto" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Assembling task estimates and milestone timeline...
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Call B is currently streaming task hours, complexity matrices, and milestone delivery schedules.
              </p>
            </div>
          ) : (
            <>
              {/* Stripe-docs Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="panel p-3.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    Expected Total
                  </div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50 mt-0.5">
                    {taskBreakdown.totalHoursExpected}h
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Engineering hours
                  </div>
                </div>

                <div className="panel p-3.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    Estimate Range
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50 mt-0.5">
                    {taskBreakdown.totalHoursMin}–{taskBreakdown.totalHoursMax}h
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Low to high bounds
                  </div>
                </div>

                <div className="panel p-3.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    Duration
                  </div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50 mt-0.5">
                    {milestoneTimeline.estimatedTotalWeeks} wks
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    End-to-end delivery
                  </div>
                </div>

                <div className="panel p-3.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    Work Breakdown
                  </div>
                  <div className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50 mt-0.5">
                    {taskBreakdown.tasks.length} tasks
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {milestoneTimeline.milestones.length} phases
                  </div>
                </div>
              </div>

              {/* Task Breakdown Table (Stripe docs style) */}
              <div className="panel overflow-hidden">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Task Breakdown &amp; Resource Allocation
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Granular engineering estimates with role and complexity weights
                    </p>
                  </div>
                  <CopyButton
                    text={formatTaskBreakdownText(data!)}
                    label="Copy tasks"
                    size="sm"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 font-mono text-[11px] text-zinc-500">
                        <th className="py-2.5 px-3 font-medium">ID</th>
                        <th className="py-2.5 px-3 font-medium">Phase</th>
                        <th className="py-2.5 px-3 font-medium">Task &amp; Description</th>
                        <th className="py-2.5 px-3 font-medium">Role</th>
                        <th className="py-2.5 px-3 font-medium">Complexity</th>
                        <th className="py-2.5 px-3 font-medium text-right">Range</th>
                        <th className="py-2.5 px-3 font-medium text-right">Expected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {taskBreakdown.tasks.map((task) => (
                        <tr
                          key={task.id}
                          className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono text-zinc-400">
                            {task.id}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                            {task.phase}
                          </td>
                          <td className="py-2.5 px-3 max-w-sm">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                              {task.task}
                            </span>
                            <span className="text-zinc-500 text-[11px] leading-relaxed block mt-0.5">
                              {task.description}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                            {task.role}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[10px] font-medium font-mono ${complexityColor(
                                task.complexity
                              )}`}
                            >
                              {task.complexity}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-500 whitespace-nowrap">
                            {task.hoursMin}–{task.hoursMax}h
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                            {task.hoursExpected}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {taskBreakdown.estimationNotes && (
                  <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-mono uppercase text-[10px] tracking-wider text-zinc-500 mr-2">
                      Estimation Notes:
                    </span>
                    {taskBreakdown.estimationNotes}
                  </div>
                )}
              </div>

              {/* Milestone Timeline Sequence */}
              <div className="panel p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Milestone Timeline ({milestoneTimeline.estimatedTotalWeeks} Weeks Total)
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Sequential delivery gates, key outputs, and formal exit criteria
                    </p>
                  </div>
                  <CopyButton
                    text={formatMilestoneTimelineText(data!)}
                    label="Copy timeline"
                    size="sm"
                  />
                </div>

                <div className="space-y-3">
                  {milestoneTimeline.milestones.map((m) => (
                    <div
                      key={m.phaseNumber}
                      className="rounded-[6px] border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                            Phase {m.phaseNumber}
                          </span>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {m.title}
                          </h4>
                        </div>
                        <span className="font-mono text-xs text-zinc-500">
                          {m.timeframe}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {m.summary}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                        <div>
                          <span className="font-mono text-[10px] uppercase text-zinc-500 block mb-1">
                            Key Deliverables
                          </span>
                          <ul className="space-y-1 text-zinc-700 dark:text-zinc-300">
                            {m.keyDeliverables.map((kd, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-blue-500 font-mono">•</span>
                                <span>{kd}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-mono text-[10px] uppercase text-zinc-500 block mb-1">
                            Exit Criteria
                          </span>
                          <p className="text-zinc-600 dark:text-zinc-400 font-mono text-[11px] leading-relaxed bg-white dark:bg-zinc-900 p-2 rounded-[4px] border border-zinc-200 dark:border-zinc-800">
                            {m.exitCriteria}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: RISKS & PROPOSAL */}
      {activeTab === "risks" && (
        <div className="space-y-4">
          {/* Assumptions Register */}
          <div className="panel p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Project Assumptions
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Explicit technical and operational premises
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {assumptionsAndQuestions.assumptions.length} items
              </span>
            </div>

            <div className="space-y-2.5">
              {assumptionsAndQuestions.assumptions.map((asm) => (
                <div
                  key={asm.id}
                  className="p-3 rounded-[6px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-start gap-3 text-xs"
                >
                  <span className="font-mono text-zinc-400 shrink-0 mt-0.5">
                    {asm.id}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                      {asm.statement}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                      <span>Category: <strong className="text-zinc-700 dark:text-zinc-300 font-normal">{asm.category}</strong></span>
                      <span>•</span>
                      <span>
                        Impact if wrong:{" "}
                        <strong className="text-zinc-700 dark:text-zinc-300 font-medium">
                          {asm.impactIfWrong}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Discovery Questions */}
          <div className="panel p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Clarifying Questions for Client
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Questions to ask during initial kickoff or scope alignment call
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {assumptionsAndQuestions.questionsForClient.length} questions
              </span>
            </div>

            <div className="space-y-2.5">
              {assumptionsAndQuestions.questionsForClient.map((q) => (
                <div
                  key={q.id}
                  className="p-3 rounded-[6px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                      <span className="font-mono text-zinc-400 font-normal mr-1.5">
                        {q.id}.
                      </span>
                      {q.question}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[10px] font-mono font-medium shrink-0 ${priorityColor(
                        q.priority
                      )}`}
                    >
                      {q.priority}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    <strong className="font-medium text-zinc-600 dark:text-zinc-400">
                      Why it matters:
                    </strong>{" "}
                    {q.whyItMatters}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Proposal Email Draft (Stripe-docs style code card) */}
          <div className="panel overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-500" />
                  Client Proposal Email Draft
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Ready to send to the client or paste into your CRM
                </p>
              </div>
              {proposalEmail && (
                <CopyButton
                  text={formatProposalEmailText(data!)}
                  label="Copy email"
                  variant="primary"
                  size="sm"
                />
              )}
            </div>

            {!proposalEmail ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                Email draft is being generated in parallel stream...
              </div>
            ) : (
              <div className="p-4 space-y-3 bg-zinc-50/40 dark:bg-zinc-900/30 text-xs">
                <div className="space-y-1 font-mono text-[11px] pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="w-14">To:</span>
                    <span className="text-zinc-800 dark:text-zinc-200">
                      {proposalEmail.recipientPlaceholder}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="w-14">Subject:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {proposalEmail.subject}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap py-2">
                  {proposalEmail.body}
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Next step CTA:
                  </span>{" "}
                  {proposalEmail.callToAction}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
