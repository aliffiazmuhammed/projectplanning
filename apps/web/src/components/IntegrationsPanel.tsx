import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Lock,
  Key,
  DollarSign,
  CheckCircle2,
  Clock,
  Globe,
  ArrowRight,
  X,
  Filter,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api/client';
import type {
  IThirdPartyIntegration,
  IHumanAction,
  HumanActionCategory,
  IntegrationCategory,
  BlockingStatus,
  HumanActionStatus,
  CreateIntegrationRequest,
  CreateHumanActionRequest,
} from '@project-planner/types';

interface IntegrationsPanelProps {
  projectId: string;
}

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'integrations'>('actions');
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [integrations, setIntegrations] = useState<IThirdPartyIntegration[]>([]);
  const [actions, setActions] = useState<IHumanAction[]>([]);
  const [stats, setStats] = useState({
    totalIntegrations: 0,
    configuredIntegrations: 0,
    totalActions: 0,
    completedActions: 0,
    pendingBlockingActions: 0,
  });

  // Filters
  const [actionCategoryFilter, setActionCategoryFilter] = useState<string>('ALL');
  const [actionBlockingFilter, setActionBlockingFilter] = useState<string>('ALL');
  const [integrationCategoryFilter, setIntegrationCategoryFilter] = useState<string>('ALL');

  // Expanded items
  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({});
  const [expandedIntegrations, setExpandedIntegrations] = useState<Record<string, boolean>>({});

  // Modals
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [showAddIntegrationModal, setShowAddIntegrationModal] = useState(false);

  // New action form state
  const [newAction, setNewAction] = useState<Partial<CreateHumanActionRequest>>({
    title: '',
    category: 'ACCOUNT_SETUP',
    whyRequired: '',
    instructions: [''],
    credentialsRequired: [],
    whereToObtain: '',
    isSecret: false,
    secretHandlingInstructions: '',
    aiActionAfterward: '',
    blockingStatus: 'BLOCKING',
  });

  // New integration form state
  const [newIntegration, setNewIntegration] = useState<Partial<CreateIntegrationRequest>>({
    service: '',
    category: 'AUTH',
    purpose: '',
    accountRequired: true,
    securityClassification: 'SECRET',
    blockingStatus: 'BLOCKING',
    credentialsRequired: [],
    humanSetupSteps: [''],
    aiResponsibilities: [''],
    humanResponsibilities: [''],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.integrations.get(projectId);
      setIntegrations(data.integrations || []);
      setActions(data.actions || []);
      setStats(data.stats);

      // Expand first 2 actions by default
      const initialExpanded: Record<string, boolean> = {};
      data.actions?.slice(0, 2).forEach((a) => {
        initialExpanded[a.id] = true;
      });
      setExpandedActions(initialExpanded);
    } catch (err) {
      console.error('Failed to load integrations & actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleDiscover = async () => {
    try {
      setDiscovering(true);
      const data = await api.integrations.discover(projectId);
      setIntegrations(data.integrations || []);
      setActions(data.actions || []);
      setStats(data.stats);

      const initialExpanded: Record<string, boolean> = {};
      data.actions?.slice(0, 3).forEach((a) => {
        initialExpanded[a.id] = true;
      });
      setExpandedActions(initialExpanded);
    } catch (err) {
      console.error('Failed to discover integrations & actions:', err);
    } finally {
      setDiscovering(false);
    }
  };

  const handleToggleActionStatus = async (action: IHumanAction) => {
    const nextStatus: HumanActionStatus =
      action.completionStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      // Optimistic update
      setActions((prev) =>
        prev.map((a) =>
          a.id === action.id ? { ...a, completionStatus: nextStatus } : a,
        ),
      );
      setStats((prev) => ({
        ...prev,
        completedActions:
          nextStatus === 'COMPLETED'
            ? prev.completedActions + 1
            : Math.max(0, prev.completedActions - 1),
        pendingBlockingActions:
          action.blockingStatus === 'BLOCKING'
            ? nextStatus === 'COMPLETED'
              ? Math.max(0, prev.pendingBlockingActions - 1)
              : prev.pendingBlockingActions + 1
            : prev.pendingBlockingActions,
      }));

      await api.actions.updateStatus(projectId, action.id, {
        status: nextStatus,
      });
    } catch (err) {
      console.error('Failed to update action status:', err);
      loadData();
    }
  };

  const toggleActionExpand = (id: string) => {
    setExpandedActions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleIntegrationExpand = (id: string) => {
    setExpandedIntegrations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.title || !newAction.whyRequired || !newAction.whereToObtain || !newAction.aiActionAfterward) {
      return;
    }
    try {
      const validInstructions = (newAction.instructions || []).filter((s) => s.trim().length > 0);
      await api.actions.create(projectId, {
        title: newAction.title,
        category: (newAction.category as HumanActionCategory) || 'ACCOUNT_SETUP',
        whyRequired: newAction.whyRequired,
        instructions: validInstructions.length > 0 ? validInstructions : ['Complete setup in provider dashboard'],
        whereToObtain: newAction.whereToObtain,
        credentialsRequired: newAction.credentialsRequired || [],
        permissionsNeeded: newAction.permissionsNeeded,
        isSecret: newAction.isSecret ?? false,
        secretHandlingInstructions: newAction.secretHandlingInstructions,
        aiActionAfterward: newAction.aiActionAfterward,
        blockingStatus: (newAction.blockingStatus as BlockingStatus) || 'BLOCKING',
      });
      setShowAddActionModal(false);
      setNewAction({
        title: '',
        category: 'ACCOUNT_SETUP',
        whyRequired: '',
        instructions: [''],
        credentialsRequired: [],
        whereToObtain: '',
        isSecret: false,
        secretHandlingInstructions: '',
        aiActionAfterward: '',
        blockingStatus: 'BLOCKING',
      });
      loadData();
    } catch (err) {
      console.error('Failed to create human action:', err);
    }
  };

  const handleCreateIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntegration.service || !newIntegration.purpose) return;
    try {
      await api.integrations.create(projectId, {
        service: newIntegration.service,
        category: (newIntegration.category as IntegrationCategory) || 'OTHER',
        purpose: newIntegration.purpose,
        accountRequired: newIntegration.accountRequired ?? true,
        accountName: newIntegration.accountName,
        credentialsRequired: newIntegration.credentialsRequired || [],
        humanSetupSteps: (newIntegration.humanSetupSteps || []).filter((s) => s.trim().length > 0),
        aiResponsibilities: (newIntegration.aiResponsibilities || []).filter((s) => s.trim().length > 0),
        humanResponsibilities: (newIntegration.humanResponsibilities || []).filter((s) => s.trim().length > 0),
        securityClassification: newIntegration.securityClassification || 'SECRET',
        blockingStatus: newIntegration.blockingStatus || 'BLOCKING',
        estimatedCost: newIntegration.estimatedCost,
        docsUrl: newIntegration.docsUrl,
      });
      setShowAddIntegrationModal(false);
      setNewIntegration({
        service: '',
        category: 'AUTH',
        purpose: '',
        accountRequired: true,
        securityClassification: 'SECRET',
        blockingStatus: 'BLOCKING',
        credentialsRequired: [],
        humanSetupSteps: [''],
        aiResponsibilities: [''],
        humanResponsibilities: [''],
      });
      loadData();
    } catch (err) {
      console.error('Failed to create integration:', err);
    }
  };

  // Filtered actions
  const filteredActions = actions.filter((action) => {
    if (actionCategoryFilter !== 'ALL' && action.category !== actionCategoryFilter) {
      return false;
    }
    if (actionBlockingFilter === 'BLOCKING' && action.blockingStatus !== 'BLOCKING') {
      return false;
    }
    if (actionBlockingFilter === 'NON_BLOCKING' && action.blockingStatus !== 'NON_BLOCKING') {
      return false;
    }
    if (actionBlockingFilter === 'PENDING' && action.completionStatus === 'COMPLETED') {
      return false;
    }
    if (actionBlockingFilter === 'COMPLETED' && action.completionStatus !== 'COMPLETED') {
      return false;
    }
    return true;
  });

  // Filtered integrations
  const filteredIntegrations = integrations.filter((item) => {
    if (integrationCategoryFilter !== 'ALL' && item.category !== integrationCategoryFilter) {
      return false;
    }
    return true;
  });

  const completionPercentage =
    stats.totalActions > 0
      ? Math.round((stats.completedActions / stats.totalActions) * 100)
      : 0;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Top Header & Metrics Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Integrations & Human Actions</h2>
              <p className="text-xs text-slate-400">External services and prerequisites for implementation</p>
            </div>
          </div>
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {discovering ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{discovering ? 'Analyzing Dependencies...' : 'Scan Integrations & Actions'}</span>
          </button>
        </div>

        {/* Action KPI and Progress Bar */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-medium">Implementation Readiness Checklist</span>
            <span className="font-semibold text-emerald-400">
              {stats.completedActions} / {stats.totalActions} Done ({completionPercentage}%)
            </span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800/80">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">External Services</div>
              <div className="text-sm font-bold text-white mt-0.5">{stats.totalIntegrations}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800/80">
              <div className="text-amber-400 text-[10px] uppercase font-semibold flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Blocking Actions</span>
              </div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {stats.pendingBlockingActions}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800/80">
              <div className="text-emerald-400 text-[10px] uppercase font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Completed</span>
              </div>
              <div className="text-sm font-bold text-emerald-300 mt-0.5">
                {stats.completedActions}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'actions'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Human Action Plan</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                {actions.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'integrations'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>External Services</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                {integrations.length}
              </span>
            </button>
          </div>

          <button
            onClick={() =>
              activeTab === 'actions'
                ? setShowAddActionModal(true)
                : setShowAddIntegrationModal(true)
            }
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{activeTab === 'actions' ? 'Add Action' : 'Add Service'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-emerald-400" />
            <p className="text-xs">Loading external dependencies and human action checklist...</p>
          </div>
        ) : activeTab === 'actions' ? (
          /* =========================================================================
             TAB 1: HUMAN ACTION PLAN (M8 Core)
             ========================================================================= */
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Status:
                </span>
                {['ALL', 'BLOCKING', 'PENDING', 'COMPLETED'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActionBlockingFilter(filter)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      actionBlockingFilter === filter
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter === 'ALL'
                      ? 'All'
                      : filter === 'BLOCKING'
                      ? '⚠️ Blocking Only'
                      : filter === 'PENDING'
                      ? '⏳ Pending'
                      : '✅ Completed'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <select
                  value={actionCategoryFilter}
                  onChange={(e) => setActionCategoryFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="ACCOUNT_SETUP">Account Setup</option>
                  <option value="CREDENTIALS">Credentials & Keys</option>
                  <option value="BILLING">Billing & Plans</option>
                  <option value="LEGAL_COMPLIANCE">Legal & Compliance</option>
                  <option value="DNS_DOMAIN">DNS & Domains</option>
                  <option value="VERIFICATION">Identity Verification</option>
                  <option value="APPROVAL">Approvals</option>
                </select>
              </div>
            </div>

            {/* Blocking Warning Banner */}
            {stats.pendingBlockingActions > 0 && (
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-amber-200">
                    {stats.pendingBlockingActions} Blocking Pre-Implementation Action
                    {stats.pendingBlockingActions > 1 ? 's' : ''}
                  </p>
                  <p className="text-amber-400/80 mt-0.5">
                    The autonomous coding agent will pause implementation at these points until external accounts or credentials are created.
                  </p>
                </div>
              </div>
            )}

            {filteredActions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No human actions match filters</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click &quot;Scan Integrations & Actions&quot; to auto-generate the complete founder checklist.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActions.map((action) => {
                  const isCompleted = action.completionStatus === 'COMPLETED';
                  const isExpanded = !!expandedActions[action.id];

                  return (
                    <div
                      key={action.id}
                      className={`border rounded-xl transition-all ${
                        isCompleted
                          ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                          : action.blockingStatus === 'BLOCKING'
                          ? 'bg-slate-800/40 border-amber-500/30 shadow-sm'
                          : 'bg-slate-800/30 border-slate-800'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="p-3 flex items-start gap-3">
                        <button
                          onClick={() => handleToggleActionStatus(action)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                          title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                        >
                          {isCompleted ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                          )}
                        </button>

                        <div
                          className="flex-1 cursor-pointer select-none"
                          onClick={() => toggleActionExpand(action.id)}
                        >
                          <div className="flex items-center flex-wrap gap-1.5 mb-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {action.actionId}
                            </span>

                            {action.blockingStatus === 'BLOCKING' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                <AlertCircle className="w-2.5 h-2.5" />
                                BLOCKING
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                OPTIONAL / NON-BLOCKING
                              </span>
                            )}

                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800/90 text-slate-400">
                              {action.category.replace('_', ' ')}
                            </span>

                            {isCompleted && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Completed
                              </span>
                            )}
                          </div>

                          <h3
                            className={`text-sm font-semibold transition-colors ${
                              isCompleted
                                ? 'line-through text-slate-400'
                                : 'text-slate-100 hover:text-emerald-300'
                            }`}
                          >
                            {action.title}
                          </h3>

                          {/* Founder "Why It Is Required" snippet */}
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {action.whyRequired}
                          </p>
                        </div>

                        <button
                          onClick={() => toggleActionExpand(action.id)}
                          className="text-slate-500 hover:text-slate-300 p-1"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Expandable Step-by-Step Instructions & AI Hand-off */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3 text-xs">
                          {/* Where to obtain */}
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Where to perform / Dashboard:</span>
                            {action.whereToObtain.startsWith('http') ? (
                              <a
                                href={action.whereToObtain}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 underline underline-offset-2"
                              >
                                Open Portal <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="font-mono text-slate-200">{action.whereToObtain}</span>
                            )}
                          </div>

                          {/* Prerequisites if any */}
                          {action.prerequisites && action.prerequisites.length > 0 && (
                            <div>
                              <span className="text-slate-400 font-medium block mb-1">
                                Prerequisites:
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                                {action.prerequisites.map((p, idx) => (
                                  <li key={idx}>{p}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Instructions written for nontechnical founder */}
                          <div>
                            <span className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1">
                              <span>Step-by-Step Instructions (Founder Guide):</span>
                            </span>
                            <div className="space-y-1.5 pl-1">
                              {action.instructions.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-slate-300">
                                  <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span className="leading-relaxed">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Credentials & Secrets to obtain */}
                          {action.credentialsRequired && action.credentialsRequired.length > 0 && (
                            <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                              <div className="flex items-center gap-1.5 text-amber-300 font-medium mb-1">
                                <Key className="w-3 h-3" />
                                <span>Keys / Tokens to Obtain:</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {action.credentialsRequired.map((cred, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-slate-800 text-amber-200 border border-slate-700 font-mono text-[11px]"
                                  >
                                    {cred}
                                  </span>
                                ))}
                              </div>

                              {action.isSecret && (
                                <div className="mt-2 text-[11px] text-amber-400/90 flex items-start gap-1 bg-amber-950/20 p-2 rounded border border-amber-500/20">
                                  <Lock className="w-3 h-3 shrink-0 mt-0.5" />
                                  <span>
                                    {action.secretHandlingInstructions ||
                                      'Store strictly in local .env or secret manager. Never commit to git or paste into chat.'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* AI Action Afterward (Collaborative hand-off) */}
                          <div className="bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded-lg">
                            <span className="text-emerald-400 font-semibold flex items-center gap-1 mb-1">
                              <Sparkles className="w-3 h-3" /> What the AI will do afterward:
                            </span>
                            <p className="text-emerald-200/90 leading-relaxed">
                              {action.aiActionAfterward}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
             TAB 2: THIRD-PARTY INTEGRATIONS (External Dependencies)
             ========================================================================= */
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Filter className="w-3 h-3" /> Category:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  'ALL',
                  'AUTH',
                  'PAYMENT',
                  'EMAIL',
                  'SMS',
                  'STORAGE',
                  'AI_LLM',
                  'DATABASE_CLOUD',
                  'ANALYTICS',
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setIntegrationCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                      integrationCategoryFilter === cat
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Services' : cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {filteredIntegrations.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No external services found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click &quot;Scan Integrations & Actions&quot; to inspect requirements and detect APIs, Auth, and Storage.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIntegrations.map((item) => {
                  const isExpanded = !!expandedIntegrations[item.id];

                  return (
                    <div
                      key={item.id}
                      className="border border-slate-800 rounded-xl bg-slate-800/30 overflow-hidden"
                    >
                      {/* Integration Card Header */}
                      <div
                        className="p-3 flex items-start justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                        onClick={() => toggleIntegrationExpand(item.id)}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-white">{item.service}</span>
                            <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {item.category}
                            </span>
                            {item.blockingStatus === 'BLOCKING' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                BLOCKING
                              </span>
                            )}
                            <span className="text-xs text-slate-500 font-mono">
                              ({item.credentialsRequired?.length || 0} keys)
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{item.purpose}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.estimatedCost && (
                            <span className="text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 hidden sm:inline-block">
                              {item.estimatedCost}
                            </span>
                          )}
                          <button className="text-slate-500 hover:text-slate-300 p-1">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Integration Details */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-800/80 space-y-4 text-xs bg-slate-900/40">
                          {/* Cost & Account Info */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                              <span className="text-slate-400 font-medium block mb-0.5">
                                Account Requirement:
                              </span>
                              <span className="text-slate-200">
                                {item.accountName || 'Provider developer account required'}
                              </span>
                            </div>
                            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                              <span className="text-slate-400 font-medium block mb-0.5">
                                Estimated Cost:
                              </span>
                              <span className="text-slate-200">
                                {item.estimatedCost || 'Free tier available'}
                              </span>
                            </div>
                          </div>

                          {/* Credentials Required Table */}
                          {item.credentialsRequired && item.credentialsRequired.length > 0 && (
                            <div>
                              <span className="text-slate-300 font-semibold block mb-2 flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5 text-amber-400" />
                                <span>Credentials & Security Classification:</span>
                              </span>
                              <div className="border border-slate-800 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-800/80 text-slate-400 font-medium border-b border-slate-800">
                                    <tr>
                                      <th className="p-2">Environment Variable</th>
                                      <th className="p-2">Level</th>
                                      <th className="p-2">Where to find</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800 text-slate-300">
                                    {item.credentialsRequired.map((c, idx) => (
                                      <tr key={idx} className="hover:bg-slate-800/30">
                                        <td className="p-2 font-mono text-emerald-300 font-medium">
                                          {c.name}
                                        </td>
                                        <td className="p-2">
                                          <span
                                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                              c.classification === 'SECRET'
                                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                : c.classification === 'SENSITIVE'
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                : 'bg-slate-800 text-slate-300'
                                            }`}
                                          >
                                            {c.classification}
                                          </span>
                                        </td>
                                        <td className="p-2 text-slate-400 text-[11px]">
                                          {c.whereToFind || c.description}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Responsibility Split: Human vs AI */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
                              <span className="text-amber-300 font-semibold flex items-center gap-1.5 mb-2">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Human Responsibilities:</span>
                              </span>
                              <ul className="space-y-1 text-slate-300">
                                {item.humanResponsibilities?.map((hr, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-amber-400 mt-0.5">•</span>
                                    <span>{hr}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
                              <span className="text-emerald-300 font-semibold flex items-center gap-1.5 mb-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI Responsibilities:</span>
                              </span>
                              <ul className="space-y-1 text-slate-300">
                                {item.aiResponsibilities?.map((ar, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-emerald-400 mt-0.5">•</span>
                                    <span>{ar}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Documentation Link */}
                          {item.docsUrl && (
                            <div className="pt-1">
                              <a
                                href={item.docsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                              >
                                Official Documentation <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
         MODAL 1: ADD MANUAL HUMAN ACTION
         ========================================================================= */}
      {showAddActionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 text-slate-100 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" /> Add Required Human Action
              </h3>
              <button
                onClick={() => setShowAddActionModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAction} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Purchase domain name and configure DNS"
                  value={newAction.title}
                  onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newAction.category}
                    onChange={(e) =>
                      setNewAction({
                        ...newAction,
                        category: e.target.value as HumanActionCategory,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ACCOUNT_SETUP">Account Setup</option>
                    <option value="CREDENTIALS">Credentials & Keys</option>
                    <option value="BILLING">Billing</option>
                    <option value="LEGAL_COMPLIANCE">Legal Compliance</option>
                    <option value="DNS_DOMAIN">DNS & Domain</option>
                    <option value="VERIFICATION">Identity Verification</option>
                    <option value="APPROVAL">Production Approval</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Blocking Status</label>
                  <select
                    value={newAction.blockingStatus}
                    onChange={(e) =>
                      setNewAction({
                        ...newAction,
                        blockingStatus: e.target.value as BlockingStatus,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="BLOCKING">BLOCKING (Must complete)</option>
                    <option value="NON_BLOCKING">NON_BLOCKING (Optional)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Why It Is Required (Founder Plain-Language)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain why the human must do this and why the AI cannot..."
                  value={newAction.whyRequired}
                  onChange={(e) => setNewAction({ ...newAction, whyRequired: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Where to Obtain (URL or Dashboard path)
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://dashboard.stripe.com/register"
                  value={newAction.whereToObtain}
                  onChange={(e) => setNewAction({ ...newAction, whereToObtain: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Instructions (One step per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="1. Go to dashboard&#10;2. Click Generate API Key&#10;3. Copy Secret Key"
                  value={(newAction.instructions || []).join('\n')}
                  onChange={(e) =>
                    setNewAction({
                      ...newAction,
                      instructions: e.target.value.split('\n'),
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  What the AI Will Do Afterward
                </label>
                <input
                  type="text"
                  required
                  placeholder="The AI agent will configure the SDK and wire up webhook verification"
                  value={newAction.aiActionAfterward}
                  onChange={(e) =>
                    setNewAction({ ...newAction, aiActionAfterward: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddActionModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  Save Human Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 2: ADD MANUAL INTEGRATION
         ========================================================================= */}
      {showAddIntegrationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 text-slate-100 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" /> Add External Third-Party Service
              </h3>
              <button
                onClick={() => setShowAddIntegrationModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIntegration} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Service Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Resend, Twilio, Stripe"
                    value={newIntegration.service}
                    onChange={(e) =>
                      setNewIntegration({ ...newIntegration, service: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newIntegration.category}
                    onChange={(e) =>
                      setNewIntegration({
                        ...newIntegration,
                        category: e.target.value as IntegrationCategory,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="AUTH">Authentication</option>
                    <option value="PAYMENT">Payments</option>
                    <option value="EMAIL">Transactional Email</option>
                    <option value="SMS">SMS / WhatsApp</option>
                    <option value="STORAGE">Cloud Storage</option>
                    <option value="MAPS">Maps & Geo</option>
                    <option value="AI_LLM">AI & LLMs</option>
                    <option value="ANALYTICS">Analytics</option>
                    <option value="MONITORING">Monitoring & Logs</option>
                    <option value="DATABASE_CLOUD">Cloud Database</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Purpose</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Why is this integration needed for the product?"
                  value={newIntegration.purpose}
                  onChange={(e) =>
                    setNewIntegration({ ...newIntegration, purpose: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Estimated Cost</label>
                  <input
                    type="text"
                    placeholder="e.g. Free tier up to 3,000/mo"
                    value={newIntegration.estimatedCost}
                    onChange={(e) =>
                      setNewIntegration({ ...newIntegration, estimatedCost: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Docs URL</label>
                  <input
                    type="text"
                    placeholder="https://resend.com/docs"
                    value={newIntegration.docsUrl}
                    onChange={(e) =>
                      setNewIntegration({ ...newIntegration, docsUrl: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddIntegrationModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  Save Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
