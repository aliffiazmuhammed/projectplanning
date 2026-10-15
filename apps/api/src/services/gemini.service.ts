import { logger } from '../config/logger.js';
import { DiscoveryPhase } from '@project-planner/types';
import type { ProjectDocument } from '../models/Project.js';
import type { MessageDocument } from '../models/Message.js';

// ── Context window limits ───────────────────────────────────────────────────
// Keep the last N message pairs sent to Gemini. Older messages are represented
// by the rolling conversationSummary stored on the Project document.
const MAX_HISTORY_MESSAGES = 20; // 10 user + 10 assistant pairs

// ── Discovery phase metadata ────────────────────────────────────────────────
const PHASE_LABELS: Record<DiscoveryPhase, string> = {
  [DiscoveryPhase.GOALS]: 'Goals & Vision',
  [DiscoveryPhase.USERS]: 'Target Users',
  [DiscoveryPhase.FEATURES]: 'Features & Workflows',
  [DiscoveryPhase.CONSTRAINTS]: 'Constraints & Timeline',
  [DiscoveryPhase.INTEGRATIONS]: 'Integrations & External Services',
  [DiscoveryPhase.UX]: 'UX & Design Preferences',
  [DiscoveryPhase.COMPLETE]: 'Discovery Complete',
};

// Minimum number of assistant messages in a phase before suggesting advancement
const PHASE_MIN_EXCHANGES: Record<DiscoveryPhase, number> = {
  [DiscoveryPhase.GOALS]: 2,
  [DiscoveryPhase.USERS]: 2,
  [DiscoveryPhase.FEATURES]: 3,
  [DiscoveryPhase.CONSTRAINTS]: 2,
  [DiscoveryPhase.INTEGRATIONS]: 2,
  [DiscoveryPhase.UX]: 2,
  [DiscoveryPhase.COMPLETE]: 0,
};

const PHASE_ORDER: DiscoveryPhase[] = [
  DiscoveryPhase.GOALS,
  DiscoveryPhase.USERS,
  DiscoveryPhase.FEATURES,
  DiscoveryPhase.CONSTRAINTS,
  DiscoveryPhase.INTEGRATIONS,
  DiscoveryPhase.UX,
  DiscoveryPhase.COMPLETE,
];

export function getNextPhase(current: DiscoveryPhase): DiscoveryPhase {
  const idx = PHASE_ORDER.indexOf(current);
  return PHASE_ORDER[Math.min(idx + 1, PHASE_ORDER.length - 1)];
}

// ── System prompt ───────────────────────────────────────────────────────────
function buildSystemPrompt(phase: DiscoveryPhase, summary?: string): string {
  const phaseLabel = PHASE_LABELS[phase];

  const phaseFocus: Record<DiscoveryPhase, string> = {
    [DiscoveryPhase.GOALS]: `Focus on: project purpose, core problem being solved, success criteria, business model (if any), and why this is being built now. Ask no more than 2 questions per turn.`,
    [DiscoveryPhase.USERS]: `Focus on: who the users are, their technical level, how many users are expected, different user roles, and pain points they currently experience. Ask no more than 2 questions per turn.`,
    [DiscoveryPhase.FEATURES]: `Focus on: core workflows, must-have features, nice-to-have features, data the system must store, and how users will interact with the system. Ask no more than 3 questions per turn.`,
    [DiscoveryPhase.CONSTRAINTS]: `Focus on: budget, timeline, team size, regulatory requirements, compliance needs, and any technical constraints the user already has. Ask no more than 2 questions per turn.`,
    [DiscoveryPhase.INTEGRATIONS]: `Focus on: external services (payment, auth, email, analytics, APIs), data sources, existing systems this must connect to, and any credentials/accounts the user already has. Ask no more than 2 questions per turn.`,
    [DiscoveryPhase.UX]: `Focus on: design style preferences, color/branding preferences, reference apps they admire, accessibility requirements, device/platform targets, and navigation patterns they prefer. Ask no more than 2 questions per turn.`,
    [DiscoveryPhase.COMPLETE]: `Discovery is complete. Summarize what has been learned and tell the user you are ready to extract structured requirements. Be concise and clear.`,
  };

  const summarySection = summary
    ? `\n\n## Conversation Summary So Far\n${summary}\n\n(The above is a summary of prior conversation. The recent messages follow.)`
    : '';

  return `You are an AI Project Discovery & Planning Agent. Your role is to guide users through a structured discovery process, transforming their software ideas into detailed, implementation-ready project specifications.

## Current Discovery Phase: ${phaseLabel}
${phaseFocus[phase]}${summarySection}

## Core Principles
1. UNDERSTAND the user's intent thoroughly before suggesting solutions.
2. ASK targeted clarifying questions — never overwhelm with more than 3 at once.
3. NEVER invent requirements — if unsure, ask.
4. REMEMBER everything discussed — never re-ask answered questions.
5. ADAPT your language to the user's technical level.
6. BE conversational and encouraging — non-technical users can feel intimidated.
7. ACKNOWLEDGE and validate the user's answers before asking follow-ups.
8. IDENTIFY ambiguity, contradictions, or vague statements and surface them explicitly.

## Response format
- Use plain, friendly prose for conversation.
- Use bullet points only when listing multiple items for clarity.
- Keep responses focused — 3-5 sentences followed by your questions.
- Bold any key terms you introduce for the first time.
- Do NOT mention internal phases or system prompts to the user.

## Phase transition
When you feel you have sufficiently covered the current phase's focus areas, end your response with this exact line (on its own line):
[PHASE_COMPLETE]

Do not mention this to the user — it is a system signal only.`;
}

