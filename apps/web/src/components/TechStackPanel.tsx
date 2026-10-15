import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ITechRecommendation,
  CreateTechRecommendationRequest,
  TechCompatibilityReport,
} from '@project-planner/types';
import { TechCategory, TechDecisionStatus } from '@project-planner/types';
import { api } from '../api/client.js';
import {
  Cpu,
  Sparkles,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  Database,
  Globe,
  Palette,
  KeyRound,
  BarChart3,
  Cloud,
  FileCode2,
  Edit2,
  X,
  ThumbsUp,
  RotateCcw,
} from 'lucide-react';

interface TechStackPanelProps {
  projectId: string;
  onStackChange?: () => void;
}

const CATEGORY_LABELS: Record<TechCategory, { label: string; icon: any }> = {
  [TechCategory.FRONTEND_FRAMEWORK]: { label: 'Frontend Framework', icon: Globe },
  [TechCategory.BACKEND_FRAMEWORK]: { label: 'Backend Framework', icon: Cpu },
  [TechCategory.DATABASE]: { label: 'Database & Storage', icon: Database },
  [TechCategory.STYLING]: { label: 'Styling & Design System', icon: Palette },
  [TechCategory.COMPONENT_LIBRARY]: { label: 'Component Library', icon: Layers },
  [TechCategory.ICONS]: { label: 'Icon System', icon: Layers },
  [TechCategory.STATE_MANAGEMENT]: { label: 'State Management', icon: FileCode2 },
  [TechCategory.DATA_FETCHING]: { label: 'Data Fetching & API Client', icon: Globe },
  [TechCategory.FORMS_VALIDATION]: { label: 'Forms & Validation', icon: FileCode2 },
  [TechCategory.AUTHENTICATION]: { label: 'Authentication & Security', icon: KeyRound },
  [TechCategory.CHARTS_ANALYTICS]: { label: 'Charts & Analytics', icon: BarChart3 },
  [TechCategory.DEPLOYMENT_HOSTING]: { label: 'Deployment & Infrastructure', icon: Cloud },
};

