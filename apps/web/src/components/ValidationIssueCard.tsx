import { useState } from 'react';
import type { IValidationIssue } from '@project-planner/types';
import { ValidationIssueStatus } from '@project-planner/types';
import { 
  ValidationSeverityBadge, 
  ValidationTypeBadge, 
  ValidationStatusBadge 
} from './ValidationIssueBadge.js';
import { 
  Check, 
  CheckCircle2, 
  Layers, 
  CornerDownRight, 
  Loader2, 
  EyeOff 
} from 'lucide-react';

interface ValidationIssueCardProps {
  issue: IValidationIssue;
  onResolve: (id: string, chosenOption?: string, notes?: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

export default function ValidationIssueCard({
  issue,
  onResolve,
  onDismiss,
}: ValidationIssueCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isOpen = issue.status === ValidationIssueStatus.OPEN;
  const isResolved = issue.status === ValidationIssueStatus.RESOLVED;

  const handleApplyResolution = async () => {
    setLoading(true);
    try {
      await onResolve(issue.id, selectedOption || undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    setLoading(true);
    try {
      await onDismiss(issue.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        isResolved
          ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
          : issue.severity === 'BLOCKING'
          ? 'bg-red-500/5 border-red-500/30'
          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700/80'
      }`}
    >
      {/* Header Badges */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <ValidationSeverityBadge severity={issue.severity} />
          <ValidationTypeBadge type={issue.type} />
        </div>

        <ValidationStatusBadge status={issue.status} />
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-white mb-1.5 leading-snug">
        {issue.title}
      </h4>

      {/* Description */}
      <p className="text-xs text-slate-300 leading-relaxed mb-3">
        {issue.description}
      </p>

      {/* Affected Requirements Tags */}
      {issue.affectedRequirements.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            Affected:
          </span>
          {issue.affectedRequirements.map((reqId) => (
            <span
              key={reqId}
              className="font-mono text-[10px] font-bold text-brand-300 bg-brand-500/10 border border-brand-500/20 px-1.5 py-0.5 rounded"
            >
              {reqId}
            </span>
          ))}
        </div>
      )}

      {/* Suggested Resolutions List (if Open) */}
      {isOpen && issue.suggestedResolutions.length > 0 && (
        <div className="my-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <CornerDownRight className="w-3 h-3 text-brand-400" />
            <span>Suggested Resolutions:</span>
          </div>

          <div className="space-y-1.5">
            {issue.suggestedResolutions.map((option, idx) => (
              <label
                key={idx}
                className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedOption === option
                    ? 'bg-brand-600/15 border-brand-500/50 text-white font-medium'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <input
                  type="radio"
                  name={`resolution-${issue.id}`}
                  checked={selectedOption === option}
                  onChange={() => setSelectedOption(option)}
                  className="mt-0.5 text-brand-500 focus:ring-brand-500/40"
                />
                <span className="leading-snug">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Notes (if Resolved) */}
      {isResolved && issue.resolutionNotes && (
        <div className="my-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
          <span className="leading-snug">{issue.resolutionNotes}</span>
        </div>
      )}

      {/* Footer Action Buttons */}
      {isOpen && (
        <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs mt-1">
          <button
            onClick={handleDismiss}
            disabled={loading}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Dismiss</span>
          </button>

          <button
            onClick={handleApplyResolution}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3" />
            )}
            <span>{selectedOption ? 'Apply Resolution' : 'Mark Resolved'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
