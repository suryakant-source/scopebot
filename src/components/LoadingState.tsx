"use client";

import React, { useEffect, useState } from "react";
import { Clock, Eye, Loader2, Server } from "lucide-react";

const STEPS = [
  "Connecting to BharatCode model and initializing parallel streams...",
  "Call A: Extracting scope summary, objectives and deliverables...",
  "Call B: Estimating task hours and engineering complexity...",
  "Call A: Formulating assumptions and client discovery questions...",
  "Call B: Sequencing milestones and drafting proposal email...",
  "Validating compact JSON schemas and assembling output...",
];

export function LoadingState({ onViewSample }: { onViewSample?: () => void }) {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 4500);
    const clock = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      clearInterval(stepTimer);
      clearInterval(clock);
    };
  }, []);

  const isQueued = elapsed >= 12;

  const formatElapsed = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  return (
    <div className="space-y-4" role="status" aria-live="polite">
      {/* Primary status box */}
      <div
        className={`panel p-4 transition-colors duration-150 ${
          isQueued
            ? "border-amber-500/40 bg-amber-500/5 dark:border-amber-500/30 dark:bg-amber-500/5"
            : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <Loader2
            className={`h-4 w-4 shrink-0 animate-spin mt-0.5 ${
              isQueued ? "text-amber-500" : "text-blue-500"
            }`}
          />
          <div className="flex-1 min-w-0">
            {isQueued ? (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <Server className="h-3 w-3" />
                    Model is queued, this can take a few minutes
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-500 font-mono">
                    <Clock className="h-3 w-3" />
                    {formatElapsed(elapsed)} elapsed
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  The upstream model (<code className="font-mono text-zinc-700 dark:text-zinc-300">qwen-3.8-27b</code>) is processing requests under peak load. The server keeps this connection alive with heartbeats every 10 seconds.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {STEPS[step]}
                </p>
                <p className="text-xs text-zinc-500 font-mono">
                  Parallel streams active • {formatElapsed(elapsed)} elapsed (timeout: 240s)
                </p>
              </div>
            )}

            {onViewSample && (
              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500">
                  Want to review the output format immediately?
                </span>
                <button
                  type="button"
                  onClick={onViewSample}
                  className="inline-flex items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  Load sample output
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dev-tool skeleton placeholders */}
      <div className="panel p-5 space-y-3">
        <div className="skeleton-box h-4 w-40" />
        <div className="skeleton-box h-3 w-full" />
        <div className="skeleton-box h-3 w-5/6" />
        <div className="skeleton-box h-3 w-3/4" />
      </div>

      <div className="panel p-5 space-y-3">
        <div className="skeleton-box h-4 w-32" />
        <div className="grid grid-cols-4 gap-2 pt-1">
          <div className="skeleton-box h-8 rounded-[4px]" />
          <div className="skeleton-box h-8 rounded-[4px]" />
          <div className="skeleton-box h-8 rounded-[4px]" />
          <div className="skeleton-box h-8 rounded-[4px]" />
        </div>
      </div>
    </div>
  );
}
