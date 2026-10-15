import type { IProject } from '@project-planner/types';
import { 
  FolderKanban, 
  MessageSquare, 
  Clock, 
  ArrowRight, 
  Smartphone, 
  Globe, 
  Layers,
  Sparkles 
} from 'lucide-react';

interface ProjectCardProps {
  project: IProject;
  onClick: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  DRAFT: { label: 'Draft', class: 'bg-slate-800 text-slate-300 border-slate-700' },
  DISCOVERY: { label: 'Discovery', class: 'bg-brand-500/10 text-brand-300 border-brand-500/30' },
  NEEDS_CLARIFICATION: { label: 'Needs Clarification', class: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  WAITING_FOR_APPROVAL: { label: 'In Review', class: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
  READY_FOR_IMPLEMENTATION: { label: 'Ready to Build', class: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  FINALIZED: { label: 'Finalized', class: 'bg-teal-500/10 text-teal-300 border-teal-500/30' },
};

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const statusInfo = STATUS_CONFIG[project.status] || {
    label: project.status,
    class: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const getPlatformIcon = (platform?: string) => {
    if (!platform) return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    const p = platform.toLowerCase();
    if (p.includes('mobile') || p.includes('ios') || p.includes('android')) {
      return <Smartphone className="w-3.5 h-3.5 text-slate-400" />;
    }
    return <Globe className="w-3.5 h-3.5 text-slate-400" />;
  };

  const formattedDate = new Date(project.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative w-full text-left bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-brand-500/40 rounded-2xl p-6 transition-all duration-300 shadow-card hover:shadow-card-hover cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Ambient background glow on hover */}
      <div className="absolute -right-16 -top-16 w-32 h-32 bg-brand-500/5 group-hover:bg-brand-500/15 rounded-full blur-2xl transition-all duration-500 pointer-events-none"></div>

      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-brand-400 group-hover:scale-105 group-hover:bg-brand-500/10 group-hover:border-brand-500/30 transition-all flex-shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors truncate">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-slate-500">{project.version || 'v0.1'}</span>
                {project.discoveryPhase && (
                  <>
                    <span className="text-slate-700">•</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <Sparkles className="w-3 h-3 text-brand-400" />
                      Phase: {project.discoveryPhase}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.class} flex-shrink-0`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Initial Idea / Pitch */}
        <p className="text-sm text-slate-400 group-hover:text-slate-300 leading-relaxed line-clamp-2 mb-4">
          {project.initialIdea}
        </p>
      </div>

      {/* Footer Info Row */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 mt-2">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Target Platform */}
          {project.targetPlatform && (
            <div className="flex items-center gap-1.5 bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-800">
              {getPlatformIcon(project.targetPlatform)}
              <span className="font-medium text-slate-300">{project.targetPlatform}</span>
            </div>
          )}

          {/* Message Count */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>{project.messageCount || 0} messages</span>
          </div>

          {/* Updated Date */}
          <div className="flex items-center gap-1.5 text-slate-500 hidden sm:flex">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Action arrow */}
        <div className="flex items-center gap-1 text-brand-400 font-semibold group-hover:translate-x-1 transition-transform">
          <span className="text-xs hidden sm:inline">Open</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
