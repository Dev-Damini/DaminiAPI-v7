import { useState } from 'react';
import { Image as ImageIcon, Sparkles, ExternalLink, Download } from 'lucide-react';
import { generateImage } from '@/lib/damini-api';
import TerminalOutput from '@/components/features/TerminalOutput';
import StatusBadge from '@/components/features/StatusBadge';
import type { DaminiResponse } from '@/types';

interface Props {
  onSuccess: () => void;
}

export default function AIImageSection({ onSuccess }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DaminiResponse | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const origin = window.location.origin;
  const testerUrl = `${origin}/#ai-image`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setResponse(null);
    setImageUrl(null);

    console.log('[Daminī AI Image] Generating image for prompt:', prompt);
    const result = await generateImage(prompt);
    console.log('[Daminī AI Image] Response received:', result);

    setResponse(result);
    setLoading(false);

    if (result.success && result.response_data?.result) {
      setImageUrl(result.response_data.result);
      onSuccess();
    }
  };

  return (
    <div id="ai-image" className="space-y-5 fade-in-up">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">AI Image Engine</h2>
            <p className="text-[11px] text-muted-foreground font-mono">
              deepai.org/api/text2img
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {response && <StatusBadge status={response.status} />}
          <a
            href={testerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-cyan-400 transition-colors font-mono"
          >
            <ExternalLink className="w-3 h-3" />
            Tester Link
          </a>
        </div>
      </div>

      {/* Tester URL display */}
      <div className="bg-[#0a0d1a] border border-cyan-500/10 rounded-lg px-4 py-2 font-mono text-[11px] text-muted-foreground flex items-center gap-2">
        <span className="text-cyan-500">POST</span>
        <span className="text-cyan-400/70 break-all">{testerUrl}</span>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
            Image Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            rows={3}
            disabled={loading}
            className="w-full bg-[#0a0d1a] border border-cyan-500/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 font-mono resize-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* JSON body preview */}
        <div className="bg-[#020408] border border-cyan-500/10 rounded-lg p-3 font-mono text-[11px] text-muted-foreground">
          <span className="text-cyan-400">// Request Body (multipart/form-data)</span>
          <br />
          <span className="text-violet-300">text</span>
          <span className="text-white">: </span>
          <span className="text-emerald-300">"{prompt.slice(0, 50) || '...'}"</span>
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-cyan-500/20"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Generating Image...' : 'Generate Image'}
        </button>
      </form>

      {/* Dual output: terminal + image */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            JSON Response Terminal
          </p>
          <TerminalOutput data={response} loading={loading} />
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Image Render Frame
          </p>
          <div className="terminal-bg rounded-xl overflow-hidden min-h-[220px] flex items-center justify-center relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 bg-[#0a0d1a] border-b border-cyan-500/15">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-amber-400/70" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/70" />
                <span className="ml-2 text-[11px] font-mono text-muted-foreground">
                  output_url · image/render
                </span>
              </div>
              {imageUrl && (
                <a
                  href={imageUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-cyan-400 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </a>
              )}
            </div>

            <div className="pt-10 p-4 w-full">
              {loading && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
                  </div>
                  <p className="text-xs text-cyan-400 font-mono">Generating visual...</p>
                </div>
              )}

              {!loading && !imageUrl && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground font-mono">
                    Image will render here
                  </p>
                </div>
              )}

              {!loading && imageUrl && (
                <div className="space-y-2">
                  <img
                    src={imageUrl}
                    alt="AI Generated output"
                    className="w-full rounded-lg object-cover max-h-[280px]"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                    }}
                  />
                  <p className="text-[10px] font-mono text-muted-foreground/60 break-all">
                    {imageUrl}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
