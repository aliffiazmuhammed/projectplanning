import { RequirementStatus, RequirementType, type RequirementPriority } from '@project-planner/types';

interface StatusBadgeProps {
  status: RequirementStatus;
}

export function RequirementStatusBadge({ status }: StatusBadgeProps) {
  const CONFIG: Record<RequirementStatus, { label: string; class: string }> = {
    [RequirementStatus.CONFIRMED]: {
      label: 'Confirmed',
      class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    [RequirementStatus.RECOMMENDATION]: {
      label: 'Recommendation',
      class: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    },
    [RequirementStatus.ASSUMPTION]: {
      label: 'Assumption',
      class: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    },
    [RequirementStatus.OPEN_QUESTION]: {
      label: 'Open Question',
      class: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    },
    [RequirementStatus.CONTRADICTION]: {
      label: 'Contradiction',
      class: 'bg-red-500/20 text-red-200 border-red-500/40 animate-pulse',
    },
    [RequirementStatus.CONSTRAINT]: {
      label: 'Constraint',
      class: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    },
    [RequirementStatus.DEPRECATED]: {
      label: 'Deprecated',
      class: 'bg-slate-800 text-slate-400 border-slate-700 line-through',
    },
  };

  const info = CONFIG[status] || {
    label: status,
    class: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${info.class}`}
    >
      {info.label}
    </span>
  );
}

interface TypeBadgeProps {
  type: RequirementType;
}

export function RequirementTypeBadge({ type }: TypeBadgeProps) {
  const TYPE_CLASSES: Record<RequirementType, string> = {
    [RequirementType.FUNCTIONAL]: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    [RequirementType.NON_FUNCTIONAL]: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    [RequirementType.BUSINESS_RULE]: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
    [RequirementType.SECURITY]: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    [RequirementType.PERFORMANCE]: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    [RequirementType.ACCESSIBILITY]: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    [RequirementType.UX]: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
    [RequirementType.TECHNICAL]: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    [RequirementType.DEPLOYMENT]: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    [RequirementType.INTEGRATION]: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    [RequirementType.CONSTRAINT]: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  };

  const styleClass = TYPE_CLASSES[type] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border font-mono ${styleClass}`}
    >
      {type}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: RequirementPriority;
}

export function RequirementPriorityBadge({ priority }: PriorityBadgeProps) {
  const PRIORITY_CLASSES: Record<RequirementPriority, { label: string; class: string }> = {
    CRITICAL: { label: 'P0 Critical', class: 'text-red-400 font-bold' },
    HIGH: { label: 'P1 High', class: 'text-amber-400 font-semibold' },
    MEDIUM: { label: 'P2 Med', class: 'text-blue-400 font-medium' },
    LOW: { label: 'P3 Low', class: 'text-slate-400 font-medium' },
  };

  const info = PRIORITY_CLASSES[priority] || { label: priority, class: 'text-slate-400' };

  return <span className={`text-[10px] uppercase tracking-wider ${info.class}`}>{info.label}</span>;
}
