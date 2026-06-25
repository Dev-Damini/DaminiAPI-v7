import { useState } from 'react';
import { Copy, CheckCheck, ChevronDown, ChevronUp, Code2, Loader2, Terminal } from 'lucide-react';
import TerminalOutput from '@/components/features/TerminalOutput';
import type { DaminiResponse } from '@/types';

export type HttpMethod = 'GET' | 'POST' | 'UTIL';

export interface EndpointDef {
  id: string;
  name: string;
  description: string;
  method: HttpMethod;
  pathSuffix: string;
  functionName?: string;
  codeBody?: string;
  paramLabel?: string;
  paramPlaceholder?: string;
  paramKey?: string;
  inputType?: 'text' | 'textarea';
  accentColor: 'violet' | 'cyan' | 'emerald' | 'amber';
  execute: (input: string) => Promise<DaminiResponse | null>;
  renderExtra?: (response: DaminiResponse | null, loading: boolean) => React.ReactNode;
}

interface Props {
  endpoint: EndpointDef;
  onUseInCode?: () => void;
}

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  POST: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  UTIL: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

const ACCENT: Record<string, {
  border: string; hover: string; statusDot: string;
  inputBorder: string; btnGrad: string; copyBtn: string;
  endpointBorderColor: string;
}> = {
  violet: {
    border: 'border-violet-500/25',
    hover: 'hover:border-violet-500/45',
    statusDot: 'bg-violet-400',
    inputBorder: 'border-violet-500/20 focus:border-violet-500/50 focus:ring-violet-500/20',
    btnGrad: 'from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 shadow-violet-500/20',
    copyBtn: 'bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20',
    endpointBorderColor: 'rgba(139,92,246,0.12)',
  },
  cyan: {
    border: 'border-cyan-500/25',
    hover: 'hover:border-cyan-500/45',
    statusDot: 'bg-cyan-400',
    inputBorder: 'border-cyan-500/20 focus:border-cyan-500/50 focus:ring-cyan-500/20',
    btnGrad: 'from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 shadow-cyan-500/20',
    copyBtn: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20',
    endpointBorderColor: 'rgba(6,182,212,0.12)',
  },
  emerald: {
    border: 'border-emerald-500/25',
    hover: 'hover:border-emerald-500/45',
    statusDot: 'bg-emerald-400',
    inputBorder: 'border-emerald-500/20 focus:border-emerald-500/50 focus:ring-emerald-500/20',
    btnGrad: 'from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-500/20',
    copyBtn: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20',
    endpointBorderColor: 'rgba(16,185,129,0.12)',
  },
  amber: {
    border: 'border-amber-500/25',
    hover: 'hover:border-amber-500/45',
    statusDot: 'bg-amber-400',
    inputBorder: 'border-amber-500/20 focus:border-amber-500/50 focus:ring-amber-500/20',
    btnGrad: 'from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/20',
    copyBtn: 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20',
    endpointBorderColor: 'rgba(245,158,11,0.12)',
  },
};

const ACCENT_TEXT: Record<string, string> = {
  violet: 'text-violet-400',
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
};

