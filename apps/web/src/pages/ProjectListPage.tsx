import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IProject, CreateProjectRequest } from '@project-planner/types';
import { api } from '../api/client.js';
import ProjectCard from '../components/ProjectCard.js';
import CreateProjectForm from '../components/CreateProjectForm.js';
import { 
  Plus, 
  Search, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Activity, 
  Compass, 
  Filter,
  ArrowRight
} from 'lucide-react';

export default function ProjectListPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await api.projects.list();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: CreateProjectRequest) {
    const project = await api.projects.create(data);
    const targetId = project.id || (project as any)._id;
    if (targetId) {
      navigate(`/projects/${targetId}`);
    } else {
      await loadProjects();
      setShowForm(false);
    }
  }

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.initialIdea.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.targetPlatform && p.targetPlatform.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'DISCOVERY' && p.status === 'DISCOVERY') ||
        (statusFilter === 'READY' && p.status === 'READY_FOR_IMPLEMENTATION') ||
        (statusFilter === 'REVIEW' && (p.status === 'NEEDS_CLARIFICATION' || p.status === 'WAITING_FOR_APPROVAL'));

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  // Quick stats
  const stats = useMemo(() => {
    const total = projects.length;
    const inDiscovery = projects.filter((p) => p.status === 'DISCOVERY').length;
    const ready = projects.filter((p) => p.status === 'READY_FOR_IMPLEMENTATION' || p.status === 'FINALIZED').length;
    return { total, inDiscovery, ready };
  }, [projects]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in">
      {/* Hero & Action Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Autonomous Software Planning Suite</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Project Architecture Workspaces
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
            Convert human product ideas into detailed technical architecture, discovery specifications, and ready-to-execute agent roadmaps.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-glow transition-all active:scale-[0.98] flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Architecture Workspace</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      {projects.length > 0 && !showForm && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
              <Layers className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-slate-400">Total Workspaces</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
              <Activity className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.inDiscovery}</div>
              <div className="text-xs text-slate-400">Active in Discovery</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.ready}</div>
              <div className="text-xs text-slate-400">Ready for Engineering</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* Creation Modal / Form */}
      {showForm && (
        <div className="mb-8">
          <CreateProjectForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Search and Filters Bar */}
      {projects.length > 0 && !showForm && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name, idea..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/70 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {[
              { key: 'ALL', label: 'All Projects' },
              { key: 'DISCOVERY', label: 'In Discovery' },
              { key: 'REVIEW', label: 'Review' },
              { key: 'READY', label: 'Implementation Ready' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === tab.key
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-1/2 h-5 bg-slate-800 rounded-lg"></div>
                <div className="w-3/4 h-3 bg-slate-800/60 rounded"></div>
              </div>
              <div className="w-1/3 h-3 bg-slate-800/40 rounded"></div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 && !showForm ? (
        /* Empty State */
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/30 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-5 shadow-glow">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No planning workspaces yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
            Create your first project idea to launch an intelligent multi-turn discovery conversation with the Planner Agent.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Start Your First Project</span>
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        /* Filter Empty */
        <div className="py-16 text-center text-slate-500">
          <Filter className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No projects matched your search criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className="mt-3 text-xs text-brand-400 hover:underline"
          >
            Reset filters
          </button>
        </div>
      ) : (
        /* Project Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
