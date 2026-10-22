"use client";

import React from "react";
import {
  CalendarRange,
  ClipboardList,
  FileText,
  HelpCircle,
  Loader2,
  Mail,
} from "lucide-react";
import type { ScopeOutput, ScopePartA, ScopePartB } from "@/lib/schema";
import {
  formatAssumptionsAndQuestionsText,
  formatFullScopeMarkdown,
  formatMilestoneTimelineText,
  formatProposalEmailText,
  formatScopeSummaryText,
  formatTaskBreakdownText,
} from "@/lib/formatters";
import { CopyButton } from "./CopyButton";

function Section({
  index,
  title,
  icon,
  copyText,
  children,
}: {
  index: number;
  title: string;
  icon: React.ReactNode;
  copyText?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby={`section-${index}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id={`section-${index}`} className="flex items-center gap-2.5 text-base font-semibold sm:text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
            {icon}
          </span>
          <span className="text-slate-500">{index}.</span> {title}
        </h2>
        {copyText && <CopyButton text={copyText} />}
      </div>
      {children}
    </section>
  );
}

function Pill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "red" | "amber" | "green" | "indigo";
}) {
  const tones = {
    slate: "bg-slate-800 text-slate-300 border-slate-700",
    red: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}
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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm text-slate-300">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PendingSectionPlaceholder({
  index,
  title,
  icon,
  message,
}: {
  index: number;
  title: string;
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <section className="card p-5 sm:p-6 opacity-85" aria-labelledby={`pending-section-${index}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 id={`pending-section-${index}`} className="flex items-center gap-2.5 text-base font-semibold text-slate-300 sm:text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
            {icon}
          </span>
          <span className="text-slate-500">{index}.</span> {title}
        </h2>
        <span className="flex items-center gap-1.5 text-xs text-indigo-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Generating…
        </span>
      </div>
      <div className="space-y-3">
        <p className="text-xs text-slate-400">{message}</p>
        <div className="shimmer h-4 w-3/4 rounded" />
        <div className="shimmer h-4 w-5/6 rounded" />
        <div className="shimmer h-4 w-2/3 rounded" />
      </div>
    </section>
  );
}

export function ResultsView({
  data,
  partialPartA,
  isWaitingPartB,
}: {
  data?: ScopeOutput | null;
  partialPartA?: ScopePartA | null;
  isWaitingPartB?: boolean;
}) {
  // Use data or partialPartA for scope summary & assumptions
  const partA = data || partialPartA;
  const partB = data;

  if (!partA) return null;

  const s = partA.scopeSummary;
  const aq = partA.assumptionsAndQuestions;

  return (
    <div className="space-y-5">
      {/* Headline stats */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-indigo-300">{s.clientIndustry}</p>
            <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">{s.projectTitle}</h2>
          </div>
          {data && (
            <CopyButton text={formatFullScopeMarkdown(data)} label="Copy all (Markdown)" variant="primary" />
          )}
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-slate-800/60 p-3">
            <dt className="text-[11px] text-slate-400">Expected effort</dt>
            <dd className="text-lg font-semibold text-white">
              {partB ? `${partB.taskBreakdown.totalHoursExpected}h` : <span className="text-xs text-indigo-300">Calculating…</span>}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-3">
            <dt className="text-[11px] text-slate-400">Range</dt>
            <dd className="text-lg font-semibold text-white">
              {partB ? (
                `${partB.taskBreakdown.totalHoursMin}–${partB.taskBreakdown.totalHoursMax}h`
              ) : (
                <span className="text-xs text-slate-500">…</span>
              )}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-3">
            <dt className="text-[11px] text-slate-400">Timeline</dt>
            <dd className="text-lg font-semibold text-white">
              {partB ? (
                `${partB.milestoneTimeline.estimatedTotalWeeks} wks`
              ) : (
                <span className="text-xs text-slate-500">…</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* 1. Scope summary */}
      <Section
        index={1}
        title="Scope Summary"
        icon={<FileText className="h-4 w-4" />}
        copyText={data ? formatScopeSummaryText(data) : undefined}
      >
        <p className="text-sm leading-relaxed text-slate-200">{s.executiveSummary}</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Objectives</h3>
            <BulletList items={s.objectives} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Deliverables</h3>
            <BulletList items={s.deliverables} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Out of scope</h3>
            <BulletList items={s.outOfScope} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Recommended stack</h3>
            <div className="flex flex-wrap gap-1.5">
              {s.recommendedStack.map((t, i) => (
                <Pill key={i} tone="indigo">
                  {t}
                </Pill>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 2. Assumptions & questions */}
      <Section
        index={2}
        title="Assumptions & Questions for the Client"
        icon={<HelpCircle className="h-4 w-4" />}
        copyText={data ? formatAssumptionsAndQuestionsText(data) : undefined}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Assumptions</h3>
            <ul className="space-y-2.5">
              {aq.assumptions.map((a) => (
                <li key={a.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    <Pill>{a.id}</Pill>
                    <Pill>{a.category}</Pill>
                    <Pill tone={levelTone(a.impactIfWrong)}>Impact if wrong: {a.impactIfWrong}</Pill>
                  </div>
                  <p className="text-sm text-slate-300">{a.statement}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Questions to ask</h3>
            <ol className="space-y-2.5">
              {aq.questionsForClient.map((q) => (
                <li key={q.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    <Pill>{q.id}</Pill>
                    <Pill tone={levelTone(q.priority)}>{q.priority}</Pill>
                  </div>
                  <p className="text-sm font-medium text-slate-100">{q.question}</p>
                  <p className="mt-1 text-xs text-slate-400">Why it matters: {q.whyItMatters}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* 3. Task breakdown */}
      {partB ? (
        <Section
          index={3}
          title="Task Breakdown & Hour Estimates"
          icon={<ClipboardList className="h-4 w-4" />}
          copyText={formatTaskBreakdownText(partB)}
        >
          <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-3 font-medium">Task</th>
                  <th className="py-2 pr-3 font-medium">Role</th>
                  <th className="py-2 pr-3 font-medium">Complexity</th>
                  <th className="py-2 pr-3 text-right font-medium">Range</th>
                  <th className="py-2 text-right font-medium">Expected</th>
                </tr>
              </thead>
              <tbody>
                {partB.taskBreakdown.tasks.map((t) => (
                  <tr key={t.id} className="border-b border-slate-800/60 align-top">
                    <td className="py-3 pr-3">
                      <p className="text-[11px] text-indigo-300">
                        {t.id} · {t.phase}
                      </p>
                      <p className="font-medium text-slate-100">{t.task}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{t.description}</p>
                    </td>
                    <td className="py-3 pr-3 text-slate-300">{t.role}</td>
                    <td className="py-3 pr-3">
                      <Pill tone={levelTone(t.complexity)}>{t.complexity}</Pill>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-3 text-right text-slate-400">
                      {t.hoursMin}–{t.hoursMax}h
                    </td>
                    <td className="whitespace-nowrap py-3 text-right font-semibold text-white">{t.hoursExpected}h</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-sm">
                  <td colSpan={3} className="pt-3 font-semibold text-slate-200">
                    Total
                  </td>
                  <td className="whitespace-nowrap pt-3 pr-3 text-right text-slate-300">
                    {partB.taskBreakdown.totalHoursMin}–{partB.taskBreakdown.totalHoursMax}h
                  </td>
                  <td className="whitespace-nowrap pt-3 text-right font-bold text-emerald-300">
                    {partB.taskBreakdown.totalHoursExpected}h
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-400">{partB.taskBreakdown.estimationNotes}</p>
        </Section>
      ) : isWaitingPartB ? (
        <PendingSectionPlaceholder
          index={3}
          title="Task Breakdown & Hour Estimates"
          icon={<ClipboardList className="h-4 w-4" />}
          message="Calculating engineering effort, role assignments, and min–max hour ranges in parallel…"
        />
      ) : null}

      {/* 4. Milestones */}
      {partB ? (
        <Section
          index={4}
          title="Milestone Timeline"
          icon={<CalendarRange className="h-4 w-4" />}
          copyText={formatMilestoneTimelineText(partB)}
        >
          <ol className="relative space-y-5 border-l border-slate-800 pl-6">
            {partB.milestoneTimeline.milestones.map((m) => (
              <li key={m.phaseNumber} className="relative">
                <span className="absolute -left-[33px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-indigo-400 bg-slate-950" />
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-100">
                    Phase {m.phaseNumber}: {m.title}
                  </h3>
                  <Pill tone="indigo">{m.timeframe}</Pill>
                </div>
                <p className="mt-1 text-sm text-slate-300">{m.summary}</p>
                <div className="mt-2">
                  <BulletList items={m.keyDeliverables} />
                </div>
                <p className="mt-2 text-xs text-emerald-300/90">
                  <span className="font-semibold">Exit criteria:</span> {m.exitCriteria}
                </p>
              </li>
            ))}
          </ol>
        </Section>
      ) : isWaitingPartB ? (
        <PendingSectionPlaceholder
          index={4}
          title="Milestone Timeline"
          icon={<CalendarRange className="h-4 w-4" />}
          message="Sequencing sprint phases, exit criteria, and deliverables…"
        />
      ) : null}

      {/* 5. Proposal email */}
      {partB ? (
        <Section
          index={5}
          title="Proposal Email"
          icon={<Mail className="h-4 w-4" />}
          copyText={formatProposalEmailText(partB)}
        >
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="border-b border-slate-800 pb-2 text-sm">
              <span className="text-slate-500">Subject: </span>
              <span className="font-medium text-slate-100">{partB.proposalEmail.subject}</span>
            </p>
            <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {partB.proposalEmail.recipientPlaceholder}
              {"\n\n"}
              {partB.proposalEmail.body}
              {"\n\n"}
              {partB.proposalEmail.callToAction}
              {"\n\n"}Best regards,{"\n"}[Your Name / Engineering Team]
            </div>
          </div>
        </Section>
      ) : isWaitingPartB ? (
        <PendingSectionPlaceholder
          index={5}
          title="Proposal Email"
          icon={<Mail className="h-4 w-4" />}
          message="Synthesizing scope highlights into a client proposal email…"
        />
      ) : null}
    </div>
  );
}
