"use client";

import React, { useEffect, useState } from "react";
import { Clock, Eye, Loader2, Server } from "lucide-react";

const STEPS = [
  "Connecting to BharatCode model & starting parallel streams…",
  "Call A: Extracting scope summary, objectives & deliverables…",
  "Call B: Estimating task hours & engineering complexity…",
  "Call A: Formulating assumptions & client discovery questions…",
  "Call B: Sequencing milestones & drafting proposal email…",
  "Validating compact JSON schemas & merging output…",
];

export function LoadingState({ onViewSample }: { onViewSample?: () => void }) {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 4000);
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
      <div className={`card p-4 transition-all duration-200 ${isQueued ? "border-amber-500/40 bg-amber-950/15" : ""}`}>
        <div className="flex items-start gap-3">
          <Loader2 className={`h-5 w-5 shrink-0 animate-spin mt-0.5 ${isQueued ? "text-amber-400" : "text-indigo-400"}`} />
          <div className="flex-1 min-w-0">
            {isQueued ? (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
                    <Server className="h-3 w-3" />
                    Model is queued, this can take a few minutes
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                    <Clock className="h-3 w-3 text-slate-500" />
                    {formatElapsed(elapsed)} elapsed
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                  The BharatCode model (<code>qwen-3.8-27b</code>) is processing requests. The server keeps this connection open with heartbeats every 10s.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-100">{STEPS[step]}</p>
                <p className="text-xs text-slate-400">
                  Running 2 parallel streams · {formatElapsed(elapsed)} elapsed (internal timeout: 240s)
                </p>
              </div>
            )}

            {onViewSample && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Evaluating for judges?</span>
                <button
                  type="button"
                  onClick={onViewSample}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2.5 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-500/25 transition"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View KiranaFlash sample output while waiting
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shimmer placeholders */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="card space-y-3 p-5">
          <div className="shimmer h-5 w-1/3 rounded" />
          <div className="shimmer h-3 w-full rounded" />
          <div className="shimmer h-3 w-11/12 rounded" />
          <div className="shimmer h-3 w-4/5 rounded" />
        </div>
      ))}
    </div>
  );
}
