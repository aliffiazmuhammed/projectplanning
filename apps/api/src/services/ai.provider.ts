import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface ChatMessageExchange {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  systemPrompt: string;
  history: ChatMessageExchange[];
  userMessage: string;
  contextPrefix?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface JsonCompletionOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}

export interface TextCompletionOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ImageAnalysisOptions {
  prompt: string;
  imageBase64: string;
  mimeType?: string;
}

let groqInstance: Groq | null = null;
function getGroq(): Groq | null {
  if (!groqInstance && env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 0) {
    try {
      groqInstance = new Groq({ apiKey: env.GROQ_API_KEY.trim() });
    } catch (err) {
      logger.error({ err }, 'Failed to initialize Groq SDK client');
      groqInstance = null;
    }
  }
  return groqInstance;
}

const geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Strips markdown code blocks and parses JSON reliably
 */
export function cleanAndParseJson<T = any>(rawText: string): T {
  let cleaned = rawText.trim();
  // Strip ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  }
  return JSON.parse(cleaned) as T;
}

export class AiProvider {
  /**
   * Conversational Discovery Chat & Dialogue
   * Primary: Groq (Llama-3.3-70b-versatile) for sub-second, zero-latency chat.
   * Fallback: Gemini (gemini-2.0-flash) if Groq is not configured or errors out.
   */
  static async chat(options: ChatCompletionOptions): Promise<{ reply: string; provider: 'groq' | 'gemini' }> {
    const groq = getGroq();
    const useGroq = Boolean(groq && env.AI_CHAT_PROVIDER === 'groq');

    if (useGroq && groq) {
      try {
        const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: 'system', content: options.systemPrompt },
          ...options.history.map((h) => ({
            role: (h.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
            content: h.content,
          })),
          { role: 'user', content: (options.contextPrefix || '') + options.userMessage },
        ];

        const completion = await groq.chat.completions.create({
          model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
        });

        const reply = completion.choices[0]?.message?.content || '';
        if (reply.trim().length > 0) {
          logger.debug({ provider: 'groq', model: env.GROQ_MODEL }, 'Chat response generated via Groq');
          return { reply, provider: 'groq' };
        }
      } catch (err: any) {
        logger.warn(
          { error: err?.message || err, status: err?.status },
          'Groq chat call failed or throttled; falling back to Gemini',
        );
      }
    }

