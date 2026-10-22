"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Code2,
  FileText,
  Github,
  RotateCw,
  Server,
  Terminal,
  Trash2,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const demoId = params.get("demo");
      if (demoId) {
        const found =
          SAMPLE_BRIEFS.find((s) => s.id === demoId) || SAMPLE_BRIEFS[0];
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

  const showExample = (sampleId = "kirana-flash") => {
    const sample =
      SAMPLE_BRIEFS.find((s) => s.id === sampleId) || SAMPLE_BRIEFS[0];
    if (!sample) return;
    setBrief(sample.messyBrief);
    setActiveSampleId(sample.id);
    setResult(sample.sampleOutput);
    setPartialPartA(null);
    setError(null);
    setMeta({ source: "example" });
  };

  const generate = async (text: string, sampleId: string | null) => {
    if (loading) return;
    const trimmed = text.trim();
    if (trimmed.length < 20) {
      setError({
        message: "Please enter a client brief of at least 20 characters.",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setPartialPartA(null);
    setMeta(null);

    // On mobile, scroll to output pane
    if (window.innerWidth < 1024 && rightPaneRef.current) {
      rightPaneRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    try {
      const res = await fetch("/api/scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: trimmed, stream: true }),
      });

      const contentType = res.headers.get("content-type") || "";

      // 1. SSE Stream handling
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
                  attempts: Math.max(
                    event.meta?.attemptsA || 1,
                    event.meta?.attemptsB || 1
                  ),
                });
                setLoading(false);
              } else if (event.type === "error") {
                const isTimeout = event.code === "TIMEOUT";
                setError({
                  message: isTimeout
                    ? "Upstream model timed out after 240 seconds. BharatCode servers are under high load. Please retry or inspect the sample output."
                    : event.error || "Generation error.",
                  code: event.code,
                  isTimeout,
                });
                setLoading(false);
              }
            } catch {
              // Ignore non-json lines
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
          ? "Upstream model timed out after 240 seconds. BharatCode servers are under high load. Please retry or inspect the sample output."
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
        message: "Network error: could not connect to ScopeBot API route.",
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
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Dev-tool Top Navbar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-[var(--bg-panel)] sticky top-0 z-40">
        <div className="mx-auto flex h-13 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-700/50 dark:border-zinc-300 font-mono text-xs font-bold">
              &gt;_
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                ScopeBot
              </span>
              <span className="hidden sm:inline-flex items-center rounded-[4px] border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                BharatCode Build League
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => showExample("kirana-flash")}
              className="inline-flex items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              <span>Sample output</span>
            </button>

            <ThemeToggle />

            <a
              href="https://github.com/suryakant-source/scopebot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Two-Pane Developer Layout */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] xl:grid-cols-[460px_1fr] gap-6 items-start">
          {/* LEFT PANE: Input Form & Settings */}
          <div className="space-y-4">
            <div className="panel p-5 space-y-4">
              <div>
                <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Project Brief
                </h1>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Paste unformatted client notes, meeting transcripts, or messy email threads. ScopeBot structures requirements into technical scopes, task hours, and timelines.
                </p>
              </div>

              {/* Textarea Form */}
              <div className="space-y-2">
                <div className="rounded-[6px] border border-zinc-200 dark:border-zinc-800 bg-[var(--bg-panel)] focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors">
                  <label htmlFor="brief-input" className="sr-only">
                    Client brief
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
                    rows={10}
                    placeholder="Paste unformatted client requirements here (e.g. email thread, Slack discussion, client voice note notes)..."
                    className="w-full resize-y bg-transparent p-3 text-xs leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500 font-mono"
                  />

                  {/* Inside Textarea Action Row */}
                  <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 p-2.5 bg-zinc-50/50 dark:bg-zinc-900/40">
                    <span className="font-mono text-[11px] text-zinc-400">
                      {brief.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
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
                          className="inline-flex items-center gap-1 rounded-[4px] px-2 py-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Clear</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void generate(brief, activeSampleId)}
                        disabled={loading || brief.trim().length < 20}
                        className="inline-flex items-center gap-1.5 rounded-[6px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>{loading ? "Generating..." : "Generate scope"}</span>
                        <kbd className="hidden sm:inline-block rounded-[3px] bg-blue-700/80 px-1 py-0.2 text-[9px] font-mono text-blue-100">
                          ⌘↵
                        </kbd>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Demo Brief Selector */}
              <div className="space-y-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">
                  Select Demo Brief
                </span>
                <div className="space-y-1.5">
                  {SAMPLE_BRIEFS.map((s) => {
                    const isSelected = activeSampleId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleChipClick(s.id)}
                        className={`w-full text-left p-2.5 rounded-[6px] border text-xs transition-colors flex items-start justify-between gap-2 ${
                          isSelected
                            ? "border-blue-500/50 bg-blue-500/5 text-blue-700 dark:text-blue-300"
                            : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{s.label}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {s.badge}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Model & Architecture Spec Box */}
            <div className="panel p-4 space-y-2 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                <Server className="h-3.5 w-3.5" />
                <span>Execution Harness</span>
              </div>
              <ul className="space-y-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                <li>• Model: qwen-3.8-27b (BharatCode API)</li>
                <li>• Architecture: 2 parallel streamed completions</li>
                <li>• Validation: Strict Zod schemas + auto-repair</li>
                <li>• Keepalive: SSE comments streamed every 10s</li>
              </ul>
            </div>
          </div>

          {/* RIGHT PANE: Output View / States */}
          <div ref={rightPaneRef} className="space-y-4">
            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="panel p-4 border-rose-500/30 bg-rose-500/5 space-y-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-rose-600 dark:text-rose-400">
                      {error.message}
                    </p>
                    {error.code && (
                      <p className="font-mono text-[10px] text-zinc-500 mt-0.5">
                        Code: {error.code}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-rose-500/20">
                  <button
                    type="button"
                    onClick={() => void generate(brief, activeSampleId)}
                    disabled={loading || brief.trim().length < 20}
                    className="inline-flex items-center gap-1.5 rounded-[4px] bg-rose-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-rose-500 transition-colors"
                  >
                    <RotateCw className="h-3 w-3" />
                    <span>Retry generation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showExample("kirana-flash")}
                    className="inline-flex items-center gap-1.5 rounded-[4px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span>Load sample output</span>
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && !partialPartA && (
              <LoadingState onViewSample={() => showExample("kirana-flash")} />
            )}

            {/* Progressive Streaming Preview */}
            {loading && partialPartA && (
              <div className="space-y-4">
                <div className="panel p-3 flex items-center justify-between gap-3 text-xs border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300">
                  <div className="flex items-center gap-2 font-mono">
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>
                      Progressive stream: Part A validated. Estimating task hours and timeline in parallel...
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => showExample("kirana-flash")}
                    className="underline underline-offset-2 shrink-0 font-medium"
                  >
                    View sample output
                  </button>
                </div>
                <ResultsView partialPartA={partialPartA} isWaitingPartB={true} />
              </div>
            )}

            {/* Completed Output */}
            {!loading && result && meta && (
              <div className="space-y-4">
                {/* Result Metadata Strip */}
                <div className="panel p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded-[4px] ${
                        meta.source === "live"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {meta.source === "live" ? "Live Result" : "Sample Dataset"}
                    </span>
                    <span className="font-mono text-zinc-500 text-[11px]">
                      {meta.source === "live" ? (
                        <>
                          Model: {meta.model} •{" "}
                          {typeof meta.durationMs === "number"
                            ? `${(meta.durationMs / 1000).toFixed(1)}s`
                            : "parallel stream"}{" "}
                          • Zod schema validated
                        </>
                      ) : (
                        <>KiranaFlash sample brief • Complete 5-section scope</>
                      )}
                    </span>
                  </div>

                  {meta.source === "example" && (
                    <button
                      type="button"
                      onClick={() => void generate(brief, activeSampleId)}
                      disabled={loading || brief.trim().length < 20}
                      className="inline-flex items-center gap-1 rounded-[4px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <RotateCw className="h-3 w-3" />
                      <span>Run live model</span>
                    </button>
                  )}
                </div>

                <ResultsView data={result} />
              </div>
            )}

            {/* Empty State */}
            {!loading && !result && !error && !partialPartA && (
              <div className="panel p-8 sm:p-12 text-center space-y-4">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[6px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-mono text-sm">
                  &gt;_
                </div>
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    No scope generated yet
                  </h2>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                    Paste unformatted client notes on the left and select &ldquo;Generate scope&rdquo;, or load a pre-generated sample dataset to inspect the output schema.
                  </p>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => showExample("kirana-flash")}
                    className="inline-flex items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span>Load KiranaFlash sample output</span>
                    <ArrowRight className="h-3 w-3 text-zinc-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Dev-tool Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-[var(--bg-panel)] py-4 text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px]">
            ScopeBot • BharatCode Build League Submission
          </span>
          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://scopebot-three.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              Live Demo
            </a>
            <a
              href="https://github.com/suryakant-source/scopebot"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