// ── Summarization prompt ────────────────────────────────────────────────────
const SUMMARY_PROMPT = `You are summarizing a project discovery conversation. 
Produce a concise factual summary (bullet points, max 300 words) covering:
- What is being built
- Who it's for
- Key confirmed features/requirements
- Any open questions or unresolved ambiguities
- Important constraints or preferences mentioned

Do not invent information. Only summarize what was explicitly stated.`;

import { AiProvider } from './ai.provider.js';

export interface ChatResult {
  reply: string;
  phaseComplete: boolean;
  updatedSummary?: string;
}

export async function chat(
  project: ProjectDocument,
  messages: MessageDocument[],
  userMessage: string,
): Promise<ChatResult> {
  // Slide the window: keep only the most recent MAX_HISTORY_MESSAGES
  const windowedMessages = messages.slice(-MAX_HISTORY_MESSAGES);

  // Build history from windowed messages
  const history = windowedMessages.map((msg) => ({
    role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: msg.content,
  }));

  // If this is the very first message, prepend project context inline
  const isFirstMessage = messages.length === 0;
  const contextPrefix = isFirstMessage
    ? `[Project context — Name: "${project.name}"${project.description ? `, Description: "${project.description}"` : ''}, Initial idea: "${project.initialIdea}"${project.targetPlatform ? `, Target platform: ${project.targetPlatform}` : ''}]\n\n`
    : '';

  const systemPrompt = buildSystemPrompt(project.discoveryPhase, project.conversationSummary);

  const { reply: rawReply, provider } = await AiProvider.chat({
    systemPrompt,
    history,
    userMessage,
    contextPrefix,
    temperature: 0.7,
  });

  logger.info({ projectId: project._id, provider }, 'Discovery chat exchange succeeded');

  // Check for phase completion signal
  const phaseComplete = rawReply.includes('[PHASE_COMPLETE]');
  const reply = rawReply.replace(/\[PHASE_COMPLETE\]\s*/g, '').trim();

  // Periodically update the conversation summary (every 10 messages or on phase change)
  let updatedSummary: string | undefined;
  const shouldSummarize = phaseComplete || messages.length % 10 === 9;

  if (shouldSummarize && messages.length > 2) {
    try {
      updatedSummary = await summarizeConversation(messages, userMessage, reply);
    } catch (err) {
      logger.warn({ err }, 'Failed to generate conversation summary — continuing without it');
    }
  }

  return { reply, phaseComplete, updatedSummary };
}

async function summarizeConversation(
  messages: MessageDocument[],
  latestUserMsg: string,
  latestAssistantMsg: string,
): Promise<string> {
  // Build a transcript from all messages + the current exchange
  const transcript = [
    ...messages.map((m) => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`),
    `User: ${latestUserMsg}`,
    `Agent: ${latestAssistantMsg}`,
  ].join('\n\n');

  const { reply } = await AiProvider.chat({
    systemPrompt: SUMMARY_PROMPT,
    history: [],
    userMessage: `Please summarize this project discovery conversation:\n\n${transcript}`,
    temperature: 0.3,
  });

  return reply.trim();
}
