import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  FileCode2,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Send,
  AlertCircle,
  HelpCircle,
  Code,
  CheckCheck,
  ListOrdered,
  Activity,
  History,
  X,
  FileCheck,
} from 'lucide-react';
import { api } from '../api/client.js';
import type {
  IEngineeringHandoffPackage,
  ITaskQueueItem,
  IAgentFeedbackReport,
  IAgentActivityLog,
  AgentTaskExecutionStatus,
  IPlanTask,
} from '@project-planner/types';

interface AgentIntegrationPanelProps {
  projectId: string;
}

export const AgentIntegrationPanel: React.FC<AgentIntegrationPanelProps> = ({ projectId }) => {
  const [data, setData] = useState<IEngineeringHandoffPackage | null>(null);
  const [nextTask, setNextTask] = useState<ITaskQueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab state inside the Agent panel
  const [activeTab, setActiveTab] = useState<'queue' | 'cli' | 'activity'>('queue');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Action modals
  const [completeModalTask, setCompleteModalTask] = useState<IPlanTask | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeFiles, setCompleteFiles] = useState('');
  const [completing, setCompleting] = useState(false);

  const [failModalTask, setFailModalTask] = useState<IPlanTask | null>(null);
  const [failReason, setFailReason] = useState('');
  const [failDetails, setFailDetails] = useState('');
  const [failing, setFailing] = useState(false);

  // New feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<
    'CLARIFICATION_NEEDED' | 'DEPENDENCY_BLOCKED' | 'CODE_ERROR' | 'TEST_FAILURE' | 'SPEC_DRIFT'
  >('CLARIFICATION_NEEDED');
  const [feedbackTask, setFeedbackTask] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackRemedy, setFeedbackRemedy] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [handoffPkg, next] = await Promise.all([
        api.agent.getHandoff(projectId),
        api.agent.getNextTask(projectId),
      ]);
      setData(handoffPkg);
      setNextTask(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load engineering agent handoff');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleReinitialize = async () => {
    setRefreshing(true);
    try {
      const updated = await api.agent.initializeHandoff(projectId);
      setData(updated);
      const next = await api.agent.getNextTask(projectId);
      setNextTask(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-initialize handoff');
    } finally {
      setRefreshing(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleClaim = async (taskId: string) => {
    try {
      setRefreshing(true);
      await api.agent.claimTask(projectId, taskId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim task');
      setRefreshing(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalTask) return;
    try {
      setCompleting(true);
      const filesList = completeFiles
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      await api.agent.completeTask(projectId, completeModalTask.taskId, {
        notes: completeNotes.trim() || undefined,
        filesModified: filesList,
        testsPassed: true,
      });

      setCompleteModalTask(null);
      setCompleteNotes('');
      setCompleteFiles('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task');
    } finally {
      setCompleting(false);
    }
  };

  const handleFailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failModalTask) return;
    try {
      setFailing(true);
      await api.agent.failTask(projectId, failModalTask.taskId, {
        reason: failReason.trim(),
        errorDetails: failDetails.trim() || undefined,
      });

      setFailModalTask(null);
      setFailReason('');
      setFailDetails('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report task failure');
    } finally {
      setFailing(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingFeedback(true);
      await api.agent.submitFeedback(projectId, {
        type: feedbackType,
        taskId: feedbackTask.trim() || undefined,
        message: feedbackMsg.trim(),
        suggestedRemedy: feedbackRemedy.trim() || undefined,
      });

      setShowFeedbackModal(false);
      setFeedbackMsg('');
      setFeedbackRemedy('');
      setFeedbackTask('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-400 mb-3" />
        <p className="text-sm">Synthesizing engineering agent handoff package...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-rose-300">Agent Integration Error</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { handoff, taskQueue, agentInstructions, cliExecutionSnippet } = data;
  const { taskProgress } = handoff;

  const filteredQueue = taskQueue.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.executionStatus === filterStatus;
  });

  const getStatusBadge = (status: AgentTaskExecutionStatus) => {
    switch (status) {
      case 'READY_TO_RUN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Play className="w-2.5 h-2.5 fill-current" />
            READY TO RUN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 animate-pulse">
            <Clock className="w-2.5 h-2.5" />
            IN PROGRESS
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <Check className="w-2.5 h-2.5" />
            COMPLETED
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-2.5 h-2.5" />
            BLOCKED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            TODO
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Hero Banner: Agent Protocol Status */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-500/10 border border-brand-500/30 rounded-xl text-brand-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Autonomous Coding Agent Handoff
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    handoff.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : handoff.status === 'BLOCKED'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : handoff.status === 'IN_PROGRESS'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 animate-pulse'
                      : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                  }`}
                >
                  {handoff.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Agent: <strong className="text-slate-200">{handoff.agentName}</strong></span>
                <span>•</span>
                <span>Spec: <strong className="text-slate-200">{handoff.specVersion}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReinitialize}
              disabled={refreshing}
              title="Re-synchronize handoff package with latest specification"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
              <span className="hidden sm:inline">Sync Spec</span>
            </button>
          </div>
        </div>

        {/* SHA-256 Integrity Checksum Pill */}
        <div className="mt-3 flex items-center justify-between text-[11px] bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400">
            <FileCheck className="w-3.5 h-3.5 text-brand-400" />
            <span>SHA-256:</span>
            <code className="text-slate-200 font-mono text-[10px]">
              {handoff.specChecksum.slice(0, 16)}...{handoff.specChecksum.slice(-8)}
            </code>
          </div>
          <button
            onClick={() => copyToClipboard(handoff.specChecksum, 'checksum')}
            className="flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 transition"
          >
            {copiedKey === 'checksum' ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Checksum</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar & Counters */}
        <div className="mt-3">
          <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
            <span>
              Execution Progress: <strong className="text-white">{taskProgress.completed}</strong> of{' '}
              <strong className="text-white">{taskProgress.total}</strong> tasks done
            </span>
            <span className="font-bold text-brand-400">{taskProgress.percentComplete}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${taskProgress.total > 0 ? (taskProgress.completed / taskProgress.total) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-sky-500 h-full transition-all duration-500"
              style={{
                width: `${taskProgress.total > 0 ? (taskProgress.inProgress / taskProgress.total) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{
                width: `${taskProgress.total > 0 ? (taskProgress.blocked / taskProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Completed ({taskProgress.completed})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> In Progress ({taskProgress.inProgress})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Blocked ({taskProgress.blocked})
            </span>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900/30 px-4 text-xs font-medium flex-shrink-0">
        <button
          onClick={() => setActiveTab('queue')}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'queue'
              ? 'border-brand-500 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5 text-indigo-400" />
          <span>Queue & Next Task</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded-full text-slate-300">
            {taskQueue.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('cli')}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'cli'
              ? 'border-brand-500 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-teal-400" />
          <span>Agent CLI & Snippets</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'activity'
              ? 'border-brand-500 text-white font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>Activity & Feedback</span>
          {handoff.feedbackReports.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded-full">
              {handoff.feedbackReports.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'queue' && (
          <>
            {/* Next Ready Task Spotlight Runner Card */}
            {nextTask ? (
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-brand-500/30 shadow-lg shadow-brand-500/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {nextTask.executionStatus === 'IN_PROGRESS'
                        ? 'Task Currently In Progress'
                        : 'Next Ready-To-Execute Task'}
                    </span>
                  </div>
                  {getStatusBadge(nextTask.executionStatus)}
                </div>

                <div className="mt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono font-bold text-brand-300">
                      [{nextTask.task.taskId}]
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      {nextTask.task.title}
                    </h3>
                  </div>
                  {nextTask.task.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {nextTask.task.description}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Type: {nextTask.task.type}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Priority: {nextTask.task.priority}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Complexity: {nextTask.task.complexity}
                  </span>
                  {nextTask.task.phaseId && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Phase: {nextTask.task.phaseId}
                    </span>
                  )}
                </div>

                {/* Prerequisites checklist */}
                {nextTask.task.dependencies && nextTask.task.dependencies.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px]">
                    <span className="text-slate-400">Dependencies:</span>
                    <div className="flex flex-wrap gap-1">
                      {nextTask.task.dependencies.map((depId) => {
                        const isSatisfied = !nextTask.unmetDependencies.includes(depId);
                        return (
                          <span
                            key={depId}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 ${
                              isSatisfied
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isSatisfied ? <Check className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                            {depId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  {nextTask.executionStatus === 'READY_TO_RUN' && (
                    <button
                      onClick={() => handleClaim(nextTask.task.taskId)}
                      className="px-3 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg flex items-center gap-1.5 transition shadow"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Claim & Start Task</span>
                    </button>
                  )}

                  {nextTask.executionStatus === 'IN_PROGRESS' && (
                    <>
                      <button
                        onClick={() => setCompleteModalTask(nextTask.task)}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition shadow"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Complete Task</span>
                      </button>
                      <button
                        onClick={() => setFailModalTask(nextTask.task)}
                        className="px-3 py-1.5 text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Report Blocker</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : taskProgress.completed === taskProgress.total && taskProgress.total > 0 ? (
              <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white">All Implementation Tasks Completed!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  The autonomous software engineering agent has successfully executed all planned tasks.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                No active ready-to-run tasks. Verify preceding milestone tasks or clear blockers.
              </div>
            )}

            {/* Task Queue Filters & Counter */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-brand-400" />
                <span>Topological Dependency Queue</span>
              </div>
              <div className="flex items-center gap-1">
                {(['ALL', 'READY_TO_RUN', 'IN_PROGRESS', 'BLOCKED', 'TODO', 'COMPLETED'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                        filterStatus === st
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Task Queue List */}
            <div className="space-y-2">
              {filteredQueue.map((item) => (
                <div
                  key={item.task.id || item.task.taskId}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 mt-0.5">
                        #{item.orderIndex + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-brand-300">
                            [{item.task.taskId}]
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {item.task.title}
                          </span>
                        </div>
                        {item.task.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.task.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>{getStatusBadge(item.executionStatus)}</div>
                  </div>

                  {/* Prerequisites info & quick actions */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Type: {item.task.type} ({item.task.complexity})</span>
                      {item.task.phaseId && (
                        <span className="text-slate-500">• {item.task.phaseId}</span>
                      )}
                      {item.unmetDependencies.length > 0 && (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Waiting on: {item.unmetDependencies.join(', ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.executionStatus === 'READY_TO_RUN' && (
                        <button
                          onClick={() => handleClaim(item.task.taskId)}
                          className="px-2 py-0.5 bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 border border-brand-500/30 rounded text-[10px] font-semibold transition"
                        >
                          Claim
                        </button>
                      )}
                      {item.executionStatus === 'IN_PROGRESS' && (
                        <>
                          <button
                            onClick={() => setCompleteModalTask(item.task)}
                            className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-semibold transition"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => setFailModalTask(item.task)}
                            className="px-2 py-0.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded text-[10px] font-semibold transition"
                          >
                            Block
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'cli' && (
          <div className="space-y-4">
            {/* CLI Snippet Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-brand-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Autonomous Execution Loop (CLI)
                  </h3>
                </div>
                <button
                  onClick={() => copyToClipboard(cliExecutionSnippet, 'cli')}
                  className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 transition"
                >
                  {copiedKey === 'cli' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Run this loop in any terminal or coding agent harness (e.g. Gemini CLI, Claude Code, Aider, OpenHands):
              </p>
              <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto border border-slate-800/80 leading-relaxed whitespace-pre-wrap">
                {cliExecutionSnippet}
              </pre>
            </div>

            {/* Agent Prompt Instructions */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Agent System Prompt Instructions
                  </h3>
                </div>
                <button
                  onClick={() => copyToClipboard(agentInstructions, 'instructions')}
                  className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 transition"
                >
                  {copiedKey === 'instructions' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Instructions</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 max-h-72 overflow-y-auto border border-slate-800/80 leading-relaxed whitespace-pre-wrap">
                {agentInstructions}
              </pre>
            </div>

            {/* Spec JSON Quick Download */}
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-teal-400" />
                <span className="text-xs text-slate-300">
                  Full Verified Spec: <code className="text-brand-300 font-mono">project-spec.json</code>
                </span>
              </div>
              <a
                href={`/api/projects/${projectId}/export/json`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1 transition"
              >
                <span>View Raw</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            {/* Header with Submit Feedback button */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-brand-400" />
                <span>Agent Execution Activity Feed</span>
              </div>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-2.5 py-1 text-xs bg-brand-600 hover:bg-brand-500 text-white rounded-lg flex items-center gap-1 transition"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Submit Feedback</span>
              </button>
            </div>

            {/* Activity Stream */}
            <div className="space-y-2">
              {handoff.activityLog.slice().reverse().map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-300">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300">{log.details}</p>
                </div>
              ))}
            </div>

            {/* Feedback / Blocker Reports */}
            {handoff.feedbackReports.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Agent Feedback & Clarification Reports</span>
                </h4>
                <div className="space-y-2">
                  {handoff.feedbackReports.map((report, idx) => (
                    <div
                      key={report.id || idx}
                      className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-bold text-rose-400">
                          [{report.type}] {report.taskId ? `Task ${report.taskId}` : ''}
                        </span>
                        <span className="text-slate-500">
                          {new Date(report.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-200">{report.message}</p>
                      {report.suggestedRemedy && (
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          Remedy: {report.suggestedRemedy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Complete Task Modal */}
      {completeModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                Complete Task: [{completeModalTask.taskId}]
              </h3>
              <button
                onClick={() => setCompleteModalTask(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">{completeModalTask.title}</p>
            <form onSubmit={handleCompleteSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Files Modified (one per line):
                </label>
                <textarea
                  value={completeFiles}
                  onChange={(e) => setCompleteFiles(e.target.value)}
                  placeholder="src/components/Button.tsx&#10;src/components/Button.test.tsx"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Implementation & Test Notes:
                </label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="Implemented responsive button variants. 100% test coverage passed."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalTask(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completing}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition"
                >
                  {completing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Mark Task Completed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fail / Blocker Modal */}
      {failModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Report Blocker: [{failModalTask.taskId}]
              </h3>
              <button
                onClick={() => setFailModalTask(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">{failModalTask.title}</p>
            <form onSubmit={handleFailSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Blocker Reason (Required):
                </label>
                <input
                  type="text"
                  required
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  placeholder="Missing OAuth credentials in environment configuration"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Technical Error Details / Stack Trace:
                </label>
                <textarea
                  value={failDetails}
                  onChange={(e) => setFailDetails(e.target.value)}
                  placeholder="AUTH_PROVIDER_INVALID_CLIENT_ID"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFailModalTask(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={failing}
                  className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1.5 transition"
                >
                  {failing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Report Task Blocker</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Agent Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-400" />
                Submit Agent Feedback / Clarification
              </h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Feedback Category:
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="CLARIFICATION_NEEDED">Clarification Needed</option>
                  <option value="DEPENDENCY_BLOCKED">Dependency Blocked</option>
                  <option value="CODE_ERROR">Code Execution Error</option>
                  <option value="TEST_FAILURE">Test Suite Failure</option>
                  <option value="SPEC_DRIFT">Specification Drift Detected</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Task ID (Optional):
                </label>
                <input
                  type="text"
                  value={feedbackTask}
                  onChange={(e) => setFeedbackTask(e.target.value)}
                  placeholder="e.g. T-003"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Feedback Message (Required):
                </label>
                <textarea
                  required
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  placeholder="Need clarification on rate limit headers in API endpoint spec."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Suggested Remedy (Optional):
                </label>
                <input
                  type="text"
                  value={feedbackRemedy}
                  onChange={(e) => setFeedbackRemedy(e.target.value)}
                  placeholder="Add X-RateLimit-Limit and X-RateLimit-Remaining headers"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="px-4 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg flex items-center gap-1.5 transition"
                >
                  {submittingFeedback && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentIntegrationPanel;
