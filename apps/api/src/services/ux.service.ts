import { logger } from '../config/logger.js';
import { ScreenSpec, type ScreenSpecDocument } from '../models/ScreenSpec.js';
import { Requirement } from '../models/Requirement.js';
import type { ProjectDocument } from '../models/Project.js';
import { VisualThemeCategory, type IColorPalette } from '@project-planner/types';
import { AiProvider } from './ai.provider.js';

interface ImageAnalysisOutput {
  suggestedCategory: VisualThemeCategory;
  colorPalette: IColorPalette;
  typography: {
    headingFont?: string;
    bodyFont?: string;
  };
  visualDensity: 'compact' | 'comfortable' | 'spacious';
  observedFromReference: string[];
  agentRecommendations: string[];
  summary: string;
}

const IMAGE_ANALYSIS_PROMPT = `You are a Principal UX/UI Designer and Design Systems Architect.
Analyze this uploaded reference image/screenshot for a software application.

Perform a thorough visual and structural analysis:
1. Extract the Color Palette (hex codes for primary, secondary, accent, background, surface, text).
2. Classify the Visual Theme Category:
   MINIMAL_CLEAN | MODERN_SAAS | ENTERPRISE | PREMIUM_LUXURY | PLAYFUL | DEVELOPER_DARK | ECOMMERCE | DATA_DASHBOARD | AGENT_DECIDE
3. Identify Typography (approximate font families, hierarchy, font weights).
4. Observe Visual Density (compact | comfortable | spacious).
5. Extract structural observations:
   - OBSERVED_FROM_REFERENCE: Concrete visual elements clearly present in the image (layouts, component types, spacing, border radiuses, shadows).
   - AGENT_RECOMMENDATION: Your recommendations for building this into an implementation-ready software system.

Output Format:
You must respond with pure JSON adhering to this schema:
{
  "suggestedCategory": "MODERN_SAAS",
  "colorPalette": {
    "primary": "#4f46e5",
    "secondary": "#a855f7",
    "accent": "#10b981",
    "background": "#020617",
    "surface": "#0f172a",
    "text": "#f8fafc"
  },
  "typography": {
    "headingFont": "Inter or Plus Jakarta Sans",
    "bodyFont": "Inter"
  },
  "visualDensity": "comfortable",
  "observedFromReference": [
    "Collapsible left navigation sidebar with dark surface",
    "Card grid with subtle borders and 12px rounded corners",
    "Status badges with soft tinted backgrounds"
  ],
  "agentRecommendations": [
    "Use Tailwind CSS with custom slate-900 surface palette",
    "Implement responsive drawer on mobile screens"
  ],
  "summary": "Modern technical SaaS dashboard featuring dark slate aesthetics, clean iconography, and high-contrast typography."
}`;

export async function analyzeReferenceImage(
  imageBase64: string,
  mimeType: string,
  project: ProjectDocument,
): Promise<ImageAnalysisOutput> {
  try {
    const prompt = `Context: This reference design is for the project "${project.name}" (Initial idea: "${project.initialIdea}").
Target platform: "${project.targetPlatform || 'Web'}".
${IMAGE_ANALYSIS_PROMPT}`;

    const parsed = await AiProvider.analyzeImage<ImageAnalysisOutput>({
      prompt,
      imageBase64,
      mimeType,
    });
    logger.info({ projectId: project.id }, 'Reference image analyzed successfully via Gemini Vision');
    return parsed;
  } catch (error) {
    logger.error({ error, projectId: project.id }, 'Error analyzing reference image');
    throw new Error('Failed to analyze reference image. Ensure image format is valid.');
  }
}

interface RawScreenItem {
  name: string;
  route: string;
  purpose: string;
  targetRoles: string[];
  layout: string;
  components: string[];
  responsiveBehavior: {
    desktop: string;
    tablet: string;
    mobile: string;
  };
  states: {
    loading: string;
    empty: string;
    error: string;
    success: string;
  };
  apiDependencies: string[];
  authRequired: boolean;
}

