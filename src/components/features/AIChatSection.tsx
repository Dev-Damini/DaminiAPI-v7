
import { useState } from 'react';
import { Send, Bot, ExternalLink } from 'lucide-react';
import { sendChatMessage } from '@/lib/damini-api';
import TerminalOutput from '@/components/features/TerminalOutput';
import StatusBadge from '@/components/features/StatusBadge';
import type { DaminiResponse } from '@/types';

interface Props {
  onSuccess: () => void;
}

export default function AIChatSection({ onSuccess }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DaminiResponse | null>(null);

  const origin = window.location.origin;
  const testerUrl = `${origin}/#ai-chat`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setResponse(null);

    console.log('[Daminī AI Chat] Sending prompt:', prompt);
    const result = await sendChatMessage(prompt);
    console.log('[Daminī AI Chat] Response received:', result);

    setResponse(result);
    setLoading(false);

    if (result.success) {
      onSuccess();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div id="ai-chat" className="space-y-5 fade-in-up">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">AI Text Engine</h2>
            <p className="text-[11px] text-muted-foreground font-mono">
              deepai.org/api/desktop-chat
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {response && <StatusBadge status={response.status} />}
          <a
            href={testerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-violet-400 transition-colors font-mono"
          >
            <ExternalLink className="w-3 h-3" />
            Tester Link
          </a>
        </div>
      </div>

      {/* Tester URL display */}
      <div className="bg-[#0a0d1a] border border-violet-500/10 rounded-lg px-4 py-2 font-mono text-[11px] text-muted-foreground flex items-center gap-2">
        <span className="text-violet-500">GET</span>
        <span className="text-cyan-400/70 break-all">{testerUrl}</span>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
            Prompt Input
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your message... (Ctrl+Enter to send)"
            rows={4}
            disabled={loading}
            className="w-full bg-[#0a0d1a] border border-violet-500/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 font-mono resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* JSON body preview */}
        <div className="bg-[#020408] border border-violet-500/10 rounded-lg p-3 font-mono text-[11px] text-muted-foreground">
          <span className="text-violet-400">// Request Body (application/x-www-form-urlencoded)</span>
          <br />
          <span className="text-cyan-300">uuid</span>
          <span className="text-white">=</span>
          <span className="text-emerald-300">"1c69f075-36c5-4643-b80a-80d7133323ce"</span>
          <span className="text-muted-foreground"> &amp; </span>
          <span className="text-cyan-300">messages</span>
          <span className="text-white">=</span>
          <span className="text-emerald-300">{`[{'role':"user",'content':"${prompt.slice(0, 40) || '...'}"}]`}</span>
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-violet-500/20"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Processing Request...' : 'Execute Chat Request'}
        </button>
      </form>

      {/* Terminal output */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Response Terminal
        </p>
        <TerminalOutput data={response} loading={loading} />
      </div>

      {/* Result text extraction */}
      {response?.success && response.response_data?.result && (
        <div className="glass-panel border border-emerald-400/20 rounded-xl p-4">
          <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider mb-2">
            Extracted Response
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {response.response_data.result}
          </p>
        </div>
      )}
    </div>
  );
}
