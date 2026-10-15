import React, { useState, useEffect } from 'react';
import {
  Download,
  FileJson,
  FileText,
  History,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Lock,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Code,
  Eye,
  FolderArchive,
  ArrowRight,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { api } from '../api/client.js';
import type { 
  IProjectSpec, 
  ISpecificationVersion, 
  IModularSpecBundle, 
  ISpecChangeRecord,
  CreateSpecVersionRequest 
} from '@project-planner/types';

interface ExportPanelProps {
  projectId: string;
  onVersionChange?: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ projectId, onVersionChange }) => {
  const [activeTab, setActiveTab] = useState<'json' | 'markdown' | 'pdf' | 'bundle' | 'history'>('json');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [spec, setSpec] = useState<IProjectSpec | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [bundle, setBundle] = useState<IModularSpecBundle | null>(null);
  const [versions, setVersions] = useState<ISpecificationVersion[]>([]);

  // UI helpers
  const [copied, setCopied] = useState<string | null>(null);
  const [includeMermaid, setIncludeMermaid] = useState(true);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  // New Version Modal state
  const [showModal, setShowModal] = useState(false);
  const [newVersion, setNewVersion] = useState('v1.0');
  const [versionName, setVersionName] = useState('Finalized Specification Baseline');
  const [versionDesc, setVersionDesc] = useState('Production implementation contract for coding agents.');
  const [changes, setChanges] = useState<ISpecChangeRecord[]>([
    {
      changedItem: 'Complete Specification',
      oldValue: 'Draft',
      newValue: 'Finalized',
      reason: 'Readiness audit passed and founder approved.',
      timestamp: new Date().toISOString(),
      affectsDownstream: true,
      downstreamArtifacts: ['project-spec.json', 'SPECIFICATION.md', 'TASKS.md'],
    },
  ]);
  const [savingVersion, setSavingVersion] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [jsonSpec, mdRes, bundleRes, versionsRes] = await Promise.all([
        api.export.getJson(projectId),
        api.export.getMarkdown(projectId, includeMermaid),
        api.export.getBundle(projectId),
        api.export.listVersions(projectId),
      ]);
      setSpec(jsonSpec);
      setMarkdown(mdRes.markdown);
      setBundle(bundleRes.files);
      setVersions(versionsRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load specification data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId, includeMermaid]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingVersion(true);
      const payload: CreateSpecVersionRequest = {
        version: newVersion.trim(),
        name: versionName.trim(),
        description: versionDesc.trim(),
        changes,
      };
      await api.export.createVersion(projectId, payload);
      setShowModal(false);
      await loadData();
      if (onVersionChange) {
        onVersionChange();
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to freeze version');
    } finally {
      setSavingVersion(false);
    }
  };

  const handleAddChangeRecord = () => {
    setChanges([
      ...changes,
      {
        changedItem: '',
        oldValue: '',
        newValue: '',
        reason: '',
        timestamp: new Date().toISOString(),
        affectsDownstream: false,
        downstreamArtifacts: [],
      },
    ]);
  };

  const handleRemoveChangeRecord = (idx: number) => {
    setChanges(changes.filter((_, i) => i !== idx));
  };

  const updateChangeRecord = (idx: number, field: keyof ISpecChangeRecord, val: any) => {
    const updated = [...changes];
    (updated[idx] as any)[field] = val;
    setChanges(updated);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-950/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-indigo-400" />
              Specification Export & Versioning
            </h2>
            {spec?.metadata.specVersion && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {spec.metadata.specVersion}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Machine-readable contracts, formatted documentation, and frozen release snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh specification"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Snapshot Version
          </button>
        </div>
      </div>

      {/* Subtabs Selector */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('json')}
          className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'json'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileJson className="w-3.5 h-3.5" />
          JSON Contract
        </button>
        <button
          onClick={() => setActiveTab('markdown')}
          className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'markdown'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Full Markdown Spec
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'pdf'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Printer className="w-3.5 h-3.5 text-rose-400" />
          Professional PDF
        </button>
        <button
          onClick={() => setActiveTab('bundle')}
          className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'bundle'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5" />
          Modular Docs Bundle
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Version History ({versions.length})
        </button>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && !spec ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Generating specification exports...
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : activeTab === 'json' ? (
          /* ================= Tab 1: Machine-Readable JSON ================= */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">project-spec.json</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Section 27 Validated
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  The primary source-of-truth consumed directly by autonomous software engineering agents.
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
                  <span>Tasks: <strong>{spec?.tasks.length || 0}</strong></span>
                  <span>Requirements: <strong>{spec?.requirements.length || 0}</strong></span>
                  <span>Screens: <strong>{spec?.screens.length || 0}</strong></span>
                  <span>DB Entities: <strong>{spec?.database.entities.length || 0}</strong></span>
                  <span>Endpoints: <strong>{spec?.api.endpoints.length || 0}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleCopy(JSON.stringify(spec, null, 2), 'json')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'json' ? 'Copied!' : 'Copy JSON'}
                </button>
                <button
                  onClick={() =>
                    handleDownloadFile(
                      JSON.stringify(spec, null, 2),
                      `${spec?.project.name?.toLowerCase().replace(/\s+/g, '-') || 'project'}-spec.json`,
                      'application/json'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .json
                </button>
              </div>
            </div>

            {/* Code Viewer */}
            <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <pre className="p-4 text-xs font-mono text-emerald-400/90 overflow-x-auto max-h-[500px] leading-relaxed">
                {JSON.stringify(spec, null, 2)}
              </pre>
            </div>
          </div>
        ) : activeTab === 'markdown' ? (
          /* ================= Tab 2: Full Markdown Spec ================= */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">project-spec.md</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    GitHub Flavored Markdown
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Complete human-readable architecture, IEEE requirements, API contracts, and task checklists.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMermaid}
                      onChange={(e) => setIncludeMermaid(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                    />
                    Include Mermaid Diagrams
                  </label>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => setShowRawMarkdown(!showRawMarkdown)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {showRawMarkdown ? <Eye className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                    {showRawMarkdown ? 'Render View' : 'Raw Text View'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleCopy(markdown, 'markdown')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'markdown' ? 'Copied!' : 'Copy Markdown'}
                </button>
                <button
                  onClick={() =>
                    handleDownloadFile(
                      markdown,
                      `${spec?.project.name?.toLowerCase().replace(/\s+/g, '-') || 'project'}-spec.md`,
                      'text/markdown'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .md
                </button>
              </div>
            </div>

            {/* Markdown Display */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              {showRawMarkdown ? (
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed whitespace-pre-wrap">
                  {markdown}
                </pre>
              ) : (
                <div className="p-6 text-sm text-slate-200 max-h-[500px] overflow-y-auto space-y-4 prose prose-invert prose-indigo max-w-none">
                  <pre className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                    {markdown}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'pdf' ? (
          /* ================= Tab 3: Professional PDF Report ================= */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">project-report.pdf</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                    <Printer className="w-3 h-3" />
                    Section 30 & 31 Standard
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Publication-ready multi-page architecture report designed for founders, technical leads, and investors.
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
                  <span>Cover Page</span>
                  <span>•</span>
                  <span>Requirements Matrix</span>
                  <span>•</span>
                  <span>System Architecture</span>
                  <span>•</span>
                  <span>Human Action Guide</span>
                  <span>•</span>
                  <span>Readiness Gate</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={api.export.getPdfUrl(projectId, true)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                  Open Fullscreen / Print
                </a>
                <a
                  href={api.export.getPdfUrl(projectId, false)}
                  download={`${spec?.project.name?.toLowerCase().replace(/\s+/g, '-') || 'project'}-spec.pdf`}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .pdf
                </a>
              </div>
            </div>

            {/* Embedded Live PDF Document Preview */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
              <iframe
                src={api.export.getPdfUrl(projectId, true)}
                title="Specification PDF Preview"
                className="w-full h-[650px] border-none bg-slate-900"
              />
            </div>
          </div>
        ) : activeTab === 'bundle' ? (
          /* ================= Tab 4: Modular Docs Bundle ================= */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="font-semibold text-white text-sm">Modular Specification Files</span>
              <p className="text-xs text-slate-400 mt-1">
                Download specialized documents for repository documentation, architecture wikis, or engineering handoffs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: SPECIFICATION.md */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    SPECIFICATION.md
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Product goals, user personas, and full IEEE functional and non-functional requirements matrix.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleCopy(bundle?.['SPECIFICATION.md'] || '', 'spec_doc')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copied === 'spec_doc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadFile(bundle?.['SPECIFICATION.md'] || '', 'SPECIFICATION.md', 'text/markdown')
                    }
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3 text-indigo-400" />
                    Download
                  </button>
                </div>
              </div>

              {/* Card 2: ARCHITECTURE.md */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Code className="w-4 h-4 text-emerald-400" />
                    ARCHITECTURE.md
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    System topology, tech stack decisions, database entities, and REST API contract specifications.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleCopy(bundle?.['ARCHITECTURE.md'] || '', 'arch_doc')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copied === 'arch_doc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadFile(bundle?.['ARCHITECTURE.md'] || '', 'ARCHITECTURE.md', 'text/markdown')
                    }
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    Download
                  </button>
                </div>
              </div>

              {/* Card 3: TASKS.md */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    TASKS.md
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Autonomous coding agent tasks (`TASK-001`), work subtasks checklists, acceptance criteria, and test requirements.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleCopy(bundle?.['TASKS.md'] || '', 'tasks_doc')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copied === 'tasks_doc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                  <button
                    onClick={() => handleDownloadFile(bundle?.['TASKS.md'] || '', 'TASKS.md', 'text/markdown')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3 text-cyan-400" />
                    Download
                  </button>
                </div>
              </div>

              {/* Card 4: HUMAN_ACTIONS.md */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Tag className="w-4 h-4 text-amber-400" />
                    HUMAN_ACTIONS.md
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Actionable prerequisites checklist, provider links, credential setup guide, and human vs. AI split.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleCopy(bundle?.['HUMAN_ACTIONS.md'] || '', 'human_doc')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copied === 'human_doc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadFile(bundle?.['HUMAN_ACTIONS.md'] || '', 'HUMAN_ACTIONS.md', 'text/markdown')
                    }
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3 text-amber-400" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= Tab 4: Version History & Changelog ================= */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white text-sm">Specification Version History</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chronological immutable snapshots following Section 29 versioning governance.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Snapshot New Version
              </button>
            </div>

            {versions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No frozen version snapshots recorded yet. Click &quot;Snapshot New Version&quot; above to lock a release milestone.
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((ver) => (
                  <div key={ver.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {ver.version}
                        </span>
                        <h4 className="font-semibold text-white text-sm">{ver.name}</h4>
                        {ver.isLocked && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Lock className="w-3 h-3 text-amber-400" />
                            Locked
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(ver.createdAt).toLocaleDateString()} by {ver.createdBy}
                      </div>
                    </div>

                    {ver.description && (
                      <p className="text-xs text-slate-300">{ver.description}</p>
                    )}

                    {/* Change Records */}
                    {ver.changes && ver.changes.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Recorded Changes ({ver.changes.length})
                        </div>
                        {ver.changes.map((c, i) => (
                          <div key={i} className="text-xs bg-slate-900/80 p-2 rounded border border-slate-800 flex items-start justify-between gap-2">
                            <div>
                              <span className="font-medium text-slate-200">{c.changedItem}</span>
                              <p className="text-slate-400 text-[11px] mt-0.5">{c.reason}</p>
                            </div>
                            {c.affectsDownstream && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                                Affects Downstream
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() =>
                          handleDownloadFile(
                            JSON.stringify(ver.spec, null, 2),
                            `${spec?.project.name?.toLowerCase().replace(/\s+/g, '-') || 'project'}-spec-${ver.version}.json`,
                            'application/json'
                          )
                        }
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5"
                      >
                        <Download className="w-3 h-3 text-indigo-400" />
                        Download Snapshot (.json)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Snapshot Version Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              Freeze Specification Version Snapshot
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Creates a permanent immutable record of the specification contract with structured changelog entries.
            </p>

            <form onSubmit={handleCreateVersion} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Version Identifier (e.g. v1.0)
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                    placeholder="v1.0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Snapshot Name
                  </label>
                  <input
                    type="text"
                    required
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                    placeholder="Finalized Specification v1.0"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Snapshot Notes & Rationale
                </label>
                <textarea
                  rows={2}
                  value={versionDesc}
                  onChange={(e) => setVersionDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="Approved for autonomous software engineering agent implementation."
                />
              </div>

              {/* Dynamic Changelog Records */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Change Records ({changes.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddChangeRecord}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Change Item
                  </button>
                </div>

                {changes.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Change #{idx + 1}</span>
                      {changes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChangeRecord(idx)}
                          className="text-[11px] text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Changed Item (e.g. Database: added orders)"
                        value={item.changedItem}
                        onChange={(e) => updateChangeRecord(idx, 'changedItem', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Reason (e.g. Added payment workflow)"
                        value={item.reason}
                        onChange={(e) => updateChangeRecord(idx, 'reason', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
                        required
                      />
                    </div>
                    <label className="text-[11px] text-slate-300 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.affectsDownstream}
                        onChange={(e) => updateChangeRecord(idx, 'affectsDownstream', e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                      />
                      Affects downstream architecture or implementation tasks
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={savingVersion}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVersion}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm"
                >
                  {savingVersion && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Freeze & Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportPanel;
