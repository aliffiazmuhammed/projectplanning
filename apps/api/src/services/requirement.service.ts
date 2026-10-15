import { logger } from '../config/logger.js';
import { Requirement, type RequirementDocument } from '../models/Requirement.js';
import type { ProjectDocument } from '../models/Project.js';
import type { MessageDocument } from '../models/Message.js';
import { 
  RequirementType, 
  RequirementStatus, 
  type RequirementPriority, 
  type RequirementSource 
} from '@project-planner/types';
import { AiProvider } from './ai.provider.js';

const PREFIX_MAP: Record<RequirementType, string> = {
  [RequirementType.FUNCTIONAL]: 'FR',
  [RequirementType.NON_FUNCTIONAL]: 'NFR',
  [RequirementType.BUSINESS_RULE]: 'BR',
  [RequirementType.SECURITY]: 'SEC',
  [RequirementType.PERFORMANCE]: 'PERF',
  [RequirementType.ACCESSIBILITY]: 'A11Y',
  [RequirementType.UX]: 'UX',
  [RequirementType.TECHNICAL]: 'TECH',
  [RequirementType.DEPLOYMENT]: 'DEP',
  [RequirementType.INTEGRATION]: 'INT',
  [RequirementType.CONSTRAINT]: 'CON',
};

interface ExtractedRequirementItem {
  title: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  status: RequirementStatus;
  source: RequirementSource;
  confidence: number;
  dependencies?: string[];
}

const EXTRACTION_SYSTEM_PROMPT = `You are an expert Software Requirements Engineering Agent.
Your job is to analyze the software project conversation and extract formal, structured requirements following IEEE 830 and modern agile best practices.

Extract requirements categorized into these types:
- FUNCTIONAL (core user behaviors, workflows, user stories)
- NON_FUNCTIONAL (scalability, reliability, observability)
- BUSINESS_RULE (domain logic, policies, limits, calculations)
- SECURITY (auth, permissions, encryption, data privacy)
- PERFORMANCE (latency, throughput, concurrency limits)
- ACCESSIBILITY (WCAG, keyboard navigation, contrast)
- UX (screen navigation, responsive design, component styling)
- TECHNICAL (runtime, libraries, architecture patterns)
- DEPLOYMENT (hosting, CI/CD, containers, environments)
- INTEGRATION (third-party APIs, webhooks, payment gateways, email)
- CONSTRAINT (fixed budget, timeline, team, legal/compliance limits)

Requirement Status Rules:
1. CONFIRMED: The user explicitly stated or confirmed this requirement.
2. RECOMMENDATION: The agent recommended this best practice, but the user has not yet approved it.
3. ASSUMPTION: An unstated assumption necessary for the system to function.
4. OPEN_QUESTION: Something critical that is vague or undefined and needs clarification.
5. CONSTRAINT: A strict environmental or user-imposed boundary.

Priority: LOW | MEDIUM | HIGH | CRITICAL
Source: USER | AGENT
Confidence: A number between 0.0 and 1.0 indicating certainty based strictly on conversation facts.

Output Format:
You must respond with a JSON array of requirement objects matching this schema:
[
  {
    "title": "Concise summary (max 10 words)",
    "description": "Clear, testable, atomic requirement statement",
    "type": "FUNCTIONAL",
    "priority": "HIGH",
    "status": "CONFIRMED",
    "source": "USER",
    "confidence": 0.95,
    "dependencies": []
  }
]

CRITICAL RULES:
- Do not invent requirements that contradict the conversation.
- Do not duplicate existing requirements provided in the prompt.
- Every requirement must be atomic, unambiguous, and verifiable.`;

