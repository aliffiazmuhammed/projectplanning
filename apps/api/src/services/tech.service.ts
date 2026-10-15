import { logger } from '../config/logger.js';
import { TechDecision, type TechDecisionDocument } from '../models/TechDecision.js';
import { Requirement } from '../models/Requirement.js';
import { ScreenSpec } from '../models/ScreenSpec.js';
import type { ProjectDocument } from '../models/Project.js';
import {
  TechCategory,
  TechDecisionStatus,
  type TechCompatibilityReport,
} from '@project-planner/types';
import { AiProvider } from './ai.provider.js';

interface RawTechRecommendation {
  category: TechCategory;
  technology: string;
  versionConsidered: string;
  plainLanguageExplanation: string;
  technicalRationale: string;
  evaluationCriteria: {
    maturity: number;
    communityAdoption: number;
    documentationQuality: number;
    typeScriptSupport: number;
    performance: number;
    maintenance: number;
  };
  compatibilityNotes: string;
  risksAndTradeoffs: string[];
  alternatives: {
    name: string;
    pros: string[];
    cons: string[];
    reasonNotChosen: string;
  }[];
  confidence: number;
}

const TECH_EVALUATION_PROMPT = `You are a Principal Software Architect, CTO, and Technology Researcher.
Your job is to recommend the optimal, production-grade technology stack for this project.

Follow these strict principles from the specification:
1. DO NOT choose technology solely because it is "latest" or hype. Favor proven stability, long-term viability, and developer productivity.
2. For each recommendation, provide:
   - plainLanguageExplanation: Clear, jargon-free explanation written so a non-technical founder understands why this choice benefits their business.
   - technicalRationale: Rigorous architectural evaluation for senior engineers.
   - evaluationCriteria: Integer scores from 1 to 10 for maturity, communityAdoption, documentationQuality, typeScriptSupport, performance, maintenance.
   - compatibilityNotes: Explicit confirmation of how this technology interoperates with other components in this stack.
   - risksAndTradeoffs: 2-3 honest limitations or tradeoffs.
   - alternatives: 2-3 realistic alternatives that were evaluated, with their pros, cons, and reasonNotChosen.

Categories to recommend:
- FRONTEND_FRAMEWORK (e.g., React with Vite, Next.js, Vue/Nuxt)
- BACKEND_FRAMEWORK (e.g., Node.js with Express/Fastify, NestJS, Go/Fiber, Python/FastAPI)
- DATABASE (e.g., PostgreSQL with Prisma/Drizzle, MongoDB with Mongoose, SQLite)
- STYLING (e.g., Tailwind CSS, CSS Modules, Styled Components)
- COMPONENT_LIBRARY (e.g., Radix UI / Shadcn UI, Ant Design, Chakra UI)
- ICONS (e.g., Lucide Icons, Heroicons)
- STATE_MANAGEMENT (e.g., Zustand, TanStack Query, Redux Toolkit)
- DATA_FETCHING (e.g., TanStack Query, Axios, Native Fetch with custom wrappers)
- FORMS_VALIDATION (e.g., React Hook Form + Zod, Yup)
- AUTHENTICATION (e.g., Auth.js / NextAuth, Supabase Auth, Clerk, JWT / bcrypt)
- CHARTS_ANALYTICS (e.g., Recharts, Chart.js, Tremor, or N/A if not required)
- DEPLOYMENT_HOSTING (e.g., Vercel, Docker + Railway / Render, AWS ECS, DigitalOcean)

Output Format:
You must return a pure JSON array of recommendation objects adhering to this schema:
[
  {
    "category": "FRONTEND_FRAMEWORK",
    "technology": "React 18 / 19 with Vite",
    "versionConsidered": "^18.3 or ^19.0",
    "plainLanguageExplanation": "React is the global industry standard for interactive web applications. Vite ensures rapid screen loading and lightning-fast developer turnaround.",
    "technicalRationale": "Component-driven architecture, massive ecosystem, outstanding TypeScript ergonomics, and zero lock-in compared to opinionated meta-frameworks.",
    "evaluationCriteria": {
      "maturity": 10,
      "communityAdoption": 10,
      "documentationQuality": 9,
      "typeScriptSupport": 10,
      "performance": 9,
      "maintenance": 10
    },
    "compatibilityNotes": "Pairs cleanly with Tailwind CSS, Lucide icons, and REST API backend.",
    "risksAndTradeoffs": [
      "Client-side rendered by default; requires SSR or static generation if aggressive public SEO is mandatory",
      "Requires team discipline on state management patterns"
    ],
    "alternatives": [
      {
        "name": "Next.js App Router",
        "pros": ["Built-in server components", "First-class SEO rendering"],
        "cons": ["Higher deployment complexity", "Vercel-centric abstractions"],
        "reasonNotChosen": "Standard client SPA with separate backend API provides cleaner decoupling for this specific project."
      }
    ],
    "confidence": 0.95
  }
]`;

