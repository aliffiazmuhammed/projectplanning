import { logger } from '../config/logger.js';
import { ThirdPartyIntegration, type ThirdPartyIntegrationDocument } from '../models/ThirdPartyIntegration.js';
import { HumanAction, type HumanActionDocument } from '../models/HumanAction.js';
import { Project } from '../models/Project.js';
import { Requirement } from '../models/Requirement.js';
import { ScreenSpec } from '../models/ScreenSpec.js';
import { TechDecision } from '../models/TechDecision.js';
import { ArchitecturePlan } from '../models/ArchitecturePlan.js';
import type {
  IThirdPartyIntegration,
  IHumanAction,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  CreateHumanActionRequest,
  UpdateHumanActionRequest,
  HumanActionStatus,
  IntegrationCategory,
  IntegrationStatus,
  SecurityClassification,
  BlockingStatus,
  HumanActionCategory,
  ICredentialRequirement,
} from '@project-planner/types';
import { AiProvider } from './ai.provider.js';

interface RawIntegration {
  service: string;
  category: IntegrationCategory;
  purpose: string;
  accountRequired: boolean;
  accountName?: string;
  credentialsRequired: ICredentialRequirement[];
  permissionsRequired: string[];
  configurationRequired: string[];
  humanSetupSteps: string[];
  aiResponsibilities: string[];
  humanResponsibilities: string[];
  securityClassification: SecurityClassification;
  blockingStatus: BlockingStatus;
  estimatedCost?: string;
  dependencies: string[];
  docsUrl?: string;
}

interface RawHumanAction {
  actionId?: string;
  title: string;
  category: HumanActionCategory;
  whyRequired: string;
  prerequisites: string[];
  instructions: string[];
  credentialsRequired: string[];
  whereToObtain: string;
  permissionsNeeded?: string;
  isSecret: boolean;
  secretHandlingInstructions?: string;
  aiActionAfterward: string;
  blockingStatus: BlockingStatus;
  integrationName?: string;
}

const THIRD_PARTY_INTEGRATION_PROMPT = `You are a Principal Software Solutions Architect.
Analyze the project requirements, frontend screens, technology stack, and architecture to identify all external third-party integrations and dependencies.

Consider these common enterprise categories:
- AUTH: OAuth providers (Google OAuth, GitHub, Apple), Auth0, Clerk
- PAYMENT: Stripe, PayPal, Razorpay, LemonSqueezy
- EMAIL: Resend, SendGrid, Postmark, AWS SES
- SMS / COMMUNICATIONS: Twilio, WhatsApp Business Cloud API
- STORAGE: AWS S3, Cloudflare R2, Google Cloud Storage
- MAPS: Google Maps, Mapbox
- AI_LLM: OpenAI API, Google Gemini API, Anthropic Claude
- ANALYTICS: PostHog, Google Analytics, Mixpanel
- MONITORING: Sentry, Datadog, LogRocket
- DATABASE_CLOUD: MongoDB Atlas, Supabase, Neon
- OTHER: Webhook destinations, external CDNs

For every integration:
1. Provide exact credentials required with classification (PUBLIC, SENSITIVE, SECRET).
2. Clearly divide responsibilities: what the human must do vs. what the AI coding agent will automate.
3. State whether this integration is BLOCKING (system cannot run without it) or NON_BLOCKING.
4. Estimate free-tier vs standard pricing cost.

Return a JSON array of integration objects matching this schema:
[
  {
    "service": "Stripe",
    "category": "PAYMENT",
    "purpose": "Process customer subscription billing, one-off checkouts, and handle payment webhooks.",
    "accountRequired": true,
    "accountName": "Stripe Merchant Account",
    "credentialsRequired": [
      {
        "name": "STRIPE_SECRET_KEY",
        "classification": "SECRET",
        "description": "Server-side secret key for Stripe SDK API requests",
        "whereToFind": "Stripe Dashboard > Developers > API keys",
        "exampleFormat": "sk_test_..."
      },
      {
        "name": "STRIPE_PUBLISHABLE_KEY",
        "classification": "PUBLIC",
        "description": "Client-side key for initializing Stripe Elements UI",
        "whereToFind": "Stripe Dashboard > Developers > API keys",
        "exampleFormat": "pk_test_..."
      },
      {
        "name": "STRIPE_WEBHOOK_SECRET",
        "classification": "SECRET",
        "description": "Secret used to verify cryptographic signatures on incoming webhooks",
        "whereToFind": "Stripe Dashboard > Developers > Webhooks",
        "exampleFormat": "whsec_..."
      }
    ],
    "permissionsRequired": ["Customers read/write", "Charges read/write", "Subscriptions read/write"],
    "configurationRequired": ["Register webhook endpoint /api/webhooks/stripe", "Enable payment methods"],
    "humanSetupSteps": [
      "Sign up for a Stripe account and complete business KYC verification.",
      "Navigate to Developers > API keys and copy test keys.",
      "Register webhook URL in Stripe dashboard and copy webhook signing secret."
    ],
    "aiResponsibilities": [
      "Install @stripe/stripe-js and stripe npm packages.",
      "Implement checkout session creation API endpoint.",
      "Implement webhook handler with signature verification."
    ],
    "humanResponsibilities": [
      "Complete legal business registration and bank account payout setup.",
      "Provide API keys via .env or cloud secret manager."
    ],
    "securityClassification": "SECRET",
    "blockingStatus": "BLOCKING",
    "estimatedCost": "2.9% + $0.30 per successful card transaction. No monthly subscription fee.",
    "dependencies": ["FR-004"],
    "docsUrl": "https://stripe.com/docs"
  }
]`;

