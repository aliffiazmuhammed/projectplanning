import { useState } from 'react';
import type { CreateProjectRequest } from '@project-planner/types';
import { 
  Sparkles, 
  X, 
  FolderPlus, 
  Lightbulb, 
  FileText, 
  Layers, 
  ArrowRight, 
  Loader2 
} from 'lucide-react';

interface CreateProjectFormProps {
  onSubmit: (data: CreateProjectRequest) => Promise<void>;
  onCancel: () => void;
}

const TEMPLATES = [
  {
    name: 'SaaS Analytics Platform',
    idea: 'A real-time metrics dashboard for indie developers with automated churn prediction and Stripe webhook ingestion.',
    platform: 'Web App (Next.js / Node.js)',
  },
  {
    name: 'AI Voice Journal',
    idea: 'A mobile-first voice journaling app that transcribes daily thoughts, identifies recurring emotional themes, and generates weekly growth summaries.',
    platform: 'Mobile (iOS & Android)',
  },
  {
    name: 'B2B Procurement Portal',
    idea: 'A supplier discovery and purchase order tracking tool for restaurants to manage vendor contracts and invoice matching.',
    platform: 'Responsive Web',
  },
];

export default function CreateProjectForm({ onSubmit, onCancel }: CreateProjectFormProps) {
  const [name, setName] = useState('');
  const [initialIdea, setInitialIdea] = useState('');
  const [description, setDescription] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setName(tpl.name);
    setInitialIdea(tpl.idea);
    setTargetPlatform(tpl.platform);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !initialIdea.trim()) return;

    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        initialIdea: initialIdea.trim(),
        description: description.trim() || undefined,
        targetPlatform: targetPlatform.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-slide-up">
      {/* Background glow accent */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Initiate New Project</h2>
            <p className="text-xs text-slate-400">
              The AI Planner will translate your vision into technical architecture.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Template Starters */}
      <div className="my-5">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">Quick Inspiration Templates</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-brand-500/40 transition-all text-xs group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-brand-300 truncate">
                {tpl.name}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{tpl.platform}</div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* Form Inputs */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="project-name" className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1.5">
            <FolderPlus className="w-3.5 h-3.5 text-slate-400" />
            Project Name <span className="text-brand-400">*</span>
          </label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            placeholder="e.g. NexusFlow, HealthTrack Pro"
          />
        </div>

        <div>
          <label htmlFor="project-idea" className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
            <span className="flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              What are you building? <span className="text-brand-400">*</span>
            </span>
            <span className="text-[11px] font-normal text-slate-500">Non-technical language is welcome</span>
          </label>
          <textarea
            id="project-idea"
            value={initialIdea}
            onChange={(e) => setInitialIdea(e.target.value)}
            required
            rows={3}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none leading-relaxed"
            placeholder="Describe the product idea, who will use it, and what problem it solves in your own words..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="project-platform" className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Target Platform
            </label>
            <input
              id="project-platform"
              type="text"
              value={targetPlatform}
              onChange={(e) => setTargetPlatform(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              placeholder="e.g. Web (React), iOS, Fullstack"
            />
          </div>

          <div>
            <label htmlFor="project-desc" className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Initial Constraints or Notes
            </label>
            <input
              id="project-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              placeholder="e.g. Needs Google Login, tight deadline"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim() || !initialIdea.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Launching Discovery...</span>
              </>
            ) : (
              <>
                <span>Start Planning</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
