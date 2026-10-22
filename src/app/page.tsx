"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  Clock,
  Github,
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
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
            source: "example",
            model: "qwen-3.8-27b",
            durationMs: 2420,
            attempts: 1,
          });
        }
      }
    }
  }, []);

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const showExample = (sampleId = "kirana-flash") => {
    const sample = SAMPLE_BRIEFS.find((s) => s.id === sampleId) || SAMPLE_BRIEFS[0];
    if (!sample) return;
    setBrief(sample.messyBrief);
    setActiveSampleId(sample.id);
    setResult(sample.sampleOutput);
    setPartialPartA(null);
    setError(null);
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
                    ? "Generation timed out after 240 seconds. The BharatCode model took too long to complete. Please try again or inspect the pre-generated sample output."
                    : event.error || "Generation error.",
                  code: event.code,
                  isTimeout,
                });
                setLoading(false);
              }
            } catch {
              // ignore non-json SSE lines
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
          ? "Generation timed out after 240 seconds. The BharatCode model took too long to respond. Please try again or inspect the pre-generated sample output."
          : json?.error || `Request failed with HTTP ${res.status}.`;

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

  const handleChipClick = (sampleId: string) => {
    const sample = SAMPLE_BRIEFS.find((s) => s.id === sampleId);
    if (!sample) return;
    setBrief(sample.messyBrief);
    setActiveSampleId(sample.id);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const onBriefChange = (value: string) => {
    setBrief(value.slice(0, MAX_CHARS));
    const active = SAMPLE_BRIEFS.find((s) => s.id === activeSampleId);
    if (active && value !== active.messyBrief) {
      setActiveSampleId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200/80 bg-white/70 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70 sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm font-bold text-sm">
              ⚡
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-zinc-900 dark:text-zinc-50 text-base">
                ScopeBot
              </span>
              <span className="hidden sm:inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                BharatCode Build League
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => showExample("kirana-flash")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20 transition-colors shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Sample output</span>
            </button>

            <ThemeToggle />

            <a
              href="https://github.com/suryakant-source/scopebot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 flex-1 space-y-12">
        {/* Focused Hero Input Section (v0.dev / Linear style) */}
        <section className="mx-auto max-w-3xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100/80 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Powered by <strong>qwen-3.8-27b</strong> on BharatCode API
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl md:text-5xl leading-tight">
            Turn messy client briefs into board-ready scopes.
          </h1>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 sm:text-base max-w-2xl mx-auto leading-relaxed">
            Paste unformatted voice notes, email dumps, or WhatsApp call summaries. ScopeBot delivers executive scopes, assumptions, task hour breakdowns, timelines, and proposal emails in seconds.
          </p>

          {/* Large Hero Textarea */}
          <div className="mt-6 text-left card p-4 sm:p-5 focus-within:ring-2 focus-within:ring-indigo-500/60 focus-within:border-indigo-500 transition-all shadow-md dark:shadow-none">
            <label htmlFor="brief-input" className="sr-only">
              Paste client brief
            </label>
            <textarea
              id="brief-input"
              ref={textareaRef}
              value={brief}
              onChange={(e) => onBriefChange(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  void generate(brief, activeSampleId);
                }
              }}
              rows={8}
              placeholder="Paste raw client brief here (e.g. WhatsApp forward, Slack dump, voice note transcript, or messy email thread)…"
              className="w-full resize-y bg-transparent p-1 text-sm sm:text-base leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />

            {/* Action Bar inside Textarea Card */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/80 pt-3 dark:border-zinc-800/80">
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
                {brief.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
              </span>

              <div className="flex items-center gap-2">
                {brief.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setBrief("");
                      setActiveSampleId(null);
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void generate(brief, activeSampleId)}
                  disabled={loading || brief.trim().length < 20}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{loading ? "Generating scope…" : "Generate scope"}</span>
                  <kbd className="hidden sm:inline-block rounded bg-indigo-700/70 px-1.5 py-0.5 text-[10px] font-mono text-indigo-100">
                    ⌘↵
                  </kbd>
                </button>
              </div>
            </div>
          </div>

          {/* 3 Demo Brief Chips (Clickable) */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="font-medium text-zinc-500 dark:text-zinc-400 mr-1">
              Try a demo brief:
            </span>
            {SAMPLE_BRIEFS.map((s) => {
              const isSelected = activeSampleId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleChipClick(s.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-xs"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <span>{s.label}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                    ({s.badge})
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Results / Status Anchor */}
        <div ref={resultsRef} className="scroll-mt-20">
          {/* Error Alert with Retry button */}
          {error && (
            <div
              role="alert"
              className={`mb-6 card p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-start ${
                error.isTimeout
                  ? "border-amber-300 bg-amber-50/50 dark:border-amber-800/60 dark:bg-amber-950/30"
                  : "border-rose-300 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/30"
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 shrink-0 mt-0.5 ${
                  error.isTimeout ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                }`}
              />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{error.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => void generate(brief, activeSampleId)}
                    disabled={loading || brief.trim().length < 20}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Retry generation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showExample("kirana-flash")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100/70 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>View KiranaFlash sample output</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State with Live Queue Status */}
          {loading && !partialPartA && (
            <LoadingState onViewSample={() => showExample("kirana-flash")} />
          )}

          {/* Progressive Preview */}
          {loading && partialPartA && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3.5 text-xs text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span>
                    <strong>Progressive stream:</strong> Scope summary &amp; assumptions ready. Assembling task hours and milestones in parallel…
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => showExample("kirana-flash")}
                  className="font-medium underline underline-offset-2 hover:opacity-80 shrink-0"
                >
                  View sample output
                </button>
              </div>
              <ResultsView partialPartA={partialPartA} isWaitingPartB={true} />
            </div>
          )}

          {/* Completed Scope Output */}
          {!loading && result && meta && (
            <div className="space-y-4">
              {/* Output Source Meta Banner */}
              <div
                className={`flex flex-wrap items-center justify-between gap-2.5 rounded-xl border p-3 text-xs ${
                  meta.source === "live"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
                    : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      meta.source === "live"
                        ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                        : "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    }`}
                  >
                    {meta.source === "live" ? "Live Result" : "Sample Output"}
                  </span>
                  <span>
                    {meta.source === "live" ? (
                      <>
                        Generated via <strong>{meta.model}</strong> in{" "}
                        {typeof meta.durationMs === "number"
                          ? `${(meta.durationMs / 1000).toFixed(1)}s`
                          : "parallel stream"}{" "}
                        • Strict Zod Schema Validated
                      </>
                    ) : (
                      <>
                        Pre-generated sample output for <strong>KiranaFlash</strong> brief. Full 5-section scope ready for judge review.
                      </>
                    )}
                  </span>
                </div>

                {meta.source === "example" && (
                  <button
                    type="button"
                    onClick={() => void generate(brief, activeSampleId)}
                    disabled={loading || brief.trim().length < 20}
                    className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 transition-colors"
                  >
                    <RotateCw className="h-3 w-3" />
                    Run Live Model
                  </button>
                )}
              </div>

              <ResultsView data={result} />
            </div>
          )}

          {/* Empty State */}
          {!loading && !result && !error && !partialPartA && (
            <div className="card mx-auto max-w-2xl p-8 sm:p-12 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 sm:text-xl">
                Ready to scope your project
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Paste any client notes above or test with a one-click sample brief. Or click below to immediately review a completed board-ready scope package.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => showExample("kirana-flash")}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-all shadow-xs"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>View KiranaFlash Sample Output</span>
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 bg-white/50 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-950/50 dark:text-zinc-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-3">
          <span>
            ScopeBot • Built for the <strong>BharatCode Build League</strong>
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://scopebot-three.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
            >
              Live Demo
            </a>
            <a
              href="https://github.com/suryakant-source/scopebot"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
