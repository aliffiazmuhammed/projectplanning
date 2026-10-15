import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Sparkles,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronRight,
  Download,
  Copy,
  Check,
  FileJson,
  Layers,
  Milestone,
  Clock,
  AlertCircle,
  Play,
  X,
  Code2,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { api } from '../api/client';
import type {
  IImplementationPlan,
  IPlanTask,
  TaskStatus,
  TaskType,
  TaskPriority,
  TaskComplexity,
  CreateTaskRequest,
} from '@project-planner/types';

interface PlanPanelProps {
  projectId: string;
}

export const PlanPanel: React.FC<PlanPanelProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'roadmap' | 'stories' | 'spec'>('tasks');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<IImplementationPlan | null>(null);
  const [tasks, setTasks] = useState<IPlanTask[]>([]);
  const [executableTaskIds, setExecutableTaskIds] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    blockedTasks: 0,
    todoTasks: 0,
    executableTasksCount: 0,
    totalRoadmapPhases: 0,
    totalMilestones: 0,
    totalFeatures: 0,
    totalUserStories: 0,
    totalEstimatedHours: 0,
    byType: {} as Record<string, number>,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Expanded items
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Spec export modal/state
  const [specJson, setSpecJson] = useState<string | null>(null);
  const [specCopied, setSpecCopied] = useState(false);
  const [loadingSpec, setLoadingSpec] = useState(false);

  // Manual Task Modal
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState<Partial<CreateTaskRequest>>({
    title: '',
    description: '',
    type: 'FULLSTACK',
    priority: 'MEDIUM',
    complexity: 'M',
    dependencies: [],
    affectedComponents: [],
    subtasks: [''],
    acceptanceCriteria: [''],
    testCases: [''],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.plan.get(projectId);
      setPlan(data.plan);
      setTasks(data.tasks || []);
      setExecutableTaskIds(data.executableTaskIds || []);
      setStats(data.stats);

      // Expand first 2 tasks by default
      const initialExpanded: Record<string, boolean> = {};
      data.tasks?.slice(0, 2).forEach((t) => {
        initialExpanded[t.id] = true;
      });
      setExpandedTasks(initialExpanded);
    } catch (err) {
      console.error('Failed to load implementation plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      const data = await api.plan.generate(projectId);
      setPlan(data.plan);
      setTasks(data.tasks || []);
      setExecutableTaskIds(data.executableTaskIds || []);
      setStats(data.stats);

      const initialExpanded: Record<string, boolean> = {};
      data.tasks?.slice(0, 3).forEach((t) => {
        initialExpanded[t.id] = true;
      });
      setExpandedTasks(initialExpanded);
    } catch (err) {
      console.error('Failed to generate implementation plan:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (task: IPlanTask, nextStatus: TaskStatus) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
      );

      await api.plan.updateTaskStatus(projectId, task.id, {
        status: nextStatus,
      });

      // Reload to recalculate executable tasks & metrics
      const updated = await api.plan.get(projectId);
      setStats(updated.stats);
      setExecutableTaskIds(updated.executableTaskIds || []);
    } catch (err) {
      console.error('Failed to update task status:', err);
      loadData();
    }
  };

  const toggleTaskExpand = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLoadSpec = async () => {
    try {
      setLoadingSpec(true);
      const spec = await api.plan.exportSpec(projectId);
      setSpecJson(JSON.stringify(spec, null, 2));
    } catch (err) {
      console.error('Failed to export project spec:', err);
    } finally {
      setLoadingSpec(false);
    }
  };

  const handleCopySpec = () => {
    if (!specJson) return;
    navigator.clipboard.writeText(specJson);
    setSpecCopied(true);
    setTimeout(() => setSpecCopied(false), 2000);
  };

  const handleDownloadSpec = () => {
    if (!specJson) return;
    const blob = new Blob([specJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-spec-${projectId.slice(-6)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.description) return;
    try {
      const validSubtasks = (newTask.subtasks || []).filter((s) => s.trim().length > 0);
      const validAC = (newTask.acceptanceCriteria || []).filter((s) => s.trim().length > 0);
      const validTC = (newTask.testCases || []).filter((s) => s.trim().length > 0);

      await api.plan.createTask(projectId, {
        title: newTask.title,
        description: newTask.description,
        type: newTask.type || 'FULLSTACK',
        priority: newTask.priority || 'MEDIUM',
        complexity: newTask.complexity || 'M',
        dependencies: newTask.dependencies || [],
        affectedComponents: newTask.affectedComponents || [],
        subtasks: validSubtasks.length > 0 ? validSubtasks : ['1. Implement task logic'],
        acceptanceCriteria: validAC.length > 0 ? validAC : ['Fulfills requirements'],
        testCases: validTC.length > 0 ? validTC : ['Verify unit test passes'],
        assignedAgent: newTask.assignedAgent,
      });

      setShowAddTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        type: 'FULLSTACK',
        priority: 'MEDIUM',
        complexity: 'M',
        dependencies: [],
        affectedComponents: [],
        subtasks: [''],
        acceptanceCriteria: [''],
        testCases: [''],
      });
      loadData();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // Filtered tasks
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'READY') {
      return executableTaskIds.includes(t.taskId);
    }
    if (statusFilter !== 'ALL' && t.status !== statusFilter) {
      return false;
    }
    if (typeFilter !== 'ALL' && t.type !== typeFilter) {
      return false;
    }
    return true;
  });

  const completionPercentage =
    stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Top Header & Metrics Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Implementation Plan</h2>
              <p className="text-xs text-slate-400">Execution roadmap, stories, and coding tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {generating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{generating ? 'Decomposing Plan...' : 'Generate Plan'}</span>
            </button>
          </div>
        </div>

        {/* Plan KPI and Progress Bar */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-medium">Coding Agent Progress</span>
            <span className="font-semibold text-indigo-400">
              {stats.completedTasks} / {stats.totalTasks} Tasks Done ({completionPercentage}%)
            </span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800/80">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Total Tasks</div>
              <div className="text-sm font-bold text-white mt-0.5">{stats.totalTasks}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800/80">
              <div className="text-emerald-400 text-[10px] uppercase font-semibold flex items-center justify-center gap-1">
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Ready to Code</span>
              </div>
              <div className="text-sm font-bold text-emerald-300 mt-0.5">
                {stats.executableTasksCount}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800/80">
              <div className="text-amber-400 text-[10px] uppercase font-semibold">In Progress</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {stats.inProgressTasks}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800/80">
              <div className="text-purple-400 text-[10px] uppercase font-semibold">Est. Hours</div>
              <div className="text-sm font-bold text-purple-300 mt-0.5">
                {stats.totalEstimatedHours || '~120'}h
              </div>
            </div>
          </div>
        </div>

        {/* Subtabs Switcher */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 overflow-x-auto">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === 'tasks'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Tasks</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                {tasks.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === 'roadmap'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Milestone className="w-3.5 h-3.5" />
              <span>Roadmap</span>
            </button>
            <button
              onClick={() => setActiveTab('stories')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === 'stories'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stories</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('spec');
                if (!specJson) handleLoadSpec();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === 'spec'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>Agent Spec</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddTaskModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-400" />
            <p className="text-xs">Loading execution roadmap, milestones, and task graph...</p>
          </div>
        ) : activeTab === 'tasks' ? (
          /* =========================================================================
             SUBTAB 1: CODING AGENT TASKS
             ========================================================================= */
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Status:
                </span>
                {['ALL', 'READY', 'TODO', 'IN_PROGRESS', 'COMPLETED'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      statusFilter === filter
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter === 'ALL'
                      ? 'All'
                      : filter === 'READY'
                      ? '⚡ Ready to Code'
                      : filter === 'TODO'
                      ? 'To Do'
                      : filter === 'IN_PROGRESS'
                      ? 'In Progress'
                      : 'Done'}
                  </button>
                ))}
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Types</option>
                <option value="BACKEND">Backend</option>
                <option value="FRONTEND">Frontend</option>
                <option value="DATABASE">Database</option>
                <option value="DEVOPS">DevOps</option>
                <option value="TESTING">Testing</option>
                <option value="SECURITY">Security</option>
                <option value="FULLSTACK">Fullstack</option>
              </select>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                <ListTodo className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No tasks generated yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click &quot;Generate Plan&quot; to synthesize requirements and architecture into actionable tasks.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === 'COMPLETED';
                  const isExecutable = executableTaskIds.includes(task.taskId);
                  const isExpanded = !!expandedTasks[task.id];

                  return (
                    <div
                      key={task.id}
                      className={`border rounded-xl transition-all ${
                        isCompleted
                          ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                          : isExecutable
                          ? 'bg-slate-800/40 border-emerald-500/30 shadow-sm'
                          : 'bg-slate-800/30 border-slate-800'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className="flex-1 cursor-pointer select-none"
                            onClick={() => toggleTaskExpand(task.id)}
                          >
                            <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                {task.taskId}
                              </span>

                              {isExecutable && !isCompleted && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                  <Play className="w-2 h-2 fill-current" />
                                  READY TO CODE
                                </span>
                              )}

                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  task.priority === 'CRITICAL'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : task.priority === 'HIGH'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {task.priority}
                              </span>

                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                {task.type}
                              </span>

                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                                Size: {task.complexity}
                              </span>
                            </div>

                            <h3
                              className={`text-sm font-semibold transition-colors ${
                                isCompleted
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-100 hover:text-indigo-300'
                              }`}
                            >
                              {task.title}
                            </h3>

                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          </div>

                          {/* Status Picker & Expand */}
                          <div className="flex items-center gap-2">
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleStatusChange(task, e.target.value as TaskStatus)
                              }
                              className={`text-[11px] font-medium px-2 py-1 rounded-lg border focus:outline-none ${
                                task.status === 'COMPLETED'
                                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
                                  : task.status === 'BLOCKED'
                                  ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="BLOCKED">Blocked</option>
                            </select>

                            <button
                              onClick={() => toggleTaskExpand(task.id)}
                              className="text-slate-500 hover:text-slate-300 p-1"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Task Deep Dive (Subtasks, Criteria, Tests, Components) */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3 text-xs bg-slate-900/40">
                          {/* Dependencies & Components */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                              <span className="text-slate-400 font-medium block mb-1">
                                Dependencies:
                              </span>
                              {task.dependencies && task.dependencies.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {task.dependencies.map((dep, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]"
                                    >
                                      {dep}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[11px]">
                                  None (Ready to implement)
                                </span>
                              )}
                            </div>

                            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                              <span className="text-slate-400 font-medium block mb-1">
                                Affected Components / Files:
                              </span>
                              {task.affectedComponents && task.affectedComponents.length > 0 ? (
                                <div className="space-y-0.5">
                                  {task.affectedComponents.map((file, idx) => (
                                    <div
                                      key={idx}
                                      className="font-mono text-emerald-400/90 text-[11px] truncate"
                                    >
                                      {file}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[11px]">Core codebase</span>
                              )}
                            </div>
                          </div>

                          {/* Work / Subtasks Checklist */}
                          <div>
                            <span className="text-slate-300 font-semibold block mb-1 flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Work & Atomic Subtasks:</span>
                            </span>
                            <div className="space-y-1 pl-1">
                              {task.subtasks.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-slate-300">
                                  <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span className="leading-relaxed">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Acceptance Criteria */}
                          <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-300 font-semibold block mb-1 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Acceptance Criteria:</span>
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                              {task.acceptanceCriteria.map((ac, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  {ac}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Test Cases */}
                          <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-slate-300 font-semibold block mb-1 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                              <span>Required Test Scenarios:</span>
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                              {task.testCases.map((tc, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  {tc}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'roadmap' ? (
          /* =========================================================================
             SUBTAB 2: ROADMAP PHASES & MILESTONES
             ========================================================================= */
          <div className="space-y-4">
            {plan?.summary && (
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 text-xs leading-relaxed text-slate-300">
                <span className="font-semibold text-white block mb-1">
                  Implementation Strategy Summary:
                </span>
                {plan.summary}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Roadmap Phases
              </h3>
              {(plan?.roadmap || []).map((phase, idx) => (
                <div
                  key={phase.id || idx}
                  className="bg-slate-800/30 border border-slate-800 rounded-xl p-3 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm">{phase.name}</span>
                    {phase.targetDuration && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                        {phase.targetDuration}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 leading-relaxed mb-2">{phase.description}</p>
                  {phase.deliverables && phase.deliverables.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {phase.deliverables.map((del, dIdx) => (
                        <span
                          key={dIdx}
                          className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 text-[11px]"
                        >
                          ✓ {del}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Milestones & Acceptance Gates
              </h3>
              {(plan?.milestones || []).map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="bg-slate-800/30 border border-slate-800 rounded-xl p-3 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold text-[10px]">
                        {m.id}
                      </span>
                      <span className="font-bold text-white">{m.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      {m.status}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed mb-2">{m.description}</p>
                  {m.criteria && m.criteria.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                      {m.criteria.map((c, cIdx) => (
                        <li key={cIdx}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'stories' ? (
          /* =========================================================================
             SUBTAB 3: FEATURES & USER STORIES
             ========================================================================= */
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Features & Epics
              </h3>
              {(plan?.features || []).map((feat, idx) => (
                <div
                  key={feat.id || idx}
                  className="bg-slate-800/30 border border-slate-800 rounded-xl p-3 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm">{feat.title}</span>
                    <span className="font-mono text-[10px] text-slate-500">{feat.id}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed mb-2">{feat.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {feat.requirementIds?.map((req, rIdx) => (
                      <span
                        key={rIdx}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]"
                      >
                        {req}
                      </span>
                    ))}
                    {feat.screenRoutes?.map((route, rtIdx) => (
                      <span
                        key={rtIdx}
                        className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 font-mono text-[10px]"
                      >
                        {route}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                User Stories
              </h3>
              {(plan?.userStories || []).map((story, idx) => (
                <div
                  key={story.id || idx}
                  className="bg-slate-800/30 border border-slate-800 rounded-xl p-3 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-[10px] text-indigo-400">
                      {story.id}
                    </span>
                    <span className="text-[10px] text-slate-400">{story.role}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed text-slate-200">
                    <span className="text-indigo-400 font-semibold">As a</span> {story.role},{' '}
                    <span className="text-indigo-400 font-semibold">I want</span> {story.want},{' '}
                    <span className="text-indigo-400 font-semibold">so that</span> {story.benefit}.
                  </div>
                  {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">
                        Acceptance Criteria:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                        {story.acceptanceCriteria.map((ac, acIdx) => (
                          <li key={acIdx}>{ac}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* =========================================================================
             SUBTAB 4: AGENT SPECIFICATION (project-spec.json)
             ========================================================================= */
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <div>
                <h4 className="font-semibold text-white">Machine-Readable project-spec.json</h4>
                <p className="text-[11px] text-slate-400">
                  Specification Section 26 & 27: The exact contract autonomous coding agents consume.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySpec}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
                >
                  {specCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{specCopied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={handleDownloadSpec}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {loadingSpec ? (
              <div className="flex items-center justify-center h-48 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              </div>
            ) : specJson ? (
              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-3 max-h-[500px] overflow-auto font-mono text-[11px] text-slate-300 leading-relaxed">
                <pre>{specJson}</pre>
              </div>
            ) : (
              <button
                onClick={handleLoadSpec}
                className="w-full py-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-400 hover:text-slate-200"
              >
                Click to load machine-readable specification
              </button>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
         MODAL: ADD MANUAL TASK
         ========================================================================= */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 text-slate-100 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" /> Add Coding Agent Task
              </h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement user registration endpoint"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value as TaskType })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BACKEND">Backend</option>
                    <option value="FRONTEND">Frontend</option>
                    <option value="DATABASE">Database</option>
                    <option value="DEVOPS">DevOps</option>
                    <option value="TESTING">Testing</option>
                    <option value="SECURITY">Security</option>
                    <option value="FULLSTACK">Fullstack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value as TaskPriority })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Complexity</label>
                  <select
                    value={newTask.complexity}
                    onChange={(e) =>
                      setNewTask({ ...newTask, complexity: e.target.value as TaskComplexity })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detailed technical context and objectives..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Work / Subtasks (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="1. Create Mongoose model&#10;2. Add Zod validation schema&#10;3. Register endpoint"
                  value={(newTask.subtasks || []).join('\n')}
                  onChange={(e) =>
                    setNewTask({ ...newTask, subtasks: e.target.value.split('\n') })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Acceptance Criteria (One per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="- Valid users can register&#10;- Duplicate email rejected"
                  value={(newTask.acceptanceCriteria || []).join('\n')}
                  onChange={(e) =>
                    setNewTask({ ...newTask, acceptanceCriteria: e.target.value.split('\n') })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Test Cases (One per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="- successful registration test&#10;- duplicate email test"
                  value={(newTask.testCases || []).join('\n')}
                  onChange={(e) =>
                    setNewTask({ ...newTask, testCases: e.target.value.split('\n') })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