const HUMAN_ACTION_PLANNER_PROMPT = `You are a Senior Project Manager & Technical Operations Specialist.
Analyze the project requirements, architecture, and external integrations to generate a step-by-step checklist of EVERY ACTION A HUMAN MUST COMPLETE before or during development.
The AI cannot safely or legally perform these actions itself (e.g. creating accounts, entering credit cards, business verification, purchasing domains, OAuth consent, generating secret keys).

CRITICAL SPECIFICATION REQUIREMENTS:
1. Instructions MUST be written in plain language for a NON-TECHNICAL FOUNDER.
2. Provide exact click-by-click instructions, portal URLs, and menu navigation.
3. Classify whether the action is BLOCKING (prerequisite before coding or deployment) or NON_BLOCKING.
4. Clearly state what credentials or tokens the human must obtain.
5. Provide strict secret handling guidelines: "Never share in chat, commit to git, or paste into public forums; store in .env.local or secret manager".
6. Explicitly state "What the AI will do afterward" once the action is completed.

Return a JSON array of human action objects matching this schema:
[
  {
    "actionId": "HA-001",
    "title": "Create Stripe Account & Obtain API Keys",
    "category": "ACCOUNT_SETUP",
    "whyRequired": "Payment processing requires a verified merchant account. The AI cannot legally sign agreements or access your banking details.",
    "prerequisites": ["Valid business email address", "Business bank account details"],
    "instructions": [
      "Go to https://dashboard.stripe.com/register and create an account.",
      "Verify your email address via the confirmation link sent to your inbox.",
      "Complete the business verification form with your legal business name and tax ID.",
      "Toggle to 'Test Mode' at the top right of the dashboard.",
      "Navigate to Developers > API Keys in the left sidebar.",
      "Click 'Reveal live key' or copy 'Publishable key' and 'Secret key'."
    ],
    "credentialsRequired": ["STRIPE_PUBLISHABLE_KEY", "STRIPE_SECRET_KEY"],
    "whereToObtain": "https://dashboard.stripe.com/apikeys",
    "permissionsNeeded": "Administrator or Developer role on Stripe account",
    "isSecret": true,
    "secretHandlingInstructions": "Copy the Secret Key directly into your local .env file. Never commit this file to Git or paste it into public chat.",
    "aiActionAfterward": "The AI coding agent will configure the Stripe SDK in the backend checkout controller and hook up checkout sessions.",
    "blockingStatus": "BLOCKING",
    "integrationName": "Stripe"
  }
]`;