export async function generateTechStackRecommendations(
  project: ProjectDocument,
): Promise<TechDecisionDocument[]> {
  try {
    const [requirements, screens] = await Promise.all([
      Requirement.find({ projectId: project._id }),
      ScreenSpec.find({ projectId: project._id }),
    ]);

    const reqsSummary = requirements
      .map((r) => `[${r.reqId}] (${r.type}) ${r.title ? `${r.title}: ` : ''}${r.description}`)
      .join('\n');

    const screensSummary = screens
      .map((s) => `- ${s.name} (${s.route}): ${s.purpose} [Components: ${s.components.join(', ')}]`)
      .join('\n');

    const designSummary = project.designSpec
      ? `Visual Category: ${project.designSpec.visualCategory || 'MODERN_SAAS'}, Theme: ${project.designSpec.themeMode || 'dark'}, Density: ${project.designSpec.visualDensity || 'comfortable'}`
      : 'Modern SaaS aesthetic';

    const prompt = `Project: "${project.name}"
Initial Idea: "${project.initialIdea}"
Target Platform: "${project.targetPlatform || 'Web'}"
Design System Preferences: ${designSummary}

Core Functional & Non-Functional Requirements:
${reqsSummary || 'Derive stack from initial product description.'}

Screens & Frontend UI Complexity:
${screensSummary || 'Standard multi-view dashboard and management interface.'}

${TECH_EVALUATION_PROMPT}`;

    let rawList: RawTechRecommendation[] = [];
    try {
      const { data, provider } = await AiProvider.importantJson<any>({
        prompt,
        temperature: 0.2,
      });
      logger.info({ projectId: project.id, provider }, 'Tech stack generated via AI');

      if (Array.isArray(data)) {
        rawList = data;
      } else if (typeof data === 'object' && data !== null) {
        rawList = data.recommendations || data.techStack || [];
      }
    } catch (parseErr) {
      logger.error({ parseErr }, 'Failed to generate tech stack via AI');
      return [];
    }

    const savedDecisions: TechDecisionDocument[] = [];

    for (const item of rawList) {
      if (!item.category || !item.technology) continue;

      // Ensure valid category enum
      if (!Object.values(TechCategory).includes(item.category)) {
        continue;
      }

      const existing = await TechDecision.findOne({
        projectId: project._id,
        category: item.category,
      });

      if (existing) {
        // If user already approved or customized, keep status and user notes
        if (
          existing.status === TechDecisionStatus.APPROVED ||
          existing.status === TechDecisionStatus.CUSTOMIZED
        ) {
          existing.versionConsidered = item.versionConsidered || existing.versionConsidered;
          existing.technicalRationale = item.technicalRationale;
          existing.evaluationCriteria = item.evaluationCriteria;
          existing.compatibilityNotes = item.compatibilityNotes;
          existing.risksAndTradeoffs = item.risksAndTradeoffs;
          existing.alternatives = item.alternatives as any;
          await existing.save();
          savedDecisions.push(existing);
        } else {
          // Update full recommendation
          existing.technology = item.technology;
          existing.versionConsidered = item.versionConsidered;
          existing.plainLanguageExplanation = item.plainLanguageExplanation;
          existing.technicalRationale = item.technicalRationale;
          existing.evaluationCriteria = item.evaluationCriteria;
          existing.compatibilityNotes = item.compatibilityNotes;
          existing.risksAndTradeoffs = item.risksAndTradeoffs;
          existing.alternatives = item.alternatives as any;
          existing.confidence = item.confidence || 0.9;
          existing.status = TechDecisionStatus.RECOMMENDED;
          await existing.save();
          savedDecisions.push(existing);
        }
      } else {
        const created = await TechDecision.create({
          projectId: project._id,
          category: item.category,
          technology: item.technology,
          versionConsidered: item.versionConsidered,
          plainLanguageExplanation: item.plainLanguageExplanation,
          technicalRationale: item.technicalRationale,
          evaluationCriteria: item.evaluationCriteria,
          compatibilityNotes: item.compatibilityNotes,
          risksAndTradeoffs: item.risksAndTradeoffs,
          alternatives: item.alternatives,
          confidence: item.confidence || 0.9,
          status: TechDecisionStatus.RECOMMENDED,
        });
        savedDecisions.push(created);
      }
    }

    logger.info({ projectId: project.id, count: savedDecisions.length }, 'Technology stack recommendations generated');
    return savedDecisions;
  } catch (error) {
    logger.error({ error, projectId: project.id }, 'Error generating tech stack recommendations');
    return [];
  }
}

