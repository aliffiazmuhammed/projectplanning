import { useState } from 'react';
import type { IRequirement } from '@project-planner/types';
import { RequirementStatus } from '@project-planner/types';
import { 
  RequirementStatusBadge, 
  RequirementTypeBadge, 
  RequirementPriorityBadge 
} from './RequirementBadge.js';
import { 
  Check, 
  Trash2, 
  User, 
  Bot, 
  MoreVertical, 
  ChevronDown 
} from 'lucide-react';

interface RequirementCardProps {
  requirement: IRequirement;
  onUpdateStatus: (id: string, status: RequirementStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function RequirementCard({
  requirement,
  onUpdateStatus,
  onDelete,
}: RequirementCardProps) {
  const [updating, setUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleConfirm = async () => {
    setUpdating(true);
    try {
      await onUpdateStatus(requirement.id, RequirementStatus.CONFIRMED);
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusSelect = async (status: RequirementStatus) => {
    setShowStatusMenu(false);
    setUpdating(true);
    try {
      await onUpdateStatus(requirement.id, status);
    } finally {
      setUpdating(false);
    }
  };

  const isConfirmed = requirement.status === RequirementStatus.CONFIRMED;
  const isRecommendation = requirement.status === RequirementStatus.RECOMMENDATION;
  const isAssumption = requirement.status === RequirementStatus.ASSUMPTION;

  const confidencePercent = Math.round((requirement.confidence || 0.8) * 100);

  return (
    <div className="group relative rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/90 p-4 transition-all shadow-sm">
      {/* Header row: ReqId, Type, Priority, and Status */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
            {requirement.reqId}
          </span>
          <RequirementTypeBadge type={requirement.type} />
          <RequirementPriorityBadge priority={requirement.priority} />
        </div>

        <div className="flex items-center gap-1.5">
          <RequirementStatusBadge status={requirement.status} />

          {/* Quick status dropdown toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              title="Change status"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1 z-30">
                {Object.values(RequirementStatus).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusSelect(st)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-800 flex items-center justify-between ${
                      requirement.status === st ? 'text-brand-400 bg-slate-800/50' : 'text-slate-300'
                    }`}
                  >
                    <span>{st}</span>
                    {requirement.status === st && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title (if present) */}
      {requirement.title && (
        <h4 className="text-xs font-bold text-slate-100 mb-1 leading-snug">
          {requirement.title}
        </h4>
      )}

      {/* Description */}
      <p className="text-xs text-slate-300 leading-relaxed mb-3">
        {requirement.description}
      </p>

      {/* Footer Meta Row: Source, Confidence, and Quick Actions */}
      <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          {/* Source */}
          <span className="flex items-center gap-1 text-slate-500">
            {requirement.source === 'USER' ? (
              <User className="w-3 h-3 text-blue-400" />
            ) : (
              <Bot className="w-3 h-3 text-brand-400" />
            )}
            <span>{requirement.source === 'USER' ? 'User confirmed' : 'Agent extracted'}</span>
          </span>

          {/* Confidence */}
          <span className="flex items-center gap-1 text-slate-500">
            <span>Confidence:</span>
            <span className={`font-mono font-medium ${confidencePercent >= 90 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {confidencePercent}%
            </span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Quick 1-click Approve for Recommendations/Assumptions */}
          {(isRecommendation || isAssumption) && (
            <button
              onClick={handleConfirm}
              disabled={updating}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium text-[10px] transition-colors"
              title="Confirm and lock this requirement"
            >
              <Check className="w-3 h-3" />
              <span>Confirm</span>
            </button>
          )}

          <button
            onClick={() => onDelete(requirement.id)}
            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete requirement"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