export class IntegrationService {
  /**
   * Get all integrations, human actions, and KPI summary stats for a project.
   */
  static async getIntegrationsAndActions(projectId: string) {
    const [integrations, actions] = await Promise.all([
      ThirdPartyIntegration.find({ projectId }).sort({ category: 1, service: 1 }),
      HumanAction.find({ projectId }).sort({ actionId: 1 }),
    ]);

    const stats = {
      totalIntegrations: integrations.length,
      configuredIntegrations: integrations.filter(
        (i) => i.status === 'CONFIGURED' || i.status === 'VERIFIED',
      ).length,
      totalActions: actions.length,
      completedActions: actions.filter((a) => a.completionStatus === 'COMPLETED').length,
      pendingBlockingActions: actions.filter(
        (a) => a.blockingStatus === 'BLOCKING' && a.completionStatus !== 'COMPLETED',
      ).length,
    };

    return {
      integrations,
      actions,
      stats,
    };
  }

  /**
   * Run Gemini discovery to identify all third-party integrations and required human actions.
   */
  static async discoverIntegrationsAndActions(projectId: string) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    const [requirements, screens, techStack, architecturePlan] = await Promise.all([
      Requirement.find({ projectId: project._id }),
      ScreenSpec.find({ projectId: project._id }),
      TechDecision.find({ projectId: project._id }),
      ArchitecturePlan.findOne({ projectId: project._id }),
    ]);

    const reqsText = requirements
      .map((r) => `[${r.reqId}] (${r.type} - ${r.priority}): ${r.title ? r.title + ': ' : ''}${r.description}`)
      .join('\n');

    const screensText = screens
      .map((s) => `Screen: ${s.name} (${s.route}) - APIs: ${s.apiDependencies?.join(', ') || 'N/A'}`)
      .join('\n');

    const techText = techStack
      .map((t) => `${t.category}: ${t.technology}`)
      .join('\n');

    const archText = architecturePlan
      ? `System Overview: ${architecturePlan.systemOverview}\nSecurity Strategy: ${architecturePlan.security?.authenticationStrategy}\nDeployment: ${architecturePlan.deployment?.platform}`
      : 'Monorepo architecture with REST API and single-page application frontend.';

    const context = `Project: "${project.name}"
Initial Idea: "${project.initialIdea}"
Target Platform: "${project.targetPlatform || 'Web'}"

Technology Choices:
${techText || 'Node.js, Express, React, TypeScript, MongoDB'}

Requirements:
${reqsText || 'Standard MVP functionality'}

Frontend Screens:
${screensText || 'Dashboard and management interface'}

Architecture Summary:
${archText}`;

    // Run parallel Important Task AI discovery for Integrations and Human Actions (Gemini primary, Groq fallback)
    const [integrationsResult, actionsResult] = await Promise.all([
      AiProvider.importantJson<any>({ prompt: `${context}\n\n${THIRD_PARTY_INTEGRATION_PROMPT}` }),
      AiProvider.importantJson<any>({ prompt: `${context}\n\n${HUMAN_ACTION_PLANNER_PROMPT}` }),
    ]);

    // Parse integrations
    let rawIntegrations: RawIntegration[] = [];
    try {
      const parsed = integrationsResult.data;
      rawIntegrations = Array.isArray(parsed) ? parsed : parsed?.integrations || [];
    } catch (err) {
      logger.error({ err }, 'Failed to parse integrations JSON via AI');
    }

