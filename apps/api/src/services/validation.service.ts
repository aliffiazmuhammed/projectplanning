import { logger } from '../config/logger.js';
import { ValidationIssue, type ValidationIssueDocument } from '../models/ValidationIssue.js';
import { Requirement } from '../models/Requirement.js';
import type { ProjectDocument } from '../models/Project.js';
import type { MessageDocument } from '../models/Message.js';
import { 
  ValidationIssueType, 
  ValidationSeverity, 
  ValidationIssueStatus 
} from '@project-planner/types';
import { AiProvider } from './ai.provider.js';

interface RawValidationIssue {
  type: ValidationIssueType;
  title: string;
  description: string;
  severity: ValidationSeverity;
  affectedRequirements: string[];
  suggestedResolutions: string[];
}

const VALIDATION_SYSTEM_PROMPT = `You are an elite Software Architecture & Requirements Validation Engine.
Your purpose is to rigorously inspect software requirements and conversation context to detect:

1. AMBIGUITY:
   - Identify vague adjectives or unmeasurable claims (e.g. "fast", "secure", "scale to many users", "admin manages everything", "users get notifications").
   - For each ambiguity, provide 2 to 4 concrete, actionable interpretations or measurable standards.

2. CONTRADICTION:
   - Identify mutually conflicting requirements (e.g. "only admins can create posts" vs "standard members can publish posts", or "must be 100% offline" vs "real-time cloud backup").
   - Explicitly list the affected requirement IDs (e.g. ["FR-002", "FR-005"]).

3. MISSING_INFO:
   - Detect missing critical architectural decisions (e.g. user authentication strategy, role permissions matrix, data retention/backup rules, error-handling/offline behavior, rate limiting).
   - Only flag genuinely critical omissions for the current scope.

4. ASSUMPTION:
   - Identify any unconfirmed assumptions that carry high architectural risk and require human confirmation.

Severity Rules:
- BLOCKING: Critical contradictions or severe ambiguities that would stall implementation or lead to incorrect architecture.
- WARNING: Important gaps or ambiguities that should be clarified before coding.
- INFO: Minor suggestions or best-practice clarifications.

Output Format:
You must respond with a JSON array of issue objects:
[
  {
    "type": "CONTRADICTION",
    "title": "Conflicting role permissions for course creation",
    "description": "FR-002 states only admins can create courses, but FR-007 allows instructors to create and publish courses directly.",
    "severity": "BLOCKING",
    "affectedRequirements": ["FR-002", "FR-007"],
    "suggestedResolutions": [
      "Allow instructors to draft courses, but require admin approval before publishing",
      "Grant instructors full creation rights, restricting admins to platform management",
      "Separate into distinct permission tiers (e.g. verified vs unverified instructors)"
    ]
  }
]

CRITICAL RULES:
- If no genuine issues exist, return an empty array [].
- Only reference requirement IDs that actually exist in the provided list.
- Be precise, constructive, and provide actionable resolutions.`;

export async function runValidationAudit(
  project: ProjectDocument,
  messages: MessageDocument[],
): Promise<ValidationIssueDocument[]> {
  try {
    const requirements = await Requirement.find({ projectId: project._id });

    if (requirements.length === 0) {
      return [];
    }

    const reqsSummary = requirements
      .map(
        (r) =>
          `[${r.reqId}] (${r.type} | Priority: ${r.priority} | Status: ${r.status})\nTitle: ${r.title || 'Untitled'}\nDescription: ${r.description}`
      )
      .join('\n\n');

    const recentTranscript = messages
      .slice(-10)
      .map((m) => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
      .join('\n\n');

    const prompt = `Project Name: "${project.name}"
Initial Idea: "${project.initialIdea}"
Target Platform: "${project.targetPlatform || 'Not specified'}"
Active Discovery Phase: ${project.discoveryPhase}

Current Requirements List:
${reqsSummary}

Recent Conversation Context:
${recentTranscript}

Perform a comprehensive validation audit. Detect any Ambiguities, Contradictions, Missing Information, and Unconfirmed Critical Assumptions. Return a JSON array.`;

    let parsedIssues: RawValidationIssue[] = [];
    try {
      const { data, provider } = await AiProvider.quickJson<any>({
        systemPrompt: VALIDATION_SYSTEM_PROMPT,
        prompt,
        temperature: 0.2,
      });
      logger.info({ projectId: project._id, provider }, 'Validation audit completed via AI');

      if (Array.isArray(data)) {
        parsedIssues = data;
      } else if (typeof data === 'object' && data !== null) {
        parsedIssues = data.issues || data.validationIssues || [];
      }
    } catch (parseErr) {
      logger.warn({ parseErr, projectId: project._id }, 'Failed to run validation audit via AI');
      return [];
    }

    const existingIssues = await ValidationIssue.find({ projectId: project._id });
    const savedIssues: ValidationIssueDocument[] = [];

    const validTypes = Object.values(ValidationIssueType);
    const validSeverities = Object.values(ValidationSeverity);

    for (const item of parsedIssues) {
      if (!item.title || !item.description) continue;

      const type = validTypes.includes(item.type) ? item.type : ValidationIssueType.AMBIGUITY;
      const severity = validSeverities.includes(item.severity) ? item.severity : ValidationSeverity.WARNING;

      // Check if similar issue already exists
      const existing = existingIssues.find(
        (i) =>
          i.title.toLowerCase().trim() === item.title.toLowerCase().trim() ||
          i.description.toLowerCase().trim() === item.description.toLowerCase().trim()
      );

      if (existing) {
        // If already resolved or dismissed, keep its state
        if (existing.status === ValidationIssueStatus.OPEN) {
          existing.severity = severity;
          existing.affectedRequirements = item.affectedRequirements || existing.affectedRequirements;
          existing.suggestedResolutions = item.suggestedResolutions || existing.suggestedResolutions;
          await existing.save();
        }
        savedIssues.push(existing);
        continue;
      }

      // Create new issue
      const newIssue = await ValidationIssue.create({
        projectId: project._id,
        type,
        title: item.title,
        description: item.description,
        severity,
        status: ValidationIssueStatus.OPEN,
        affectedRequirements: Array.isArray(item.affectedRequirements) ? item.affectedRequirements : [],
        suggestedResolutions: Array.isArray(item.suggestedResolutions) ? item.suggestedResolutions : [],
      });

      savedIssues.push(newIssue);
    }

    logger.info(
      { projectId: project.id, issuesCount: savedIssues.length },
      'Validation audit completed'
    );

    return savedIssues;
  } catch (error) {
    logger.error({ error, projectId: project.id }, 'Error during validation audit');
    return [];
  }
}