export default function EndpointCard({ endpoint, onUseInCode }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DaminiResponse | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedBase, setCopiedBase] = useState(false);

  const baseUrl = window.location.origin;
  const fnUrl = `https://mxcbspvyqeckbkbomxcb.backend.onspace.ai/functions/v1/${endpoint.functionName || endpoint.id}`;
  const displayUrl = endpoint.functionName ? fnUrl : `${baseUrl}${endpoint.pathSuffix}`;
  const c = ACCENT[endpoint.accentColor];

  const copyEndpoint = () => {
    navigator.clipboard.writeText(displayUrl).then(() => {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    });
  };

  const copyBase = () => {
    navigator.clipboard.writeText(baseUrl).then(() => {
      setCopiedBase(true);
      setTimeout(() => setCopiedBase(false), 2000);
    });
  };

  const handleExecute = async () => {
    if (loading) return;
    setLoading(true);
    setResponse(null);
    console.log(`[EndpointCard] Executing ${endpoint.id} with input:`, input.slice(0, 80));
    const result = await endpoint.execute(input);
    setResponse(result);
    setLoading(false);
  };

  const statusCode = response?.status ?? null;

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${c.border} ${c.hover}`}
      style={{ background: 'var(--panel)' }}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="text-base font-bold text-foreground">{endpoint.name}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border font-mono ${METHOD_STYLES[endpoint.method]}`}>
                {endpoint.method}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-2 h-2 rounded-full pulse-active ${c.statusDot}`} />
              <span className={`text-xs font-semibold ${ACCENT_TEXT[endpoint.accentColor]}`}>Ready</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{endpoint.description}</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => setExpanded((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-200 ${c.copyBtn}`}
            >
              <Code2 className="w-3.5 h-3.5" />
              {expanded ? 'Close' : 'Try it'}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {onUseInCode && (
              <button
                onClick={onUseInCode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-200 bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
              >
                <Terminal className="w-3.5 h-3.5" />
                {'</>'} Code
              </button>
            )}
          </div>
        </div>

        {/* Endpoint URL */}
        <div
          className="mt-4 rounded-xl border overflow-hidden"
          style={{ background: 'var(--panel-deep)', borderColor: c.endpointBorderColor }}
        >
          <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Endpoint</span>
            <button
              onClick={copyEndpoint}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedEndpoint ? (
                <><CheckCheck className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
              ) : (
                <><Copy className="w-3 h-3" /><span>Copy</span></>
              )}
            </button>
          </div>
          <div className="px-3 py-2">
            <code className="text-xs font-mono text-foreground/70 break-all leading-relaxed">{displayUrl}</code>
          </div>
        </div>

        {/* Base URL */}
        <div
          className="mt-2 rounded-xl border overflow-hidden"
          style={{ background: 'var(--panel-deep)', borderColor: c.endpointBorderColor }}
        >
          <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Base URL</span>
            <button
              onClick={copyBase}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedBase ? (
                <><CheckCheck className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
              ) : (
                <><Copy className="w-3 h-3" /><span>Copy</span></>
              )}
            </button>
          </div>
          <div className="px-3 py-2">
            <code className="text-xs font-mono text-foreground/70 break-all leading-relaxed">{baseUrl}</code>
          </div>
        </div>
      </div>

      {/* Expandable tester */}
      {expanded && (
        <div
          className="border-t border-white/5 p-5 space-y-4 fade-in-up"
          style={{ background: 'var(--panel-inner)' }}
        >
          {endpoint.paramLabel && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                {endpoint.paramLabel}
              </label>
              {endpoint.inputType === 'textarea' ? (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={endpoint.paramPlaceholder}
                  rows={3}
                  disabled={loading}
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 font-mono resize-none focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${c.inputBorder}`}
                  style={{ background: 'var(--panel-deep)' }}
                />
              ) : (
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={endpoint.paramPlaceholder}
                  disabled={loading}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleExecute(); }}
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 font-mono focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${c.inputBorder}`}
                  style={{ background: 'var(--panel-deep)' }}
                />
              )}
            </div>
          )}

          {/* Status badge */}
          {statusCode !== null && (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border font-mono ${
                  statusCode === 200
                    ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                    : statusCode >= 500
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {statusCode} {statusCode === 200 ? 'OK' : statusCode >= 500 ? 'Server Error' : 'Bad Request'}
              </span>
            </div>
          )}

          {/* Execute button */}
          <button
            onClick={handleExecute}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r text-white text-sm font-bold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg ${c.btnGrad}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
            {loading ? 'Executing...' : `Execute ${endpoint.method} Request`}
          </button>

          {/* Raw JSON terminal */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Raw JSON Response</p>
            <TerminalOutput data={response} loading={loading} />
          </div>

          {endpoint.renderExtra && endpoint.renderExtra(response, loading)}
        </div>
      )}
    </div>
  );
}