const SCREENS_DECOMPOSITION_PROMPT = `You are a Principal Frontend Architect.
Decompose the software application and its functional requirements into a complete screen-by-screen frontend specification.

Every important screen must have:
- name: Clear title (e.g. "Main Dashboard", "Project Chat Workspace", "User Settings")
- route: Web/App route (e.g. "/dashboard", "/projects/:id", "/settings")
- purpose: Clear 1-2 sentence explanation of screen objective
- targetRoles: User roles who access this screen (e.g. ["admin", "member", "guest"])
- layout: Layout structure (e.g. "Sticky header + left sidebar + responsive 3-column grid")
- components: Array of component names on this screen (e.g. ["Navbar", "StatsCards", "DataTable", "FilterBar"])
- responsiveBehavior: { desktop, tablet, mobile } layout adjustments
- states: { loading, empty, error, success } UI behavior for each state
- apiDependencies: REST API endpoints this screen consumes (e.g. ["GET /api/projects", "POST /api/projects"])
- authRequired: boolean

Output Format:
You must return a JSON array of screen objects:
[
  {
    "name": "Dashboard",
    "route": "/dashboard",
    "purpose": "Displays real-time project metrics, active tasks, and recent notifications.",
    "targetRoles": ["user", "admin"],
    "layout": "Sidebar navigation with sticky header and card grid",
    "components": ["SidebarNav", "HeaderProfile", "MetricCardGrid", "ActivityFeed"],
    "responsiveBehavior": {
      "desktop": "Expanded sidebar, 3-column metric cards",
      "tablet": "Collapsible sidebar, 2-column cards",
      "mobile": "Bottom navigation bar, single-column scroll"
    },
    "states": {
      "loading": "Animated skeleton cards with pulse shimmer",
      "empty": "Welcome banner with 'Create First Project' CTA button",
      "error": "Dismissable alert banner with retry button",
      "success": "Populated cards with live indicators"
    },
    "apiDependencies": ["GET /api/projects", "GET /api/stats"],
    "authRequired": true
  }
]`;

export async function generateScreenSpecsFromRequirements(
  project: ProjectDocument,
): Promise<ScreenSpecDocument[]> {
  try {
    const requirements = await Requirement.find({ projectId: project._id });

    const reqsSummary = requirements
      .map((r) => `[${r.reqId}] (${r.type}) ${r.title ? `${r.title}: ` : ''}${r.description}`)
      .join('\n');

    const prompt = `Project: "${project.name}"
Initial Idea: "${project.initialIdea}"
Target Platform: "${project.targetPlatform || 'Web'}"
Design Category: "${project.designSpec?.visualCategory || 'MODERN_SAAS'}"

Functional & Technical Requirements:
${reqsSummary || 'No formal requirements yet — derive from initial idea.'}

${SCREENS_DECOMPOSITION_PROMPT}`;

    let parsedScreens: RawScreenItem[] = [];
    try {
      const { data, provider } = await AiProvider.importantJson<any>({
        prompt,
        temperature: 0.2,
      });
      logger.info({ projectId: project.id, provider }, 'Screens decomposed via AI');

      if (Array.isArray(data)) {
        parsedScreens = data;
      } else if (typeof data === 'object' && data !== null) {
        parsedScreens = data.screens || [];
      }
    } catch (parseErr) {
      logger.error({ parseErr }, 'Failed to parse screen specs JSON');
      return [];
    }

    const savedScreens: ScreenSpecDocument[] = [];

    for (const item of parsedScreens) {
      if (!item.name || !item.route) continue;

      // Upsert by route
      const existing = await ScreenSpec.findOne({ projectId: project._id, route: item.route });
      if (existing) {
        existing.name = item.name;
        existing.purpose = item.purpose;
        existing.targetRoles = item.targetRoles || existing.targetRoles;
        existing.layout = item.layout;
        existing.components = item.components || existing.components;
        existing.responsiveBehavior = item.responsiveBehavior || existing.responsiveBehavior;
        existing.states = item.states || existing.states;
        existing.apiDependencies = item.apiDependencies || existing.apiDependencies;
        existing.authRequired = item.authRequired ?? existing.authRequired;
        await existing.save();
        savedScreens.push(existing);
      } else {
        const created = await ScreenSpec.create({
          projectId: project._id,
          name: item.name,
          route: item.route,
          purpose: item.purpose,
          targetRoles: item.targetRoles || [],
          layout: item.layout,
          components: item.components || [],
          responsiveBehavior: item.responsiveBehavior,
          states: item.states,
          apiDependencies: item.apiDependencies || [],
          authRequired: item.authRequired ?? true,
        });
        savedScreens.push(created);
      }
    }

    logger.info({ projectId: project.id, count: savedScreens.length }, 'Screen specifications generated');
    return savedScreens;
  } catch (error) {
    logger.error({ error, projectId: project.id }, 'Error generating screen specs');
    return [];
  }
}
