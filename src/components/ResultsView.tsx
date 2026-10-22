"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Flag,
  HelpCircle,
  Layers,
  Loader2,
  Mail,
  Send,
  ShieldAlert,
  Sparkles,
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

const SECTIONS = [
  { id: "section-scope", label: "Scope Summary", icon: FileText },
  { id: "section-assumptions", label: "Assumptions & Questions", icon: HelpCircle },
  { id: "section-tasks", label: "Task Breakdown", icon: ClipboardList },
  { id: "section-timeline", label: "Milestone Timeline", icon: CalendarRange },
  { id: "section-proposal", label: "Proposal Email", icon: Mail },
];

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "red" | "amber" | "green" | "indigo" | "purple";
}) {
  const tones = {
    neutral:
      "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60",
    red: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60",
    amber:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
    green:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
    indigo:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60",
    purple:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-tight ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

const levelTone = (level: string) =>
  level === "High" || level === "Critical"
    ? "red"
    : level === "Medium" || level === "Important"
    ? "amber"
    : "green";

export function ResultsView({
  data,
  partialPartA,
  isWaitingPartB,
}: {
  data?: ScopeOutput | null;
  partialPartA?: ScopePartA | null;
  isWaitingPartB?: boolean;
}) {
  const [activeSection, setActiveSection] = useState("section-scope");

  const partA = data || partialPartA;
  const partB = data;

  // Scroll-spy observer
  useEffect(() => {
    const handleScroll = () => {
      const offsets = SECTIONS.map((sec) => {
        const el = document.getElementById(sec.id);
        if (!el) return { id: sec.id, top: Infinity };
        const rect = el.getBoundingClientRect();
        return { id: sec.id, top: Math.abs(rect.top - 120) };
      });
      offsets.sort((a, b) => a.top - b.top);
      if (offsets[0] && offsets[0].top < 600) {
        setActiveSection(offsets[0].id);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -90;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (!partA) return null;

  const s = partA.scopeSummary;
  const aq = partA.assumptionsAndQuestions;

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      {/* Sticky Left Section Nav (Linear / Stripe Docs style) */}
      <aside className="hidden lg:block">
        <nav
          aria-label="Section navigation"
          className="sticky top-24 space-y-4 rounded-xl border border-zinc-200/90 bg-white/70 p-3 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60"
        >
          <div className="px-2 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Sections
            </p>
          </div>
          <ul className="space-y-1">
            {SECTIONS.map((sec, idx) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              const isPending = !partB && idx >= 2;
              return (
                <li key={sec.id}>
                  <button
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
                    } ${isPending ? "opacity-60" : ""}`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    <span className="truncate">{sec.label}</span>
                    {isPending && (
                      <Loader2 className="ml-auto h-3 w-3 animate-spin text-indigo-500" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-zinc-200/80 pt-3 dark:border-zinc-800/80">
            {data && (
              <CopyButton
                text={formatFullScopeMarkdown(data)}
                label="Copy All (Markdown)"
                variant="primary"
                className="w-full justify-center"
              />
            )}
          </div>
        </nav>
      </aside>

      {/* Main Results Column */}
      <div className="space-y-8 min-w-0">
        {/* Hours Summary KPI Bar */}
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  {s.clientIndustry}
                </span>
                <span className="text-xs text-zinc-400">•</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Board-Ready Scope</span>
              </div>
              <h1 className="mt-1.5 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                {s.projectTitle}
              </h1>
            </div>
            {data && (
              <div className="lg:hidden">
                <CopyButton
                  text={formatFullScopeMarkdown(data)}
                  label="Copy All (Markdown)"
                  variant="primary"
                />
              </div>
            )}
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-3.5 dark:border-zinc-800/60 dark:bg-zinc-900/40">
              <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Expected Effort
              </dt>
              <dd className="mt-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {partB ? (
                  `${partB.taskBreakdown.totalHoursExpected} hrs`
                ) : (
                  <span className="flex items-center gap-1 text-sm font-medium text-indigo-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> Calculating…
                  </span>
                )}
              </dd>
            </div>

            <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-3.5 dark:border-zinc-800/60 dark:bg-zinc-900/40">
              <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Effort Range
              </dt>
              <dd className="mt-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {partB ? (
                  `${partB.taskBreakdown.totalHoursMin}–${partB.taskBreakdown.totalHoursMax}h`
                ) : (
                  <span className="text-sm text-zinc-400">—</span>
                )}
              </dd>
            </div>

            <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-3.5 dark:border-zinc-800/60 dark:bg-zinc-900/40">
              <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Timeline
              </dt>
              <dd className="mt-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {partB ? (
                  `${partB.milestoneTimeline.estimatedTotalWeeks} Weeks`
                ) : (
                  <span className="text-sm text-zinc-400">—</span>
                )}
              </dd>
            </div>

            <div className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-3.5 dark:border-zinc-800/60 dark:bg-zinc-900/40">
              <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Milestones
              </dt>
              <dd className="mt-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {partB ? `${partB.milestoneTimeline.milestones.length} Phases` : "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Section 1: Scope Summary */}
        <section
          id="section-scope"
          className="card scroll-mt-24 p-6"
          aria-labelledby="heading-scope"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <h2
              id="heading-scope"
              className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <FileText className="h-4 w-4" />
              </span>
              <span>1. Clear Scope Summary</span>
            </h2>
            {data && <CopyButton text={formatScopeSummaryText(data)} />}
          </div>

          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {s.executiveSummary}
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Core Objectives
              </h3>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                {s.objectives.map((obj, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                Key Deliverables
              </h3>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                {s.deliverables.map((deliv, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span>{deliv}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                Out of Scope (Boundaries)
              </h3>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                {s.outOfScope.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Recommended Tech Stack
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {s.recommendedStack.map((tech, i) => (
                  <Pill key={i} tone="indigo">
                    {tech}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Assumptions & Questions */}
        <section
          id="section-assumptions"
          className="card scroll-mt-24 p-6"
          aria-labelledby="heading-assumptions"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <h2
              id="heading-assumptions"
              className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <HelpCircle className="h-4 w-4" />
              </span>
              <span>2. Assumptions &amp; Clarifying Questions</span>
            </h2>
            {data && <CopyButton text={formatAssumptionsAndQuestionsText(data)} />}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Key Assumptions Made
              </h3>
              <ul className="space-y-3">
                {aq.assumptions.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-950/40"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <Pill>{a.id}</Pill>
                      <Pill>{a.category}</Pill>
                      <Pill tone={levelTone(a.impactIfWrong)}>
                        Impact if wrong: {a.impactIfWrong}
                      </Pill>
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {a.statement}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Questions to Ask the Client
              </h3>
              <ol className="space-y-3">
                {aq.questionsForClient.map((q) => (
                  <li
                    key={q.id}
                    className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-950/40"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <Pill>{q.id}</Pill>
                      <Pill tone={levelTone(q.priority)}>{q.priority} Priority</Pill>
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {q.question}
                    </p>
                    <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      <strong className="font-semibold text-zinc-600 dark:text-zinc-300">
                        Why it matters:
                      </strong>{" "}
                      {q.whyItMatters}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Section 3: Task Breakdown & Hour Estimates */}
        {partB ? (
          <section
            id="section-tasks"
            className="card scroll-mt-24 p-6"
            aria-labelledby="heading-tasks"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
              <h2
                id="heading-tasks"
                className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <span>3. Task Breakdown &amp; Hour Estimates</span>
              </h2>
              <CopyButton text={formatTaskBreakdownText(partB)} />
            </div>

            <div className="-mx-6 overflow-x-auto px-6">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="py-2.5 pr-3">Task Details</th>
                    <th className="py-2.5 pr-3">Role</th>
                    <th className="py-2.5 pr-3">Complexity</th>
                    <th className="py-2.5 pr-3 text-right">Range</th>
                    <th className="py-2.5 text-right">Expected</th>
                  </tr>
                </thead>
                <tbody>
                  {partB.taskBreakdown.tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-zinc-100 align-top dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="py-3.5 pr-3">
                        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                          {task.id} • {task.phase}
                        </span>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{task.task}</p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {task.description}
                        </p>
                      </td>
                      <td className="whitespace-nowrap py-3.5 pr-3 text-xs text-zinc-600 dark:text-zinc-300">
                        {task.role}
                      </td>
                      <td className="whitespace-nowrap py-3.5 pr-3">
                        <Pill tone={levelTone(task.complexity)}>{task.complexity}</Pill>
                      </td>
                      <td className="whitespace-nowrap py-3.5 pr-3 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {task.hoursMin}–{task.hoursMax}h
                      </td>
                      <td className="whitespace-nowrap py-3.5 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        {task.hoursExpected}h
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-200 text-sm font-semibold dark:border-zinc-800">
                    <td colSpan={3} className="pt-3 text-zinc-900 dark:text-zinc-100">
                      Total Calculated Effort
                    </td>
                    <td className="whitespace-nowrap pt-3 pr-3 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {partB.taskBreakdown.totalHoursMin}–{partB.taskBreakdown.totalHoursMax}h
                    </td>
                    <td className="whitespace-nowrap pt-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {partB.taskBreakdown.totalHoursExpected} hrs
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-950/40 dark:text-zinc-400">
              <strong className="font-semibold text-zinc-700 dark:text-zinc-300">
                Estimation Notes:
              </strong>{" "}
              {partB.taskBreakdown.estimationNotes}
            </p>
          </section>
        ) : isWaitingPartB ? (
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                3. Task Breakdown &amp; Hour Estimates
              </span>
              <span className="text-xs text-indigo-500">Calculating hours in parallel…</span>
            </div>
            <div className="mt-4 space-y-2.5">
              <div className="shimmer h-4 w-3/4 rounded" />
              <div className="shimmer h-4 w-full rounded" />
              <div className="shimmer h-4 w-5/6 rounded" />
            </div>
          </div>
        ) : null}

        {/* Section 4: Visual Horizontal Milestone Timeline */}
        {partB ? (
          <section
            id="section-timeline"
            className="card scroll-mt-24 p-6"
            aria-labelledby="heading-timeline"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
              <h2
                id="heading-timeline"
                className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <CalendarRange className="h-4 w-4" />
                </span>
                <span>
                  4. Milestone Timeline ({partB.milestoneTimeline.estimatedTotalWeeks} Weeks Total)
                </span>
              </h2>
              <CopyButton text={formatMilestoneTimelineText(partB)} />
            </div>

            {/* Visual Horizontal Timeline Cards */}
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x">
                {partB.milestoneTimeline.milestones.map((m, idx) => (
                  <div
                    key={m.phaseNumber}
                    className="relative flex w-[280px] shrink-0 snap-start flex-col justify-between rounded-xl border border-zinc-200/90 bg-zinc-50/70 p-4 dark:border-zinc-800/90 dark:bg-zinc-950/50"
                  >
                    <div>
                      <div className="mb-2.5 flex items-center justify-between gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
                          {m.phaseNumber}
                        </span>
                        <Pill tone="indigo">{m.timeframe}</Pill>
                      </div>

                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                        {m.title}
                      </h3>

                      <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3">
                        {m.summary}
                      </p>

                      <div className="mt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                          Key Deliverables
                        </p>
                        <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                          {m.keyDeliverables.slice(0, 3).map((d, i) => (
                            <li key={i} className="flex gap-1.5">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-500" />
                              <span className="truncate">{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-zinc-200/80 pt-2.5 dark:border-zinc-800/80">
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        <strong className="font-semibold">Exit:</strong> {m.exitCriteria}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : isWaitingPartB ? (
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                4. Milestone Timeline
              </span>
              <span className="text-xs text-indigo-500">Sequencing phases in parallel…</span>
            </div>
            <div className="mt-4 space-y-2.5">
              <div className="shimmer h-4 w-3/4 rounded" />
              <div className="shimmer h-4 w-full rounded" />
            </div>
          </div>
        ) : null}

        {/* Section 5: Proposal Email */}
        {partB ? (
          <section
            id="section-proposal"
            className="card scroll-mt-24 p-6"
            aria-labelledby="heading-proposal"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
              <h2
                id="heading-proposal"
                className="flex items-center gap-2.5 text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Mail className="h-4 w-4" />
                </span>
                <span>5. Client Proposal Email Draft</span>
              </h2>
              <CopyButton
                text={formatProposalEmailText(partB)}
                label="Copy Proposal Email"
                variant="primary"
              />
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-800/90 dark:bg-zinc-950/60">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-zinc-500 dark:text-zinc-400">Subject:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {partB.proposalEmail.subject}
                  </span>
                </div>
                <CopyButton
                  text={partB.proposalEmail.subject}
                  label="Copy subject"
                  variant="subtle"
                />
              </div>

              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 font-sans">
                {partB.proposalEmail.recipientPlaceholder}
                {"\n\n"}
                {partB.proposalEmail.body}
                {"\n\n"}
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200 font-medium">
                  {partB.proposalEmail.callToAction}
                </div>
                {"\n"}
                Best regards,
                {"\n"}
                [Your Name / Engineering Team]
              </div>
            </div>
          </section>
        ) : isWaitingPartB ? (
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                5. Client Proposal Email
              </span>
              <span className="text-xs text-indigo-500">Drafting proposal…</span>
            </div>
            <div className="mt-4 space-y-2.5">
              <div className="shimmer h-4 w-2/3 rounded" />
              <div className="shimmer h-4 w-full rounded" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
