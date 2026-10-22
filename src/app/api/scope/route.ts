import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildRateLimitHeaders,
  checkRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import {
  PART_A_SYSTEM_PROMPT,
  PART_B_SYSTEM_PROMPT,
  buildPartARetryPrompt,
  buildPartAUserPrompt,
  buildPartBRetryPrompt,
  buildPartBUserPrompt,
} from "@/lib/prompts";
import {
  ScopePartA,
  ScopePartB,
  mergeScopeParts,
  parseAndValidatePartAJson,
  parseAndValidatePartBJson,
} from "@/lib/schema";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const RequestBodySchema = z.object({
  brief: z
    .string()
    .trim()
    .min(20, "Please provide a client brief of at least 20 characters.")
    .max(12000, "Client brief must be under 12,000 characters."),
  stream: z.boolean().optional(),
});

const DEFAULT_BASE_URL = "https://bharatcode.ai/api/model/v1";
const DEFAULT_MODEL = "qwen-3.8-27b";
const CALL_TIMEOUT_MS = 55000; // 55 seconds per call
const MAX_ATTEMPTS = 2; // Initial attempt + 1 automatic retry on bad JSON

interface ModelCallResult {
  ok: boolean;
  status: number;
  content: string;
  errorMessage?: string;
  code?: string;
}

/**
 * Reads an SSE stream from the BharatCode chat completions endpoint (OpenAI-compatible)
 * and assembles the full text response server-side.
 */
