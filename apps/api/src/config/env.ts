import dotenv from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve .env from the monorepo root (4 levels up from apps/api/src/config/)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });


interface EnvConfig {
  PORT: number;
  MONGODB_URI: string;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  GROQ_API_KEY: string;
  GROQ_MODEL: string;
  AI_CHAT_PROVIDER: 'groq' | 'gemini';
  AI_IMPORTANT_PROVIDER: 'gemini' | 'groq';
  JWT_SECRET: string;
  LOG_LEVEL: string;
  NODE_ENV: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env: EnvConfig = {
  PORT: parseInt(process.env['PORT'] || '3001', 10),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  GEMINI_API_KEY: requireEnv('GEMINI_API_KEY'),
  GEMINI_MODEL: process.env['GEMINI_MODEL'] || 'gemini-2.5-flash',
  GROQ_API_KEY: process.env['GROQ_API_KEY'] || '',
  GROQ_MODEL: process.env['GROQ_MODEL'] || 'llama-3.3-70b-versatile',
  AI_CHAT_PROVIDER: (process.env['AI_CHAT_PROVIDER'] as 'groq' | 'gemini') || 'groq',
  AI_IMPORTANT_PROVIDER: (process.env['AI_IMPORTANT_PROVIDER'] as 'gemini' | 'groq') || 'gemini',
  JWT_SECRET: process.env['JWT_SECRET'] || 'project-planner-jwt-secret-key-2026',
  LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
  NODE_ENV: process.env['NODE_ENV'] || 'development',
};
