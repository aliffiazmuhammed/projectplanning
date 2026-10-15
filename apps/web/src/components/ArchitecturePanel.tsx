import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  IDatabaseEntity,
  IApiEndpoint,
  IArchitecturePlan,
  CreateEntityRequest,
  CreateApiEndpointRequest,
  HttpMethod,
} from '@project-planner/types';
import { api } from '../api/client.js';
import {
  Layers,
  Database,
  Globe,
  ShieldCheck,
  Cloud,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  KeyRound,
  Server,
  ArrowRight,
  Code2,
  AlertCircle,
  CheckCircle2,
  X,
  FileCode,
} from 'lucide-react';

interface ArchitecturePanelProps {
  projectId: string;
  onArchitectureChange?: () => void;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-sky-950/80 text-sky-300 border-sky-800/80',
  POST: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
  PUT: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
  PATCH: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
  DELETE: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
  OPTIONS: 'bg-slate-900 text-slate-400 border-slate-800',
  HEAD: 'bg-slate-900 text-slate-400 border-slate-800',
};

export default function ArchitecturePanel({
  projectId,
  onArchitectureChange,
}: ArchitecturePanelProps) {
  const [subTab, setSubTab] = useState<'database' | 'apis' | 'security' | 'deployment'>('database');
  const [plan, setPlan] = useState<IArchitecturePlan | null>(null);
  const [entities, setEntities] = useState<IDatabaseEntity[]>([]);
  const [endpoints, setEndpoints] = useState<IApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Expanded cards tracking
  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null);
  const [expandedEndpointId, setExpandedEndpointId] = useState<string | null>(null);

  // Modals state
  const [showAddEntityModal, setShowAddEntityModal] = useState(false);
  const [showAddEndpointModal, setShowAddEndpointModal] = useState(false);

  // New entity form state
  const [newEntity, setNewEntity] = useState<CreateEntityRequest>({
    name: '',
    tableNameOrCollection: '',
    description: '',
    fields: [
      { name: 'id', type: 'String', required: true, unique: true, description: 'Primary identifier' },
      { name: 'createdAt', type: 'Date', required: true, defaultValue: 'now()' },
    ],
    relationships: [],
    indexes: [],
  });
  const [creatingEntity, setCreatingEntity] = useState(false);

  // New endpoint form state
  const [newEndpoint, setNewEndpoint] = useState<CreateApiEndpointRequest>({
    method: 'GET',
    route: '',
    summary: '',
    description: '',
    authentication: 'JWT',
    requiredRoles: ['MEMBER'],
    parameters: [],
    responses: [{ statusCode: 200, description: 'Successful response' }],
    dependencies: [],
  });
  const [creatingEndpoint, setCreatingEndpoint] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.architecture.get(projectId);
      setPlan(res.plan);
      setEntities(res.entities);
      setEndpoints(res.endpoints);
    } catch (err) {
      console.error('Failed to load architecture data', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId, loadData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.architecture.generate(projectId);
      setPlan(res.plan);
      setEntities(res.entities);
      setEndpoints(res.endpoints);
      onArchitectureChange?.();
    } catch (err) {
      console.error('Failed to generate architecture', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteEntity = async (id: string) => {
    try {
      await api.architecture.deleteEntity(projectId, id);
      setEntities((prev) => prev.filter((e) => e.id !== id));
      onArchitectureChange?.();
    } catch (err) {
      console.error('Failed to delete entity', err);
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    try {
      await api.architecture.deleteEndpoint(projectId, id);
      setEndpoints((prev) => prev.filter((e) => e.id !== id));
      onArchitectureChange?.();
    } catch (err) {
      console.error('Failed to delete endpoint', err);
    }
  };

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntity.name || !newEntity.tableNameOrCollection || !newEntity.description) return;

    setCreatingEntity(true);
    try {
      const created = await api.architecture.createEntity(projectId, newEntity);
      setEntities((prev) => [...prev, created]);
      setShowAddEntityModal(false);
      setNewEntity({
        name: '',
        tableNameOrCollection: '',
        description: '',
        fields: [
          { name: 'id', type: 'String', required: true, unique: true },
          { name: 'createdAt', type: 'Date', required: true },
        ],
        relationships: [],
        indexes: [],
      });
      onArchitectureChange?.();
    } catch (err) {
      console.error('Failed to create entity', err);
    } finally {
      setCreatingEntity(false);
    }
  };

  const handleCreateEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndpoint.route || !newEndpoint.summary) return;

    setCreatingEndpoint(true);
    try {
      const created = await api.architecture.createEndpoint(projectId, newEndpoint);
      setEndpoints((prev) => [...prev, created]);
      setShowAddEndpointModal(false);
      setNewEndpoint({
        method: 'GET',
        route: '',
        summary: '',
        description: '',
        authentication: 'JWT',
        requiredRoles: ['MEMBER'],
        parameters: [],
        responses: [{ statusCode: 200, description: 'Successful response' }],
        dependencies: [],
      });
      onArchitectureChange?.();
    } catch (err) {
      console.error('Failed to create endpoint', err);
    } finally {
      setCreatingEndpoint(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        <span className="text-xs font-medium">Loading system architecture...</span>
      </div>
    );
  }

  const security = plan?.security;
  const deployment = plan?.deployment;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Header & Actions */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl mb-3 flex-shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold text-white">System Architecture & Design</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 font-semibold font-mono">
              {entities.length} Tables
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-950/50 text-indigo-400 border border-indigo-800/60 font-semibold font-mono">
              {endpoints.length} Endpoints
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 transition-all"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Designing Architecture...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Generate Architecture</span>
              </>
            )}
          </button>

          {subTab === 'database' && (
            <button
              onClick={() => setShowAddEntityModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Entity</span>
            </button>
          )}

          {subTab === 'apis' && (
            <button
              onClick={() => setShowAddEndpointModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Endpoint</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-950/60 border border-slate-800 rounded-xl mb-3 flex-shrink-0 text-xs font-semibold">
        <button
          onClick={() => setSubTab('database')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'database'
              ? 'bg-brand-600/90 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Database ({entities.length})</span>
        </button>
        <button
          onClick={() => setSubTab('apis')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'apis'
              ? 'bg-brand-600/90 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>APIs ({endpoints.length})</span>
        </button>
        <button
          onClick={() => setSubTab('security')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'security'
              ? 'bg-brand-600/90 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security</span>
        </button>
        <button
          onClick={() => setSubTab('deployment')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'deployment'
              ? 'bg-brand-600/90 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Deploy</span>
        </button>
      </div>

      {/* SUBTAB 1: DATABASE ENTITIES */}
      {subTab === 'database' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
          {entities.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center">
              <Database className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-300">No database schemas defined</h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Click 'Auto-Generate Architecture' to derive entity schemas, fields, relationships, and indexes based on your functional specifications.
              </p>
            </div>
          ) : (
            entities.map((entity) => {
              const isExpanded = expandedEntityId === entity.id;
              return (
                <div
                  key={entity.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{entity.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                          {entity.tableNameOrCollection}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {entity.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedEntityId(isExpanded ? null : entity.id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                        title="Toggle fields & relationships"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteEntity(entity.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all"
                        title="Delete entity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Fields Count & Key Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    <span className="text-slate-400 font-mono">
                      {entity.fields.length} Fields
                    </span>
                    {entity.relationships && entity.relationships.length > 0 && (
                      <span className="text-indigo-400 font-mono">
                        • {entity.relationships.length} Relations
                      </span>
                    )}
                    {entity.indexes && entity.indexes.length > 0 && (
                      <span className="text-emerald-400 font-mono">
                        • {entity.indexes.length} Indexes
                      </span>
                    )}
                  </div>

                  {/* Expandable Fields Table & Details */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-3 text-[11px] animate-fade-in">
                      {/* Fields Table */}
                      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/50">
                        <table className="w-full text-left text-[10px]">
                          <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
                            <tr>
                              <th className="p-2">Field</th>
                              <th className="p-2">Type</th>
                              <th className="p-2">Attributes</th>
                              <th className="p-2">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono">
                            {entity.fields.map((f, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/30">
                                <td className="p-2 font-bold text-white">{f.name}</td>
                                <td className="p-2 text-indigo-300">{f.type}</td>
                                <td className="p-2">
                                  <div className="flex items-center gap-1">
                                    {f.required && (
                                      <span className="px-1 py-0.2 rounded bg-amber-950/60 text-amber-400 text-[9px]">
                                        REQ
                                      </span>
                                    )}
                                    {f.unique && (
                                      <span className="px-1 py-0.2 rounded bg-emerald-950/60 text-emerald-400 text-[9px]">
                                        UNIQ
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2 text-slate-400 font-sans">{f.description || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Relationships */}
                      {entity.relationships && entity.relationships.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Relationships
                          </span>
                          <div className="space-y-1 text-[10px]">
                            {entity.relationships.map((rel, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                              >
                                <span className="font-semibold text-white">
                                  {entity.name} → {rel.relatedEntity} ({rel.type})
                                </span>
                                <span className="text-slate-400 font-mono">
                                  FK: {rel.foreignKey || 'N/A'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ownership / Access */}
                      {entity.ownershipNotes && (
                        <div className="p-2 rounded bg-slate-900/40 border border-slate-800 text-[10px] text-slate-300">
                          <span className="text-slate-500 font-semibold block">Access & Ownership:</span>
                          {entity.ownershipNotes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUBTAB 2: API SPECIFICATION */}
      {subTab === 'apis' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
          {endpoints.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center">
              <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-300">No API endpoints defined</h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Click 'Auto-Generate Architecture' to derive complete REST contracts, parameters, and status responses.
              </p>
            </div>
          ) : (
            endpoints.map((ep) => {
              const isExpanded = expandedEndpointId === ep.id;
              const methodColor = METHOD_COLORS[ep.method] || 'bg-slate-900 text-slate-300';
              return (
                <div
                  key={ep.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${methodColor}`}>
                          {ep.method}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">{ep.route}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{ep.summary}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedEndpointId(isExpanded ? null : ep.id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                        title="Toggle endpoint contract"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteEndpoint(ep.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all"
                        title="Delete endpoint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      Auth: {ep.authentication}
                    </span>
                    {ep.requiredRoles && ep.requiredRoles.length > 0 && (
                      <span>• Roles: {ep.requiredRoles.join(', ')}</span>
                    )}
                    {ep.rateLimit && <span>• {ep.rateLimit}</span>}
                  </div>

                  {/* Expandable Contract Details */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2.5 text-[11px] animate-fade-in">
                      {ep.description && (
                        <p className="text-[11px] text-slate-400">{ep.description}</p>
                      )}

                      {/* Request Body Schema */}
                      {ep.requestBodySchema && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Request Body Schema
                          </span>
                          <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto whitespace-pre">
                            {ep.requestBodySchema}
                          </pre>
                        </div>
                      )}

                      {/* Responses Contract */}
                      {ep.responses && ep.responses.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Responses
                          </span>
                          <div className="space-y-1">
                            {ep.responses.map((resp, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[10px] flex items-start gap-2"
                              >
                                <span
                                  className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                                    resp.statusCode < 300
                                      ? 'bg-emerald-950 text-emerald-400'
                                      : resp.statusCode < 500
                                      ? 'bg-amber-950 text-amber-400'
                                      : 'bg-rose-950 text-rose-400'
                                  }`}
                                >
                                  {resp.statusCode}
                                </span>
                                <div className="flex-1">
                                  <span className="text-slate-300 font-medium block">
                                    {resp.description}
                                  </span>
                                  {resp.schemaOrExample && (
                                    <pre className="mt-1 text-[9px] font-mono text-slate-400 overflow-x-auto">
                                      {resp.schemaOrExample}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUBTAB 3: SECURITY & RBAC */}
      {subTab === 'security' && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {!security ? (
            <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center">
              <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-300">No security architecture defined</h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Generate architecture to derive authentication strategy, RBAC permissions matrix, and encryption standards.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Auth Strategy & Session */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Authentication & Session Security
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {security.authenticationStrategy}
                </p>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">Session Management: </span>
                  {security.sessionManagement}
                </div>
              </div>

              {/* RBAC Roles Matrix */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                  Role-Based Access Control (RBAC) Matrix
                </span>
                <div className="space-y-2">
                  {security.rbacRoles.map((role, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{role.role}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {role.permissions.length} Permissions
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{role.description}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {role.permissions.map((perm, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-[9px]"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Protection & Encryption */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Data Protection & Encryption Standards
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 font-bold block">In-Transit:</span>
                    <span className="text-white font-medium">{security.dataProtection.transitEncryption}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 font-bold block">At-Rest:</span>
                    <span className="text-white font-medium">{security.dataProtection.restEncryption}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: DEPLOYMENT & CI/CD */}
      {subTab === 'deployment' && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {!deployment ? (
            <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center">
              <Cloud className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-300">No deployment topology defined</h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Generate architecture to configure deployment platforms, containerization, and the environment variable security matrix.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Platform & Pipeline */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  Infrastructure & Container Topology
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {deployment.platform}
                </p>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">CI/CD Pipeline: </span>
                  {deployment.ciCdPipeline}
                </div>
              </div>

              {/* Environment Variables Security Matrix */}
              {deployment.environmentVariables && deployment.environmentVariables.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                    Environment Variables Matrix ({deployment.environmentVariables.length})
                  </span>
                  <div className="space-y-1.5">
                    {deployment.environmentVariables.map((envVar, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-white block">
                            {envVar.key}
                          </span>
                          <span className="text-[10px] text-slate-400">{envVar.description}</span>
                        </div>
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                            envVar.classification === 'SECRET'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                              : envVar.classification === 'SENSITIVE'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                              : 'bg-sky-950/80 text-sky-300 border-sky-800/80'
                          }`}
                        >
                          {envVar.classification}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE ENTITY MODAL */}
      {showAddEntityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-400" />
                <span>Add Database Entity</span>
              </h3>
              <button
                onClick={() => setShowAddEntityModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEntity} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Entity Name *</label>
                  <input
                    type="text"
                    required
                    value={newEntity.name}
                    onChange={(e) =>
                      setNewEntity({
                        ...newEntity,
                        name: e.target.value,
                        tableNameOrCollection: e.target.value.toLowerCase() + 's',
                      })
                    }
                    placeholder="e.g. Workspace"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Table/Collection *</label>
                  <input
                    type="text"
                    required
                    value={newEntity.tableNameOrCollection}
                    onChange={(e) =>
                      setNewEntity({ ...newEntity, tableNameOrCollection: e.target.value })
                    }
                    placeholder="e.g. workspaces"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={newEntity.description}
                  onChange={(e) => setNewEntity({ ...newEntity, description: e.target.value })}
                  placeholder="Entity purpose, lifecycle, and data contents"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEntityModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEntity}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all shadow-glow flex items-center gap-1.5"
                >
                  {creatingEntity && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Entity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ENDPOINT MODAL */}
      {showAddEndpointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-400" />
                <span>Add API Endpoint Contract</span>
              </h3>
              <button
                onClick={() => setShowAddEndpointModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEndpoint} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Method *</label>
                  <select
                    value={newEndpoint.method}
                    onChange={(e) =>
                      setNewEndpoint({ ...newEndpoint, method: e.target.value as HttpMethod })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-slate-400 font-semibold block mb-1">Route Path *</label>
                  <input
                    type="text"
                    required
                    value={newEndpoint.route}
                    onChange={(e) => setNewEndpoint({ ...newEndpoint, route: e.target.value })}
                    placeholder="e.g. /api/workspaces/:id"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Summary *</label>
                <input
                  type="text"
                  required
                  value={newEndpoint.summary}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, summary: e.target.value })}
                  placeholder="e.g. Retrieve single workspace by ID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEndpointModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEndpoint}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all shadow-glow flex items-center gap-1.5"
                >
                  {creatingEndpoint && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Endpoint</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
