import { ScopeOutput } from "./schema";

export interface SampleBrief {
  id: string;
  label: string;
  badge: string;
  clientPersona: string;
  messyBrief: string;
  sampleOutput: ScopeOutput;
}

export const SAMPLE_BRIEFS: SampleBrief[] = [
  {
    id: "kirana-flash",
    label: "D2C Quick-Commerce & Tally Sync",
    badge: "Retail / Quick-Commerce",
    clientPersona: "Founder, 12-store Supermarket Chain (Pune)",
    messyBrief: `Hey team, forwarding notes from my call with my brother. We run 12 grocery + daily essentials stores across Pune and PCMC. Blinkit/Zepto are eating into our evening basket size so we urgently need our own web app + mobile web where apartment societies within 3km of each store can order and get delivery in 45 mins.

Right now all stock is in Tally Prime on local store PCs—sometimes items show in stock online when they're actually sold out at the counter, so we need some kind of near real-time sync or CSV/connector every 10 mins. Customers should login via OTP (WhatsApp or SMS, whichever is cheaper), browse categories, pay via UPI Intent / Razorpay or COD. 

Also our store packers need a simple tablet screen with sound alert when an order lands, and a link we can WhatsApp to our own delivery riders so they can mark "Picked Up" and "Delivered" with a 4-digit OTP from customer. Need English + Marathi support if possible. Can we go live before festive season in 5-6 weeks? Budget is tight so no fancy native iOS/Android apps right now, PWA is fine. Tell me how many hours and send a rough plan I can show my partner tonight.`,
    sampleOutput: {
      scopeSummary: {
        projectTitle: "KiranaFlash — Hyperlocal Multi-Store Quick-Commerce PWA & Store Ops Suite",
        clientIndustry: "Retail & Hyperlocal Quick-Commerce (D2C Grocery)",
        executiveSummary:
          "Build a mobile-first Progressive Web App (PWA) and store fulfillment system enabling 12 Pune/PCMC supermarket locations to accept geofenced orders within a 3km radius for 45-minute delivery. The platform includes a scheduled Tally Prime inventory bridge, WhatsApp/SMS OTP authentication, Razorpay UPI + COD checkout, a tablet packer console with audio alerts, and a lightweight rider delivery verification web view.",
        objectives: [
          "Launch a geofenced customer ordering PWA mapping buyers to the nearest active store within a 3km radius.",
          "Eliminate stockout cancellations by syncing Tally Prime SKU quantities and pricing every 10 minutes per store.",
          "Streamline in-store picking and last-mile handoff with a packer tablet queue and OTP-verified rider completion link.",
          "Ship a production MVP within 6 weeks ahead of the festive demand spike without native app store review delays."
        ],
        deliverables: [
          "Customer Storefront PWA (Next.js) with GPS/Pincode store resolution, bilingual UI (English & Marathi), cart, and checkout",
          "Tally Prime XML/ODBC Sync Agent & webhook ingestion endpoint updating store-level SKU stock every 10 minutes",
          "Payment & Auth integration: WhatsApp/SMS OTP login plus Razorpay (UPI Intent, Cards) and Cash-on-Delivery (COD)",
          "Store Packer Tablet Console with real-time WebSocket/SSE order alerts, pick-list checklist, and invoice print view",
          "Delivery Rider Mobile Web Link with Google Maps navigation deep-link and 4-digit customer delivery OTP verification",
          "Central Admin Dashboard for catalog enrichment (photos/Marathi labels), delivery radius rules, and daily reconciliation"
        ],
        outOfScope: [
          "Native iOS (Swift) and Android (Kotlin) mobile binaries and App Store / Play Store submissions",
          "Live continuous GPS telemetry tracking of delivery riders on an animated customer map (status milestones used instead)",
          "Two-way accounting write-back of GST ledgers into Tally Prime (Phase 1 is one-way inventory/price sync from Tally to cloud + CSV order export)",
          "Automated warehouse dark-store robotics or multi-warehouse split-shipment routing"
        ],
        recommendedStack: [
          "Next.js 15 (App Router) + TypeScript + Tailwind CSS (PWA)",
          "PostgreSQL (Supabase / Neon) with PostGIS for 3km polygon geofencing",
          "Node.js Tally XML Bridge Service + Cron Worker",
          "Razorpay Standard Checkout (UPI Intent) + Gupshup/MSG91 WhatsApp OTP",
          "Vercel + Cloudflare CDN"
        ]
      },
      assumptionsAndQuestions: {
        assumptions: [
          {
            id: "A1",
            category: "Inventory Sync",
            statement: "Each of the 12 stores runs Tally Prime on a Windows PC with internet access capable of running a lightweight scheduled background script every 10 minutes.",
            impactIfWrong: "High"
          },
          {
            id: "A2",
            category: "Catalog Media",
            statement: "Tally only stores SKU names, barcodes, MRP, and stock counts; product images and Marathi display titles will be uploaded once via bulk CSV/image folder in the cloud admin panel.",
            impactIfWrong: "Medium"
          },
          {
            id: "A3",
            category: "Delivery Fleet",
            statement: "Riders are store-assigned staff or local gig riders managed manually by the store manager rather than dispatched via 3rd-party APIs like Shadowfax/Porter.",
            impactIfWrong: "Medium"
          },
          {
            id: "A4",
            category: "Language Support",
            statement: "Bilingual support (English + Marathi) applies to UI navigation, category headers, and top 1,500 fast-moving SKUs.",
            impactIfWrong: "Low"
          }
        ],
        questionsForClient: [
          {
            id: "Q1",
            priority: "Critical",
            question: "Are the 12 stores using a centralized Tally Server 9 / Tally Prime Server, or 12 independent Tally instances at each shop?",
            whyItMatters: "Determines whether we deploy a single central sync connector or 12 store-level lightweight sync agents with store ID keys."
          },
          {
            id: "Q2",
            priority: "Critical",
            question: "How should partial stockouts be handled when a packer discovers an item is damaged on the shelf during picking?",
            whyItMatters: "Impacts payment flow: for prepaid UPI orders, we either trigger an instant partial Razorpay refund or credit an in-app wallet."
          },
          {
            id: "Q3",
            priority: "Important",
            question: "Do you already have an approved Meta WhatsApp Business API (WABA) account and DLT registration for OTP templates?",
            whyItMatters: "DLT and WABA verification in India takes 3–5 business days and is on the critical path for customer login and rider notifications."
          },
          {
            id: "Q4",
            priority: "Nice-to-know",
            question: "Do different stores have different selling prices or local promotions for the same SKU barcode?",
            whyItMatters: "Shapes the database schema (global catalog vs. store-specific price override table)."
          }
        ]
      },
      taskBreakdown: {
        tasks: [
          {
            id: "T1",
            phase: "Discovery & Architecture",
            task: "Database Schema, Geofencing Rules & Tally XML Bridge Spec",
            description: "Design multi-store PostgreSQL schema, 3km PostGIS store resolver, and Tally Prime XML HTTP export payload specification.",
            role: "Solutions Architect",
            hoursMin: 12,
            hoursMax: 18,
            hoursExpected: 15,
            complexity: "Medium"
          },
          {
            id: "T2",
            phase: "Core Backend & Sync",
            task: "Tally Prime Inventory Sync Connector & Delta Ingestion API",
            description: "Build lightweight connector polling Tally XML port every 10 mins, pushing stock/price deltas with retry queue and store health heartbeat.",
            role: "Backend Engineer",
            hoursMin: 24,
            hoursMax: 34,
            hoursExpected: 28,
            complexity: "High"
          },
          {
            id: "T3",
            phase: "Storefront PWA",
            task: "Bilingual Customer PWA (Store Locator, Catalog, Search & Cart)",
            description: "Responsive Next.js PWA with GPS/pincode geofencing, English/Marathi locale switcher, fast SKU search, and persistent cart.",
            role: "Full-Stack Engineer",
            hoursMin: 32,
            hoursMax: 44,
            hoursExpected: 38,
            complexity: "Medium"
          },
          {
            id: "T4",
            phase: "Payments & Auth",
            task: "WhatsApp/SMS OTP Login & Razorpay UPI / COD Checkout",
            description: "Integrate OTP authentication, Razorpay order creation, webhook signature verification, partial refund handler, and COD eligibility rules.",
            role: "Full-Stack Engineer",
            hoursMin: 18,
            hoursMax: 26,
            hoursExpected: 22,
            complexity: "Medium"
          },
          {
            id: "T5",
            phase: "Store & Rider Ops",
            task: "Packer Tablet Console & Rider OTP Delivery Web View",
            description: "Real-time order queue with persistent audio alert, item pick/substitute workflow, WhatsApp dispatch link for riders, and 4-digit customer OTP completion.",
            role: "Full-Stack Engineer",
            hoursMin: 26,
            hoursMax: 36,
            hoursExpected: 30,
            complexity: "Medium"
          },
          {
            id: "T6",
            phase: "Admin & QA",
            task: "Catalog Enrichment Admin, Pilot Store Stress Test & Deployment",
            description: "Admin bulk CSV/image uploader, store operating hours toggle, end-to-end UAT with 1 pilot store in Pune, and production rollout.",
            role: "QA / DevOps Engineer",
            hoursMin: 18,
            hoursMax: 26,
            hoursExpected: 22,
            complexity: "Low"
          }
        ],
        totalHoursMin: 130,
        totalHoursMax: 184,
        totalHoursExpected: 155,
        estimationNotes: "Estimated at 155 engineering hours (~5.5 weeks with 1 Senior Full-Stack Engineer + 1 part-time Backend/DevOps Engineer), including 15% buffer for Tally local network edge cases."
      },
      milestoneTimeline: {
        estimatedTotalWeeks: 6,
        milestones: [
          {
            phaseNumber: 1,
            title: "Foundation, Multi-Store Schema & Tally Sync Prototype",
            timeframe: "Week 1 – Week 2",
            summary: "Establish cloud database, geofencing service, and verify live 10-minute stock pulls from 1 pilot store's Tally Prime instance.",
            keyDeliverables: [
              "PostgreSQL + PostGIS multi-store database schema",
              "Working Tally Prime XML sync script verified against pilot store SKU master",
              "Admin CSV bulk uploader for product images and Marathi translations"
            ],
            exitCriteria: "Stock quantity changes in pilot store Tally reflect in cloud database within 10 minutes."
          },
          {
            phaseNumber: 2,
            title: "Customer Ordering PWA & Razorpay/OTP Checkout",
            timeframe: "Week 3 – Week 4",
            summary: "Deliver the customer-facing mobile web experience with bilingual toggle, OTP login, and live payment processing.",
            keyDeliverables: [
              "Geofenced Storefront PWA (English & Marathi)",
              "WhatsApp/SMS OTP login flow",
              "Razorpay UPI Intent + COD checkout with webhook verification"
            ],
            exitCriteria: "Test user within 3km of pilot store can complete an end-to-end prepaid UPI and COD order on mobile."
          },
          {
            phaseNumber: 3,
            title: "Store Packer Tablet Console & Rider OTP Flow",
            timeframe: "Week 5",
            summary: "Build in-store fulfillment dashboard and rider last-mile WhatsApp web link.",
            keyDeliverables: [
              "Tablet packer console with sound notification and out-of-stock adjustment",
              "One-tap rider assignment & WhatsApp dispatch message",
              "Rider mobile web screen with Google Maps button and 4-digit customer OTP handoff"
            ],
            exitCriteria: "Store packer can pack an order in <3 minutes and rider can mark delivered using customer OTP."
          },
          {
            phaseNumber: 4,
            title: "Pilot Store Soft Launch & 12-Store Festive Rollout",
            timeframe: "Week 6",
            summary: "Run live orders at 1 Pune store for 72 hours, train store packers, and onboard remaining 11 locations.",
            keyDeliverables: [
              "Production deployment on Vercel with monitoring & alerting",
              "Tally sync agent installed across all 12 store PCs",
              "Store manager & packer quick-reference SOP guide"
            ],
            exitCriteria: "All 12 stores actively syncing stock and accepting live customer orders with <1% webhook error rate."
          }
        ]
      },
      proposalEmail: {
        subject: "Scope & 6-Week Launch Plan: Hyperlocal Quick-Commerce PWA for Your 12 Pune Stores",
        recipientPlaceholder: "Hi [Client Name],",
        body: "Thanks for sharing the notes from your call. Launching a dedicated 45-minute delivery channel for your 12 Pune & PCMC stores ahead of the festive season is a smart move—and going with a mobile-first PWA instead of native apps is the right call to hit your 6-week timeline and keep costs lean.\n\nWe have mapped out a complete technical scope (~155 engineering hours across 6 weeks) that covers the four pillars you need:\n1. Geofenced Customer PWA (English + Marathi) with WhatsApp OTP login and Razorpay UPI/COD checkout.\n2. Automated Tally Prime Sync Bridge updating store-level inventory every 10 minutes so customers never order out-of-stock items.\n3. Store Packer Tablet Console with audio alerts and partial-stock refund handling.\n4. Rider WhatsApp Web Link with Google Maps navigation and 4-digit OTP delivery proof.\n\nBefore we lock in the Sprint 1 kickoff, we just need quick clarity on two critical items: whether your 12 stores run independent Tally instances or a central Tally Server, and whether your Meta WhatsApp Business / DLT registration is already active.",
        callToAction: "Do you and your partner have 20 minutes tomorrow at 4:00 PM IST to walk through the milestone plan and kick off the pilot store Tally check?"
      }
    }
  },
  {
    id: "lexveda-ai",
    label: "AI Vendor Contract Risk Scanner",
    badge: "B2B SaaS / LegalTech AI",
    clientPersona: "VP Operations, Mid-Market Logistics Enterprise",
    messyBrief: `Hi, we sign around 180 vendor, warehousing, and fleet lease contracts every month across India. Our legal team of 2 people is completely bottlenecked and procurement keeps chasing them on Slack and email.

We want an internal web tool where anyone in procurement can upload a draft PDF or Word (.docx) contract from a vendor. The system should automatically read it using AI, pull out key commercial terms (start/end date, lock-in period, notice period, GST/TDS terms, liability cap, jurisdiction city, auto-renewal), and compare the clauses against our standard company playbook (for example: liability cap must not exceed 6 months of fees, jurisdiction must be Mumbai or Bengaluru, termination notice <= 30 days).

If a clause deviates, highlight it Red/Amber/Green with the exact page/paragraph quote and suggest replacement wording our procurement manager can copy-paste back to the vendor! Also need a Slack notification to #legal-reviews when a High-Risk contract is uploaded, and role-based login via Google Workspace SSO. Must keep documents private (no training public models on our contracts). Looking for an MVP estimate and timeline.`,
    sampleOutput: {
      scopeSummary: {
        projectTitle: "LexVeda — AI Vendor Contract Playbook Auditor & Redline Assistant",
        clientIndustry: "Enterprise LegalTech / Procurement Automation",
        executiveSummary:
          "Develop a secure, internal B2B web application with Google Workspace SSO that enables procurement teams to upload PDF and DOCX vendor contracts for automated clause extraction and playbook compliance scoring. The platform parses document structure with citation anchors, evaluates terms against configurable company rules (Red/Amber/Green), generates copy-ready fallback redline clauses, and alerts legal reviewers in Slack for high-risk deviations.",
        objectives: [
          "Cut initial vendor contract triage time from 48 hours to under 3 minutes per document.",
          "Extract 10+ structured commercial metadata fields (dates, lock-in, GST/TDS, liability cap, jurisdiction) with exact paragraph citations.",
          "Automate RAG (Red/Amber/Green) risk scoring against the company's legal playbook and generate copy-paste fallback language.",
          "Enforce enterprise privacy with Google Workspace SSO, role-based access, and zero-data-retention LLM API endpoints."
        ],
        deliverables: [
          "Secure Web Portal with Google Workspace OAuth2 SSO and Role-Based Access Control (Procurement vs. Legal Admin)",
          "Document Ingestion Pipeline supporting native PDF, scanned OCR PDF, and DOCX parsing with section/page indexing",
          "Structured AI Playbook Evaluation Engine outputting Red/Amber/Green clause ratings, verbatim quotes, and fallback wording",
          "Interactive Side-by-Side Contract Review UI with one-click copy for suggested redline clauses and CSV/PDF summary export",
          "Playbook Rules Configuration UI allowing Legal Admins to edit risk thresholds (e.g., jurisdiction, liability caps) without code changes",
          "Slack Webhook / Bot Integration posting high-risk contract alerts with deep-links to #legal-reviews"
        ],
        outOfScope: [
          "Direct bi-directional editing of binary Microsoft Word track-changes (.docx byte-level XML patching) in Phase 1",
          "External vendor portal or e-signature orchestration (DocuSign / Leegality integration deferred to Phase 2)",
          "Automated ERP purchase order creation inside SAP/Oracle/Zoho Books"
        ],
        recommendedStack: [
          "Next.js 15 (App Router) + TypeScript + Tailwind CSS",
          "PostgreSQL + pgvector (Supabase / RDS) + S3 Encrypted Object Storage",
          "Document Parsing: mammoth (DOCX) + pdf-parse / Azure Document Intelligence OCR",
          "Zero-Retention Enterprise LLM API with Structured JSON Schema Validation",
          "NextAuth.js (Google Workspace SSO) + Slack Incoming Webhooks API"
        ]
      },
      assumptionsAndQuestions: {
        assumptions: [
          {
            id: "A1",
            category: "Document Quality",
            statement: "At least 80% of uploaded contracts are digitally generated PDFs or DOCX files; up to 20% may be scanned stamped agreements requiring OCR.",
            impactIfWrong: "High"
          },
          {
            id: "A2",
            category: "Contract Length",
            statement: "Standard warehousing and fleet vendor agreements average 8–35 pages (under 25,000 tokens per contract).",
            impactIfWrong: "Medium"
          },
          {
            id: "A3",
            category: "Language",
            statement: "Contracts are written in English (with occasional Indian legal stamp headers that do not contain operative commercial clauses).",
            impactIfWrong: "Medium"
          },
          {
            id: "A4",
            category: "Data Privacy",
            statement: "Using enterprise API endpoints with zero data retention (no model training on customer payloads) satisfies internal infosec policy without requiring on-premise GPU hosting.",
            impactIfWrong: "High"
          }
        ],
        questionsForClient: [
          {
            id: "Q1",
            priority: "Critical",
            question: "Do you have a single unified company playbook, or different rule sets for Warehousing Leases vs. Fleet Transport vs. IT Vendors?",
            whyItMatters: "Determines whether the Playbook Engine needs contract-type classification and multiple rule templates at upload time."
          },
          {
            id: "Q2",
            priority: "Critical",
            question: "Roughly what percentage of incoming PDFs are scanned physical stamp-paper copies versus clean digital PDFs/Word files?",
            whyItMatters: "Scanned documents require an OCR layout step (e.g., Document Intelligence/Textract) before LLM analysis to preserve accurate page/clause citations."
          },
          {
            id: "Q3",
            priority: "Important",
            question: "Should procurement users be able to see only their own uploaded contracts, or all contracts across their regional business unit?",
            whyItMatters: "Defines the PostgreSQL row-level security and RBAC permission matrix."
          },
          {
            id: "Q4",
            priority: "Nice-to-know",
            question: "Would you like the Slack alert in #legal-reviews to include Approve / Request Changes action buttons directly in Slack, or a link back to the web portal?",
            whyItMatters: "Deep-link notifications take 4 hours; interactive Slack Block Kit approval workflows add ~12 hours."
          }
        ]
      },
      taskBreakdown: {
        tasks: [
          {
            id: "T1",
            phase: "Discovery & Security",
            task: "Google Workspace SSO, RBAC & Encrypted Storage Setup",
            description: "Configure Google OAuth domain restriction, Procurement/Legal roles, encrypted S3 bucket, and audit logging.",
            role: "Full-Stack Engineer",
            hoursMin: 12,
            hoursMax: 16,
            hoursExpected: 14,
            complexity: "Low"
          },
          {
            id: "T2",
            phase: "Document Pipeline",
            task: "PDF/DOCX Text & Page-Coordinate Extraction Service",
            description: "Build parser for DOCX and PDF with page/paragraph chunking and fallback OCR hook for scanned stamp-paper PDFs.",
            role: "Backend AI Engineer",
            hoursMin: 20,
            hoursMax: 30,
            hoursExpected: 24,
            complexity: "High"
          },
          {
            id: "T3",
            phase: "AI Playbook Engine",
            task: "Structured Clause Extractor & RAG Risk Scoring Pipeline",
            description: "Implement prompt harness + Zod validation extracting commercial metadata, evaluating playbook rules, and drafting fallback redlines.",
            role: "Backend AI Engineer",
            hoursMin: 28,
            hoursMax: 38,
            hoursExpected: 32,
            complexity: "High"
          },
          {
            id: "T4",
            phase: "Frontend & UX",
            task: "Contract Review Dashboard, Citation Viewer & Redline Copy UI",
            description: "Build upload queue, executive metadata cards, Red/Amber/Green clause filter, verbatim quote highlights, and one-click redline copy.",
            role: "Full-Stack Engineer",
            hoursMin: 28,
            hoursMax: 36,
            hoursExpected: 32,
            complexity: "Medium"
          },
          {
            id: "T5",
            phase: "Admin & Integrations",
            task: "Playbook Rule Manager UI & Slack #legal-reviews Alerting",
            description: "Allow Legal Admins to customize playbook rules/thresholds and fire formatted Slack Block Kit notifications on High-Risk uploads.",
            role: "Full-Stack Engineer",
            hoursMin: 16,
            hoursMax: 22,
            hoursExpected: 18,
            complexity: "Medium"
          },
          {
            id: "T6",
            phase: "QA & Calibration",
            task: "Playbook Accuracy Benchmarking on 20 Historical Contracts",
            description: "Test extraction precision against 20 real anonymized vendor contracts with the 2-person legal team and tune prompt guardrails.",
            role: "QA / AI Engineer",
            hoursMin: 14,
            hoursMax: 20,
            hoursExpected: 16,
            complexity: "Medium"
          }
        ],
        totalHoursMin: 118,
        totalHoursMax: 162,
        totalHoursExpected: 136,
        estimationNotes: "Estimated at 136 engineering hours (~4.5 to 5 weeks), including prompt calibration against a sample set of your historical warehousing and fleet agreements."
      },
      milestoneTimeline: {
        estimatedTotalWeeks: 5,
        milestones: [
          {
            phaseNumber: 1,
            title: "SSO Security Foundation & Document Parsing Pipeline",
            timeframe: "Week 1",
            summary: "Stand up Google Workspace authentication, encrypted contract storage, and PDF/DOCX extraction with page citations.",
            keyDeliverables: [
              "Google Workspace SSO login restricted to company domain",
              "PDF & DOCX parser outputting structured page/paragraph segments",
              "PostgreSQL schema for contracts, clauses, and playbook templates"
            ],
            exitCriteria: "Sample PDF and DOCX contracts upload securely and parse into indexed paragraphs with 100% page-number fidelity."
          },
          {
            phaseNumber: 2,
            title: "AI Playbook Evaluator & Commercial Metadata Extractor",
            timeframe: "Week 2 – Week 3",
            summary: "Build the structured LLM evaluation engine for commercial term extraction, Red/Amber/Green grading, and fallback clause generation.",
            keyDeliverables: [
              "Extraction of 10 core commercial fields (lock-in, liability cap, GST/TDS, jurisdiction, etc.)",
              "Playbook rule comparator with Red/Amber/Green severity classification",
              "Automated fallback wording generator aligned with legal standards"
            ],
            exitCriteria: "Benchmark run on 10 sample contracts achieves >92% agreement with human legal counsel ratings."
          },
          {
            phaseNumber: 3,
            title: "Interactive Review UI, Playbook Admin & Slack Alerts",
            timeframe: "Week 4",
            summary: "Deliver the procurement user interface, legal rule editor, and automated Slack notifications.",
            keyDeliverables: [
              "Contract audit view with Red/Amber/Green tabs and one-click redline copy buttons",
              "Legal Admin playbook threshold editor",
              "Automated Slack webhook alerts to #legal-reviews for Red-flagged contracts"
            ],
            exitCriteria: "Uploading a contract with an uncapped indemnity clause triggers a #legal-reviews Slack alert within 30 seconds."
          },
          {
            phaseNumber: 4,
            title: "Legal Team Calibration, UAT & Production Handover",
            timeframe: "Week 5",
            summary: "Calibrate prompts with your 2 legal counsel members, export PDF/CSV audit logs, and go live.",
            keyDeliverables: [
              "Fine-tuned playbook templates for Warehousing, Fleet, and General Vendor contracts",
              "Downloadable PDF/CSV risk summary report for procurement sign-off",
              "Production deployment & security documentation"
            ],
            exitCriteria: "Legal and procurement teams sign off on 20 live contract reviews in production."
          }
        ]
      },
      proposalEmail: {
        subject: "Project Scope: AI Vendor Contract Risk Scanner & Playbook Assistant (5-Week MVP)",
        recipientPlaceholder: "Hi [Client Name],",
        body: "Processing 180+ vendor and lease contracts a month with a two-person legal team is a classic high-leverage bottleneck for AI automation. Based on your brief, we have designed a focused 5-week MVP (~136 engineering hours) that lets procurement self-serve first-pass contract checks in under 3 minutes while keeping your legal team in full control of the rules.\n\nHere is what the MVP delivers:\n• Google Workspace SSO & Zero-Retention Privacy: Contracts stay encrypted and are never used to train public models.\n• Automated Commercial Extraction: Pulls start/end dates, lock-in, notice period, GST/TDS, liability caps, and jurisdiction with exact page/paragraph quotes.\n• Red / Amber / Green Playbook Audit: Flags deviations (e.g., liability cap > 6 months or non-Mumbai/Bengaluru jurisdiction) and generates copy-paste replacement clauses.\n• Instant Slack Escalation: Posts High-Risk summaries directly to #legal-reviews.\n\nTo finalize the architecture, could you let us know if you use a single playbook or separate rules for Warehousing vs. Fleet agreements, and roughly how many contracts arrive as scanned physical stamp-paper PDFs?",
        callToAction: "Could we schedule a 20-minute review call this Thursday with you and one member of your legal team to review a sample clause extraction demo?"
      }
    }
  },
  {
    id: "arogya-pulse",
    label: "Multi-Clinic Telehealth & ABHA Portal",
    badge: "HealthTech / Diagnostics",
    clientPersona: "COO, 4-Branch Polyclinic & Diagnostics Network (Bengaluru)",
    messyBrief: `Hello, we operate 4 specialty polyclinics in Bengaluru (Indiranagar, Jayanagar, Whitefield, Hebbal) with 35 consulting doctors and an in-house blood/pathology lab. Currently patients call our front desk or message on WhatsApp to book slots, and receptionists track everything in Google Sheets which causes double bookings and missed follow-ups.

We need a clean patient booking website + doctor schedule portal where patients can pick branch, specialty, or doctor, choose In-Clinic or Video Consultation, pay a ₹200 booking deposit (or full fee for video consult) via Razorpay, and get an automatic WhatsApp confirmation with calendar link / Google Meet or Zoom link.

Also when their blood test PDF is ready from our lab software, receptionist uploads it against the patient's mobile number so the patient can view past prescriptions + lab reports in one place. Bonus: we want our patient profiles structured so we can link Ayushman Bharat ABHA IDs easily next quarter. What's a realistic scope, hour breakdown, and timeline?`,
    sampleOutput: {
      scopeSummary: {
        projectTitle: "ArogyaPulse — Multi-Branch Polyclinic Booking, Telehealth & Patient Vault",
        clientIndustry: "Healthcare / Multi-Clinic Outpatient & Diagnostics",
        executiveSummary:
          "Build a unified patient appointment, teleconsultation, and medical records web platform across 4 Bengaluru polyclinics and 35 doctors. The system replaces manual Google Sheets scheduling with real-time slot locking, Razorpay deposit/full-fee collection, automated WhatsApp appointment reminders with video links, a receptionist lab report upload console, and an ABDM/ABHA-ready patient profile schema.",
        objectives: [
          "Eliminate front-desk double bookings across all 4 Bengaluru branches with atomic real-time doctor slot locking.",
          "Automate In-Clinic deposit (₹200) and Video Consultation full-fee collection via Razorpay with instant WhatsApp confirmations.",
          "Provide patients a secure mobile-OTP vault to download past digital prescriptions and pathology PDF reports.",
          "Structure patient demographic and health record schemas aligned with NDHM/ABDM standards for seamless Phase 2 ABHA ID linking."
        ],
        deliverables: [
          "Patient Booking Web App (filter by Branch, Specialty, Doctor, and In-Clinic vs. Video slot with 10-minute checkout lock)",
          "Doctor & Front-Desk Schedule Console (shift rosters, walk-in slot blocking, reschedule/refund controls)",
          "Razorpay Payment Gateway Integration (₹200 deposit for In-Clinic, 100% fee for Video Consult, automated GST receipt)",
          "Automated WhatsApp Notification Engine (booking confirmation, 2-hour reminder, video call join link, and lab report ready alert)",
          "Lab Report & Prescription Vault (Receptionist PDF uploader tagged by patient mobile/UHID + patient secure download portal)",
          "ABHA-Ready Patient Data Schema (FHIR-aligned identifier fields and consent metadata structure)"
        ],
        outOfScope: [
          "Direct HL7/ASTM hardware analyzer integration with laboratory blood testing machines (Phase 1 uses receptionist/lab PDF upload)",
          "Full ABDM M1/M2/M3 Sandbox certification and government gateway approval (schema is built ABHA-ready; certification is Phase 2)",
          "In-house custom WebRTC video server (uses automated Google Meet / Zoom SDK links for high reliability on low-bandwidth mobile networks)"
        ],
        recommendedStack: [
          "Next.js 15 (App Router) + TypeScript + Tailwind CSS",
          "PostgreSQL (Supabase / AWS RDS Mumbai ap-south-1) + Redis / Upstash for slot locking",
          "Razorpay Orders & Refunds API + Meta WhatsApp Business API (WABA)",
          "Google Calendar / Meet API or Zoom Meeting API for automated video links",
          "AWS S3 (ap-south-1 Mumbai) with pre-signed expiring URLs for medical PDF privacy"
        ]
      },
      assumptionsAndQuestions: {
        assumptions: [
          {
            id: "A1",
            category: "Data Residency & Privacy",
            statement: "All patient records and pathology PDFs will be hosted in India (AWS Mumbai ap-south-1) using encrypted storage and short-lived pre-signed download links.",
            impactIfWrong: "High"
          },
          {
            id: "A2",
            category: "Family Profiles",
            statement: "Multiple family members (e.g., parents/children) may share a single primary mobile number for WhatsApp OTP login, requiring sub-profiles per mobile number.",
            impactIfWrong: "High"
          },
          {
            id: "A3",
            category: "Video Platform",
            statement: "Automated unique Google Meet or Zoom links per teleconsultation are acceptable rather than building a custom embedded video player.",
            impactIfWrong: "Medium"
          },
          {
            id: "A4",
            category: "ABHA Scope",
            statement: "Phase 1 captures optional 14-digit ABHA number and structures health records in FHIR-compatible JSON, while formal NHA sandbox certification happens next quarter.",
            impactIfWrong: "Low"
          }
        ],
        questionsForClient: [
          {
            id: "Q1",
            priority: "Critical",
            question: "Do any of the 35 doctors split their day across multiple Bengaluru branches (e.g., morning at Indiranagar, evening at Whitefield)?",
            whyItMatters: "Requires branch-tagged shift windows per day of the week so a doctor cannot be booked simultaneously at two clinics."
          },
          {
            id: "Q2",
            priority: "Critical",
            question: "What is your cancellation and refund policy when a patient cancels or reschedules an In-Clinic (₹200 deposit) or Video appointment?",
            whyItMatters: "Dictates automated cutoff rules (e.g., free reschedule up to 4 hours prior vs. manual front-desk refund approval)."
          },
          {
            id: "Q3",
            priority: "Important",
            question: "How do doctors currently write prescriptions during consultations—typed on a computer, or handwritten on clinic letterheads?",
            whyItMatters: "Determines whether doctors need a quick digital Rx form in the portal or if receptionists scan/upload prescription PDFs alongside lab reports."
          },
          {
            id: "Q4",
            priority: "Nice-to-know",
            question: "Does your existing pathology lab software export reports with a standardized filename (e.g., MobileNumber_Date.pdf)?",
            whyItMatters: "If filenames follow a pattern, we can enable drag-and-drop batch uploading of 50+ lab PDFs at once with auto-matching."
          }
        ]
      },
      taskBreakdown: {
        tasks: [
          {
            id: "T1",
            phase: "Architecture & ABHA Schema",
            task: "Multi-Branch Roster Schema, Family Sub-Profiles & Slot Lock Design",
            description: "Design PostgreSQL schema supporting 4 branches, split-shift doctor rosters, family members per phone number, and ABHA/FHIR fields.",
            role: "Solutions Architect",
            hoursMin: 14,
            hoursMax: 20,
            hoursExpected: 16,
            complexity: "Medium"
          },
          {
            id: "T2",
            phase: "Booking & Payments",
            task: "Patient Slot Discovery, Atomic Locking & Razorpay Checkout",
            description: "Build branch/specialty/doctor booking flow, 10-min Redis slot reservation, and Razorpay ₹200 deposit vs. full video fee checkout.",
            role: "Full-Stack Engineer",
            hoursMin: 30,
            hoursMax: 40,
            hoursExpected: 34,
            complexity: "High"
          },
          {
            id: "T3",
            phase: "Telehealth & WhatsApp",
            task: "Video Meeting Generator & WhatsApp Automated Notifications",
            description: "Auto-generate unique video links on booking confirmation and send WhatsApp templates for confirmation, T-2h reminder, and rescheduling.",
            role: "Backend Engineer",
            hoursMin: 20,
            hoursMax: 28,
            hoursExpected: 24,
            complexity: "Medium"
          },
          {
            id: "T4",
            phase: "Clinic Operations",
            task: "Front-Desk Reception Console & Doctor Roster Manager",
            description: "Build receptionist calendar view for walk-ins, slot blocking, doctor leave overrides, and one-click appointment rescheduling.",
            role: "Full-Stack Engineer",
            hoursMin: 28,
            hoursMax: 38,
            hoursExpected: 32,
            complexity: "Medium"
          },
          {
            id: "T5",
            phase: "Patient Health Vault",
            task: "Encrypted Lab PDF Uploader & Patient Medical Records Portal",
            description: "S3 Mumbai encrypted upload with batch mobile-number matching, WhatsApp 'Report Ready' alert, and OTP-protected patient vault.",
            role: "Full-Stack Engineer",
            hoursMin: 22,
            hoursMax: 30,
            hoursExpected: 26,
            complexity: "Medium"
          },
          {
            id: "T6",
            phase: "QA & Clinic Rollout",
            task: "Security Audit, Receptionist Training & 4-Branch Migration",
            description: "Import existing 35 doctor schedules from Google Sheets, verify signed URL security, and onboard front-desk staff across 4 branches.",
            role: "QA / DevOps Engineer",
            hoursMin: 14,
            hoursMax: 20,
            hoursExpected: 16,
            complexity: "Low"
          }
        ],
        totalHoursMin: 128,
        totalHoursMax: 176,
        totalHoursExpected: 148,
        estimationNotes: "Estimated at 148 engineering hours (~5 weeks), including migration of the 35 doctor rosters from your current Google Sheets."
      },
      milestoneTimeline: {
        estimatedTotalWeeks: 5,
        milestones: [
          {
            phaseNumber: 1,
            title: "Multi-Branch Database, Family Profiles & Doctor Roster Engine",
            timeframe: "Week 1",
            summary: "Set up India-region database, family sub-profile OTP auth, and multi-branch shift scheduling for all 35 doctors.",
            keyDeliverables: [
              "ABHA-ready PostgreSQL patient & family member schema",
              "Doctor shift engine supporting split-branch schedules and leave blocks",
              "Seed import of your 4 Bengaluru clinics and 35 doctors"
            ],
            exitCriteria: "Admin can configure a doctor practicing mornings in Indiranagar and evenings in Whitefield without slot collisions."
          },
          {
            phaseNumber: 2,
            title: "Patient Booking Portal, Slot Locking & Razorpay Payments",
            timeframe: "Week 2 – Week 3",
            summary: "Launch the patient-facing booking flow with ₹200 In-Clinic deposits, full video consultation payments, and automated video links.",
            keyDeliverables: [
              "Responsive booking flow by Branch, Specialty, or Doctor",
              "Atomic slot locking preventing simultaneous double-bookings",
              "Razorpay payment webhook + automated Google Meet/Zoom link generation"
            ],
            exitCriteria: "Two concurrent test users attempting to book the same 10:30 AM slot result in zero double-bookings."
          },
          {
            phaseNumber: 3,
            title: "Front-Desk Console, WhatsApp Alerts & Lab Report Vault",
            timeframe: "Week 4",
            summary: "Deliver the receptionist walk-in calendar, WhatsApp reminders, and encrypted pathology PDF uploader.",
            keyDeliverables: [
              "Front-desk calendar for walk-in entries and slot rescheduling",
              "WhatsApp Business API notifications (Booking Confirmed, 2hr Reminder, Lab Report Ready)",
              "Encrypted Lab Report & Rx PDF uploader + Patient download portal"
            ],
            exitCriteria: "Uploading a lab PDF triggers a WhatsApp message to the patient, who can view it after OTP verification."
          },
          {
            phaseNumber: 4,
            title: "Staff Training & Live Cutover Across All 4 Bengaluru Clinics",
            timeframe: "Week 5",
            summary: "Run parallel shadow testing at Indiranagar branch, train receptionists, and retire Google Sheets.",
            keyDeliverables: [
              "Production deployment on AWS Mumbai / Vercel",
              "Front-desk receptionist quick-training walkthrough",
              "Daily Razorpay settlement & branch-wise booking reconciliation CSV"
            ],
            exitCriteria: "All 4 Bengaluru branches operating 100% on ArogyaPulse with zero Google Sheet dependencies."
          }
        ]
      },
      proposalEmail: {
        subject: "Scope & 5-Week Plan: Multi-Branch Booking, Telehealth & Lab Vault for Your 4 Bengaluru Clinics",
        recipientPlaceholder: "Hi [Client Name],",
        body: "Managing 35 doctors across 4 Bengaluru branches on Google Sheets is tough on your front-desk team—and moving to an automated booking + WhatsApp confirmation flow will immediately stop double-bookings and reduce no-shows.\n\nWe have put together a 5-week scope (~148 engineering hours) tailored to your polyclinic & diagnostics workflow:\n1. Multi-Branch Patient Booking: Patients filter by clinic (Indiranagar, Jayanagar, Whitefield, Hebbal), specialty, or doctor, choose In-Clinic (₹200 deposit) or Video Consult (100% fee), and pay via Razorpay.\n2. Zero Double-Bookings & Front-Desk Console: Real-time slot locking plus a fast receptionist screen to log walk-ins, handle reschedules, and manage doctors who split hours across branches.\n3. Automated WhatsApp Journey: Instant booking confirmations, video call links, 2-hour reminders, and 'Lab Report Ready' alerts.\n4. ABHA-Ready Patient Vault: Secure AWS Mumbai storage where receptionists upload pathology PDFs and prescriptions for patients (including family sub-profiles under one mobile number).\n\nBefore we kick off Week 1, could we confirm whether any doctors rotate between multiple branches on the same day, and whether your lab software exports PDFs with a standard naming format?",
        callToAction: "Are you free for a quick 20-minute walkthrough tomorrow afternoon to review the receptionist workflow and finalize our kickoff date?"
      }
    }
  }
];
