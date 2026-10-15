import { useState, useEffect, useMemo, useCallback } from 'react';
import type { IRequirement, CreateRequirementRequest } from '@project-planner/types';
import { RequirementStatus, RequirementType } from '@project-planner/types';
import { api } from '../api/client.js';
import RequirementCard from './RequirementCard.js';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  Loader2, 
  X,
  FileCode2,
  RefreshCw
} from 'lucide-react';

interface RequirementsPanelProps {
  projectId: string;
  onRequirementChange?: () => void;
}

export default function RequirementsPanel({ projectId, onRequirementChange }: RequirementsPanelProps) {
  const [requirements, setRequirements] = useState<IRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New requirement form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<RequirementType>(RequirementType.FUNCTIONAL);
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [creating, setCreating] = useState(false);

  const loadRequirements = useCallback(async () => {
    try {
      const data = await api.requirements.list(projectId);
      setRequirements(data);
    } catch (err) {
      console.error('Failed to load requirements', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadRequirements();
    }
  }, [projectId, loadRequirements]);

  const handleExtract = async () => {
    setExtracting(true);
    try {
      const updated = await api.requirements.extract(projectId);
      setRequirements(updated);
      onRequirementChange?.();
    } catch (err) {
      console.error('Extraction failed', err);
    } finally {
      setExtracting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: RequirementStatus) => {
    try {
      const updated = await api.requirements.update(projectId, id, { status });
      setRequirements((prev) => prev.map((r) => (r.id === id ? updated : r)));
      onRequirementChange?.();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.requirements.delete(projectId, id);
      setRequirements((prev) => prev.filter((r) => r.id !== id));
      onRequirementChange?.();
    } catch (err) {
      console.error('Failed to delete requirement', err);
    }
  };

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    setCreating(true);
    try {
      const created = await api.requirements.create(projectId, {
        title: newTitle.trim() || undefined,
        description: newDescription.trim(),
        type: newType,
        priority: newPriority,
        status: RequirementStatus.CONFIRMED,
        source: 'USER',
        confidence: 1.0,
      });

      setRequirements((prev) => [...prev, created]);
      setNewTitle('');
      setNewDescription('');
      setShowAddModal(false);
      onRequirementChange?.();
    } catch (err) {
      console.error('Failed to create requirement', err);
    } finally {
      setCreating(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = requirements.length;
    const confirmed = requirements.filter((r) => r.status === RequirementStatus.CONFIRMED).length;
    const recommendations = requirements.filter((r) => r.status === RequirementStatus.RECOMMENDATION).length;
    const assumptions = requirements.filter((r) => r.status === RequirementStatus.ASSUMPTION).length;
    const questions = requirements.filter((r) => r.status === RequirementStatus.OPEN_QUESTION).length;
    return { total, confirmed, recommendations, assumptions, questions };
  }, [requirements]);

  // Filtered list
  const filtered = useMemo(() => {
    return requirements.filter((req) => {
      const matchesSearch =
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.reqId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.title && req.title.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'CONFIRMED' && req.status === RequirementStatus.CONFIRMED) ||
        (filterStatus === 'RECOMMENDATIONS' && req.status === RequirementStatus.RECOMMENDATION) ||
        (filterStatus === 'ASSUMPTIONS' && req.status === RequirementStatus.ASSUMPTION) ||
        (filterStatus === 'QUESTIONS' && req.status === RequirementStatus.OPEN_QUESTION);

      return matchesSearch && matchesStatus;
    });
  }, [requirements, searchQuery, filterStatus]);

  return (
    <div className="flex flex-col h-full">
      {/* Top Controls & Extraction Trigger */}
      <div className="pb-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4 text-brand-400" />
              Structured Requirements
            </span>
            <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
              {stats.total}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-xs font-semibold transition-all disabled:opacity-50"
              title="Extract requirements from conversation"
            >
              {extracting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Extract</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all"
              title="Manually add a requirement"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        {/* Quick status summary chips */}
        {requirements.length > 0 && (
          <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <div className="font-bold text-xs">{stats.confirmed}</div>
              <div>Confirmed</div>
            </div>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <div className="font-bold text-xs">{stats.recommendations}</div>
              <div>Recomms</div>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <div className="font-bold text-xs">{stats.assumptions}</div>
              <div>Assumptions</div>
            </div>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20">
              <div className="font-bold text-xs">{stats.questions}</div>
              <div>Questions</div>
            </div>
          </div>
        )}

        {/* Search & Filter pills */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter requirements by keyword or ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/80 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'CONFIRMED', label: 'Confirmed' },
              { key: 'RECOMMENDATIONS', label: 'Recomms' },
              { key: 'ASSUMPTIONS', label: 'Assumptions' },
              { key: 'QUESTIONS', label: 'Questions' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  filterStatus === tab.key
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-400" />
            <span>Loading requirements...</span>
          </div>
        ) : requirements.length === 0 ? (
          <div className="py-12 text-center text-slate-500 px-4">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-slate-600" />
            <h4 className="text-xs font-semibold text-slate-300 mb-1">
              No requirements registered yet
            </h4>
            <p className="text-[11px] text-slate-500 mb-4 max-w-xs mx-auto leading-relaxed">
              Requirements are automatically extracted from your chat answers. You can also trigger extraction manually.
            </p>
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-xs font-semibold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${extracting ? 'animate-spin' : ''}`} />
              <span>Extract from Chat</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No requirements match the selected filter.
          </div>
        ) : (
          filtered.map((req) => (
            <RequirementCard
              key={req.id}
              requirement={req}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Add Custom Requirement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-400" />
                Add Custom Requirement
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequirement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Email verification workflow"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="The system must allow users to register using an email address..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Requirement Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as RequirementType)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    {Object.values(RequirementType).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) =>
                      setNewPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="CRITICAL">P0 Critical</option>
                    <option value="HIGH">P1 High</option>
                    <option value="MEDIUM">P2 Medium</option>
                    <option value="LOW">P3 Low</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newDescription.trim()}
                  className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Add Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
