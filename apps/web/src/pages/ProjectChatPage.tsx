import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { IProject, IMessage } from '@project-planner/types';
import { DiscoveryPhase } from '@project-planner/types';
import { api } from '../api/client.js';
import MessageBubble from '../components/MessageBubble.js';
import DiscoveryPhaseBar from '../components/DiscoveryPhaseBar.js';
import RequirementsPanel from '../components/RequirementsPanel.js';
import ValidationPanel from '../components/ValidationPanel.js';
import UXPanel from '../components/UXPanel.js';
import TechStackPanel from '../components/TechStackPanel.js';
import ArchitecturePanel from '../components/ArchitecturePanel.js';
import { IntegrationsPanel } from '../components/IntegrationsPanel.js';
import { PlanPanel } from '../components/PlanPanel.js';
import ReadinessPanel from '../components/ReadinessPanel.js';
import ExportPanel from '../components/ExportPanel.js';
import AgentIntegrationPanel from '../components/AgentIntegrationPanel.js';
import { 
  ArrowLeft, 
  Send, 
  Sparkles, 
  PanelRightClose, 
  PanelRightOpen, 
  Info, 
  Lightbulb, 
  Layers, 
  Clock, 
  Compass, 
  Bot, 
  CheckCircle2,
  CornerDownLeft,
  Loader2,
  FileCode2,
  ShieldCheck,
  ShieldAlert,
  Palette,
  Cpu,
  Boxes,
  CheckSquare,
  ListTodo,
  Download
} from 'lucide-react';

