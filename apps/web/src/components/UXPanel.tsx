import { useState, useEffect, useCallback } from 'react';
import type {
  IDesignSpec,
  IScreenSpec,
  CreateScreenSpecRequest,
} from '@project-planner/types';
import { VisualThemeCategory } from '@project-planner/types';
import { api } from '../api/client.js';
import {
  Palette,
  Layout,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Check,
  CheckCircle2,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  Type,
  Layers,
  Shield,
  RefreshCw,
  X,
  Sliders,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';

interface UXPanelProps {
  projectId: string;
  onDesignChange?: () => void;
}

const THEME_OPTIONS: {
  category: VisualThemeCategory;
  name: string;
  description: string;
  badge: string;
}[] = [
  {
    category: VisualThemeCategory.MODERN_SAAS,
    name: 'Modern SaaS',
    description: 'Clean dark/light slate with crisp borders, subtle gradients & soft neon accents (Vercel, Supabase style).',
    badge: 'Popular',
  },
  {
    category: VisualThemeCategory.DEVELOPER_DARK,
    name: 'Developer Dark',
    description: 'Terminal-inspired deep blacks, monospace code accents, high-contrast syntax highlighting.',
    badge: 'Dev Favorite',
  },
  {
    category: VisualThemeCategory.MINIMAL_CLEAN,
    name: 'Minimal Clean',
    description: 'Generous whitespace, refined sans-serif typography, understated monochromatic elegance.',
    badge: 'Zen',
  },
  {
    category: VisualThemeCategory.ENTERPRISE,
    name: 'Enterprise',
    description: 'High information density, structured data grids, accessible color contrast and corporate trust.',
    badge: 'Corporate',
  },
  {
    category: VisualThemeCategory.PREMIUM_LUXURY,
    name: 'Premium Luxury',
    description: 'Editorial typography, deep midnight tones with gold or emerald accents, smooth animations.',
    badge: 'High-End',
  },
  {
    category: VisualThemeCategory.PLAYFUL,
    name: 'Playful & Friendly',
    description: 'Rounded geometry, warm vibrant palettes, illustrative elements and approachable micro-copy.',
    badge: 'Consumer',
  },
  {
    category: VisualThemeCategory.DATA_DASHBOARD,
    name: 'Data Dashboard',
    description: 'Chart-first layout, real-time metrics cards, compact widgets with high data density.',
    badge: 'Analytics',
  },
  {
    category: VisualThemeCategory.ECOMMERCE,
    name: 'E-Commerce',
    description: 'Product-focused photography grids, bold CTA buttons, clear conversion funnel components.',
    badge: 'Storefront',
  },
  {
    category: VisualThemeCategory.AGENT_DECIDE,
    name: 'AI Agent Decide',
    description: 'Let the AI autonomously determine optimal UX styling based on your functional specifications.',
    badge: 'Autonomous',
  },
];

export default function UXPanel({ projectId, onDesignChange }: UXPanelProps) {
  const [subTab, setSubTab] = useState<'theme' | 'screens' | 'references'>('theme');
  const [designSpec, setDesignSpec] = useState<IDesignSpec | null>(null);
  const [screens, setScreens] = useState<IScreenSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);
  const [generatingScreens, setGeneratingScreens] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Expanded screen card tracking
  const [expandedScreenId, setExpandedScreenId] = useState<string | null>(null);

  // New screen modal state
  const [showAddScreenModal, setShowAddScreenModal] = useState(false);
  const [newScreen, setNewScreen] = useState<CreateScreenSpecRequest>({
    name: '',
    route: '',
    purpose: '',
    layout: '',
    targetRoles: ['user'],
    components: [],
    authRequired: true,
    responsiveBehavior: {
      desktop: '',
      tablet: '',
      mobile: '',
    },
    states: {
      loading: '',
      empty: '',
      error: '',
      success: '',
    },
    apiDependencies: [],
  });
  const [creatingScreen, setCreatingScreen] = useState(false);
  const [componentInput, setComponentInput] = useState('');
  const [apiDepInput, setApiDepInput] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [designData, screensData] = await Promise.all([
        api.ux.getDesign(projectId).catch(() => null),
        api.ux.listScreens(projectId).catch(() => []),
      ]);
      if (designData) setDesignSpec(designData);
      if (screensData) setScreens(screensData);
    } catch (err) {
      console.error('Failed to load UX data', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId, loadData]);

  // Update theme settings
  const updateTheme = async (partial: Partial<IDesignSpec>) => {
    setSavingTheme(true);
    try {
      const updated = await api.ux.updateDesign(projectId, partial);
      setDesignSpec(updated);
      onDesignChange?.();
    } catch (err) {
      console.error('Failed to update design spec', err);
    } finally {
      setSavingTheme(false);
    }
  };

  // Color change handler
  const handleColorChange = (key: string, value: string) => {
    if (!designSpec) return;
    const newPalette = {
      ...(designSpec.colorPalette || {}),
      [key]: value,
    };
    updateTheme({ colorPalette: newPalette });
  };

  // Generate screens from requirements
  const handleGenerateScreens = async () => {
    setGeneratingScreens(true);
    try {
      const generated = await api.ux.generateScreens(projectId);
      setScreens(generated);
      onDesignChange?.();
    } catch (err) {
      console.error('Failed to generate screens', err);
    } finally {
      setGeneratingScreens(false);
    }
  };

  // Delete screen
  const handleDeleteScreen = async (screenId: string) => {
    try {
      await api.ux.deleteScreen(projectId, screenId);
      setScreens((prev) => prev.filter((s) => s.id !== screenId));
    } catch (err) {
      console.error('Failed to delete screen', err);
    }
  };

  // Create manual screen
  const handleCreateScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScreen.name || !newScreen.route || !newScreen.purpose || !newScreen.layout) {
      return;
    }

    setCreatingScreen(true);
    try {
      const created = await api.ux.createScreen(projectId, newScreen);
      setScreens((prev) => [...prev, created]);
      setShowAddScreenModal(false);
      setNewScreen({
        name: '',
        route: '',
        purpose: '',
        layout: '',
        targetRoles: ['user'],
        components: [],
        authRequired: true,
        responsiveBehavior: {},
        states: {},
        apiDependencies: [],
      });
    } catch (err) {
      console.error('Failed to create screen spec', err);
    } finally {
      setCreatingScreen(false);
    }
  };

  // File upload for Gemini Vision
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (.png, .jpg, .webp).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setAnalyzingImage(true);
        const dataUrl = reader.result as string;
        const res = await api.ux.analyzeImage(projectId, {
          imageBase64: dataUrl,
          mimeType: file.type,
          fileName: file.name,
        });
        setDesignSpec(res.designSpec);
        setSubTab('references');
        onDesignChange?.();
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Image analysis failed.');
      } finally {
        setAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        <span className="text-xs font-medium">Loading UX discovery data...</span>
      </div>
    );
  }

  const currentCategory = designSpec?.visualCategory || VisualThemeCategory.AGENT_DECIDE;
  const currentDensity = designSpec?.visualDensity || 'comfortable';
  const currentMode = designSpec?.themeMode || 'dark';
  const palette = designSpec?.colorPalette || {
    primary: '#6366f1',
    secondary: '#a855f7',
    accent: '#10b981',
    background: '#020617',
    surface: '#0f172a',
    text: '#f8fafc',
  };
  const typography = designSpec?.typography || {
    headingFont: 'Plus Jakarta Sans',
    bodyFont: 'Inter',
  };
  const referenceImages = designSpec?.referenceImages || [];
  const observedInsights = designSpec?.observedInsights || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Subtab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-950/60 border border-slate-800 rounded-xl mb-3 flex-shrink-0 text-xs font-semibold">
        <button
          onClick={() => setSubTab('theme')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'theme'
              ? 'bg-brand-600/90 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Visual Theme</span>
        </button>
        <button
          onClick={() => setSubTab('screens')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'screens'
              ? 'bg-brand-600/90 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Screens ({screens.length})</span>
        </button>
        <button
          onClick={() => setSubTab('references')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'references'
              ? 'bg-brand-600/90 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Vision ({referenceImages.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: VISUAL THEME & PALETTE */}
      {subTab === 'theme' && (
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-4">
          {/* Quick Header */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Visual Style Archetypes
            </span>
            {savingTheme && (
              <span className="text-[11px] text-brand-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            )}
          </div>

          {/* Theme Categories Grid */}
          <div className="grid grid-cols-1 gap-2">
            {THEME_OPTIONS.map((theme) => {
              const isSelected = currentCategory === theme.category;
              return (
                <button
                  key={theme.category}
                  onClick={() => updateTheme({ visualCategory: theme.category })}
                  className={`text-left p-3 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'border-brand-500 bg-brand-950/30 shadow-glow'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {theme.name}
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-400" />}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                        isSelected
                          ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {theme.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{theme.description}</p>
                </button>
              );
            })}
          </div>

          {/* Theme Mode & Density Controls */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Theme Mode
              </label>
              <div className="flex gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                {(['dark', 'light', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateTheme({ themeMode: mode })}
                    className={`flex-1 py-1 rounded text-center capitalize text-[11px] font-medium transition-all ${
                      currentMode === mode
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Visual Density
              </label>
              <div className="flex gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
                  <button
                    key={density}
                    onClick={() => updateTheme({ visualDensity: density })}
                    className={`flex-1 py-1 rounded text-center capitalize text-[11px] font-medium transition-all ${
                      currentDensity === density
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Palette Swatches */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
              Color Palette Swatches
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Primary', key: 'primary', val: palette.primary },
                { label: 'Secondary', key: 'secondary', val: palette.secondary },
                { label: 'Accent', key: 'accent', val: palette.accent },
                { label: 'Background', key: 'background', val: palette.background },
                { label: 'Surface', key: 'surface', val: palette.surface },
                { label: 'Text', key: 'text', val: palette.text },
              ].map(({ label, key, val }) => (
                <div
                  key={key}
                  className="p-2 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col gap-1.5"
                >
                  <span className="text-[10px] uppercase font-semibold text-slate-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={val || '#000000'}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border border-slate-700 bg-transparent"
                    />
                    <input
                      type="text"
                      value={val || ''}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-full bg-transparent text-[10px] font-mono text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
              Typography Hierarchy
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                  Heading Font
                </span>
                <span className="font-semibold text-slate-200 font-sans">
                  {typography.headingFont || 'Plus Jakarta Sans'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                  Body Font
                </span>
                <span className="font-semibold text-slate-200 font-sans">
                  {typography.bodyFont || 'Inter'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SCREEN-BY-SCREEN SPECIFICATIONS */}
      {subTab === 'screens' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Actions */}
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <button
              onClick={handleGenerateScreens}
              disabled={generatingScreens}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50 transition-all"
            >
              {generatingScreens ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Decomposing screens...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Generate Screens</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowAddScreenModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Screen</span>
            </button>
          </div>

          {/* Screens List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
            {screens.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center">
                <Layout className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-300">No screen specs defined yet</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Click 'Auto-Generate Screens' to derive a complete screen-by-screen breakdown from your functional requirements.
                </p>
              </div>
            ) : (
              screens.map((screen) => {
                const isExpanded = expandedScreenId === screen.id;
                return (
                  <div
                    key={screen.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{screen.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {screen.route}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {screen.purpose}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setExpandedScreenId(isExpanded ? null : screen.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                          title="Toggle details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteScreen(screen.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all"
                          title="Delete screen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Layout snippet */}
                    <div className="text-[11px] text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center gap-1.5">
                      <Layout className="w-3 h-3 text-brand-400 flex-shrink-0" />
                      <span className="font-medium text-slate-400">Layout:</span>
                      <span className="truncate">{screen.layout}</span>
                    </div>

                    {/* Components Pills */}
                    {screen.components && screen.components.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {screen.components.map((comp, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expandable Details: Responsive & States & APIs */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2.5 text-[11px] animate-fade-in">
                        {/* Target Roles & Auth */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-slate-500" />
                            {screen.authRequired ? 'Protected Route' : 'Public Route'}
                          </span>
                          <span>Roles: {screen.targetRoles?.join(', ') || 'user'}</span>
                        </div>

                        {/* Responsive behavior */}
                        {screen.responsiveBehavior && (
                          <div className="space-y-1 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                              Responsive Behaviors
                            </span>
                            {screen.responsiveBehavior.desktop && (
                              <div className="flex items-start gap-1.5 text-slate-300">
                                <Monitor className="w-3 h-3 text-indigo-400 mt-0.5" />
                                <span>{screen.responsiveBehavior.desktop}</span>
                              </div>
                            )}
                            {screen.responsiveBehavior.tablet && (
                              <div className="flex items-start gap-1.5 text-slate-300">
                                <Tablet className="w-3 h-3 text-indigo-400 mt-0.5" />
                                <span>{screen.responsiveBehavior.tablet}</span>
                              </div>
                            )}
                            {screen.responsiveBehavior.mobile && (
                              <div className="flex items-start gap-1.5 text-slate-300">
                                <Smartphone className="w-3 h-3 text-indigo-400 mt-0.5" />
                                <span>{screen.responsiveBehavior.mobile}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* States */}
                        {screen.states && (
                          <div className="space-y-1 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                              State Behaviors
                            </span>
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              {screen.states.loading && (
                                <div>
                                  <span className="text-slate-500 font-semibold">Loading: </span>
                                  <span className="text-slate-300">{screen.states.loading}</span>
                                </div>
                              )}
                              {screen.states.empty && (
                                <div>
                                  <span className="text-slate-500 font-semibold">Empty: </span>
                                  <span className="text-slate-300">{screen.states.empty}</span>
                                </div>
                              )}
                              {screen.states.error && (
                                <div>
                                  <span className="text-slate-500 font-semibold">Error: </span>
                                  <span className="text-slate-300">{screen.states.error}</span>
                                </div>
                              )}
                              {screen.states.success && (
                                <div>
                                  <span className="text-slate-500 font-semibold">Success: </span>
                                  <span className="text-slate-300">{screen.states.success}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* API Dependencies */}
                        {screen.apiDependencies && screen.apiDependencies.length > 0 && (
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                              API Dependencies
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {screen.apiDependencies.map((apiItem, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300 border border-indigo-950 font-mono"
                                >
                                  {apiItem}
                                </span>
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
        </div>
      )}

      {/* SUBTAB 3: REFERENCE IMAGES & GEMINI VISION ANALYSIS */}
      {subTab === 'references' && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {/* Upload Area */}
          <div className="p-4 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/40 hover:border-slate-700 transition-all text-center relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={analyzingImage}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            {analyzingImage ? (
              <div className="flex flex-col items-center justify-center py-2 text-brand-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs font-semibold">Analyzing image with Gemini Vision...</span>
                <span className="text-[10px] text-slate-500">
                  Extracting color palettes, typography, UI patterns & recommendations
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 text-slate-400 gap-1.5">
                <Upload className="w-6 h-6 text-brand-400" />
                <span className="text-xs font-bold text-white">Upload Reference Screenshot</span>
                <span className="text-[11px] text-slate-400">
                  Drag & drop or click to upload PNG, JPG, or WebP
                </span>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-300">
              {uploadError}
            </div>
          )}

          {/* Reference Images List */}
          {referenceImages.length > 0 && (
            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                Analyzed Screenshots ({referenceImages.length})
              </span>
              {referenceImages.map((img, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    {img.dataUrl && (
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-16 h-16 object-cover rounded-lg border border-slate-800 flex-shrink-0"
                      />
                    )}
                    <div>
                      <span className="font-bold text-white block">{img.name}</span>
                      <span className="text-[10px] text-slate-500">
                        Uploaded {new Date(img.uploadedAt || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {img.analysis && (
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed">
                      {img.analysis}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Observed Insights */}
          {observedInsights.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Visual & Architecture Observations
              </span>
              <div className="space-y-1.5">
                {observedInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE SCREEN MODAL */}
      {showAddScreenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-400" />
                <span>Define Screen Specification</span>
              </h3>
              <button
                onClick={() => setShowAddScreenModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateScreen} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Screen Name *</label>
                  <input
                    type="text"
                    required
                    value={newScreen.name}
                    onChange={(e) => setNewScreen({ ...newScreen, name: e.target.value })}
                    placeholder="e.g. Analytics Dashboard"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Route *</label>
                  <input
                    type="text"
                    required
                    value={newScreen.route}
                    onChange={(e) => setNewScreen({ ...newScreen, route: e.target.value })}
                    placeholder="e.g. /dashboard/analytics"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Purpose *</label>
                <textarea
                  required
                  rows={2}
                  value={newScreen.purpose}
                  onChange={(e) => setNewScreen({ ...newScreen, purpose: e.target.value })}
                  placeholder="Primary objective and user intent on this screen"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Layout Architecture *</label>
                <input
                  type="text"
                  required
                  value={newScreen.layout}
                  onChange={(e) => setNewScreen({ ...newScreen, layout: e.target.value })}
                  placeholder="e.g. Sticky header + sidebar + 3-column metric cards"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Components (comma separated)</label>
                <input
                  type="text"
                  value={componentInput}
                  onChange={(e) => {
                    setComponentInput(e.target.value);
                    const comps = e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setNewScreen({ ...newScreen, components: comps });
                  }}
                  placeholder="e.g. MetricCard, DataTable, DateRangePicker"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">API Dependencies (comma separated)</label>
                <input
                  type="text"
                  value={apiDepInput}
                  onChange={(e) => {
                    setApiDepInput(e.target.value);
                    const deps = e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setNewScreen({ ...newScreen, apiDependencies: deps });
                  }}
                  placeholder="e.g. GET /api/metrics, POST /api/reports"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="authReq"
                  checked={newScreen.authRequired}
                  onChange={(e) => setNewScreen({ ...newScreen, authRequired: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-brand-600 focus:ring-0"
                />
                <label htmlFor="authReq" className="text-slate-300 font-medium cursor-pointer">
                  Authentication Required
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddScreenModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingScreen}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all shadow-glow flex items-center gap-1.5"
                >
                  {creatingScreen && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Screen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
