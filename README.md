# 🚀 SpecForge AI — Autonomous Project Discovery & Specification Agent

> **Transforming vague human software ideas into implementation-ready, cryptographically verified specifications for autonomous software engineering agents.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-68A063?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4+-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.9+-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75C2?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Groq LPU](https://img.shields.io/badge/Groq_LPU-Llama_3.3_70B-F55036?style=flat-square)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## 💡 The Problem & The Need

Modern autonomous software engineering agents (**Claude Code**, **Cursor**, **Aider**, **OpenHands**, **Gemini CLI**, **Devin**) are capable of remarkable code generation. However, they routinely fail when given fuzzy, high-level human ideas like *"Build an Uber for dog walkers"* or *"Create a modern CRM"*.

### Why Autonomous Coding Agents Fail Without Prior Specification:
1. **Unstated Architectural Assumptions**: Agents invent their own database schemas and authentication strategies on the fly, leading to conflicting patterns and security vulnerabilities.
2. **Infinite Debugging Loops**: Without formal acceptance criteria and test cases, coding agents wander aimlessly through codebases, burning thousands of tokens trying to interpret intent.
3. **Implicit Dependencies & Blockers**: Coding agents attempt to build integrations (Stripe, Twilio, OAuth) before the founder has created accounts or provided necessary credentials.
4. **Context Window Exhaustion**: Raw conversational chats quickly overwhelm LLM context windows, resulting in forgotten requirements and regressions.

### The Solution: SpecForge AI
**SpecForge AI** bridges the chasm between human intuition and machine implementation. Acting as a Principal Software Delivery Director and Staff Solutions Architect, it guides founders through a structured 7-stage discovery interview, autonomously parses IEEE 830-compliant requirements, audits contradictions, designs the technical architecture, and compiles an immutable, machine-readable specification contract (`project-spec.json`) along with a topological task execution queue for coding agents.

```
       Human Idea ("Build an app for X")
                      │
                      ▼
   ┌─────────────────────────────────────┐
   │         SpecForge AI Planner        │
   │   • Phased Discovery Interview      │
   │   • IEEE 830 Requirements Engine    │
   │   • Real-Time Contradiction Audit   │
   │   • Database & REST API Architecture│
   │   • Multi-Factor Tech Evaluation    │
   │   • 11-Dimension Readiness Gate     │
   └─────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
 ┌───────────────┐           ┌──────────────┐
 │project-spec   │           │Professional  │
 │.json (Sec. 27)│           │12-Chapter PDF│
 └───────────────┘           └──────────────┘
        │
        ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Autonomous Coding Agents (Claude Code, Aider, OpenHands)│
 │ Topological Task Execution Queue (TASK-001 -> TASK-050) │
 └─────────────────────────────────────────────────────────┘
        │
        ▼
   Working Production Software
```

---

## ⚡ Key Features & Capabilities

### 1. Dual-Engine Hybrid AI Architecture (Groq LPU + Google Gemini)
- **Sub-Second Discovery Chat**: Powered by **Groq** (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) running on custom LPU hardware for near-instant (<500ms) conversation and real-time extraction.
- **Deep Architectural Reasoning**: Powered by **Google Gemini** (`gemini-2.5-flash` / `gemini-2.5-pro`) leveraging deep reasoning and massive 1,000,000 token context windows for C4 diagrams, complex schema modeling, and WBS planning.
- **Transparent Dual-Engine Fallback**: If either provider encounters rate limits (429 Resource Exhausted) or network downtime, the system automatically and silently rescues the generation with the alternate engine.

### 2. Phased Discovery State Machine
A 7-stage guided interview protocol ensuring every dimension of the product is thoroughly captured:
- `GOALS`: Project vision, success metrics, business model, and core value proposition.
- `USERS`: Target user personas, permissions, roles, technical proficiencies, and pain points.
- `FEATURES`: Core workflows, user stories, must-haves vs nice-to-haves.
- `CONSTRAINTS`: Budget boundaries, deadlines, compliance requirements (HIPAA, GDPR), team constraints.
- `INTEGRATIONS`: Third-party services, APIs, webhooks, payment gateways, and authentication providers.
- `UX`: Design style archetypes, dark/light themes, color palettes, component density, and reference designs.
- `COMPLETE`: Formal synthesis and transition to specification locking.

### 3. IEEE 830 Requirements Engineering Engine
- Automated real-time extraction of formal requirements from conversation transcripts.
- Strict categorization: `FUNCTIONAL`, `NON_FUNCTIONAL`, `BUSINESS_RULE`, `SECURITY`, `PERFORMANCE`, `ACCESSIBILITY`, `UX`, `TECHNICAL`, `DEPLOYMENT`, `INTEGRATION`, and `CONSTRAINT`.
- Sequential IEEE numbering (`FR-001`, `NFR-001`, `SEC-001`) with confidence scoring and source tracing.
- 1-click human founder confirmation, approval, and custom editing.

### 4. Real-Time Quality, Ambiguity & Contradiction Audit
- Automatically inspects requirements to detect:
  - **Ambiguities**: Flags unmeasurable terms (e.g. "must be fast", "scale easily") and provides measurable standards.
  - **Contradictions**: Identifies conflicting requirements (e.g. "Admins only" vs "Public posting") with explicit affected requirement IDs.
  - **Missing Architectural Decisions**: Flags missing authentication policies, rate limits, or error fallback flows.
  - **Critical Assumptions**: Surfaces unvalidated assumptions requiring human sign-off.
- 1-click **Apply Resolution** automatically updates requirements and resolves conflicts.

### 5. Multi-Factor Technology Stack Evaluation
- Evaluates candidates across 12 tech categories: Frontend, Backend, Database, Styling, Components, State, Data Fetching, Forms, Auth, Charts, Deployment, and Mobile.
- Weighted scoring (1–10) across Maturity, Community Adoption, Documentation Quality, TypeScript Support, and Performance.
- **Dual-Perspective Output**: Plain-language founder explanations ("Why this fits your business") paired with senior engineering technical rationales and alternatives trade-off matrices.
- Automated Stack Compatibility Audit verifying inter-library compatibility.

### 6. Implementation-Ready Technical Architecture
- **Database Modeler**: Complete database schema definitions (collections/tables, data types, nullability, defaults, 1:1, 1:N, N:M relationships, compound indexes, and seed requirements).
- **REST API Designer**: Strict HTTP contracts (routes, methods, role permissions, request body JSON schemas, response status codes, and rate limits).
- **Security Architecture**: Session rules, password policies, RBAC permission matrices, TLS/encryption rules, and security headers.
- **Deployment Topology**: Multi-stage Docker containerization, CI/CD pipeline steps, Redis caching, and environment variable classification (`PUBLIC`, `SENSITIVE`, `SECRET`).

### 7. Integrations & Actionable Human Setup Guides
- Catalogs external dependencies (Stripe, Supabase, SendGrid, GitHub, AWS).
- **AI vs. Human Responsibility Split**: Clearly documents what the coding agent implements vs. what the human founder must fulfill.
- **Human Action Checklist**: Step-by-step guides for founders with click-by-click instructions, where to obtain API keys, secret handling warnings, and blocking status.

### 8. Autonomous Engineering Agent Handoff Protocol
- Generates Section 26 & 27 compliant `project-spec.json`.
- **Cryptographic Verification**: Computes SHA-256 integrity checksums (`specChecksum`) to detect spec drift between planner and coding agents.
- **Topological Task Queue**: Decomposes the plan into granular coding tasks (`TASK-001` through `TASK-050`) with affected file paths, subtasks, acceptance criteria, and scenario test cases.
- Computes dependency graphs with `READY_TO_RUN`, `BLOCKED`, and `COMPLETED` execution states.
- Terminal execution snippets and system prompt instructions for autonomous agent loops.

### 9. 11-Dimension Production Readiness Gate
- Automated audit across all 11 planning dimensions with weighted 0–100 scorecards.
- Hard blocking enforcement: blocks implementation handoff if critical ambiguities or setup prerequisites remain open.
- Formal founder verification gate with sign-off signature, timestamp, and immutable snapshot locking (`FINALIZED`).

### 10. Multi-Format Publication Exports
- **`project-spec.json`**: Runtime Zod-validated machine-readable specification contract.
- **Modular Documentation Bundle**: Clean GitHub-flavored Markdown files (`SPECIFICATION.md`, `ARCHITECTURE.md`, `TASKS.md`, `HUMAN_ACTIONS.md`).
- **12-Chapter Professional PDF**: Built with PDFKit for publication-ready client and stakeholder deliverables with cover pages, badges, and headers/footers.

### 11. Security & Cookie Session Authentication
- Secure HTTP-only cookie sessions (`token`) with 7-day TTL, `sameSite: 'lax'`, and production `secure` flags.
- Complete password encryption via `bcryptjs` (salt rounds: 12).
- Zero client-side token exposure: auth tokens are never stored in `localStorage` or returned in JSON bodies.
- Mandatory `requireAuth` protection on all project endpoints with user ownership isolation.

---

## 🏗️ Architecture & System Design

```
projectplanning/
├── apps/
│   ├── api/                   # Express.js REST API & AI Orchestration Layer
│   │   ├── src/
│   │   │   ├── config/        # Environment, database, logger (Pino)
│   │   │   ├── controllers/   # Project, Auth, Message, Export, Agent controllers
│   │   │   ├── middleware/    # Auth (cookie/bearer), Error handling, Logging
│   │   │   ├── models/        # Mongoose schemas (Project, Requirement, Task, etc.)
│   │   │   ├── services/      # AiProvider (Groq/Gemini), Architecture, Plan, PDF
│   │   │   └── routes/        # Express REST endpoints
│   │   └── package.json
│   │
│   └── web/                   # React 18 + Vite Frontend Application
│       ├── src/
│       │   ├── components/    # Inspector panels (Arch, Tech, UX, Plan, Agent, Export)
│       │   ├── context/       # AuthContext (HTTP-only cookie session management)
│       │   ├── pages/         # ProjectChatPage, ProjectListPage, Login, Signup
│       │   └── services/      # Typed API client with credentials: 'include'
│       └── package.json
│
├── packages/
│   ├── types/                 # Shared TypeScript interfaces, types, and enums
│   │   └── src/index.ts
│   └── schemas/               # Shared Zod validation schemas (Section 27 spec)
│       └── src/index.ts
│
├── .env.example               # Template environment configuration
├── tsconfig.base.json         # Base TypeScript compiler options
└── package.json               # Monorepo workspace orchestration
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Monorepo** | npm Workspaces, TypeScript 5.7+ |
| **Backend API** | Node.js 20+, Express.js 4.21, Mongoose 8.9, Pino HTTP Logger, Zod 3.24 |
| **Frontend UI** | React 18, Vite 6.4, Tailwind CSS 3.4, Lucide React (Linear / Supabase developer aesthetic) |
| **AI Inference** | Google Generative AI (`gemini-2.5-flash`), Groq SDK (`llama-3.3-70b-versatile`) |
| **Document Generation** | PDFKit 0.20+ (vector PDF rendering), Markdown / Mermaid |
| **Security & Auth** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser` (HTTP-only cookies) |
| **Database** | MongoDB 6+ / MongoDB Atlas |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **MongoDB** running locally (`mongodb://localhost:27017/project-planner`) or MongoDB Atlas
- **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/))
- *(Recommended)* **Groq API Key** for zero-latency discovery chat ([Groq Console](https://console.groq.com/))

---

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/aliffiazmuhammed/projectplanning.git
   cd projectplanning
   ```

2. **Install monorepo dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/project-planner
   
   # Google Gemini API Key (Required for heavy architecture & spec generation)
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash

   # Groq API Key (Recommended for sub-second discovery chat)
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile

   # Dual Engine Routing
   AI_CHAT_PROVIDER=groq
   AI_IMPORTANT_PROVIDER=gemini

   # Session Security
   JWT_SECRET=your-secure-random-jwt-secret-string
   LOG_LEVEL=info
   NODE_ENV=development
   ```

4. **Build the packages and apps**:
   ```bash
   npm run build
   ```

5. **Start the development servers**:
   ```bash
   npm run dev
   ```
   - **Frontend Application**: `http://localhost:5173`
   - **Backend API Server**: `http://localhost:3001`

---

## 📡 Core API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register new user account & set secure session cookie |
| `POST` | `/api/auth/signin` | Sign in existing user & set secure session cookie |
| `POST` | `/api/auth/logout` | Invalidate session & clear HTTP-only cookies |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile |
| `GET` | `/api/projects` | List all projects owned by the authenticated user |
| `POST` | `/api/projects` | Create a new project discovery workspace |
| `POST` | `/api/projects/:id/messages` | Send message in discovery chat (Groq / Gemini) |
| `GET` | `/api/projects/:id/requirements` | Retrieve IEEE 830 structured requirements |
| `POST` | `/api/projects/:id/requirements/extract` | On-demand structured requirement extraction |
| `GET` | `/api/projects/:id/validation` | Inspect open ambiguities and contradictions |
| `POST` | `/api/projects/:id/validation/run` | Run autonomous validation quality audit |
| `POST` | `/api/projects/:id/tech-stack/generate` | Generate multi-factor technical stack evaluation |
| `POST` | `/api/projects/:id/architecture/generate` | Generate database entities, API specs & C4 diagrams |
| `POST` | `/api/projects/:id/integrations/discover` | Discover third-party dependencies & human actions |
| `POST` | `/api/projects/:id/plan/generate` | Decompose into WBS roadmap, milestones & task graph |
| `POST` | `/api/projects/:id/readiness/audit` | Execute 11-dimension production readiness audit |
| `POST` | `/api/projects/:id/readiness/finalize` | Lock specification for autonomous agent execution |
| `GET` | `/api/projects/:id/export/json` | Download Section 27 `project-spec.json` contract |
| `GET` | `/api/projects/:id/export/markdown` | Download complete Markdown specification report |
| `GET` | `/api/projects/:id/export/pdf` | Download publication-ready 12-chapter PDF report |
| `GET` | `/api/projects/:id/agent/handoff` | Autonomous agent handoff package with checksum |
| `GET` | `/api/projects/:id/agent/queue` | Topological task execution queue for coding agents |
| `POST` | `/api/projects/:id/agent/tasks/:taskId/claim` | Coding agent claims task and begins implementation |
| `POST` | `/api/projects/:id/agent/tasks/:taskId/complete` | Coding agent reports completed task with modified files |

---

## 🔒 Security & Privacy Guarantees

- **Zero-Leak Secret Policy**: Sensitive API keys and credentials are never stored in plain text, never embedded in PDF exports, and never passed into public client states.
- **HTTP-Only Cookies**: Authentication tokens are transmitted strictly via encrypted `httpOnly`, `sameSite: 'lax'` cookies, preventing XSS-based token theft.
- **Granular Ownership Isolation**: All projects and specifications are isolated to their owner's UUID with database-level query filtering.

---

## 🤝 Contributing

Contributions, feedback, and suggestions are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

Made with ❤️ for founders and autonomous engineering agents worldwide.