    // Upsert integrations
    const savedIntegrations: ThirdPartyIntegrationDocument[] = [];
    for (const item of rawIntegrations) {
      if (!item.service) continue;
      const existing = await ThirdPartyIntegration.findOne({
        projectId: project._id,
        service: item.service,
      });

      if (existing) {
        existing.category = item.category || existing.category;
        existing.purpose = item.purpose || existing.purpose;
        existing.accountRequired = item.accountRequired ?? existing.accountRequired;
        existing.accountName = item.accountName || existing.accountName;
        existing.credentialsRequired = item.credentialsRequired || existing.credentialsRequired;
        existing.permissionsRequired = item.permissionsRequired || existing.permissionsRequired;
        existing.configurationRequired = item.configurationRequired || existing.configurationRequired;
        existing.humanSetupSteps = item.humanSetupSteps || existing.humanSetupSteps;
        existing.aiResponsibilities = item.aiResponsibilities || existing.aiResponsibilities;
        existing.humanResponsibilities = item.humanResponsibilities || existing.humanResponsibilities;
        existing.securityClassification = item.securityClassification || existing.securityClassification;
        existing.blockingStatus = item.blockingStatus || existing.blockingStatus;
        existing.estimatedCost = item.estimatedCost || existing.estimatedCost;
        existing.dependencies = item.dependencies || existing.dependencies;
        existing.docsUrl = item.docsUrl || existing.docsUrl;
        await existing.save();
        savedIntegrations.push(existing);
      } else {
        const created = await ThirdPartyIntegration.create({
          projectId: project._id,
          service: item.service,
          category: item.category || 'OTHER',
          purpose: item.purpose,
          accountRequired: item.accountRequired ?? true,
          accountName: item.accountName,
          credentialsRequired: item.credentialsRequired || [],
          permissionsRequired: item.permissionsRequired || [],
          configurationRequired: item.configurationRequired || [],
          humanSetupSteps: item.humanSetupSteps || [],
          aiResponsibilities: item.aiResponsibilities || [],
          humanResponsibilities: item.humanResponsibilities || [],
          securityClassification: item.securityClassification || 'SECRET',
          blockingStatus: item.blockingStatus || 'BLOCKING',
          estimatedCost: item.estimatedCost,
          dependencies: item.dependencies || [],
          docsUrl: item.docsUrl,
          status: 'IDENTIFIED',
        });
        savedIntegrations.push(created);
      }
    }

    // Parse human actions
    let rawActions: RawHumanAction[] = [];
    try {
      const parsed = actionsResult.data;
      rawActions = Array.isArray(parsed) ? parsed : parsed?.actions || [];
    } catch (err) {
      logger.error({ err }, 'Failed to parse human actions JSON via AI');
    }

