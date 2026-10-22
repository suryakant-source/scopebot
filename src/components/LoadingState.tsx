"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STEPS = [
  "Analyzing brief & launching parallel model streams…",
  "Call A: Extracting scope, objectives & deliverables…",
  "Call B: Estimating task hours & engineering complexity…",
  "Call A: Formulating assumptions & client discovery questions…",
  "Call B: Sequencing milestones & drafting proposal email…",
  "Validating compact JSON schemas & merging…",
];

export function LoadingState() {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 3000);
    const clock = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      clearInterval(stepTimer);
      clearInterval(clock);
    };
  }, []);

  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="card flex items-center gap-3 p-4">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-100">{STEPS[step]}</p>
          <p className="text-xs text-slate-400">
            Running 2 parallel BharatCode streams · {elapsed}s elapsed (internal timeout: 55s)
          </p>
        </div>
      </div>
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