export async function extractRequirementsFromConversation(
  project: ProjectDocument,
  messages: MessageDocument[],
): Promise<RequirementDocument[]> {
  try {
    const existingReqs = await Requirement.find({ projectId: project._id });

    // Format existing requirements summary to avoid duplicates
    const existingList = existingReqs.map(
      (r) => `[${r.reqId}] (${r.type} - ${r.status}) ${r.title || r.description}`
    ).join('\n');

    // Build the transcript
    const transcript = messages
      .slice(-15) // focus on the most recent 15 exchanges
      .map((m) => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
      .join('\n\n');

    const prompt = `Project Name: "${project.name}"
Initial Idea: "${project.initialIdea}"
Target Platform: "${project.targetPlatform || 'Not specified'}"
Active Discovery Phase: ${project.discoveryPhase}

Existing Requirements Already Registered:
${existingList || 'None registered yet.'}

Recent Conversation:
${transcript}

Analyze the conversation above and extract all new or updated requirements. Return a JSON array of requirement objects.`;

    let parsedItems: ExtractedRequirementItem[] = [];
    try {
      const { data, provider } = await AiProvider.quickJson<any>({
        systemPrompt: EXTRACTION_SYSTEM_PROMPT,
        prompt,
        temperature: 0.2,
      });
      logger.info({ projectId: project._id, provider }, 'Requirements extracted via AI');

      if (Array.isArray(data)) {
        parsedItems = data;
      } else if (typeof data === 'object' && data !== null) {
        parsedItems = data.requirements || data.items || [];
      }
    } catch (parseErr) {
      logger.warn({ parseErr, projectId: project._id }, 'Failed to extract requirements JSON');
      return [];
    }

    // Get current ID counters for each prefix
    const prefixCounts: Record<string, number> = {};
    for (const req of existingReqs) {
      const match = req.reqId.match(/^([A-Z0-9]+)-(\d+)$/);
      if (match && match[1] && match[2]) {
        const prefix = match[1];
        const num = parseInt(match[2], 10);
        prefixCounts[prefix] = Math.max(prefixCounts[prefix] || 0, num);
      }
    }

    const savedRequirements: RequirementDocument[] = [];

    for (const item of parsedItems) {
      if (!item.description || !item.type) continue;

      // Validate enum type fallback
      const validTypes = Object.values(RequirementType);
      const type = validTypes.includes(item.type) ? item.type : RequirementType.FUNCTIONAL;

      const validStatuses = Object.values(RequirementStatus);
      const status = validStatuses.includes(item.status) ? item.status : RequirementStatus.RECOMMENDATION;

      // Check if requirement with very similar description already exists
      const existingMatch = existingReqs.find(
        (r) =>
          r.description.toLowerCase().trim() === item.description.toLowerCase().trim() ||
          (item.title && r.title && r.title.toLowerCase().trim() === item.title.toLowerCase().trim())
      );

      if (existingMatch) {
        // Update status / confidence if changed
        if (existingMatch.status !== status || existingMatch.confidence !== item.confidence) {
          existingMatch.status = status;
          existingMatch.confidence = item.confidence || existingMatch.confidence;
          if (item.priority) existingMatch.priority = item.priority;
          await existingMatch.save();
          savedRequirements.push(existingMatch);
        }
        continue;
      }

      // Generate next sequential reqId (e.g., FR-001)
      const prefix = PREFIX_MAP[type] || 'REQ';
      const nextNum = (prefixCounts[prefix] || 0) + 1;
      prefixCounts[prefix] = nextNum;
      const formattedNum = String(nextNum).padStart(3, '0');
      const reqId = `${prefix}-${formattedNum}`;

      const newDoc = await Requirement.create({
        projectId: project._id,
        reqId,
        title: item.title || undefined,
        description: item.description,
        type,
        priority: item.priority || 'MEDIUM',
        status,
        source: item.source || 'AGENT',
        confidence: typeof item.confidence === 'number' ? Math.min(Math.max(item.confidence, 0), 1) : 0.85,
        dependencies: Array.isArray(item.dependencies) ? item.dependencies : [],
      });

      savedRequirements.push(newDoc);
    }

    logger.info(
      { projectId: project.id, newCount: savedRequirements.length },
      'Requirements extraction completed'
    );

    return savedRequirements;
  } catch (error) {
    logger.error({ error, projectId: project.id }, 'Error during requirements extraction');
    return [];
  }
}