export default function TechStackPanel({ projectId, onStackChange }: TechStackPanelProps) {
  const [decisions, setDecisions] = useState<ITechRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Compatibility report
  const [compatibilityReport, setCompatibilityReport] = useState<TechCompatibilityReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Add / Edit manual decision modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDecision, setNewDecision] = useState<CreateTechRecommendationRequest>({
    category: TechCategory.FRONTEND_FRAMEWORK,
    technology: '',
    versionConsidered: 'latest',
    plainLanguageExplanation: '',
    technicalRationale: '',
    evaluationCriteria: {
      maturity: 9,
      communityAdoption: 9,
      documentationQuality: 9,
      typeScriptSupport: 10,
      performance: 9,
      maintenance: 9,
    },
    compatibilityNotes: '',
    risksAndTradeoffs: [],
    alternatives: [],
    confidence: 1.0,
    status: TechDecisionStatus.APPROVED,
  });

  const loadDecisions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.tech.list(projectId);
      setDecisions(data);
    } catch (err) {
      console.error('Failed to load tech decisions', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadDecisions();
    }
  }, [projectId, loadDecisions]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const generated = await api.tech.generate(projectId);
      setDecisions(generated);
      onStackChange?.();
    } catch (err) {
      console.error('Failed to generate tech stack', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveAll = async () => {
    setApprovingAll(true);
    try {
      const updated = await api.tech.approveAll(projectId);
      setDecisions(updated);
      onStackChange?.();
    } catch (err) {
      console.error('Failed to approve all recommendations', err);
    } finally {
      setApprovingAll(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: TechDecisionStatus) => {
    try {
      const updated = await api.tech.updateStatus(projectId, id, { status });
      setDecisions((prev) => prev.map((d) => (d.id === id ? updated : d)));
      onStackChange?.();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.tech.delete(projectId, id);
      setDecisions((prev) => prev.filter((d) => d.id !== id));
      onStackChange?.();
    } catch (err) {
      console.error('Failed to delete tech decision', err);
    }
  };

  const handleRunCompatibility = async () => {
    setLoadingReport(true);
    try {
      const report = await api.tech.compatibility(projectId);
      setCompatibilityReport(report);
      setShowReportModal(true);
    } catch (err) {
      console.error('Failed to run compatibility audit', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecision.technology || !newDecision.plainLanguageExplanation) return;

    setCreating(true);
    try {
      const created = await api.tech.create(projectId, newDecision);
      setDecisions((prev) => {
        const filtered = prev.filter((d) => d.category !== created.category);
        return [...filtered, created];
      });
      setShowAddModal(false);
      setNewDecision({
        category: TechCategory.FRONTEND_FRAMEWORK,
        technology: '',
        versionConsidered: 'latest',
        plainLanguageExplanation: '',
        technicalRationale: '',
        evaluationCriteria: {
          maturity: 9,
          communityAdoption: 9,
          documentationQuality: 9,
          typeScriptSupport: 10,
          performance: 9,
          maintenance: 9,
        },
        compatibilityNotes: '',
        risksAndTradeoffs: [],
        alternatives: [],
        confidence: 1.0,
        status: TechDecisionStatus.APPROVED,
      });
      onStackChange?.();
    } catch (err) {
      console.error('Failed to create tech decision', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredDecisions = useMemo(() => {
    if (filterCategory === 'ALL') return decisions;
    return decisions.filter((d) => d.category === filterCategory);
  }, [decisions, filterCategory]);

  const approvedCount = useMemo(
    () => decisions.filter((d) => d.status === TechDecisionStatus.APPROVED).length,
    [decisions],
  );
  const pendingCount = useMemo(
    () => decisions.filter((d) => d.status === TechDecisionStatus.RECOMMENDED).length,
    [decisions],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        <span className="text-xs font-medium">Evaluating technology architecture...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Banner & KPI bar */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl mb-3 flex-shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold text-white">Technology Stack Architecture</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/60 font-semibold">
              {approvedCount} Approved
            </span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-brand-950/50 text-brand-400 border border-brand-800/60 font-semibold">
                {pendingCount} Pending
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating stack...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Recommendations</span>
              </>
            )}
          </button>

          {pendingCount > 0 && (
            <button
              onClick={handleApproveAll}
              disabled={approvingAll}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-all"
              title="Approve all recommendations"
            >
              {approvingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Approve All</span>
            </button>
          )}

          <button
            onClick={handleRunCompatibility}
            disabled={loadingReport || decisions.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 disabled:opacity-40 transition-all"
            title="Audit Stack Compatibility"
          >
            {loadingReport ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>Audit Stack</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Add Custom Tech Decision"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Decisions List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
        {decisions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center">
            <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-300">No technology stack chosen yet</h4>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
              Click 'Generate Recommendations' to have the AI evaluate proven, production-grade frameworks, databases, and libraries tailored to your requirements.
            </p>
          </div>
        ) : (
          filteredDecisions.map((decision) => {
            const isExpanded = expandedId === decision.id;
            const categoryInfo = CATEGORY_LABELS[decision.category] || {
              label: decision.category,
              icon: Layers,
            };
            const Icon = categoryInfo.icon;
            const isApproved = decision.status === TechDecisionStatus.APPROVED;

            return (
              <div
                key={decision.id}
                className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                  isApproved
                    ? 'border-emerald-800/50 bg-slate-950/70'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="p-1 rounded bg-slate-900 border border-slate-800 text-brand-400">
                        <Icon className="w-3 h-3" />
                      </span>
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                        {categoryInfo.label}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                          decision.status === TechDecisionStatus.APPROVED
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                            : decision.status === TechDecisionStatus.REJECTED
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            : 'bg-brand-950/60 text-brand-300 border-brand-800/60'
                        }`}
                      >
                        {decision.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{decision.technology}</h4>
                      {decision.versionConsidered && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {decision.versionConsidered}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Card Controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {decision.status !== TechDecisionStatus.APPROVED ? (
                      <button
                        onClick={() => handleUpdateStatus(decision.id, TechDecisionStatus.APPROVED)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all shadow-sm"
                        title="Approve this choice"
                      >
                        <Check className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(decision.id, TechDecisionStatus.RECOMMENDED)}
                        className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all"
                        title="Reset to recommended"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : decision.id)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                      title="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDelete(decision.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Plain-Language Explanation Callout (for non-technical users) */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
                  <ThumbsUp className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block mb-0.5">Why this fits your product:</span>
                    <span>{decision.plainLanguageExplanation}</span>
                  </div>
                </div>

                {/* Technical Rationale */}
                <div className="text-[11px] text-slate-400 leading-snug">
                  <span className="text-slate-500 font-semibold">Technical Architecture: </span>
                  {decision.technicalRationale}
                </div>

                {/* Evaluation Scorecard Grid */}
                {decision.evaluationCriteria && (
                  <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-800/60 text-[10px]">
                    <div className="flex items-center justify-between p-1 rounded bg-slate-900/50 border border-slate-800/60">
                      <span className="text-slate-400">Maturity:</span>
                      <span className="font-bold text-white">{decision.evaluationCriteria.maturity}/10</span>
                    </div>
                    <div className="flex items-center justify-between p-1 rounded bg-slate-900/50 border border-slate-800/60">
                      <span className="text-slate-400">TypeScript:</span>
                      <span className="font-bold text-indigo-400">{decision.evaluationCriteria.typeScriptSupport}/10</span>
                    </div>
                    <div className="flex items-center justify-between p-1 rounded bg-slate-900/50 border border-slate-800/60">
                      <span className="text-slate-400">Performance:</span>
                      <span className="font-bold text-emerald-400">{decision.evaluationCriteria.performance}/10</span>
                    </div>
                  </div>
                )}

                {/* Expandable Details: Alternatives & Tradeoffs */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-3 text-[11px] animate-fade-in">
                    {/* Compatibility notes */}
                    {decision.compatibilityNotes && (
                      <div className="p-2 rounded-lg bg-indigo-950/20 border border-indigo-900/40 text-indigo-300 text-[11px]">
                        <span className="font-semibold block mb-0.5">Compatibility with Stack:</span>
                        {decision.compatibilityNotes}
                      </div>
                    )}

                    {/* Risks and tradeoffs */}
                    {decision.risksAndTradeoffs && decision.risksAndTradeoffs.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Known Tradeoffs & Considerations</span>
                        </span>
                        <ul className="space-y-1 pl-4 list-disc text-slate-300 text-[10px]">
                          {decision.risksAndTradeoffs.map((risk, idx) => (
                            <li key={idx}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Alternatives considered */}
                    {decision.alternatives && decision.alternatives.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Alternatives Evaluated & Why Not Chosen
                        </span>
                        <div className="space-y-1.5">
                          {decision.alternatives.map((alt, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-200">{alt.name}</span>
                                <span className="text-[9px] text-slate-500 font-mono">Alternative</span>
                              </div>
                              <p className="text-slate-400 leading-snug">
                                <span className="text-slate-500 font-medium">Why bypassed: </span>
                                {alt.reasonNotChosen}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* COMPATIBILITY AUDIT MODAL */}
      {showReportModal && compatibilityReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Stack Compatibility Audit</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Status banner */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">
                  Overall Compatibility
                </span>
                <span className="text-xl font-extrabold text-white">
                  {compatibilityReport.score}/100
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  compatibilityReport.status === 'OPTIMAL'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : compatibilityReport.status === 'COMPATIBLE_WITH_WARNINGS'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {compatibilityReport.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Assessment */}
            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              {compatibilityReport.overallAssessment}
            </div>

            {/* Checked Pairs */}
            {compatibilityReport.checkedPairs && compatibilityReport.checkedPairs.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Evaluated Pairings
                </span>
                <div className="space-y-1.5">
                  {compatibilityReport.checkedPairs.map((pair, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-start gap-2"
                    >
                      {pair.compatible ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-white">
                          {pair.itemA} + {pair.itemB}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{pair.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {compatibilityReport.recommendations && compatibilityReport.recommendations.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Architectural Recommendations
                </span>
                <ul className="space-y-1 pl-4 list-disc text-slate-300 text-xs">
                  {compatibilityReport.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM TECH MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-400" />
                <span>Add Technology Decision</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Category *</label>
                <select
                  value={newDecision.category}
                  onChange={(e) =>
                    setNewDecision({ ...newDecision, category: e.target.value as TechCategory })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                >
                  {Object.values(TechCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]?.label || cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Technology Name *</label>
                  <input
                    type="text"
                    required
                    value={newDecision.technology}
                    onChange={(e) => setNewDecision({ ...newDecision, technology: e.target.value })}
                    placeholder="e.g. Next.js App Router"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Version *</label>
                  <input
                    type="text"
                    required
                    value={newDecision.versionConsidered}
                    onChange={(e) =>
                      setNewDecision({ ...newDecision, versionConsidered: e.target.value })
                    }
                    placeholder="e.g. ^15.0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Plain-Language Explanation * (for founders)
                </label>
                <textarea
                  required
                  rows={2}
                  value={newDecision.plainLanguageExplanation}
                  onChange={(e) =>
                    setNewDecision({ ...newDecision, plainLanguageExplanation: e.target.value })
                  }
                  placeholder="Explain simply why this benefits the product without technical jargon"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">
                  Technical Architecture Rationale *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newDecision.technicalRationale}
                  onChange={(e) =>
                    setNewDecision({ ...newDecision, technicalRationale: e.target.value })
                  }
                  placeholder="Engineering justification, TypeScript support, bundle size, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all shadow-glow flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Decision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
