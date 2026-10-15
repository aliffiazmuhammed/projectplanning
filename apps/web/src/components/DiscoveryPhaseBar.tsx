import { DiscoveryPhase } from '@project-planner/types';
import { 
  Target, 
  Users, 
  Sparkles, 
  AlertTriangle, 
  Cpu, 
  Palette, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';

interface DiscoveryPhaseBarProps {
  currentPhase: DiscoveryPhase;
}

interface PhaseConfig {
  key: DiscoveryPhase;
  label: string;
  icon: typeof Target;
  tagline: string;
}

const PHASES: PhaseConfig[] = [
  { key: DiscoveryPhase.GOALS, label: 'Goals', icon: Target, tagline: 'Mission & value proposition' },
  { key: DiscoveryPhase.USERS, label: 'Users', icon: Users, tagline: 'Personas & technical level' },
  { key: DiscoveryPhase.FEATURES, label: 'Features', icon: Sparkles, tagline: 'Workflows & capabilities' },
  { key: DiscoveryPhase.CONSTRAINTS, label: 'Constraints', icon: AlertTriangle, tagline: 'Budget, timing & limits' },
  { key: DiscoveryPhase.INTEGRATIONS, label: 'Integrations', icon: Cpu, tagline: 'APIs, auth & 3rd parties' },
  { key: DiscoveryPhase.UX, label: 'UX & Design', icon: Palette, tagline: 'Theme, layout & screens' },
  { key: DiscoveryPhase.COMPLETE, label: 'Ready', icon: CheckCircle2, tagline: 'Specification synthesis' },
];

export default function DiscoveryPhaseBar({ currentPhase }: DiscoveryPhaseBarProps) {
  const currentIndex = PHASES.findIndex((p) => p.key === currentPhase);
  const activePhaseInfo = PHASES[currentIndex] || PHASES[0];

  return (
    <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Stepper list */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {PHASES.map((phase, index) => {
            const Icon = phase.icon;
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;

            return (
              <div key={phase.key} className="flex items-center flex-shrink-0">
                <div
                  title={`${phase.label}: ${phase.tagline}`}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 select-none ${
                    isCurrent
                      ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 shadow-glow'
                      : isDone
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15'
                      : 'text-slate-500 border border-transparent hover:text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-brand-400 animate-pulse' : 'text-slate-500'}`} />
                    )}
                  </div>
                  <span className={`tracking-tight ${isCurrent ? 'font-semibold text-white' : ''}`}>
                    {phase.label}
                  </span>

                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-ping ml-0.5"></span>
                  )}
                </div>

                {index < PHASES.length - 1 && (
                  <div className="flex items-center px-1 text-slate-700">
                    <ChevronRight className={`w-3 h-3 ${isDone ? 'text-emerald-500/50' : 'text-slate-800'}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Current phase hint */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 pl-4 border-l border-slate-800/80">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Active:</span>
          <span className="text-slate-200 font-medium">{activePhaseInfo?.label}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 italic text-[11px] truncate max-w-[200px]">
            {activePhaseInfo?.tagline}
          </span>
        </div>
      </div>
    </div>
  );
}
