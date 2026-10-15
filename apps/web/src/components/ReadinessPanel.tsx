import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  Check,
  ChevronDown,
  ChevronRight,
  UserCheck,
  FileCheck2,
  Lock,
  ArrowRight,
  Database,
  Globe,
  Palette,
  Cpu,
  Layers,
  Key,
  ListChecks,
} from 'lucide-react';
import { api } from '../api/client';
import type {
  IProjectReadinessReport,
  ICategoryReadiness,
  ReadinessCategory,
  ReadinessItemStatus,
} from '@project-planner/types';
import { ProjectStatus } from '@project-planner/types';

interface ReadinessPanelProps {
  projectId: string;
  onStatusChange?: () => void;
}

const CATEGORY_ICONS: Record<ReadinessCategory, React.ComponentType<{ className?: string }>> = {
  REQUIREMENTS: FileCheck2,
  UX_UI: Palette,
  ARCHITECTURE: Layers,
  DATABASE: Database,
  API: Globe,
  TECHNOLOGY: Cpu,
  INTEGRATIONS: Globe,
  SECURITY: Lock,
  TESTING: ListChecks,
  DEPLOYMENT: Layers,
  HUMAN_ACTIONS: Key,
};

export const ReadinessPanel: React.FC<ReadinessPanelProps> = ({ projectId, onStatusChange }) => {
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [report, setReport] = useState<IProjectReadinessReport | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approverName, setApproverName] = useState('Founder');
  const [approvalNotes, setApprovalNotes] = useState('Approved for autonomous coding agent implementation.');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.readiness.get(projectId);
      setReport(data);

      // Expand any failing or action_required categories by default
      const initialExpanded: Record<string, boolean> = {};
      if (data?.categories) {
        Object.entries(data.categories).forEach(([cat, val]) => {
          if (val.status === 'FAIL' || val.status === 'ACTION_REQUIRED' || val.status === 'WARN') {
            initialExpanded[cat] = true;
          }
        });
      }
      setExpandedCategories(initialExpanded);
    } catch (err) {
      console.error('Failed to load readiness report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleRunAudit = async () => {
    try {
      setAuditing(true);
      const data = await api.readiness.audit(projectId);
      setReport(data);
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error('Failed to run readiness audit:', err);
    } finally {
      setAuditing(false);
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api.readiness.approve(projectId, {
        approvedBy: approverName,
        notes: approvalNotes,
      });
      setReport(data);
      setShowApproveModal(false);
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error('Failed to approve project:', err);
    }
  };

  const toggleCategoryExpand = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const getStatusBadge = (status: ReadinessItemStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Check className="w-2.5 h-2.5" /> PASS
          </span>
        );
      case 'WARN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> WARNING
          </span>
        );
      case 'ACTION_REQUIRED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
            <Key className="w-2.5 h-2.5" /> ACTION REQ.
          </span>
        );
      case 'FAIL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <XCircle className="w-2.5 h-2.5" /> FAILED
          </span>
        );
    }
  };

  const getOverallStatusBanner = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.READY_FOR_IMPLEMENTATION:
        return {
          title: 'Ready for Implementation',
          color: 'from-emerald-950/60 to-slate-900 border-emerald-500/30 text-emerald-300',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: ShieldCheck,
        };
      case ProjectStatus.WAITING_FOR_HUMAN_ACTION:
        return {
          title: 'Waiting for Human Action',
          color: 'from-amber-950/60 to-slate-900 border-amber-500/30 text-amber-300',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: AlertTriangle,
        };
      case ProjectStatus.WAITING_FOR_APPROVAL:
        return {
          title: 'Waiting for Founder Approval',
          color: 'from-cyan-950/60 to-slate-900 border-cyan-500/30 text-cyan-300',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          icon: UserCheck,
        };
      case ProjectStatus.NEEDS_CLARIFICATION:
        return {
          title: 'Needs Scope Clarification',
          color: 'from-rose-950/60 to-slate-900 border-rose-500/30 text-rose-300',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          icon: ShieldAlert,
        };
      case ProjectStatus.FINALIZED:
        return {
          title: 'Specification Finalized',
          color: 'from-purple-950/60 to-slate-900 border-purple-500/30 text-purple-300',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: CheckCircle2,
        };
      default:
        return {
          title: 'Discovery in Progress',
          color: 'from-slate-800/60 to-slate-900 border-slate-700 text-slate-300',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: RefreshCw,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-brand-400" />
        <p className="text-xs">Evaluating project readiness across 11 architectural dimensions...</p>
      </div>
    );
  }

  const overallStatus = report?.overallStatus || ProjectStatus.DISCOVERY;
  const banner = getOverallStatusBanner(overallStatus);
  const BannerIcon = banner.icon;

  const categoriesList = report?.categories ? Object.values(report.categories) : [];
  const passingCount = categoriesList.filter((c) => c.status === 'PASS').length;
  const actionReqCount = categoriesList.filter((c) => c.status === 'ACTION_REQUIRED').length;
  const failingCount = categoriesList.filter((c) => c.status === 'FAIL').length;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto">
      {/* Top Banner & Audit Trigger */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Project Readiness Engine</h2>
              <p className="text-xs text-slate-400">Specification verification & implementation gate</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAudit}
              disabled={auditing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${auditing ? 'animate-spin' : ''}`} />
              <span>{auditing ? 'Auditing...' : 'Re-Run Audit'}</span>
            </button>

            {!report?.approval?.isApproved && (
              <button
                onClick={() => setShowApproveModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Approve Project</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Overall Status Hero */}
        <div className={`bg-gradient-to-r ${banner.color} border rounded-2xl p-4 shadow-sm`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center shrink-0">
                <BannerIcon className="w-5 h-5 text-current" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-white">{banner.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${banner.badge}`}>
                    {overallStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  {report?.summary || 'Project specifications evaluated across all 11 planning dimensions.'}
                </p>
              </div>
            </div>

            {/* Overall Score Dial */}
            <div className="text-right shrink-0 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Readiness Score</div>
              <div className="text-xl font-black text-white mt-0.5">
                {report?.overallScore || 0}
                <span className="text-xs text-slate-500 font-normal">/100</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center text-xs">
            <div className="bg-slate-900/60 rounded-lg p-1.5 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Dimensions</span>
              <span className="font-bold text-white">11 / 11</span>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-1.5 border border-slate-800">
              <span className="text-[10px] text-emerald-400 block">Passed</span>
              <span className="font-bold text-emerald-300">{passingCount}</span>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-1.5 border border-slate-800">
              <span className="text-[10px] text-purple-400 block">Action Req.</span>
              <span className="font-bold text-purple-300">{actionReqCount}</span>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-1.5 border border-slate-800">
              <span className="text-[10px] text-rose-400 block">Failing</span>
              <span className="font-bold text-rose-300">{failingCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-4">
        {/* Open Blockers Alert */}
        {report?.blockingItems && report.blockingItems.length > 0 ? (
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{report.blockingItems.length} Prerequisite Blockers to Resolve</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-300/90 pl-5 list-disc leading-relaxed">
              {report.blockingItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero blocking dependencies detected — all implementation prerequisites verified!</span>
          </div>
        )}

        {/* Approval Status Card */}
        {report?.approval && (
          <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                report.approval.isApproved
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}>
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white block">
                  {report.approval.isApproved ? 'Founder Sign-off Granted' : 'Founder Sign-off Pending'}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {report.approval.isApproved
                    ? `Signed off by ${report.approval.approvedBy} on ${new Date(report.approval.approvedAt || '').toLocaleDateString()}`
                    : 'Requires founder review and approval before implementation begins.'}
                </span>
              </div>
            </div>

            {!report.approval.isApproved && (
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Sign Off
              </button>
            )}
          </div>
        )}

        {/* 11 Architectural Dimensions Scorecard */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            11 Planning Dimensions Scorecard
          </h3>

          <div className="space-y-2">
            {categoriesList.map((catItem) => {
              const Icon = CATEGORY_ICONS[catItem.category] || Layers;
              const isExpanded = !!expandedCategories[catItem.category];

              return (
                <div
                  key={catItem.category}
                  className="bg-slate-800/30 border border-slate-800 rounded-xl overflow-hidden text-xs transition-colors hover:border-slate-700"
                >
                  <div
                    className="p-3 flex items-center justify-between cursor-pointer select-none"
                    onClick={() => toggleCategoryExpand(catItem.category)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{catItem.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({catItem.score}%)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{catItem.summary}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(catItem.status)}
                      <button className="text-slate-500 p-1">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Findings & Blockers */}
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-slate-800/80 space-y-2 text-[11px] bg-slate-900/40">
                      {catItem.findings && catItem.findings.length > 0 && (
                        <div>
                          <span className="text-slate-400 font-semibold block mb-1">
                            Verified Checks:
                          </span>
                          <ul className="space-y-0.5 text-slate-300 pl-1">
                            {catItem.findings.map((f, fIdx) => (
                              <li key={fIdx} className="flex items-start gap-1.5">
                                <span className="text-emerald-400 mt-0.5">✓</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {catItem.blockers && catItem.blockers.length > 0 && (
                        <div className="bg-rose-950/20 border border-rose-500/20 p-2 rounded-lg">
                          <span className="text-rose-400 font-semibold block mb-1 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Blockers:
                          </span>
                          <ul className="space-y-0.5 text-rose-300 pl-1">
                            {catItem.blockers.map((b, bIdx) => (
                              <li key={bIdx}>• {b}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {catItem.recommendations && catItem.recommendations.length > 0 && (
                        <div>
                          <span className="text-indigo-400 font-semibold block mb-0.5">
                            Recommendations:
                          </span>
                          <ul className="space-y-0.5 text-slate-400 pl-1">
                            {catItem.recommendations.map((r, rIdx) => (
                              <li key={rIdx}>→ {r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
         MODAL: APPROVE FOR IMPLEMENTATION
         ========================================================================= */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 text-slate-100 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" /> Founder Approval Sign-Off
              </h3>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApprove} className="mt-4 space-y-3 text-xs">
              <p className="text-slate-400 leading-relaxed">
                By approving, you verify that requirements, screens, architecture, and technology selections meet your product goals. The project will transition to <strong className="text-emerald-300 font-semibold">READY FOR IMPLEMENTATION</strong>.
              </p>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Approved By (Your Name / Role)</label>
                <input
                  type="text"
                  required
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Approval Notes</label>
                <textarea
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  Sign Off & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadinessPanel;
