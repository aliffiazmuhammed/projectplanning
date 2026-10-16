import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Terminal, 
  Layers, 
  Palette, 
  FileText, 
  Bot, 
  Zap, 
  CheckCircle2, 
  Boxes, 
  Workflow, 
  Code2, 
  ChevronRight,
  GitBranch,
  Shield,
  Activity,
  Download,
  Copy,
  Check,
  Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface DemoPreset {
  id: string;
  title: string;
  tagline: string;
  idea: string;
  questions: string[];
  entities: { name: string; fields: string[] }[];
  endpoints: { method: string; path: string; desc: string }[];
  techStack: { name: string; category: string; badge: string }[];
  agentTask: { title: string; files: string[]; promptSnippet: string };
}

const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'fintech',
    title: 'Fintech Neo-Bank & Fraud Guard',
    tagline: 'High-throughput ledger with real-time risk scoring',
    idea: 'A multi-currency digital wallet with instant peer-to-peer transfers, virtual debit cards, and real-time algorithmic fraud detection under 50ms latency.',
    questions: [
      'What regulatory jurisdiction and compliance requirements (e.g. PCI-DSS, KYC/AML) must be enforced on user onboarding?',
      'How should currency conversions handle slippage and idempotency during network partitions?',
      'What peak transactions-per-second (TPS) and latency percentiles (p99 < 50ms) are required for ledger reconciliation?'
    ],
    entities: [
      { name: 'UserAccount', fields: ['id: UUID', 'kycStatus: Enum', 'baseCurrency: ISO4217', 'createdAt: Timestamp'] },
      { name: 'WalletLedger', fields: ['id: UUID', 'accountId: Ref<UserAccount>', 'balanceCents: BigInt', 'currency: String'] },
      { name: 'TransactionEvent', fields: ['id: UUID', 'idempotencyKey: Hash', 'riskScore: Float', 'state: Enum'] }
    ],
    endpoints: [
      { method: 'POST', path: '/api/v1/transfers', desc: 'Execute idempotent double-entry ledger transfer' },
      { method: 'GET', path: '/api/v1/cards/virtual', desc: 'List active tokenized virtual cards with spend limits' },
      { method: 'POST', path: '/api/v1/fraud/audit', desc: 'Stream real-time heuristic transaction risk payload' }
    ],
    techStack: [
      { name: 'Fastify + TypeScript', category: 'Backend Framework', badge: 'Ultra-low overhead' },
      { name: 'PostgreSQL + Timescale', category: 'Primary Ledger DB', badge: 'ACID & Timeseries' },
      { name: 'Redis Streams', category: 'Event Ingestion', badge: '< 5ms latency' },
      { name: 'Tailwind + React 19', category: 'Admin Dashboard', badge: 'Sleek UI' }
    ],
    agentTask: {
      title: 'Implement Double-Entry Transfer Ledger with Idempotency Locks',
      files: ['src/services/ledger.service.ts', 'src/models/Transaction.ts', 'src/middleware/idempotency.ts'],
      promptSnippet: 'CRITICAL: Wrap debit and credit operations in an ACID serializable transaction. Ensure Redis SETNX idempotency lock with a 60s TTL before mutating account balances.'
    }
  },
  {
    id: 'canvas',
    title: 'Collaborative Real-time Canvas',
    tagline: 'Figma-style vector graphics engine with multiplayer sync',
    idea: 'A web-first collaborative whiteboard and vector canvas featuring WebSockets CRDT state synchronization, infinite zoom, and smart auto-layout.',
    questions: [
      'Are you using CRDTs (like Yjs or Automerge) or Operational Transformation (OT) for conflict-free concurrent editing?',
      'Will rendering utilize HTML5 Canvas, SVG, or WebGL / WebGPU for handling 10,000+ simultaneous vector nodes?',
      'Do you need granular workspace roles (Viewer, Editor, Admin) and real-time presence cursor broadcast?'
    ],
    entities: [
      { name: 'DocumentRoom', fields: ['id: UUID', 'ownerId: Ref<User>', 'crdtStateVector: Binary', 'version: Int'] },
      { name: 'CanvasNode', fields: ['id: UUID', 'type: Enum', 'transformMatrix: Float32Array', 'styleProps: JSON'] },
      { name: 'UserPresence', fields: ['userId: UUID', 'cursorX: Float', 'cursorY: Float', 'activeSelection: Array'] }
    ],
    endpoints: [
      { method: 'WS', path: '/ws/canvas/:roomId', desc: 'Bidirectional binary Yjs state updates & cursor presence' },
      { method: 'POST', path: '/api/rooms/:id/snapshots', desc: 'Persist vector canvas checkpoint for history scrub' },
      { method: 'GET', path: '/api/rooms/:id/export/svg', desc: 'Server-side headless vector export engine' }
    ],
    techStack: [
      { name: 'Yjs + PartyKit', category: 'State Synchronization', badge: 'Conflict-Free Replicated Data' },
      { name: 'PixiJS / WebGL', category: 'Rendering Engine', badge: '60 FPS 10k nodes' },
      { name: 'Node.js + WebSockets', category: 'Edge Relay Server', badge: 'Global low latency' },
      { name: 'Zod + TypeScript', category: 'Data Validation', badge: 'Zero runtime errors' }
    ],
    agentTask: {
      title: 'Setup WebSockets Binary CRDT Sync Pipeline with Cursor Broadcast',
      files: ['src/engine/crdt.ts', 'src/components/CanvasRenderer.tsx', 'src/hooks/useMultiplayerPresence.ts'],
      promptSnippet: 'Use Y.Doc binary updates over WebSocket. On user mousemove, throttle cursor presence broadcasts to 30ms to maintain optimal frame budgets.'
    }
  },
  {
    id: 'ai-health',
    title: 'HIPAA Telehealth & AI Triage',
    tagline: 'Secure medical portal with diagnostic assist & HL7 FHIR sync',
    idea: 'A compliant telehealth platform with automated clinical note transcription, symptom triage pipeline, and encrypted doctor-patient video consultations.',
    questions: [
      'What encryption-at-rest and in-transit protocols are mandated for HIPAA and HL7 FHIR data standards?',
      'How should audio transcripts from patient consultations be sanitized before ingestion by the AI diagnostic model?',
      'What fallback workflows exist when the automated triage flags high-acuity red flag symptoms?'
    ],
    entities: [
      { name: 'PatientRecord', fields: ['id: UUID', 'mrnEncrypted: String', 'dobEncrypted: String', 'fhirPayload: JSON'] },
      { name: 'ConsultationSession', fields: ['id: UUID', 'patientId: Ref<Patient>', 'doctorId: Ref<Doctor>', 'status: Enum'] },
      { name: 'ClinicalNote', fields: ['id: UUID', 'soapNotes: JSON', 'aiSummary: String', 'doctorSignedAt: Timestamp'] }
    ],
    endpoints: [
      { method: 'POST', path: '/api/v1/consultations/start', desc: 'Initialize encrypted WebRTC peer connection token' },
      { method: 'POST', path: '/api/v1/triage/evaluate', desc: 'Process symptom checklist against clinical decision trees' },
      { method: 'GET', path: '/api/v1/patients/:id/fhir', desc: 'Export patient records formatted as standard FHIR resources' }
    ],
    techStack: [
      { name: 'NestJS + TypeScript', category: 'Enterprise Backend', badge: 'Modular Architecture' },
      { name: 'PostgreSQL + pgcrypto', category: 'Compliant Database', badge: 'Field-level encryption' },
      { name: 'LiveKit WebRTC', category: 'Audio/Video Engine', badge: 'E2E Encrypted Video' },
      { name: 'Google Gemini 2.0', category: 'Medical Transcription AI', badge: 'Multimodal clinical note parsing' }
    ],
    agentTask: {
      title: 'Generate Encrypted Patient Medical Record Schema with Field-Level AES-GCM',
      files: ['src/entities/PatientRecord.ts', 'src/security/encryption.service.ts', 'src/middleware/hipaaAudit.ts'],
      promptSnippet: 'Ensure patient identifiers (MRN, SSN, DOB) are encrypted using AES-256-GCM before writing to the database. Generate structured audit logs for every read access.'
    }
  }
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [activePreset, setActivePreset] = useState<DemoPreset>(DEMO_PRESETS[0]);
  const [activeTab, setActiveTab] = useState<'questions' | 'entities' | 'endpoints' | 'tech' | 'agent'>('entities');
  const [copiedTask, setCopiedTask] = useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(activePreset.agentTask.promptSnippet);
    setCopiedTask(true);
    setTimeout(() => setCopiedTask(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* =========================================================================
          BACKGROUND AURORA GLOWS (Official Gemini Style)
          ========================================================================= */}
      <div 
        aria-hidden="true" 
        className="aurora-bg-mesh bg-gradient-to-tr from-cyan-500/25 via-indigo-600/30 to-purple-600/20 w-[650px] h-[650px] -top-32 -left-32 animate-aurora"
      />
      <div 
        aria-hidden="true" 
        className="aurora-bg-mesh bg-gradient-to-br from-violet-600/20 via-fuchsia-600/15 to-emerald-500/15 w-[750px] h-[750px] top-[40%] -right-48 animate-aurora [animation-delay:4s]"
      />
      <div 
        aria-hidden="true" 
        className="aurora-bg-mesh bg-gradient-to-t from-blue-600/15 via-indigo-500/20 to-teal-500/10 w-[550px] h-[550px] bottom-10 left-1/4 animate-aurora [animation-delay:8s]"
      />

      {/* Subtle background tech grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-25 pointer-events-none" />

      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Gemini pill badge */}
          <div className="gemini-pill-accent mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin [animation-duration:8s]" />
            <span className="font-semibold text-slate-200">PlanCraft 2.0</span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-300">Powered by Gemini & Groq Hybrid Engine</span>
          </div>

          {/* Main Title with Gemini Shimmer */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            From raw product ideas to{' '}
            <span className="gemini-gradient-text-vibrant">
              production software architecture.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300/90 max-w-2xl font-normal leading-relaxed mb-10">
            The autonomous AI specification engineer that interviews your vision, designs database schemas, 
            generates typed OpenAPI contracts, audits readiness, and crafts turnkey implementation roadmaps for 
            autonomous coding agents like <span className="text-indigo-300 font-semibold">Devin</span>,{' '}
            <span className="text-purple-300 font-semibold">Claude Code</span>, and <span className="text-cyan-300 font-semibold">Cursor</span>.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-14">
            <Link
              to={isAuthenticated ? "/projects" : "/signup"}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 shadow-lg shadow-indigo-600/30 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              <span>{isAuthenticated ? 'Open Your Workspaces' : 'Start Architecting Free'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#interactive-demo"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-medium text-sm text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-2 backdrop-blur-md"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
              <span>Explore Interactive Architecture</span>
            </a>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-3xl pt-8 border-t border-slate-800/80 text-left">
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <div className="text-2xl font-bold text-white tracking-tight">10x Faster</div>
              <div className="text-xs text-slate-400 mt-0.5">Idea to complete spec</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <div className="text-2xl font-bold text-cyan-400 tracking-tight">100% Typed</div>
              <div className="text-xs text-slate-400 mt-0.5">Zod & TS interfaces</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <div className="text-2xl font-bold text-indigo-400 tracking-tight">6 Phases</div>
              <div className="text-xs text-slate-400 mt-0.5">Socratic discovery</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60">
              <div className="text-2xl font-bold text-purple-400 tracking-tight">Zero Hallucinations</div>
              <div className="text-xs text-slate-400 mt-0.5">Deterministic contracts</div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FLAGSHIP 3D HERO VISUAL
            ========================================================================= */}
        <div className="mt-14 relative mx-auto max-w-5xl group">
          {/* Surrounding ambient halo glow */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-45 transition duration-1000 -z-10" />

          {/* Main Visual Card */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur-2xl">
            {/* Top Window Bar */}
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">plancraft-agent://autonomous-architecture-synthesis</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px] text-emerald-400">STATUS: ARCHITECTURE SYNTHESIZED</span>
              </div>
            </div>

            {/* Generated Gemini Hero Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
              <img
                src="/gemini-hero.jpg"
                alt="PlanCraft Gemini Architecture Visualization"
                className="w-full h-full object-cover object-center transform group-hover:scale-[1.01] transition-transform duration-700"
                loading="eager"
              />

              {/* Floating holographic badges overlaid on the visual */}
              <div className="absolute bottom-6 left-6 hidden sm:flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 backdrop-blur-md shadow-xl animate-float">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Relational & Document Schemas</div>
                  <div className="text-[11px] text-slate-400">Prisma & Mongoose definitions with indexes</div>
                </div>
              </div>

              <div className="absolute top-6 right-6 hidden sm:flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-700/80 backdrop-blur-md shadow-xl animate-float-delayed">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Engineering Agent Handoff</div>
                  <div className="text-[11px] text-slate-400">Turnkey tasks for Devin & Claude Code</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE ARCHITECTURE PLAYGROUND
          ========================================================================= */}
      <section id="interactive-demo" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 relative">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="gemini-pill mb-4">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Architecture Playground</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            See how PlanCraft turns an idea into a specification.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Select an engineering domain below to inspect the live synthesized discovery questions, normalized entities, 
            API contracts, tech evaluations, and autonomous agent tasks.
          </p>
        </div>

        {/* Preset Selector Chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setActivePreset(preset)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activePreset.id === preset.id
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{preset.title}</span>
            </button>
          ))}
        </div>

        {/* Interactive Workspace Card */}
        <div className="gemini-glow-card rounded-2xl overflow-hidden border border-slate-800">
          {/* Preset Context Banner */}
          <div className="p-5 sm:p-6 bg-slate-900/90 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Raw Idea Input
                </span>
                <span className="text-xs text-slate-400">{activePreset.tagline}</span>
              </div>
              <p className="text-sm font-medium text-slate-200 mt-1 italic">
                "{activePreset.idea}"
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={isAuthenticated ? "/projects" : "/signup"}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-950 hover:bg-slate-200 transition flex items-center gap-1.5 shadow-sm"
              >
                <span>Architect This Project</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Interactive Inspection Tabs */}
          <div className="flex items-center overflow-x-auto border-b border-slate-800/80 bg-slate-950/60 px-4">
            {[
              { id: 'questions', label: '1. Socratic Questions', icon: Sparkles },
              { id: 'entities', label: '2. Database Entities', icon: Database },
              { id: 'endpoints', label: '3. OpenAPI Contracts', icon: Code2 },
              { id: 'tech', label: '4. Tech Decisions', icon: Boxes },
              { id: 'agent', label: '5. Agent Handoff', icon: Bot },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                    isActive
                      ? 'border-cyan-400 text-white bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="p-6 bg-slate-950/80 min-h-[320px]">
            {/* Tab: Socratic Discovery */}
            {activeTab === 'questions' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Socratic Ambiguity Probes (Extracted by AI)
                  </h3>
                  <span className="text-[11px] text-cyan-400 font-mono">Phase: Architecture & Constraints</span>
                </div>
                <div className="grid gap-3">
                  {activePreset.questions.map((q, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {q}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Database Entities */}
            {activeTab === 'entities' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Synthesized Relational Schemas (Normalized 3NF)
                  </h3>
                  <span className="text-[11px] text-indigo-400 font-mono">Mongoose / Prisma / PostgreSQL</span>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {activePreset.entities.map((entity, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                        <Database className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-bold font-mono text-white">{entity.name}</span>
                      </div>
                      <ul className="space-y-1.5 font-mono text-[11px] text-slate-300">
                        {entity.fields.map((field, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/70"></span>
                            <span>{field}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: OpenAPI Endpoints */}
            {activeTab === 'endpoints' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    REST API Contract Specifications
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-mono">OpenAPI 3.0 Compatible</span>
                </div>
                <div className="grid gap-3">
                  {activePreset.endpoints.map((ep, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          ep.method === 'POST' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          ep.method === 'WS' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {ep.method}
                        </span>
                        <span className="text-xs text-white font-semibold">{ep.path}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-sans">{ep.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Tech Decision Matrix */}
            {activeTab === 'tech' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Recommended Technology Stack & Tradeoffs
                  </h3>
                  <span className="text-[11px] text-purple-400 font-mono">Evaluated vs. Alternatives</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {activePreset.techStack.map((tech, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-400">{tech.category}</div>
                        <div className="text-sm font-bold text-white mt-0.5">{tech.name}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {tech.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Agent Handoff */}
            {activeTab === 'agent' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Autonomous Engineering Agent Execution Task
                  </h3>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  >
                    {copiedTask ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTask ? 'Copied Prompt' : 'Copy Prompt'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">{activePreset.agentTask.title}</span>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Target Files:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {activePreset.agentTask.files.map((file, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-950 border border-slate-800 text-cyan-300">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Agent Prompt Directive:</div>
                    <p className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                      {activePreset.agentTask.promptSnippet}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE SHOWCASE (GEMINI BENTO BOX)
          ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="gemini-pill mb-4">
            <Workflow className="w-3.5 h-3.5 text-purple-400" />
            <span>End-to-End Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Engineered for precision software planning.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Every module in PlanCraft is built to eliminate ambiguity and produce unassailable engineering blueprints.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Socratic AI Discovery */}
          <div className="gemini-glow-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Socratic Discovery Engine</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Interviews founders and architects across 6 structured phases. It challenges untested assumptions, clarifies edge cases, and discovers hidden compliance constraints.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-semibold">
              <span>6-Phase Discovery</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Normalized Database Models */}
          <div className="gemini-glow-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Normalized Entity Schemas</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Generates robust entity relationships, foreign keys, compound indexes, and validation rules for Mongoose, PostgreSQL, and Prisma.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold">
              <span>Automatic ER Modeling</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Hybrid AI Engine */}
          <div className="gemini-glow-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Hybrid Gemini + Groq AI</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Groq Llama 3.3 delivers blazing sub-second conversational fluidity, while Google Gemini 2.0 Flash handles deep architectural reasoning, image design review, and code contracts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-purple-400 font-semibold">
              <span>Zero Rate Limit Hiccups</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 4: Design Systems & WCAG */}
          <div className="gemini-glow-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Visual UX & Design Specs</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Architect screen layouts, component hierarchies, responsive breakpoints, and WCAG 2.1-compliant color palettes with live accessibility contrast validation.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400 font-semibold">
              <span>WCAG 2.1 Verified</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 5: Production Readiness Audit */}
          <div className="gemini-glow-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Readiness Score & Audit</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                6-dimension audit covering Security, Architecture, Scalability, Feasibility, UX, and Data integrity. Detects missing rate limits, orphaned tables, and unvalidated endpoints.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-semibold">
              <span>Automated Risk Mitigation</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 6: Turnkey Agent Handoff */}
          <div className="gemini-glow-card p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Turnkey Agent Handoff</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Breaks implementation plans into phased milestones, user stories, and atomic tasks with explicit file touches and prompts tailored for Devin, Claude Code, and Cursor.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-rose-400 font-semibold">
              <span>Agent Protocol Compliant</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE SPECIFICATION TIMELINE (HOW IT WORKS)
          ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="gemini-pill mb-4">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Methodology</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How an idea becomes engineering reality.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            A battle-tested workflow designed to prevent scope creep, architectural rework, and hallucinated AI code.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {[
            {
              step: '01',
              title: 'Socratic Interview',
              desc: 'AI probes your initial idea to unearth user personas, latency constraints, and compliance requirements.',
              icon: Sparkles,
              color: 'text-cyan-400',
              border: 'border-cyan-500/30'
            },
            {
              step: '02',
              title: 'Contract Synthesis',
              desc: 'Generates normalized data models, REST endpoints, security RBAC roles, and tech stack tradeoffs.',
              icon: Database,
              color: 'text-indigo-400',
              border: 'border-indigo-500/30'
            },
            {
              step: '03',
              title: 'Readiness Audit',
              desc: 'Runs automated risk checks across 6 dimensions to ensure the plan is 100% complete and airtight.',
              icon: ShieldCheck,
              color: 'text-purple-400',
              border: 'border-purple-500/30'
            },
            {
              step: '04',
              title: 'Agent Execution',
              desc: 'Exports executive PDFs, Markdown PRDs, and copy-pasteable task directives for autonomous coding agents.',
              icon: Bot,
              color: 'text-emerald-400',
              border: 'border-emerald-500/30'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className={`p-6 rounded-2xl bg-slate-900/60 border ${item.border} relative flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-slate-500 tracking-wider">STEP {item.step}</span>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          PRD VS PLANCRAFT COMPARISON TABLE
          ========================================================================= */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Traditional Planning vs. PlanCraft AI
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Why modern engineering teams replace weeks of alignment meetings with PlanCraft.
          </p>
        </div>

        <div className="gemini-glow-card rounded-2xl overflow-hidden border border-slate-800 text-left">
          <div className="grid grid-cols-3 p-4 bg-slate-950 font-semibold text-xs border-b border-slate-800">
            <div className="text-slate-400">Aspect</div>
            <div className="text-slate-400">Traditional Process</div>
            <div className="text-cyan-400 font-bold">PlanCraft AI Engine</div>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs sm:text-sm">
            {[
              {
                aspect: 'Time to First Architecture',
                old: '2 to 4 weeks of meetings & drafts',
                planCraft: 'Under 5 minutes via Socratic interview'
              },
              {
                aspect: 'Database & Schema Accuracy',
                old: 'Vague bullet points, unnormalized fields',
                planCraft: 'Normalized 3NF schemas with indexes & types'
              },
              {
                aspect: 'API Contract Alignment',
                old: 'Frontend & backend teams argue over payload keys',
                planCraft: 'Deterministic OpenAPI specs generated up front'
              },
              {
                aspect: 'Coding Agent Compatibility',
                old: 'Agents hallucinate folder structures and APIs',
                planCraft: 'Turnkey tasks with exact file touches & instructions'
              },
              {
                aspect: 'Compliance & Security Auditing',
                old: 'Discovered during late staging QA breaches',
                planCraft: 'Automated 6-dimension pre-flight readiness audit'
              }
            ].map((row, idx) => (
              <div key={idx} className="grid grid-cols-3 p-4 hover:bg-slate-900/40 transition">
                <div className="font-semibold text-slate-200">{row.aspect}</div>
                <div className="text-slate-400">{row.old}</div>
                <div className="text-cyan-300 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{row.planCraft}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION
          ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 text-center bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl">
          {/* Ambient light glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="gemini-pill-accent mb-6">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Free to Get Started</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              Architect your next breakthrough in minutes.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-8 leading-relaxed">
              Join engineering founders and autonomous agent developers building robust, production-ready software specifications without guesswork.
            </p>

            <Link
              to={isAuthenticated ? "/projects" : "/signup"}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98]"
            >
              <span>{isAuthenticated ? 'Go to Your Workspaces' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="PlanCraft AI Logo" className="w-7 h-7 rounded-lg shadow-sm" />
            <span className="font-bold text-slate-300 text-sm">
              PlanCraft<span className="text-cyan-400">.ai</span>
            </span>
            <span className="text-slate-600">•</span>
            <span>Autonomous Software Architecture & Discovery</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-300 transition">Sign In</Link>
            <Link to="/signup" className="hover:text-slate-300 transition">Sign Up</Link>
            <a 
              href="https://github.com/aliffiazmuhammed/projectplanning" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-slate-300 transition flex items-center gap-1"
            >
              <span>GitHub</span>
              <ArrowRight className="w-3 h-3 -rotate-45" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-900 text-center text-slate-600">
          © {new Date().getFullYear()} PlanCraft AI. Powered by Google Gemini 2.0 & Groq Llama 3.3. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
