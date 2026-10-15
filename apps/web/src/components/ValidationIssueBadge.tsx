import { 
  ValidationIssueType, 
  ValidationSeverity, 
  ValidationIssueStatus 
} from '@project-planner/types';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

interface SeverityBadgeProps {
  severity: ValidationSeverity;
}

export function ValidationSeverityBadge({ severity }: SeverityBadgeProps) {
  const CONFIG: Record<ValidationSeverity, { label: string; class: string; icon: typeof AlertCircle }> = {
    [ValidationSeverity.BLOCKING]: {
      label: 'Blocking',
      class: 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse',
      icon: AlertCircle,
    },
    [ValidationSeverity.WARNING]: {
      label: 'Warning',
      class: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      icon: AlertTriangle,
    },
    [ValidationSeverity.INFO]: {
      label: 'Advisory',
      class: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      icon: Info,
    },
  };

  const item = CONFIG[severity] || CONFIG[ValidationSeverity.INFO];
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${item.class}`}
    >
      <Icon className="w-3 h-3" />
      <span>{item.label}</span>
    </span>
  );
}

interface TypeBadgeProps {
  type: ValidationIssueType;
}

export function ValidationTypeBadge({ type }: TypeBadgeProps) {
  const CONFIG: Record<ValidationIssueType, { label: string; class: string }> = {
    [ValidationIssueType.CONTRADICTION]: {
      label: 'Contradiction',
      class: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    },
    [ValidationIssueType.AMBIGUITY]: {
      label: 'Ambiguity',
      class: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    },
    [ValidationIssueType.MISSING_INFO]: {
      label: 'Missing Info',
      class: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    },
    [ValidationIssueType.ASSUMPTION]: {
      label: 'Assumption',
      class: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
    [ValidationIssueType.RECOMMENDATION]: {
      label: 'Recommendation',
      class: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    },
  };

  const item = CONFIG[type] || {
    label: type,
    class: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border font-mono ${item.class}`}
    >
      {item.label}
    </span>
  );
}

interface StatusBadgeProps {
  status: ValidationIssueStatus;
}

export function ValidationStatusBadge({ status }: StatusBadgeProps) {
  const CONFIG: Record<ValidationIssueStatus, { label: string; class: string }> = {
    [ValidationIssueStatus.OPEN]: {
      label: 'Open',
      class: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    },
    [ValidationIssueStatus.RESOLVED]: {
      label: 'Resolved',
      class: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    },
    [ValidationIssueStatus.DISMISSED]: {
      label: 'Dismissed',
      class: 'bg-slate-800 text-slate-400 border-slate-700 line-through',
    },
  };

  const item = CONFIG[status] || CONFIG[ValidationIssueStatus.OPEN];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${item.class}`}
    >
      {item.label}
    </span>
  );
}
