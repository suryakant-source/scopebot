import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildRateLimitHeaders,
  checkRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import {
  buildRetryPrompt,
  buildUserPrompt,
  SCOPEBOT_SYSTEM_PROMPT,
} from "@/lib/prompts";
import { parseAndValidateScopeJson } from "@/lib/schema";

const RequestBodySchema = z.object({
  brief: z
    .string()
    .trim()
    .min(20, "Please provide a client brief of at least 20 characters.")
    .max(12000, "Client brief must be under 12,000 characters."),
});

const DEFAULT_BASE_URL = "https://bharatcode.ai/api/model/v1";
const DEFAULT_MODEL = "qwen-3.8-27b";
const MAX_ATTEMPTS = 2; // Initial attempt + 1 automatic retry on bad JSON

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

async function callBharatCodeModel(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  userPrompt: string;
  useResponseFormat: boolean;
}): Promise<{ ok: boolean; status: number; content: string; errorMessage?: string }> {
  const endpoint = `${params.baseUrl.replace(/\/+$/, "")}/chat/completions`;

  const payload: Record<string, unknown> = {
    model: params.model,
    messages: [
      { role: "system", content: SCOPEBOT_SYSTEM_PROMPT },
      { role: "user", content: params.userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  };

  if (params.useResponseFormat) {
    payload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

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

    const rawText = await response.text();
    let json: ChatCompletionResponse | null = null;
    try {
      json = JSON.parse(rawText) as ChatCompletionResponse;
    } catch {
      json = null;
    }

    if (!response.ok) {
      const upstreamMessage =
        json?.error?.message ||
        rawText.slice(0, 300) ||
        `Upstream HTTP ${response.status}`;
      return {
        ok: false,
        status: response.status,
        content: "",
        errorMessage: upstreamMessage,
      };
    }

    const content = json?.choices?.[0]?.message?.content ?? "";
    return {
      ok: true,
      status: response.status,
      content,
    };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      status: 504,
      content: "",
      errorMessage: isAbort
        ? "Request to BharatCode model API timed out after 55 seconds."
        : err instanceof Error
        ? err.message
        : "Network error calling BharatCode API.",
    };
  } finally {
    clearTimeout(timeout);
  }
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

  // 2. Parse and validate incoming request body
  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON request body.",
        code: "INVALID_BODY",
      },
      { status: 400, headers: rateHeaders }
    );
  }

  const parsedBody = RequestBodySchema.safeParse(bodyUnknown);
  if (!parsedBody.success) {
    const msg = parsedBody.error.issues.map((i) => i.message).join(" ");
    return NextResponse.json(
      {
        error: msg,
        code: "VALIDATION_ERROR",
      },
      { status: 400, headers: rateHeaders }
    );
  }

  const { brief } = parsedBody.data;

  // 3. Read server-only BharatCode credentials
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

  // 4. Call BharatCode model API with structured JSON validation + automatic retry on bad JSON
  let lastValidationError = "Unknown validation error";
  let lastRawSnippet = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const userPrompt =
      attempt === 1
        ? buildUserPrompt(brief)
        : buildRetryPrompt(brief, lastRawSnippet, lastValidationError);

    const apiResponse = await callBharatCodeModel({
      baseUrl,
      apiKey,
      model,
      userPrompt,
      useResponseFormat: attempt === 1,
    });

    if (!apiResponse.ok) {
      // If attempt 1 failed with 400 possibly due to response_format incompatibility, retry once without it
      if (attempt === 1 && apiResponse.status === 400) {
        lastValidationError = `Upstream HTTP 400: ${apiResponse.errorMessage}`;
        continue;
      }

      return NextResponse.json(
        {
          error: `BharatCode API error (${apiResponse.status}): ${apiResponse.errorMessage}`,
          code: "UPSTREAM_API_ERROR",
          attempt,
        },
        {
          status: apiResponse.status >= 400 && apiResponse.status < 600 ? apiResponse.status : 502,
          headers: rateHeaders,
        }
      );
    }

    const validation = parseAndValidateScopeJson(apiResponse.content);
    if (validation.success && validation.data) {
      return NextResponse.json(
        {
          data: validation.data,
          meta: {
            model,
            baseUrl,
            attempts: attempt,
            retriedOnBadJson: attempt > 1,
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

    // Record validation error for the automatic retry prompt
    lastValidationError = validation.errorSummary || "Invalid JSON structure";
    lastRawSnippet = validation.rawExtracted || apiResponse.content.slice(0, 600);
  }

  return NextResponse.json(
    {
      error: `Model output failed schema validation after ${MAX_ATTEMPTS} attempts. Last error: ${lastValidationError}`,
      code: "INVALID_MODEL_JSON",
    },
    { status: 502, headers: rateHeaders }
  );
}