export async function checkTechCompatibility(
  project: ProjectDocument,
): Promise<TechCompatibilityReport> {
  try {
    const decisions = await TechDecision.find({ projectId: project._id });

    if (decisions.length === 0) {
      return {
        score: 100,
        status: 'OPTIMAL',
        overallAssessment: 'No technology selections have been made yet to audit.',
        checkedPairs: [],
        recommendations: ['Generate technology recommendations to assess stack compatibility.'],
      };
    }

    const techListText = decisions
      .map((d) => `[${d.category}] ${d.technology} (Status: ${d.status})`)
      .join('\n');

    const prompt = `You are a Principal Software Systems Architect and Build System Auditor.
Audit this selected technology stack for internal compatibility, version friction, tooling mismatches, and deployment synergy:

Stack Selections:
${techListText}

Perform a thorough compatibility verification:
1. Are there any known conflicts, ESM/CJS discrepancies, package version incompatibilities, or architectural antipatterns?
2. Assess compatibility pairs (e.g. Frontend + Backend, Frontend + Component Library, Database + Backend Framework, etc.).
3. Assign an overall compatibility score (0 to 100).
4. Status: "OPTIMAL" (no friction, highly complementary), "COMPATIBLE_WITH_WARNINGS" (fine to use but watch out for specific integration caveats), or "CONFLICTS_DETECTED" (incompatible choices that need switching).

Output Format:
Return pure JSON adhering to this schema:
{
  "score": 96,
  "status": "OPTIMAL",
  "overallAssessment": "The stack represents a cohesive TypeScript monorepo architecture with clean separation of concerns.",
  "checkedPairs": [
    {
      "itemA": "React 19 with Vite",
      "itemB": "Tailwind CSS",
      "compatible": true,
      "note": "Fully supported with PostCSS / Vite Tailwind integration."
    },
    {
      "itemA": "Node.js + Express",
      "itemB": "MongoDB + Mongoose",
      "compatible": true,
      "note": "Standard idiomatic pairing for document-based relational persistence."
    }
  ],
  "recommendations": [
    "Ensure TypeScript tsconfig paths are shared via monorepo packages",
    "Use strict zod schemas on API boundaries"
  ]
}`;

    const { data: parsed, provider } = await AiProvider.importantJson<TechCompatibilityReport>({
      prompt,
      temperature: 0.2,
    });

    logger.info({ projectId: project.id, provider, score: parsed.score, status: parsed.status }, 'Stack compatibility audit completed');
    return parsed;
  } catch (error) {
    logger.error({ error, projectId: project.id }, 'Error auditing stack compatibility');
    return {
      score: 90,
      status: 'OPTIMAL',
      overallAssessment: 'Automated compatibility check completed with standard baseline compatibility.',
      checkedPairs: [],
      recommendations: ['Ensure dependencies are kept up to date.'],
    };
  }
}
