import { useState, useEffect, useMemo, useCallback } from 'react';
import type { IValidationIssue } from '@project-planner/types';
import { 
  ValidationIssueStatus, 
  ValidationIssueType, 
  ValidationSeverity 
} from '@project-planner/types';
import { api } from '../api/client.js';
import ValidationIssueCard from './ValidationIssueCard.js';
import { 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Filter 
} from 'lucide-react';

interface ValidationPanelProps {
  projectId: string;
  onIssuesChange?: () => void;
}

export default function ValidationPanel({ projectId, onIssuesChange }: ValidationPanelProps) {
  const [issues, setIssues] = useState<IValidationIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [filterTab, setFilterTab] = useState<string>('OPEN');
  const [searchQuery, setSearchQuery] = useState('');

  const loadIssues = useCallback(async () => {
    try {
      const data = await api.validation.list(projectId);
      setIssues(data);
    } catch (err) {
      console.error('Failed to load validation issues', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadIssues();
    }
  }, [projectId, loadIssues]);

  const handleRunAudit = async () => {
    setAuditing(true);
    try {
      const updated = await api.validation.run(projectId);
      setIssues(updated);
      onIssuesChange?.();
    } catch (err) {
      console.error('Audit run failed', err);
    } finally {
      setAuditing(false);
    }
  };

  const handleResolve = async (issueId: string, chosenOption?: string, notes?: string) => {
    try {
      const updated = await api.validation.resolve(projectId, issueId, {
        chosenOption,
        resolutionNotes: notes,
      });
      setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
      onIssuesChange?.();
    } catch (err) {
      console.error('Failed to resolve issue', err);
    }
  };

  const handleDismiss = async (issueId: string) => {
    try {
      const updated = await api.validation.dismiss(projectId, issueId);
      setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
      onIssuesChange?.();
    } catch (err) {
      console.error('Failed to dismiss issue', err);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const open = issues.filter((i) => i.status === ValidationIssueStatus.OPEN);
    const blocking = open.filter((i) => i.severity === ValidationSeverity.BLOCKING).length;
    const contradictions = open.filter((i) => i.type === ValidationIssueType.CONTRADICTION).length;
    const ambiguities = open.filter((i) => i.type === ValidationIssueType.AMBIGUITY).length;
    const missing = open.filter((i) => i.type === ValidationIssueType.MISSING_INFO).length;
    const resolved = issues.filter((i) => i.status === ValidationIssueStatus.RESOLVED).length;
    return { totalOpen: open.length, blocking, contradictions, ambiguities, missing, resolved };
  }, [issues]);

  // Filtered list
  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.affectedRequirements.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTab =
        filterTab === 'ALL' ||
        (filterTab === 'OPEN' && issue.status === ValidationIssueStatus.OPEN) ||
        (filterTab === 'BLOCKING' && issue.severity === ValidationSeverity.BLOCKING && issue.status === ValidationIssueStatus.OPEN) ||
        (filterTab === 'CONTRADICTIONS' && issue.type === ValidationIssueType.CONTRADICTION) ||
        (filterTab === 'AMBIGUITIES' && issue.type === ValidationIssueType.AMBIGUITY) ||
        (filterTab === 'RESOLVED' && issue.status === ValidationIssueStatus.RESOLVED);

      return matchesSearch && matchesTab;
    });
  }, [issues, searchQuery, filterTab]);

  return (
    <div className="flex flex-col h-full">
      {/* Top Header & Audit Action */}
      <div className="pb-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              {stats.blocking > 0 ? (
                <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              Validation & Quality
            </span>
            {stats.totalOpen > 0 && (
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                stats.blocking > 0
                  ? 'bg-red-500/15 text-red-300 border-red-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                {stats.totalOpen} open
              </span>
            )}
          </div>

          <button
            onClick={handleRunAudit}
            disabled={auditing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-xs font-semibold transition-all disabled:opacity-50"
            title="Scan requirements for ambiguities, contradictions, and gaps"
          >
            {auditing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Scan Spec</span>
          </button>
        </div>

        {/* Blocking Warning Banner */}
        {stats.blocking > 0 && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
            <span>
              <strong>{stats.blocking} Blocking issues:</strong> Implementation readiness is blocked until contradictions are resolved.
            </span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold">
          <div className={`p-1.5 rounded-lg border ${
            stats.blocking > 0 ? 'bg-red-500/10 text-red-300 border-red-500/30 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            <div className="text-xs font-bold">{stats.blocking}</div>
            <div>Blocking</div>
          </div>
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <div className="text-xs font-bold">{stats.contradictions}</div>
            <div>Conflicts</div>
          </div>
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
            <div className="text-xs font-bold">{stats.ambiguities}</div>
            <div>Vague</div>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <div className="text-xs font-bold">{stats.resolved}</div>
            <div>Resolved</div>
          </div>
        </div>

        {/* Search & Filter pills */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter issues by title, reqId..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/80 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
            {[
              { key: 'OPEN', label: 'Open' },
              { key: 'BLOCKING', label: 'Blocking' },
              { key: 'CONTRADICTIONS', label: 'Conflicts' },
              { key: 'AMBIGUITIES', label: 'Ambiguities' },
              { key: 'RESOLVED', label: 'Resolved' },
              { key: 'ALL', label: 'All' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  filterTab === tab.key
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

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-400" />
            <span>Loading validation analysis...</span>
          </div>
        ) : issues.length === 0 ? (
          <div className="py-12 text-center text-slate-500 px-4">
            <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-emerald-400/80" />
            <h4 className="text-xs font-bold text-white mb-1">
              Specification Quality Verified
            </h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto mb-4 leading-relaxed">
              No contradictions, critical ambiguities, or missing dependencies detected across the extracted requirements.
            </p>
            <button
              onClick={handleRunAudit}
              disabled={auditing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-xs font-semibold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${auditing ? 'animate-spin' : ''}`} />
              <span>Run Deep Scan</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No issues match the selected filter.
          </div>
        ) : (
          filtered.map((issue) => (
            <ValidationIssueCard
              key={issue.id}
              issue={issue}
              onResolve={handleResolve}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </div>
    </div>
  );
}
