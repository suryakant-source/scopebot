"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STEPS = [
  "Reading the client brief…",
  "Extracting objectives and deliverables…",
  "Listing assumptions and open questions…",
  "Breaking work into tasks with hour estimates…",
  "Planning milestones…",
  "Drafting the proposal email…",
  "Validating structured JSON…",
];

export function LoadingState() {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 3500);
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
            Calling the BharatCode model · {elapsed}s elapsed (usually 15–45s)
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
