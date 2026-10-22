# 🤖 ScopeBot
**Live demo:** https://scopebot-three.vercel.app
> **Turn messy, unstructured client briefs into boardroom-ready software scopes, task hour breakdowns, milestone timelines, and professional proposal emails in seconds.**  
> Built for the **BharatCode Build League**, powered by **`qwen-3.8-27b`** via the BharatCode Model API.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![BharatCode Model](https://img.shields.io/badge/Model-qwen--3.8--27b-orange)](https://bharatcode.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Problem & Overview

Freelancers, software agencies, and product leads lose hours every week parsing messy client inputs: fragmented WhatsApp voice note transcriptions, hasty email summaries, or bulletless Slack dumps.

**ScopeBot** automates this transition. It acts as an autonomous Principal Solutions Architect and Delivery Lead, ingesting raw briefs and producing a comprehensive 5-part project plan:

1. **Clear Scope Summary**: Executive overview, measurable objectives, core deliverables, strict out-of-scope boundaries, and recommended tech stack.
2. **Assumptions & Client Questions**: Assumptions with risk impact ratings (`Low` / `Medium` / `High`), plus prioritized discovery questions (`Critical` / `Important` / `Nice-to-know`) with rationale.
3. **Task Breakdown & Hour Estimates**: Granular engineering tasks with assigned roles, complexity levels, min–max effort ranges, and calculated expected hours.
4. **Milestone Timeline**: Phased sprint schedule with week-by-week summaries, deliverables, and verifiable exit criteria.
5. **Ready-to-Send Proposal Email**: Professional, consultative proposal email draft complete with subject line, scope highlights, and call-to-action.

---

## 📸 Screenshots & Walkthrough

| Interface | View |
|---|---|
| **ScopeBot Studio (Input & One-Click Demo Briefs)** | ![ScopeBot Studio](./docs/screenshots/scopebot-hero.png) |
| **Generated Scope, Breakdown & Proposal** | ![Scope Output](./docs/screenshots/scopebot-results.png) |

---

## 🏗️ Architecture Note

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js Client (Browser)                        │
│   • Responsive Tailwind UI       • One-click Demo Briefs               │
│   • Progressive Section Loader   • Per-Section & Full Copy Controls    │
│   • Live Queue Status (Timer)    • Friendly Retry on Failures          │
│   • Instant KiranaFlash "Sample output" for Judges                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ POST /api/scope (stream: true)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               ScopeBot Server Route (maxDuration = 300)                │
│                                                                        │
│  [1] IP Rate Limiter & Guardrails                                      │
│      • In-memory sliding window bucket (default: 10 req/min)           │
│      • Length validation (20 to 12,000 characters)                     │
│                                                                        │
│  [2] Parallel Streamed Generation (Promise.all)                        │
│      • Call A: Scope Summary + Assumptions & Questions                 │
│      • Call B: Task Breakdown (≤8 tasks) + Milestones (≤5) + Proposal   │
│      • stream: true + max_tokens: 2500 per call                        │
│      • 240s per-call AbortController timeout                           │
│                                                                        │
│  [3] SSE Keepalive & Heartbeat Channel                                 │
│      • Sends `: keepalive\n\n` comments every 10s to keep connection   │
│        active while model is queued                                    │
│                                                                        │
│  [4] Server-Side SSE Assembly & Zod Schema Validation                  │
│      • Strips <think>...</think> reasoning traces                      │
│      • Validates ScopePartASchema & ScopePartBSchema                   │
│                                                                        │
│  [5] Defensive Retry on Bad JSON Loop                                  │
│      • If attempt 1 fails JSON parse or Zod validation:                │
│        Re-invokes model with explicit error trace & snippet            │
│                                                                        │
│  [6] Progressive Emission & Result Merge                               │
│      • Emits partA event as soon as Call A finishes                    │
│      • Merges Part A & Part B into full ScopeOutput                    │
│      • Emits complete event with duration & meta                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Validated JSON / SSE
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Interactive Output View                         │
│  [1] Scope Summary       [2] Assumptions & Questions                   │
│  [3] Task Hour Estimates [4] Milestone Timeline  [5] Proposal Email    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

- **Built with Next.js 15 (App Router) + TypeScript + Tailwind CSS**: Responsive on desktop, tablet, and mobile with dark-mode aesthetic.
- **Parallel 2-Call Model Architecture**: Splits work into two concurrent `qwen-3.8-27b` calls, cutting generation time in half.
- **Extended Timeout & SSE Keepalive Heartbeat**: Configured with `maxDuration = 300` and a 240s internal timeout per call. Sends SSE `: keepalive\n\n` comments every 10s so connections never drop while the model is queued.
- **Clear Queue Status & Live Timer**: UI clearly displays *"Model is queued, this can take a few minutes"* with an elapsed timer, keeping the **Retry generation** button for real failures.
- **Instant "Sample output" for Judges**: Includes a pre-generated KiranaFlash scope package accessible with 1 click from anywhere in the app so judges can evaluate the full UI even when the model is busy.
- **Server-Side SSE Stream Assembly**: Calls chat completions with `stream: true`, lower token budget (`max_tokens: 2500`), and compact JSON constraints (max 8 tasks, max 5 milestones).
- **Progressive Per-Section Loading**: When generating, the UI renders Sections 1 & 2 immediately as soon as Call A resolves, while Call B finishes in parallel.
- **Strict Zod Schema Validation & Auto-Correction**: Any formatting discrepancy triggers an immediate self-healing retry prompt with specific error context.
- **In-Memory IP Rate Limiter**: Sliding-window rate limiter safeguarding against spam and API quota abuse.
- **3 One-Click Real-World Demos**:
  - *KiranaFlash*: D2C Hyperlocal Quick-Commerce & Tally Prime Sync.
  - *LexVeda AI*: B2B Vendor Contract Risk Scanner & Playbook Auditor.
  - *ArogyaPulse*: Multi-Clinic Telehealth & ABHA Appointment Portal.
- **Per-Section & Full Markdown Copying**: Dedicated copy buttons for each section plus a full markdown export option.
- **No Secrets in Repo**: Environment template in `.env.example`.

---

## ⚙️ Setup & Local Development

### Prerequisites

- **Node.js**: v18.18.0 or newer (v20+ recommended)
- **npm** or **pnpm**
- **BharatCode API Key**: Obtainable from [BharatCode.ai](https://bharatcode.ai)

### 1. Clone the repository

```bash
git clone https://github.com/suryakant-source/scopebot.git
cd scopebot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example configuration:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```ini
BHARATCODE_API_KEY=your_actual_api_key_here
BHARATCODE_BASE_URL=https://bharatcode.ai/api/model/v1
BHARATCODE_MODEL=qwen-3.8-27b
RATE_LIMIT_MAX_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000
```

### 4. Run development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build and Typecheck

```bash
npm run typecheck
npm run build
```

---

## 🌐 Deployment

### Deploy to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Project Settings > Environment Variables**, add:
   - `BHARATCODE_API_KEY`
   - *(Optional)* `BHARATCODE_BASE_URL` (default: `https://bharatcode.ai/api/model/v1`)
   - *(Optional)* `BHARATCODE_MODEL` (default: `qwen-3.8-27b`)
4. Click **Deploy**.

### Deploy to Cloudflare Pages (Next-on-Pages)

1. Connect your GitHub repository to Cloudflare Pages.
2. Select framework preset: **Next.js**.
3. Configure the environment variable `BHARATCODE_API_KEY` in Cloudflare Pages dashboard.

---

## 📄 BharatCode Harness Specification

For comprehensive documentation on the system prompt design, self-correction retry harness, parameter configuration, and workflow mechanics, consult [`BharatCode.txt`](./BharatCode.txt) in the project root.

---

## 📜 License

Released under the [MIT License](LICENSE).
