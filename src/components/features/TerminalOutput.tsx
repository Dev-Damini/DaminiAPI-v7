import { useState } from 'react';
import { Copy, CheckCheck } from 'lucide-react';
import type { DaminiResponse } from '@/types';

interface Props {
  data: DaminiResponse | null;
  loading?: boolean;
}

function syntaxHighlight(json: string): string {
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'text-cyan-300'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-violet-300'; // key
        } else {
          cls = 'text-emerald-300'; // string
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-amber-300'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-red-400'; // null
      }
      return `<span class="${cls}">${match}</span>`;
    });
}

export default function TerminalOutput({ data, loading }: Props) {
  const [copied, setCopied] = useState(false);

  const jsonString = data ? JSON.stringify(data, null, 2) : '';

  const handleCopy = () => {
    if (!jsonString) return;
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="terminal-bg rounded-xl overflow-hidden">
      {/* Terminal header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0d1a] border-b border-violet-500/15">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-amber-400/70" />
          <span className="w-3 h-3 rounded-full bg-emerald-400/70" />
          <span className="ml-2 text-[11px] font-mono text-muted-foreground">
            damini-api · response.json
          </span>
        </div>
        {jsonString && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-violet-400 transition-colors"
            aria-label="Copy JSON"
          >
            {copied ? (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Terminal body */}
      <div className="p-4 min-h-[180px] max-h-[400px] overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 text-violet-400 text-sm font-mono">
            <span className="inline-flex gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:300ms]" />
            </span>
            <span>Processing request...</span>
          </div>
        )}

        {!loading && !data && (
          <div className="text-muted-foreground text-sm font-mono">
            <span className="text-violet-500">{'>'}</span>{' '}
            <span className="typing-cursor">Awaiting execution...</span>
          </div>
        )}

        {!loading && data && (
          <pre
            className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-all"
            dangerouslySetInnerHTML={{ __html: syntaxHighlight(jsonString) }}
          />
        )}
      </div>
    </div>
  );
}