    // Determine current action counter
    const existingActions = await HumanAction.find({ projectId: project._id });
    let maxCounter = existingActions.reduce((max, a) => {
      const match = a.actionId?.match(/HA-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const savedActions: HumanActionDocument[] = [];
    for (const item of rawActions) {
      if (!item.title) continue;

      let actionId = item.actionId;
      if (!actionId || !actionId.startsWith('HA-')) {
        maxCounter += 1;
        actionId = `HA-${String(maxCounter).padStart(3, '0')}`;
      }

      // Find integration ID if referenced by name
      let integrationId: string | undefined;
      if (item.integrationName) {
        const matched = savedIntegrations.find(
          (i) => i.service.toLowerCase() === item.integrationName?.toLowerCase(),
        );
        if (matched) {
          integrationId = matched._id.toString();
        }
      }

      const existing = await HumanAction.findOne({
        projectId: project._id,
        $or: [{ actionId }, { title: item.title }],
      });

      if (existing) {
        existing.title = item.title;
        existing.category = item.category || existing.category;
        existing.whyRequired = item.whyRequired || existing.whyRequired;
        existing.prerequisites = item.prerequisites || existing.prerequisites;
        existing.instructions = item.instructions || existing.instructions;
        existing.credentialsRequired = item.credentialsRequired || existing.credentialsRequired;
        existing.whereToObtain = item.whereToObtain || existing.whereToObtain;
        existing.permissionsNeeded = item.permissionsNeeded || existing.permissionsNeeded;
        existing.isSecret = item.isSecret ?? existing.isSecret;
        existing.secretHandlingInstructions =
          item.secretHandlingInstructions || existing.secretHandlingInstructions;
        existing.aiActionAfterward = item.aiActionAfterward || existing.aiActionAfterward;
        existing.blockingStatus = item.blockingStatus || existing.blockingStatus;
        if (integrationId) existing.integrationId = integrationId;
        await existing.save();
        savedActions.push(existing);
      } else {
        const created = await HumanAction.create({
          projectId: project._id,
          actionId,
          title: item.title,
          category: item.category || 'ACCOUNT_SETUP',
          whyRequired: item.whyRequired,
          prerequisites: item.prerequisites || [],
          instructions: item.instructions || [],
          credentialsRequired: item.credentialsRequired || [],
          whereToObtain: item.whereToObtain,
          permissionsNeeded: item.permissionsNeeded,
          isSecret: item.isSecret ?? false,
          secretHandlingInstructions: item.secretHandlingInstructions,
          aiActionAfterward: item.aiActionAfterward,
          blockingStatus: item.blockingStatus || 'BLOCKING',
          completionStatus: 'PENDING',
          integrationId,
        });
        savedActions.push(created);
      }
    }

    return this.getIntegrationsAndActions(projectId);
  }

  /**
   * Create a custom integration.
   */
  static async createIntegration(projectId: string, input: CreateIntegrationRequest) {
    const integration = await ThirdPartyIntegration.create({
      projectId,
      ...input,
    });
    return integration;
  }

  /**
   * Update an integration.
   */
  static async updateIntegration(integrationId: string, input: UpdateIntegrationRequest) {
    const integration = await ThirdPartyIntegration.findByIdAndUpdate(
      integrationId,
      { $set: input },
      { new: true, runValidators: true },
    );
    if (!integration) throw new Error('Integration not found');
    return integration;
  }

  /**
   * Delete an integration.
   */
  static async deleteIntegration(integrationId: string) {
    const result = await ThirdPartyIntegration.findByIdAndDelete(integrationId);
    if (!result) throw new Error('Integration not found');
    return { success: true };
  }

  /**
   * Create a manual human action.
   */
  static async createHumanAction(projectId: string, input: CreateHumanActionRequest) {
    let actionId = input.actionId;
    if (!actionId) {
      const count = await HumanAction.countDocuments({ projectId });
      actionId = `HA-${String(count + 1).padStart(3, '0')}`;
    }

    const action = await HumanAction.create({
      projectId,
      ...input,
      actionId,
    });
    return action;
  }

  /**
   * Update a human action.
   */
  static async updateHumanAction(actionId: string, input: UpdateHumanActionRequest) {
    const action = await HumanAction.findByIdAndUpdate(
      actionId,
      { $set: input },
      { new: true, runValidators: true },
    );
    if (!action) throw new Error('Human action not found');
    return action;
  }

  /**
   * Update a human action's completion status (e.g. toggle PENDING -> COMPLETED).
   */
  static async updateHumanActionStatus(
    actionId: string,
    status: HumanActionStatus,
    notes?: string,
  ) {
    const update: Record<string, any> = { completionStatus: status };
    if (notes !== undefined) update.notes = notes;

    const action = await HumanAction.findByIdAndUpdate(
      actionId,
      { $set: update },
      { new: true },
    );
    if (!action) throw new Error('Human action not found');
    return action;
  }

  /**
   * Delete a human action.
   */
  static async deleteHumanAction(actionId: string) {
    const result = await HumanAction.findByIdAndDelete(actionId);
    if (!result) throw new Error('Human action not found');
    return { success: true };
  }
}