async function assembleSseStream(
  bodyStream: ReadableStream<Uint8Array>,
  signal: AbortSignal
): Promise<string> {
  const reader = bodyStream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let assembled = "";

  try {
    while (true) {
      if (signal.aborted) {
        throw new Error("AbortError");
      }
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;
        if (trimmed.startsWith("data:")) {
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (typeof delta === "string") {
              assembled += delta;
            }
          } catch {
            // Non-JSON SSE line, ignore
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return assembled;
}

/**
 * Calls the BharatCode model API with stream: true and max_tokens: 2500,
 * assembling the response server-side with a 55s timeout.
 */
async function callBharatCodeStream(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<ModelCallResult> {
  const endpoint = `${params.baseUrl.replace(/\/+$/, "")}/chat/completions`;

  const payload = {
    model: params.model,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 2500,
    stream: true,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = errText.slice(0, 300);
      try {
        const json = JSON.parse(errText);
        msg = json?.error?.message || msg;
      } catch {
        // use slice
      }
      return {
        ok: false,
        status: response.status,
        content: "",
        errorMessage: msg || `Upstream HTTP ${response.status}`,
      };
    }

    if (!response.body) {
      return {
        ok: false,
        status: 502,
        content: "",
        errorMessage: "No response body received from BharatCode API.",
      };
    }

    const assembled = await assembleSseStream(response.body, controller.signal);
    return {
      ok: true,
      status: 200,
      content: assembled,
    };
  } catch (err) {
    const isAbort =
      (err instanceof Error && err.name === "AbortError") || controller.signal.aborted;
    return {
      ok: false,
      status: 504,
      code: "TIMEOUT",
      content: "",
      errorMessage: isAbort
        ? "Request to BharatCode model API timed out after 55 seconds. Please try again."
        : err instanceof Error
        ? err.message
        : "Network error calling BharatCode API.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Runs Call A (Scope Summary + Assumptions & Questions) with automatic retry on bad JSON.
 */
async function runCallA(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  brief: string;
}): Promise<
  | { ok: true; data: ScopePartA; attempts: number }
  | { ok: false; status: number; code?: string; errorMessage: string }
> {
  let lastError = "Validation failed";
  let lastSnippet = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const userPrompt =
      attempt === 1
        ? buildPartAUserPrompt(params.brief)
        : buildPartARetryPrompt(params.brief, lastSnippet, lastError);

    const res = await callBharatCodeStream({
      baseUrl: params.baseUrl,
      apiKey: params.apiKey,
      model: params.model,
      systemPrompt: PART_A_SYSTEM_PROMPT,
      userPrompt,
    });

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        code: res.code,
        errorMessage: res.errorMessage || "Call A upstream error",
      };
    }

    const validation = parseAndValidatePartAJson(res.content);
    if (validation.success && validation.data) {
      return { ok: true, data: validation.data, attempts: attempt };
    }

    lastError = validation.errorSummary || "Invalid JSON in Part A";
    lastSnippet = validation.rawExtracted || res.content.slice(0, 400);
  }

  return {
    ok: false,
    status: 502,
    code: "INVALID_PART_A_JSON",
    errorMessage: `Part A failed validation after ${MAX_ATTEMPTS} attempts: ${lastError}`,
  };
}

/**
 * Runs Call B (Task Breakdown + Timeline + Proposal Email) with automatic retry on bad JSON.
 */
async function runCallB(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  brief: string;
}): Promise<
  | { ok: true; data: ScopePartB; attempts: number }
  | { ok: false; status: number; code?: string; errorMessage: string }
> {
  let lastError = "Validation failed";
  let lastSnippet = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const userPrompt =
      attempt === 1
        ? buildPartBUserPrompt(params.brief)
        : buildPartBRetryPrompt(params.brief, lastSnippet, lastError);

    const res = await callBharatCodeStream({
      baseUrl: params.baseUrl,
      apiKey: params.apiKey,
      model: params.model,
      systemPrompt: PART_B_SYSTEM_PROMPT,
      userPrompt,
    });

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        code: res.code,
        errorMessage: res.errorMessage || "Call B upstream error",
      };
    }

    const validation = parseAndValidatePartBJson(res.content);
    if (validation.success && validation.data) {
      return { ok: true, data: validation.data, attempts: attempt };
    }

    lastError = validation.errorSummary || "Invalid JSON in Part B";
    lastSnippet = validation.rawExtracted || res.content.slice(0, 400);
  }

  return {
    ok: false,
    status: 502,
    code: "INVALID_PART_B_JSON",
    errorMessage: `Part B failed validation after ${MAX_ATTEMPTS} attempts: ${lastError}`,
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // 1. Enforce IP-based sliding window rate limiting
  const clientIp = getClientIp(req.headers);
  const rateLimit = checkRateLimit(clientIp);
  const rateHeaders = buildRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded (${rateLimit.limit} requests per minute). Please wait ${rateLimit.retryAfterSeconds}s before trying again.`,
        code: "RATE_LIMITED",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: rateHeaders,
      }
    );
  }

  // 2. Parse request body
  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body.", code: "INVALID_BODY" },
      { status: 400, headers: rateHeaders }
    );
  }

  const parsedBody = RequestBodySchema.safeParse(bodyUnknown);
  if (!parsedBody.success) {
    const msg = parsedBody.error.issues.map((i) => i.message).join(" ");
    return NextResponse.json(
      { error: msg, code: "VALIDATION_ERROR" },
      { status: 400, headers: rateHeaders }
    );
  }

  const { brief, stream: clientWantsStream } = parsedBody.data;

  // 3. Read server-only credentials
  const apiKey = process.env.BHARATCODE_API_KEY?.trim();
  const baseUrl = (process.env.BHARATCODE_BASE_URL || DEFAULT_BASE_URL).trim();
  const model = (process.env.BHARATCODE_MODEL || DEFAULT_MODEL).trim();

  if (!apiKey || apiKey === "your_bharatcode_api_key_here") {
    return NextResponse.json(
      {
        error:
          "Server environment variable BHARATCODE_API_KEY is not configured. Add your key in .env.local or use 'Instant Sample Preview' to explore the 3 pre-built demo scopes.",
        code: "MISSING_API_KEY",
      },
      { status: 503, headers: rateHeaders }
    );
  }

  const callParams = { baseUrl, apiKey, model, brief };

  // 4. Handle Progressive SSE Streaming if requested by the client
  if (clientWantsStream) {
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const sendEvent = (obj: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };

        try {
          // Launch Call A and Call B in parallel
          const promiseA = runCallA(callParams).then((res) => {
            if (res.ok) {
              sendEvent({ type: "partA", data: res.data });
            }
            return res;
          });

          const promiseB = runCallB(callParams).then((res) => {
            if (res.ok) {
              sendEvent({ type: "partB", data: res.data });
            }
            return res;
          });

          const [resultA, resultB] = await Promise.all([promiseA, promiseB]);

          if (!resultA.ok) {
            sendEvent({
              type: "error",
              error: resultA.errorMessage,
              code: resultA.code || (resultA.status === 504 ? "TIMEOUT" : "UPSTREAM_ERROR"),
            });
            controller.close();
            return;
          }

          if (!resultB.ok) {
            sendEvent({
              type: "error",
              error: resultB.errorMessage,
              code: resultB.code || (resultB.status === 504 ? "TIMEOUT" : "UPSTREAM_ERROR"),
            });
            controller.close();
            return;
          }

          const merged = mergeScopeParts(resultA.data, resultB.data);
          sendEvent({
            type: "complete",
            data: merged,
            meta: {
              model,
              baseUrl,
              attemptsA: resultA.attempts,
              attemptsB: resultB.attempts,
              durationMs: Date.now() - startTime,
            },
          });
        } catch (err) {
          sendEvent({
            type: "error",
            error: err instanceof Error ? err.message : "Internal streaming error",
            code: "STREAM_ERROR",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        ...rateHeaders,
      },
    });
  }

  // 5. Standard non-streaming JSON response (Parallel Call A + Call B)
  const [resultA, resultB] = await Promise.all([
    runCallA(callParams),
    runCallB(callParams),
  ]);

  if (!resultA.ok) {
    const isTimeout = resultA.status === 504 || resultA.code === "TIMEOUT";
    return NextResponse.json(
      {
        error: isTimeout
          ? "Request timed out after 55 seconds. The BharatCode model took too long to complete. Please try again."
          : resultA.errorMessage,
        code: isTimeout ? "TIMEOUT" : resultA.code || "UPSTREAM_ERROR",
      },
      { status: resultA.status >= 400 && resultA.status < 600 ? resultA.status : 502, headers: rateHeaders }
    );
  }

  if (!resultB.ok) {
    const isTimeout = resultB.status === 504 || resultB.code === "TIMEOUT";
    return NextResponse.json(
      {
        error: isTimeout
          ? "Request timed out after 55 seconds. The BharatCode model took too long to complete. Please try again."
          : resultB.errorMessage,
        code: isTimeout ? "TIMEOUT" : resultB.code || "UPSTREAM_ERROR",
      },
      { status: resultB.status >= 400 && resultB.status < 600 ? resultB.status : 502, headers: rateHeaders }
    );
  }

  const merged = mergeScopeParts(resultA.data, resultB.data);

  return NextResponse.json(
    {
      data: merged,
      meta: {
        model,
        baseUrl,
        attemptsA: resultA.attempts,
        attemptsB: resultB.attempts,
        durationMs: Date.now() - startTime,
        rateLimit: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
        },
      },
    },
    { status: 200, headers: rateHeaders }
  );
}
