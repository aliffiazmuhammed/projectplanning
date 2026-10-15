import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { MessageRole, DiscoveryPhase } from '@project-planner/types';
import { Bot, User, Copy, Check, Sparkles } from 'lucide-react';

interface MessageBubbleProps {
  role: MessageRole;
  content: string;
  timestamp: string;
  phase?: DiscoveryPhase;
}

export default function MessageBubble({ role, content, timestamp, phase }: MessageBubbleProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`group flex items-start gap-3 mb-6 transition-all animate-fade-in ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm select-none ${
          isUser
            ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/10'
            : 'bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700/80 text-brand-400 shadow-glow'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4 text-brand-400" />
        )}
      </div>

      {/* Message Content Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[78%] flex flex-col ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        {/* Header meta */}
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <span className="text-xs font-semibold text-slate-300">
            {isUser ? 'You' : 'Planner Agent'}
          </span>

          {phase && (
            <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-400 border border-slate-700/60">
              {phase}
            </span>
          )}

          <span className="text-[11px] text-slate-500">{formattedTime}</span>
        </div>

        {/* Bubble */}
        <div
          className={`relative rounded-2xl px-5 py-4 text-sm leading-relaxed transition-all shadow-card ${
            isUser
              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-sm selection:bg-white/20'
              : 'bg-slate-900/90 border border-slate-800/90 text-slate-200 rounded-tl-sm hover:border-slate-700/90'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap font-sans text-white/95">{content}</div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none 
              prose-p:my-2 prose-p:leading-relaxed prose-p:text-slate-300
              prose-strong:text-white prose-strong:font-semibold
              prose-headings:text-slate-100 prose-headings:font-bold prose-headings:my-3
              prose-ul:my-2 prose-ul:pl-5 prose-li:my-1 prose-li:text-slate-300
              prose-ol:my-2 prose-ol:pl-5
              prose-code:text-brand-300 prose-code:bg-slate-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-code:font-mono
              prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:text-slate-200
              prose-blockquote:border-l-brand-500 prose-blockquote:bg-brand-500/5 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r"
            >
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}

          {/* Copy Button (visible on hover) */}
          {!isUser && (
            <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleCopy}
                title={copied ? 'Copied to clipboard' : 'Copy message'}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors backdrop-blur-sm"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
