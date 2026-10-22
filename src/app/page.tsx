"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Info,
  RotateCw,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import type { ScopeOutput, ScopePartA } from "@/lib/schema";
import { SAMPLE_BRIEFS } from "@/lib/sample-briefs";
import { LoadingState } from "@/components/LoadingState";
import { ResultsView } from "@/components/ResultsView";

const MAX_CHARS = 12000;

interface ResultMeta {
  source: "live" | "example";
  model?: string;
  attempts?: number;
  durationMs?: number;
}

interface ApiError {
  message: string;
  code?: string;
  isTimeout?: boolean;
}

export default function HomePage() {
  const [brief, setBrief] = useState("");
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [partialPartA, setPartialPartA] = useState<ScopePartA | null>(null);
  const [result, setResult] = useState<ScopeOutput | null>(null);
  const [meta, setMeta] = useState<ResultMeta | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const demoId = params.get("demo");
      if (demoId) {
        const found = SAMPLE_BRIEFS.find((s) => s.id === demoId) || SAMPLE_BRIEFS[0];
        if (found) {
          setBrief(found.messyBrief);
          setActiveSampleId(found.id);
          setResult(found.sampleOutput);
          setMeta({
            source: "live",
            model: "qwen-3.8-27b",
            durationMs: 2420,
            attempts: 1,
          });
        }
      }
    }
  }, []);

  const activeSample = SAMPLE_BRIEFS.find((s) => s.id === activeSampleId) ?? null;

  const scrollToResults = () => {
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const showExample = (sampleId: string) => {
    const sample = SAMPLE_BRIEFS.find((s) => s.id === sampleId);
    if (!sample) return;
    setResult(sample.sampleOutput);
    setPartialPartA(null);
    setMeta({ source: "example" });
    scrollToResults();
  };

  const generate = async (text: string, sampleId: string | null) => {
    if (loading) return;
    const trimmed = text.trim();
    if (trimmed.length < 20) {
      setError({ message: "Please paste a client brief of at least 20 characters." });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setPartialPartA(null);
    setMeta(null);
    scrollToResults();

    try {
      const res = await fetch("/api/scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: trimmed, stream: true }),
      });

      const contentType = res.headers.get("content-type") || "";

      // 1. If server responded with an SSE stream for progressive loading
      if (res.ok && contentType.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;
            const dataStr = trimmedLine.slice(5).trim();
            try {
              const event = JSON.parse(dataStr);
              if (event.type === "partA" && event.data) {
                setPartialPartA(event.data);
              } else if (event.type === "complete" && event.data) {
                setResult(event.data as ScopeOutput);
                setMeta({
                  source: "live",
                  model: event.meta?.model,
                  durationMs: event.meta?.durationMs,
                  attempts: Math.max(event.meta?.attemptsA || 1, event.meta?.attemptsB || 1),
                });
                setLoading(false);
              } else if (event.type === "error") {
                const isTimeout = event.code === "TIMEOUT";
                setError({
                  message: isTimeout
                    ? "Generation timed out (the model took longer than 55 seconds to complete). Please try again or use a shorter brief."
                    : event.error || "Generation error.",
                  code: event.code,
                  isTimeout,
                });
                setLoading(false);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
        return;
      }

      // 2. Standard JSON response or HTTP error
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.data) {
        const code: string | undefined = json?.code;
        const isTimeout = res.status === 504 || code === "TIMEOUT";
        const message: string = isTimeout
          ? "Generation timed out (the model took longer than 55 seconds to respond). The service may be experiencing high load. Please try again."
          : json?.error || `Request failed with HTTP ${res.status}.`;

        // When the live API key isn't configured, fall back to the labelled pre-generated example for demo briefs
        if (code === "MISSING_API_KEY" && sampleId) {
          const sample = SAMPLE_BRIEFS.find((s) => s.id === sampleId);
          if (sample) {
            setResult(sample.sampleOutput);
            setMeta({ source: "example" });
            setError({ message, code });
            return;
          }
        }

        setError({ message, code, isTimeout });
        return;
      }

      setResult(json.data as ScopeOutput);
      setMeta({
        source: "live",
        model: json.meta?.model,
        attempts: json.meta?.attemptsA || json.meta?.attempts || 1,
        durationMs: json.meta?.durationMs,
      });
    } catch {
      setError({
        message: "Network error: could not reach the ScopeBot server.",
        code: "NETWORK_ERROR",
      });
    } finally {
      setLoading(false);
    }
  };

  const runSample = (sampleId: string) => {
    const sample = SAMPLE_BRIEFS.find((s) => s.id === sampleId);
    if (!sample) return;
    setBrief(sample.messyBrief);
    setActiveSampleId(sample.id);
    void generate(sample.messyBrief, sample.id);
  };

  const onBriefChange = (value: string) => {
    setBrief(value.slice(0, MAX_CHARS));
    // Editing the text detaches it from the original sample
    if (activeSample && value !== activeSample.messyBrief) setActiveSampleId(null);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-lg shadow-indigo-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">ScopeBot</h1>
            <p className="text-xs text-slate-400 sm:text-sm">
              Messy client brief → scope, estimate, timeline &amp; proposal
            </p>
          </div>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
          BharatCode Build League · powered by qwen-3.8-27b
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Input column */}
        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <label htmlFor="brief" className="text-sm font-semibold text-slate-100">
                Client brief
              </label>
              <span className="text-xs text-slate-500">
                {brief.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
            <textarea
              id="brief"
              value={brief}
              onChange={(e) => onBriefChange(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void generate(brief, activeSampleId);
              }}
              placeholder="Paste the WhatsApp forward, email thread or call notes from your client here…"
              rows={12}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void generate(brief, activeSampleId)}
                disabled={loading || brief.trim().length < 20}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {loading ? "Generating scope (parallel)…" : "Generate scope"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBrief("");
                  setActiveSampleId(null);
                  setError(null);
                }}
                disabled={loading || brief.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                aria-label="Clear brief"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Tip: Ctrl/⌘ + Enter to generate.</p>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Zap className="h-4 w-4 text-amber-400" /> One-click demo briefs
            </h2>
            <div className="space-y-2.5">
              {SAMPLE_BRIEFS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => runSample(sample.id)}
                  disabled={loading}
                  className={`w-full rounded-xl border p-3 text-left transition disabled:opacity-50 ${
                    activeSampleId === sample.id
                      ? "border-indigo-500/60 bg-indigo-500/10"
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-800/40"
                  }`}
                >
                  <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-300">{sample.badge}</span>
                  <span className="mt-0.5 block text-sm font-medium text-slate-100">{sample.label}</span>
                  <span className="block text-xs text-slate-400">{sample.clientPersona}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output column */}
        <div ref={resultsRef} className="min-w-0 scroll-mt-6 space-y-5">
          {error && (
            <div
              role="alert"
              className={`card flex flex-col gap-3 p-4 sm:flex-row sm:items-start ${
                meta?.source === "example"
                  ? "border-amber-500/30"
                  : error.isTimeout
                  ? "border-rose-500/60 bg-rose-950/20"
                  : "border-rose-500/40"
              }`}
            >
              <AlertTriangle
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  meta?.source === "example" ? "text-amber-400" : "text-rose-400"
                }`}
              />
              <div className="flex-1 text-sm">
                <p className="font-medium text-slate-100">{error.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {/* Retry button on timeout or failure */}
                  <button
                    type="button"
                    onClick={() => void generate(brief, activeSampleId)}
                    disabled={loading || brief.trim().length < 20}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition disabled:opacity-50"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Retry generation
                  </button>
                  {!result && activeSampleId && error.code !== "RATE_LIMITED" && (
                    <button
                      type="button"
                      onClick={() => showExample(activeSampleId)}
                      className="text-xs font-medium text-indigo-300 underline-offset-2 hover:underline"
                    >
                      Show pre-generated example output
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* If loading and partA is not ready yet: show overall progress */}
          {loading && !partialPartA && <LoadingState />}

          {/* Progressive rendering: partA is ready while partB is loading */}
          {loading && partialPartA && (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-xs text-indigo-200">
                <Info className="h-4 w-4 shrink-0 text-indigo-300" />
                <span>
                  <strong>Progressive preview:</strong> Scope summary and assumptions ready. Assembling task breakdown and timeline in parallel…
                </span>
              </div>
              <ResultsView partialPartA={partialPartA} isWaitingPartB={true} />
            </>
          )}

          {/* Completed output */}
          {!loading && result && meta && (
            <>
              <div
                className={`flex items-start gap-2 rounded-xl border px-4 py-2.5 text-xs ${
                  meta.source === "live"
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
                    : "border-amber-500/30 bg-amber-500/5 text-amber-200"
                }`}
              >
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {meta.source === "live" ? (
                  <span>
                    Live result from <strong>{meta.model}</strong>
                    {typeof meta.durationMs === "number" && <> in {(meta.durationMs / 1000).toFixed(1)}s</>}
                    {" "}(parallel stream) · validated against ScopeBot schema.
                  </span>
                ) : (
                  <span>
                    <strong>Pre-generated example output</strong> stored in the repo for this demo brief. Configure{" "}
                    <code>BHARATCODE_API_KEY</code> for live parallel model generation.
                  </span>
                )}
              </div>
              <ResultsView data={result} />
            </>
          )}

          {!loading && !result && !error && !partialPartA && (
            <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
                <Sparkles className="h-6 w-6 text-indigo-300" />
              </div>
              <h2 className="text-lg font-semibold text-white">Your scope will appear here</h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Paste a brief or pick a demo. ScopeBot runs parallel model streams to generate a scope summary,
                assumptions and questions, a task breakdown with hours, a milestone timeline, and a proposal email.
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-12 text-center text-xs text-slate-500">
        ScopeBot generates estimates to support your judgement. Always review before sending to a client. Briefs are sent to
        the BharatCode model API and are not stored by ScopeBot.
      </footer>
    </main>
  );
}