export default function ProjectChatPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<IProject | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phaseToast, setPhaseToast] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'requirements' | 'validation' | 'ux' | 'tech' | 'architecture' | 'actions' | 'plan' | 'readiness' | 'export' | 'agent' | 'overview'>('requirements');


  const [reqsTrigger, setReqsTrigger] = useState(0);
  const [validationTrigger, setValidationTrigger] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const PHASE_TITLES: Record<DiscoveryPhase, string> = {
    [DiscoveryPhase.GOALS]: 'Phase 1: Goals & Vision',
    [DiscoveryPhase.USERS]: 'Phase 2: Target Users & Personas',
    [DiscoveryPhase.FEATURES]: 'Phase 3: Core Features & Workflows',
    [DiscoveryPhase.CONSTRAINTS]: 'Phase 4: Constraints & Limitations',
    [DiscoveryPhase.INTEGRATIONS]: 'Phase 5: Integrations & External Services',
    [DiscoveryPhase.UX]: 'Phase 6: UX & Design Preferences',
    [DiscoveryPhase.COMPLETE]: 'Phase 7: Specification Ready',
  };

  const SUGGESTED_REPLIES: Record<DiscoveryPhase, string[]> = {
    [DiscoveryPhase.GOALS]: [
      'The primary goal is to help non-technical founders plan products without coding knowledge.',
      'We want to validate our product hypothesis within 3 weeks of launch.',
      'Success means users can export a ready-to-code architecture specification.',
    ],
    [DiscoveryPhase.USERS]: [
      'Target users are early-stage startup founders and solo developers.',
      'Most users have zero coding background; simplicity is paramount.',
      'We also have technical leads who review generated specs.',
    ],
    [DiscoveryPhase.FEATURES]: [
      'Core feature: interactive AI discovery chat that updates state in real-time.',
      'Must-have: export to JSON, Markdown, and PDF architecture summaries.',
      'Nice-to-have: direct GitHub task creation or coding agent handoff.',
    ],
    [DiscoveryPhase.CONSTRAINTS]: [
      'We must run on free/open-source tiers initially (MongoDB, Node.js, React).',
      'Delivery timeline is 4 weeks for the full MVP.',
      'Must strictly preserve API key privacy with zero leaks in exports.',
    ],
    [DiscoveryPhase.INTEGRATIONS]: [
      'Google Gemini API for intelligence and reasoning.',
      'MongoDB Atlas for persistence.',
      'Optional GitHub API for repo sync in future milestones.',
    ],
    [DiscoveryPhase.UX]: [
      'Clean, dark-mode technical aesthetic inspired by Linear and Supabase.',
      'Desktop-first experience with responsive mobile viewing.',
      'Fast keyboard shortcuts throughout.',
    ],
    [DiscoveryPhase.COMPLETE]: [
      'Everything looks comprehensive! Let’s proceed to requirements generation.',
      'Can we review any ambiguous points before locking the specification?',
    ],
  };

  const loadProject = useCallback(async () => {
    if (!id || id === 'undefined') return;
    try {
      const data = await api.projects.get(id);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    }
  }, [id]);

  const loadMessages = useCallback(async () => {
    if (!id || id === 'undefined') return;
    try {
      const data = await api.messages.list(id);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  }, [id]);

  useEffect(() => {
    if (id && id !== 'undefined') {
      loadProject();
      loadMessages();
    }
  }, [id, loadProject, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSend(e?: React.FormEvent, customContent?: string) {
    if (e) e.preventDefault();
    const content = (customContent || input).trim();
    if (!content || sending) return;

    setInput('');
    setSending(true);
    setError(null);

    // Optimistic user message
    const tempUserMsg: IMessage = {
      id: `temp-${Date.now()}`,
      projectId: id!,
      role: 'user',
      content,
      phase: project?.discoveryPhase ?? DiscoveryPhase.GOALS,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const { userMessage, assistantMessage, meta } = await api.messages.send(id!, { content });

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        userMessage,
        assistantMessage,
      ]);

      // If new requirements were extracted in this turn, refresh the panel
      if (meta.extractedCount && meta.extractedCount > 0) {
        setReqsTrigger((k) => k + 1);
      }

      // If validation audit ran in this turn, refresh validation panel
      if (meta.validationIssuesCount !== undefined) {
        setValidationTrigger((k) => k + 1);
      }

      if (meta.phaseAdvanced) {
        await loadProject();
        const newTitle = PHASE_TITLES[meta.phase] || meta.phase;
        setPhaseToast(`🎉 Advanced to: ${newTitle}`);
        setTimeout(() => setPhaseToast(null), 5000);
      } else {
        setProject((prev) =>
          prev ? { ...prev, messageCount: meta.messageCount } : prev,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      if (!customContent) setInput(content);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const currentPhaseSuggestions = project ? SUGGESTED_REPLIES[project.discoveryPhase] || [] : [];

  if (error && !project) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="text-red-400 font-semibold mb-2">Error Loading Project Workspace</div>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <Link to="/" className="text-xs text-brand-400 hover:underline">
          ← Return to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
      {/* Workspace Subheader */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to="/"
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Back to projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white truncate">
                {project?.name || 'Loading project...'}
              </h2>
              <span className="hidden sm:inline-flex text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                {project?.version || 'v0.1'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-md hidden sm:block">
              {project?.initialIdea}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {project && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
              {project.status}
            </span>
          )}

          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`p-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
              showInspector
                ? 'bg-slate-800 text-brand-300 border-slate-700'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Toggle Requirements & Inspector"
          >
            {showInspector ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
            <span className="hidden md:inline">Requirements Engine</span>
          </button>
        </div>
      </div>

      {/* Discovery Phase Progress Bar */}
      {project && <DiscoveryPhaseBar currentPhase={project.discoveryPhase} />}

      {/* Phase Advance Notification Banner */}
      {phaseToast && (
        <div className="bg-gradient-to-r from-brand-600/20 via-emerald-500/20 to-brand-600/20 border-b border-brand-500/30 px-6 py-2.5 text-center animate-slide-up flex-shrink-0">
          <span className="text-xs font-bold text-brand-300 tracking-wide">{phaseToast}</span>
        </div>
      )}

      {/* Split Workspace View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Flow */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative">
          {/* Scrollable Conversation Stream */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-3xl mx-auto">
              {/* Empty state / Welcome card */}
              {messages.length === 0 && !sending && (
                <div className="my-8 p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-card text-center animate-fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto mb-4 shadow-glow">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Let's architect {project?.name}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
                    I am your AI Project Discovery Agent. I will guide you phase-by-phase through clarifying your goals, user roles, feature scopes, and technical constraints, automatically extracting structured IEEE requirements into the engine.
                  </p>

                  <div className="text-left bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 mb-6">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>Initial Idea Registered:</span>
                    </div>
                    <p className="text-xs text-slate-400 italic">
                      "{project?.initialIdea}"
                    </p>
                  </div>

                  <div className="text-xs text-slate-400 font-semibold mb-3">
                    Click a kickoff prompt or type below to begin:
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-center flex-wrap">
                    {currentPhaseSuggestions.slice(0, 2).map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(undefined, suggestion)}
                        className="text-left text-xs px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-brand-500/40 transition-all flex items-center justify-between gap-3 group"
                      >
                        <span className="truncate max-w-xs">{suggestion}</span>
                        <CornerDownLeft className="w-3 h-3 text-slate-500 group-hover:text-brand-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.createdAt}
                  phase={msg.phase}
                />
              ))}

              {/* Sending / Thinking Animation */}
              {sending && (
                <div className="flex items-start gap-3 mb-6 animate-fade-in">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-400 shadow-glow">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-card">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                      <span>Agent is synthesizing response & extracting requirements...</span>
                    </div>
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Suggestions Strip (above input) */}
          {messages.length > 0 && currentPhaseSuggestions.length > 0 && !sending && (
            <div className="px-4 sm:px-6 py-2 bg-slate-950/90 border-t border-slate-800/60 overflow-x-auto scrollbar-none flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                Suggestions:
              </span>
              {currentPhaseSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(s)}
                  className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all whitespace-nowrap flex-shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="bg-slate-900/90 border-t border-slate-800/90 px-4 sm:px-6 py-4 flex-shrink-0">
            <form onSubmit={handleSend} className="max-w-3xl mx-auto">
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-brand-500/80 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all shadow-card flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Answer the agent's questions or explore ${project?.discoveryPhase || 'goals'}... (Enter to send, Shift+Enter for newline)`}
                  rows={2}
                  disabled={sending}
                  className="w-full px-4 pt-3 pb-2 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
                />

                <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-slate-900">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="hidden sm:inline">Press</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
                      Enter ↵
                    </kbd>
                    <span className="hidden sm:inline">to submit</span>
                  </div>

                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {sending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Send</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Project Inspector & Requirements Engine Sidebar */}
        {showInspector && project && (
          <aside className="w-80 lg:w-[440px] border-l border-slate-800/80 bg-slate-900/80 backdrop-blur-md flex flex-col h-full overflow-hidden p-4 animate-fade-in flex-shrink-0">
            {/* Tab Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl mb-3 flex-shrink-0 overflow-x-auto">
              <button
                onClick={() => setSidebarTab('requirements')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  sidebarTab === 'requirements'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Requirements</span>
                <span className="sm:hidden">Reqs</span>
              </button>
              <button
                onClick={() => setSidebarTab('validation')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  sidebarTab === 'validation'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Validation</span>
                <span className="sm:hidden">Audit</span>
              </button>
              <button
                onClick={() => setSidebarTab('ux')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  sidebarTab === 'ux'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-pink-400" />
                <span className="hidden sm:inline">UX/UI</span>
                <span className="sm:hidden">UX</span>
              </button>
              <button
                onClick={() => setSidebarTab('tech')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  sidebarTab === 'tech'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Stack</span>
                <span className="sm:hidden">Tech</span>
              </button>
              <button
                onClick={() => setSidebarTab('architecture')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  sidebarTab === 'architecture'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Arch</span>
                <span className="sm:hidden">Arch</span>
              </button>
              <button
                onClick={() => setSidebarTab('actions')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  sidebarTab === 'actions'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Actions</span>
                <span className="sm:hidden">Acts</span>
              </button>
              <button
                onClick={() => setSidebarTab('plan')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  sidebarTab === 'plan'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Plan</span>
                <span className="sm:hidden">Plan</span>
              </button>
              <button
                onClick={() => setSidebarTab('readiness')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  sidebarTab === 'readiness'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Readiness</span>
                <span className="sm:hidden">Gate</span>
              </button>
              <button
                onClick={() => setSidebarTab('export')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  sidebarTab === 'export'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Spec</span>
              </button>
              <button
                onClick={() => setSidebarTab('agent')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  sidebarTab === 'agent'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Agent</span>
                <span className="sm:hidden">Bot</span>
              </button>
              <button
                onClick={() => setSidebarTab('overview')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                  sidebarTab === 'overview'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>
            </div>

            {/* Tab 1: Requirements Panel */}
            {sidebarTab === 'requirements' ? (
              <div className="flex-1 overflow-hidden">
                <RequirementsPanel 
                  projectId={project.id} 
                  key={reqsTrigger} 
                  onRequirementChange={loadProject} 
                />
              </div>
            ) : sidebarTab === 'validation' ? (
              /* Tab 2: Validation Panel */
              <div className="flex-1 overflow-hidden">
                <ValidationPanel 
                  projectId={project.id} 
                  key={validationTrigger} 
                  onIssuesChange={loadProject} 
                />
              </div>
            ) : sidebarTab === 'ux' ? (
              /* Tab 3: UX/UI Discovery Panel */
              <div className="flex-1 overflow-hidden">
                <UXPanel 
                  projectId={project.id} 
                  onDesignChange={loadProject} 
                />
              </div>
            ) : sidebarTab === 'tech' ? (
              /* Tab 4: Technology Selection Panel */
              <div className="flex-1 overflow-hidden">
                <TechStackPanel 
                  projectId={project.id} 
                  onStackChange={loadProject} 
                />
              </div>
            ) : sidebarTab === 'architecture' ? (
              /* Tab 5: System Architecture Panel */
              <div className="flex-1 overflow-hidden">
                <ArchitecturePanel 
                  projectId={project.id} 
                  onArchitectureChange={loadProject} 
                />
              </div>
            ) : sidebarTab === 'actions' ? (
              /* Tab 6: Third-Party Integrations & Human Actions Panel */
              <div className="flex-1 overflow-hidden">
                <IntegrationsPanel 
                  projectId={project.id} 
                />
              </div>
            ) : sidebarTab === 'plan' ? (
              /* Tab 7: Implementation Planning Panel */
              <div className="flex-1 overflow-hidden">
                <PlanPanel 
                  projectId={project.id} 
                />
              </div>
            ) : sidebarTab === 'readiness' ? (
              /* Tab 8: Readiness & Approval Gate Panel */
              <div className="flex-1 overflow-hidden">
                <ReadinessPanel 
                  projectId={project.id} 
                  onStatusChange={loadProject} 
                />
              </div>
            ) : sidebarTab === 'export' ? (
              /* Tab 9: Specification Export & Versioning Panel */
              <div className="flex-1 overflow-hidden">
                <ExportPanel 
                  projectId={project.id} 
                  onVersionChange={loadProject} 
                />
              </div>
            ) : sidebarTab === 'agent' ? (
              /* Tab 10: Autonomous Coding Agent Integration Panel */
              <div className="flex-1 overflow-hidden">
                <AgentIntegrationPanel 
                  projectId={project.id} 
                />
              </div>
            ) : (
              /* Tab 11: Overview / Specs Inspector */


              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {/* Active Discovery Phase */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                    Current Discovery Phase
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    {PHASE_TITLES[project.discoveryPhase]}
                  </div>
                  <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          ((Object.values(DiscoveryPhase).indexOf(project.discoveryPhase) + 1) /
                            Object.values(DiscoveryPhase).length) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Discovery Summary */}
                {project.conversationSummary ? (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-emerald-400 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Agent's Running Summary</span>
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {project.conversationSummary}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-center">
                    <Compass className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                    <div className="text-xs text-slate-400 font-medium">Summary in progress</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      As you chat, the agent periodically summarizes verified requirements here.
                    </div>
                  </div>
                )}

                {/* Specs & Metadata */}
                <div className="space-y-3">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 px-1">
                    Specifications
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      Target Platform
                    </span>
                    <span className="font-semibold text-slate-200">
                      {project.targetPlatform || 'Not specified'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-slate-500" />
                      Visual Theme
                    </span>
                    <span className="font-semibold text-slate-200">
                      {project.designSpec?.visualCategory?.replace(/_/g, ' ') || 'Agent Decide'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Message Exchanges
                    </span>
                    <span className="font-semibold text-slate-200">
                      {project.messageCount || messages.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