    // Gemini fallback or primary
    try {
      const model = geminiClient.getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction: options.systemPrompt,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens,
        },
      });

      const geminiHistory = options.history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const chatSession = model.startChat({ history: geminiHistory });
      const result = await chatSession.sendMessage((options.contextPrefix || '') + options.userMessage);
      const reply = result.response.text();

      logger.debug({ provider: 'gemini', model: env.GEMINI_MODEL }, 'Chat response generated via Gemini');
      return { reply, provider: 'gemini' };
    } catch (geminiErr: any) {
      logger.error({ geminiErr: geminiErr?.message || geminiErr }, 'Gemini chat execution failed');
      throw new Error(`Failed to generate AI response: ${geminiErr?.message || 'AI service error'}`);
    }
  }

  /**
   * Fast JSON Completion for real-time extraction & validation during chat turns.
   * Primary: Groq (if configured) to spare Gemini free-tier RPM quota.
   * Fallback: Gemini.
   */
  static async quickJson<T = any>(options: JsonCompletionOptions): Promise<{ data: T; provider: 'groq' | 'gemini' }> {
    const groq = getGroq();
    const useGroq = Boolean(groq && env.AI_CHAT_PROVIDER === 'groq');

    if (useGroq && groq) {
      try {
        const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];
        if (options.systemPrompt) {
          messages.push({
            role: 'system',
            content: `${options.systemPrompt}\n\nIMPORTANT: Respond with valid JSON only.`,
          });
        }
        messages.push({
          role: 'user',
          content: `${options.prompt}\n\nReturn response formatted as a JSON object or array.`,
        });

        const completion = await groq.chat.completions.create({
          model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages,
          temperature: options.temperature ?? 0.2,
          response_format: { type: 'json_object' },
        });

        const text = completion.choices[0]?.message?.content;
        if (text) {
          const data = cleanAndParseJson<T>(text);
          return { data, provider: 'groq' };
        }
      } catch (err: any) {
        logger.warn(
          { error: err?.message || err },
          'Groq quick JSON call failed; falling back to Gemini',
        );
      }
    }

    // Gemini fallback or primary
    try {
      const model = geminiClient.getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction: options.systemPrompt,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: options.temperature ?? 0.2,
        },
      });

      const result = await model.generateContent(options.prompt);
      const text = result.response.text();
      const data = cleanAndParseJson<T>(text);
      return { data, provider: 'gemini' };
    } catch (geminiErr: any) {
      logger.error({ geminiErr }, 'Gemini quick JSON call failed');
      throw geminiErr;
    }
  }

  /**
   * Important / Heavy Generation Tasks:
   * Architecture diagrams, C4 models, Tech stack trade-offs, Implementation plans, Readiness audits.
   * Primary: Gemini (gemini-2.0-flash) for deep reasoning and massive 1M context window.
   * Fallback: Groq (Llama-3.3-70b-versatile) if Gemini returns 429 ResourceExhausted or quota errors!
   */
  static async importantJson<T = any>(options: JsonCompletionOptions): Promise<{ data: T; provider: 'gemini' | 'groq' }> {
    // 1. Try Gemini first (Important task provider)
    try {
      const model = geminiClient.getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction: options.systemPrompt,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: options.temperature ?? 0.3,
        },
      });

      const result = await model.generateContent(options.prompt);
      const text = result.response.text();
      const data = cleanAndParseJson<T>(text);
      return { data, provider: 'gemini' };
    } catch (geminiErr: any) {
      logger.warn(
        { error: geminiErr?.message || geminiErr, status: geminiErr?.status },
        'Gemini important task call failed; checking Groq fallback',
      );

      // 2. Fallback to Groq if available
      const groq = getGroq();
      if (groq) {
        try {
          const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];
          if (options.systemPrompt) {
            messages.push({
              role: 'system',
              content: `${options.systemPrompt}\n\nIMPORTANT: Respond with valid JSON only.`,
            });
          }
          messages.push({
            role: 'user',
            content: `${options.prompt}\n\nReturn response formatted as a JSON object or array.`,
          });

          const completion = await groq.chat.completions.create({
            model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages,
            temperature: options.temperature ?? 0.3,
            response_format: { type: 'json_object' },
          });

          const text = completion.choices[0]?.message?.content;
          if (text) {
            const data = cleanAndParseJson<T>(text);
            logger.info({ provider: 'groq' }, 'Important task rescued by Groq fallback');
            return { data, provider: 'groq' };
          }
        } catch (groqErr: any) {
          logger.error({ groqErr }, 'Groq fallback also failed for important task');
        }
      }

      throw geminiErr;
    }
  }

  /**
   * Important Text / Markdown / C4 Diagram generator:
   * Primary: Gemini. Fallback: Groq.
   */
  static async importantText(options: TextCompletionOptions): Promise<{ text: string; provider: 'gemini' | 'groq' }> {
    try {
      const model = geminiClient.getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction: options.systemPrompt,
        generationConfig: {
          temperature: options.temperature ?? 0.4,
          maxOutputTokens: options.maxTokens,
        },
      });

      const result = await model.generateContent(options.prompt);
      const text = result.response.text().trim();
      return { text, provider: 'gemini' };
    } catch (geminiErr: any) {
      logger.warn({ geminiErr: geminiErr?.message || geminiErr }, 'Gemini importantText failed; attempting Groq fallback');

      const groq = getGroq();
      if (groq) {
        try {
          const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];
          if (options.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
          }
          messages.push({ role: 'user', content: options.prompt });

          const completion = await groq.chat.completions.create({
            model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            messages,
            temperature: options.temperature ?? 0.4,
            max_tokens: options.maxTokens ?? 4096,
          });

          const text = completion.choices[0]?.message?.content?.trim() || '';
          if (text) {
            return { text, provider: 'groq' };
          }
        } catch (groqErr: any) {
          logger.error({ groqErr }, 'Groq fallback also failed for important text');
        }
      }

      throw geminiErr;
    }
  }

  /**
   * Multimodal Vision & Image Analysis (Requires Gemini vision model)
   */
  static async analyzeImage<T = any>(options: ImageAnalysisOptions): Promise<T> {
    const cleanBase64 = options.imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const model = geminiClient.getGenerativeModel({
      model: env.GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: options.mimeType || 'image/png',
      },
    };

    const result = await model.generateContent([options.prompt, imagePart]);
    const responseText = result.response.text();
    return cleanAndParseJson<T>(responseText);
  }
}
