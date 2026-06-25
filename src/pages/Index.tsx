import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Copy, CheckCheck, MessageCircle, Activity, TrendingUp,
  CheckCircle2, AlertTriangle, RefreshCw, Download, Loader2,
  ChevronDown, ChevronUp, Clock, Trash2, Sun, Moon, Terminal,
  Film, Music, Mail, Inbox, Eye, Heart, MessageSquare,
  Paperclip, X, Image as ImageIcon, Radio,
  Twitter, BarChart2, Globe, Play, Mic, Tv2, Headphones,
  Sparkles, Layers, Zap,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  sendEaseMateMessage, generateImage, downloadMedia, generateMusic,
  uploadFileForVision, proxyGet,
} from '@/lib/damini-api';
import {
  getNewEmailAddress, getSession, clearSession, checkInbox,
  fetchEmailBody, formatTimeAgo, formatExpiry,
} from '@/lib/tempmail';
import { fetchAnalyticsStats, logAnalyticsEvent } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import ContactDevModal from '@/components/features/ContactDevModal';
import ThreeBackground from '@/components/three/ThreeBackground';
import DeveloperProfile from '@/components/features/DeveloperProfile';
import type {
  DaminiResponse, TempMailMessage, AnalyticsStats, MediaResult,
  SunoResult, ImageEngine,
} from '@/types';
import type { MailSession } from '@/lib/tempmail';

// ─── Logo ─────────────────────────────────────────────────────────────────────
function DaminiLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" fill="#000" />
      <path d="M6 21V7h5a7 7 0 0 1 0 14H6Z" fill="#fff" />
      <rect x="17" y="8" width="4" height="1.2" rx="0.6" fill="#fff" opacity="0.5" />
      <rect x="17" y="12" width="6" height="1.2" rx="0.6" fill="#fff" opacity="0.35" />
      <rect x="17" y="16" width="5" height="1.2" rx="0.6" fill="#fff" opacity="0.2" />
      <circle cx="25" cy="19" r="1.5" fill="#10b981" />
    </svg>
  );
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function getStoredTheme(): 'dark' | 'light' {
  try { return localStorage.getItem('damini-theme') === 'dark' ? 'dark' : 'light'; }
  catch { return 'light'; }
}
function applyTheme(theme: 'dark' | 'light') {
  const html = document.documentElement;
  if (theme === 'dark') { html.classList.add('dark'); html.style.backgroundColor = '#020817'; }
  else { html.classList.remove('dark'); html.style.backgroundColor = '#f2f2f2'; }
  try { localStorage.setItem('damini-theme', theme); } catch { /* noop */ }
}

// ─── Method pill ──────────────────────────────────────────────────────────────
function MethodPill({ method }: { method: 'GET' | 'POST' }) {
  return (
    <span className="method-pill">
      {method}
    </span>
  );
}

// ─── Status dot ───────────────────────────────────────────────────────────────
function LiveDot() {
  return (
    <span className="status-pill" style={{ color:'var(--status-success)', background:'var(--status-success-bg)', border:'1px solid var(--status-success-border)' }}>
      <span className="w-1.5 h-1.5 rounded-full pulse-active" style={{ background:'var(--status-success)' }} />
      WORKING
    </span>
  );
}

// ─── HTTP badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: number }) {
  const ok = status === 200;
  const warn = status >= 400 && status < 500;
  const c = ok ? 'var(--status-success)' : warn ? 'var(--status-warn)' : 'var(--status-error)';
  const bg = ok ? 'var(--status-success-bg)' : warn ? 'var(--status-warn-bg)' : 'var(--status-error-bg)';
  const bd = ok ? 'var(--status-success-border)' : warn ? 'var(--status-warn-border)' : 'var(--status-error-border)';
  return (
    <span className="status-pill" style={{ color:c, background:bg, border:`1px solid ${bd}` }}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status} {ok ? 'OK' : warn ? 'CLIENT ERR' : 'SERVER ERR'}
    </span>
  );
}

// ─── Terminal block ───────────────────────────────────────────────────────────
function TerminalBlock({ data, loading }: { data?: unknown; loading?: boolean }) {
  const [copied, setCopied] = useState(false);
  const json = data ? JSON.stringify(data, null, 2) : '';
  const copy = () => navigator.clipboard.writeText(json).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });

  return (
    <div className="terminal-block">
      <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">OUTPUT</span>
        {json && (
          <button onClick={copy} className="flex items-center gap-1 text-[9px] font-mono transition-colors"
            style={{ color: copied ? '#10b981' : 'rgba(255,255,255,0.3)' }}>
            {copied ? <><CheckCheck className="w-3 h-3" />copied</> : <><Copy className="w-3 h-3" />copy</>}
          </button>
        )}
      </div>
      <div className="p-3 min-h-[70px] max-h-52 overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: 'var(--status-warn)' }}>
            {[0, 120, 240].map((d) => (
              <span key={d} className="w-1 h-3 inline-block animate-bounce"
                style={{ background: 'var(--status-warn)', animationDelay: `${d}ms` }} />
            ))}
            <span>processing...</span>
          </div>
        )}
        {!loading && !data && <span className="text-[11px] font-mono text-white/20 typing-cursor">awaiting payload</span>}
        {!loading && data && <pre className="text-[11px] font-mono text-emerald-400 whitespace-pre-wrap break-all leading-relaxed">{json}</pre>}
      </div>
    </div>
  );
}

// ─── Code Modal ───────────────────────────────────────────────────────────────
interface CodeModalProps {
  open: boolean; onClose: () => void;
  name: string; method: string; endpointUrl: string; bodyExample: string;
}
function CodeModal({ open, onClose, name, method, endpointUrl, bodyExample }: CodeModalProps) {
  const [copied, setCopied] = useState(false);
  const snippet = method === 'GET'
    ? `// ${name} — Daminī API\nconst res = await fetch(\n  "${endpointUrl}"\n);\nconst data = await res.json();\nconsole.log(data);`
    : `// ${name} — Daminī API\nconst res = await fetch("${endpointUrl}", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(${bodyExample})\n});\nconst data = await res.json();\nconsole.log(data);`;

  const copy = () => navigator.clipboard.writeText(snippet).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full max-w-lg overflow-hidden"
        className="code-modal-wrap"
        style={{ background: 'rgba(6,5,20,0.97)' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(139,92,246,0.2)', background: 'rgba(0,0,0,0.5)' }}>
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-white/60" />
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">USE IN CODE · {name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copy} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold border transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: copied ? '#10b981' : '#fff' }}>
              {copied ? <><CheckCheck className="w-3 h-3 inline mr-1" />COPIED</> : <><Copy className="w-3 h-3 inline mr-1" />COPY</>}
            </button>
            <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-0" style={{ background: '#000' }}>
          <pre className="p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-64">{snippet}</pre>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 border-t" style={{ borderColor: 'var(--border-medium)' }}>
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Route through Daminī proxy — CORS resolved.</span>
        </div>
      </div>
    </div>
  );
}

// ─── Prompt textarea ──────────────────────────────────────────────────────────
function PromptTextarea({ value, onChange, placeholder, rows = 3, disabled }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; disabled?: boolean;
}) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} rows={rows} disabled={disabled}
      className="w-full px-3 py-2.5 text-sm font-mono resize-none focus:outline-none disabled:opacity-40"
      style={{ background: 'var(--panel-inner)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', borderRadius: '10px' }} />
  );
}

// ─── Execute button ───────────────────────────────────────────────────────────
function ExecBtn({ onClick, disabled, loading, label, loadingLabel }: {
  onClick: () => void; disabled?: boolean; loading: boolean; label: string; loadingLabel: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-mono font-bold uppercase tracking-widest transition-all disabled:opacity-40"
      style={{
        background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
        color: '#fff',
        border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: 'var(--radius-sm)',
      }}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
      {loading ? loadingLabel : label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//   TESTERS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── AI Chat tester ───────────────────────────────────────────────────────────
function ChatTester({ modelId, onSuccess }: { modelId: number; onSuccess: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DaminiResponse | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supportsVision = [7, 8].includes(modelId);

  const handleFileSelect = async (file: File) => {
    setImageFile(file); setImageUrl(null); setUploadLoading(true);
    const result = await uploadFileForVision(file);
    setUploadLoading(false);
    if ('url' in result) setImageUrl(result.url);
  };

  const handleExecute = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setResponse(null);
    const res = await sendEaseMateMessage(prompt.trim(), modelId, imageUrl ?? undefined);
    setResponse(res); setLoading(false);
    if (res.success) onSuccess();
  };

  return (
    <div className="space-y-3">
      {supportsVision && (
        <div className="border" style={{ borderColor: 'var(--border-medium)' }}>
          <div className="px-3 py-1.5 border-b" style={{ borderColor: 'var(--border-medium)', background: 'var(--panel-inner)' }}>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>VISION / IMAGE ATTACH</span>
          </div>
          <div className="p-3 flex items-center gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase border"
              style={{ border: '1px solid var(--border-medium)', background: 'var(--panel-inner)', color: 'var(--text-secondary)' }}>
              {uploadLoading ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--status-warn)' }} /> : <Paperclip className="w-3 h-3" />}
              {uploadLoading ? 'Uploading...' : imageFile ? 'Change' : 'Attach Image'}
            </button>
            {imageFile && !uploadLoading && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono" style={{ color: imageUrl ? 'var(--status-success)' : 'var(--status-warn)' }}>
                  {imageUrl ? '✓ ready' : '⟳ processing'} · {imageFile.name}
                </span>
                <button onClick={() => { setImageFile(null); setImageUrl(null); }}>
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
          </div>
        </div>
      )}
      <div>
        <label className="block text-[9px] font-mono font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>PROMPT</label>
        <PromptTextarea value={prompt} onChange={setPrompt} placeholder="Enter your message..." disabled={loading} />
      </div>
      {response && <StatusBadge status={response.status} />}
      <ExecBtn onClick={handleExecute} loading={loading} disabled={!prompt.trim()} label="Execute Request" loadingLabel="Processing..." />
      <TerminalBlock data={response} loading={loading} />
    </div>
  );
}

// ─── Image tester ─────────────────────────────────────────────────────────────
function ImageTester({ engine, onSuccess }: { engine: ImageEngine; onSuccess: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DaminiResponse | null>(null);

  const handleExecute = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setResponse(null);
    const res = await generateImage(prompt.trim(), engine);
    setResponse(res); setLoading(false);
    if (res.success) onSuccess();
  };

  const imgUrl = response?.success ? response.response_data?.result : null;

  return (
    <div className="space-y-3">
      <div>
        <div className="px-2 py-1 border" style={{ borderColor: 'var(--border-medium)', background: 'var(--panel-inner)' }}>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>PROMPT</span>
        </div>
        <PromptTextarea value={prompt} onChange={setPrompt} placeholder="A futuristic cityscape at dusk..." disabled={loading} />
      </div>
      {response && <StatusBadge status={response.status} />}
      <ExecBtn onClick={handleExecute} loading={loading} disabled={!prompt.trim()} label="Generate Image" loadingLabel="Generating..." />
      <div className="border flex items-center justify-center min-h-[100px]" style={{ borderColor: 'var(--border-medium)', background: '#000' }}>
        {loading && <div className="flex flex-col items-center gap-2 py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--status-warn)' }} /><p className="text-[10px] font-mono text-white/30">rendering...</p></div>}
        {!loading && !imgUrl && <div className="flex flex-col items-center gap-2 py-8"><ImageIcon className="w-6 h-6 text-white/10" /><p className="text-[10px] font-mono text-white/20">image renders here</p></div>}
        {!loading && imgUrl && <img src={imgUrl} alt="Generated" className="w-full object-cover max-h-60" />}
      </div>
      <TerminalBlock data={response} loading={loading} />
    </div>
  );
}

// ─── Music tester ─────────────────────────────────────────────────────────────
function MusicTester({ onSuccess }: { onSuccess: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DaminiResponse | null>(null);
  const [suno, setSuno] = useState<SunoResult | null>(null);

  const handleExecute = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setResponse(null); setSuno(null);
    const { response: res, suno: s } = await generateMusic(prompt.trim());
    setResponse(res); setSuno(s); setLoading(false);
    if (res.success) onSuccess();
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[9px] font-mono font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>STYLE / DESCRIPTION</label>
        <PromptTextarea value={prompt} onChange={setPrompt} placeholder="Lo-fi hip hop, 80bpm, nostalgic vibes..." rows={2} disabled={loading} />
      </div>
      {response && <StatusBadge status={response.status} />}
      <ExecBtn onClick={handleExecute} loading={loading} disabled={!prompt.trim()} label="Generate Music" loadingLabel="Composing..." />
      {suno && !loading && (
        <div className="border" style={{ borderColor: 'var(--border-medium)', background: '#000' }}>
          {suno.thumbnail && (
            <div className="relative h-28 overflow-hidden border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <img src={suno.thumbnail} alt={suno.title} className="w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)' }} />
              <p className="absolute bottom-2 left-3 text-xs font-mono font-bold text-white">{suno.title || 'Untitled'}</p>
            </div>
          )}
          <div className="p-3 space-y-3">
            {suno.url && <audio controls src={suno.url} className="w-full" style={{ height: 32 }} />}
            {suno.lyrics && (
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-2">LYRICS</p>
                <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-32 overflow-y-auto text-white/50 leading-relaxed">{suno.lyrics}</pre>
              </div>
            )}
          </div>
        </div>
      )}
      <TerminalBlock data={response} loading={loading} />
    </div>
  );
}

// ─── TTDL tester ──────────────────────────────────────────────────────────────
function TTDLTester({ onSuccess }: { onSuccess: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<MediaResult | null>(null);
  const [response, setResponse] = useState<DaminiResponse | null>(null);

  const handleFetch = async () => {
    if (!url.trim() || loading) return;
    setLoading(true); setMedia(null); setResponse(null);
    const { response: res, media: m } = await downloadMedia(url.trim());
    setResponse(res); setMedia(m); setLoading(false);
    if (res.success) onSuccess();
  };

  const fmt = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[9px] font-mono font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>MEDIA URL</label>
        <div className="flex">
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFetch(); }}
            placeholder="https://www.tiktok.com/@user/video/..." disabled={loading}
            className="flex-1 px-3 py-2.5 text-sm font-mono focus:outline-none disabled:opacity-40"
            style={{ background: 'var(--panel-inner)', border: '1px solid var(--border-medium)', borderRight: 'none', color: 'var(--text-primary)', borderRadius: '10px 0 0 10px' }} />
          <button onClick={handleFetch} disabled={loading || !url.trim()}
            className="flex items-center gap-1.5 px-4 text-[10px] font-mono font-bold uppercase disabled:opacity-40"
            style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 10px 10px 0' }}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {response && <StatusBadge status={response.status} />}
      {media && !loading && (
        <div className="border" style={{ borderColor: 'var(--border-medium)' }}>
          {media.cover && (
            <div className="relative h-32 overflow-hidden bg-black border-b" style={{ borderColor: 'var(--border-medium)' }}>
              <img src={media.cover} alt="" className="w-full h-full object-cover opacity-80" />
              {media.duration > 0 && <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5">{fmtDur(media.duration)}</span>}
            </div>
          )}
          <div className="p-3 space-y-2">
            {media.title && <p className="text-xs font-mono font-semibold line-clamp-2" style={{ color: 'var(--text-primary)' }}>{media.title}</p>}
            {media.author && <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>@{media.author}</p>}
            <div className="flex gap-3">
              {media.play_count > 0 && <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}><Eye className="w-3 h-3" />{fmt(media.play_count)}</span>}
              {media.digg_count > 0 && <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}><Heart className="w-3 h-3" />{fmt(media.digg_count)}</span>}
              {media.comment_count > 0 && <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}><MessageSquare className="w-3 h-3" />{fmt(media.comment_count)}</span>}
            </div>
            <a href={media.hd_download_url || media.download_url} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-mono font-bold uppercase border"
              style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 10px 10px 0' }}>
              <Download className="w-3 h-3" />Download — No Watermark
            </a>
          </div>
        </div>
      )}
      <TerminalBlock data={response} loading={loading} />
    </div>
  );
}

// ─── TempMail console ─────────────────────────────────────────────────────────
function TempMailConsole({ onSuccess }: { onSuccess: () => void }) {
  const [session, setSession] = useState<MailSession | null>(getSession);
  const [messages, setMessages] = useState<TempMailMessage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [expandedBody, setExpandedBody] = useState<Record<string, string>>({});
  const [loadingBody, setLoadingBody] = useState<string | null>(null);
  const [openMsg, setOpenMsg] = useState<string | null>(null);
  const [, tick] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runCheck = useCallback(async (sess: MailSession) => {
    try { const fresh = await checkInbox(sess, 0); setMessages(fresh); onSuccess(); } catch { /* noop */ }
  }, [onSuccess]);

  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (session) runCheck(session); }, [session, runCheck]);
  useEffect(() => {
    if (!session) { if (pollRef.current) clearInterval(pollRef.current); return; }
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => runCheck(session), 20000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [session, runCheck]);

  const handleGenerate = async () => {
    setGenerating(true);
    try { const sess = await getNewEmailAddress(); setSession(sess); setMessages([]); onSuccess(); }
    catch { await logAnalyticsEvent('tempmail', 500, 'gen failed'); }
    finally { setGenerating(false); }
  };

  const handleClear = () => {
    clearSession(); setSession(null); setMessages([]); setExpandedBody({});
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleToggleMsg = async (msg: TempMailMessage) => {
    if (openMsg === msg.id) { setOpenMsg(null); return; }
    setOpenMsg(msg.id);
    if (!expandedBody[msg.id] && msg.raw_id && session) {
      setLoadingBody(msg.id);
      try { const body = await fetchEmailBody(session, msg.raw_id); setExpandedBody((p) => ({ ...p, [msg.id]: body })); }
      catch { /* noop */ } finally { setLoadingBody(null); }
    }
  };

  if (!session) {
    return (
      <div className="space-y-3">
        <div className="border p-6 flex flex-col items-center gap-3" style={{ borderColor: 'var(--border-medium)' }}>
          <Mail className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
          <div className="text-center">
            <p className="text-xs font-mono font-bold uppercase" style={{ color: 'var(--text-primary)' }}>No active mailbox</p>
            <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>Generate a real disposable inbox</p>
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-2 px-5 py-2 text-[10px] font-mono font-bold uppercase disabled:opacity-50"
            style={{ background: '#000', color: '#fff' }}>
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            {generating ? 'Generating...' : 'Generate Inbox'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border" style={{ borderColor: 'var(--border-medium)' }}>
        <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-medium)', background: 'var(--panel-inner)' }}>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>ACTIVE INBOX</span>
          <span className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: 'var(--status-success)' }}>
            <span className="w-1.5 h-1.5 rounded-full pulse-active" style={{ background: 'var(--status-success)' }} />LIVE · POLL 20s
          </span>
        </div>
        <div className="p-3 flex items-center gap-3">
          <p className="flex-1 text-xs font-mono font-bold break-all" style={{ color: 'var(--status-success)' }}>{session.email_addr}</p>
          <button onClick={() => navigator.clipboard.writeText(session.email_addr).then(() => { setCopiedAddr(true); setTimeout(() => setCopiedAddr(false), 2000); })}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono border"
            style={{ border: '1px solid var(--border-medium)', color: copiedAddr ? 'var(--status-success)' : 'var(--text-muted)' }}>
            {copiedAddr ? <><CheckCheck className="w-3 h-3" />COPIED</> : <><Copy className="w-3 h-3" />COPY</>}
          </button>
        </div>
        <div className="border-t px-3 py-1.5 flex items-center gap-1.5" style={{ borderColor: 'var(--border-medium)', background: 'var(--panel-inner)' }}>
          <Clock className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{formatExpiry(session.created_at)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-0 border" style={{ borderColor: 'var(--border-medium)' }}>
        <button onClick={() => { setChecking(true); runCheck(session).finally(() => setChecking(false)); }} disabled={checking}
          className="flex items-center justify-center gap-1.5 py-2 border-r text-[9px] font-mono font-bold uppercase disabled:opacity-50 transition-colors hover:bg-black hover:text-white"
          style={{ borderColor: 'var(--border-medium)', color: 'var(--text-secondary)' }}>
          <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />Refresh
        </button>
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center justify-center gap-1.5 py-2 border-r text-[9px] font-mono font-bold uppercase disabled:opacity-50 transition-colors hover:bg-black hover:text-white"
          style={{ borderColor: 'var(--border-medium)', color: 'var(--text-secondary)' }}>
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}New
        </button>
        <button onClick={handleClear}
          className="flex items-center justify-center gap-1.5 py-2 text-[9px] font-mono font-bold uppercase transition-colors"
          style={{ color: 'var(--status-error)' }}>
          <Trash2 className="w-3 h-3" />Clear
        </button>
      </div>

      <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="px-3 py-1.5 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Inbox className="w-3 h-3 text-white/30" />
          <span className="text-[9px] font-mono text-white/30">{session.email_addr} · {messages.length} msg</span>
        </div>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <Inbox className="w-6 h-6 text-white/10" />
            <p className="text-[10px] font-mono text-white/25">inbox empty — awaiting mail</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {messages.map((msg) => {
              const isOpen = openMsg === msg.id;
              return (
                <div key={msg.id}>
                  <button onClick={() => handleToggleMsg(msg)}
                    className="w-full px-3 py-2.5 text-left flex items-start justify-between gap-2 hover:bg-white/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-mono font-semibold text-white/80 truncate">{msg.subject}</p>
                      <p className="text-[10px] font-mono mt-0.5 text-white/30 truncate">from: {msg.from}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[9px] font-mono text-white/20">{formatTimeAgo(msg.received_at)}</span>
                      {isOpen ? <ChevronUp className="w-3 h-3 text-white/20" /> : <ChevronDown className="w-3 h-3 text-white/20" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 pt-2 border-t border-white/5" style={{ background: 'rgba(0,0,0,0.3)' }}>
                      {loadingBody === msg.id
                        ? <div className="flex items-center gap-2 text-white/40 text-[10px] font-mono"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading...</div>
                        : <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto text-white/55 leading-relaxed">{expandedBody[msg.id] || msg.body}</pre>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Generic GET tester ───────────────────────────────────────────────────────
interface ParamDef { key: string; label: string; placeholder: string; required?: boolean; type?: string }

function GenericGetTester({
  baseUrl, params, onSuccess,
}: {
  baseUrl: string;
  params: ParamDef[];
  onSuccess: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<unknown | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const setValue = (key: string, v: string) => setValues((p) => ({ ...p, [key]: v }));

  const buildUrl = () => {
    const qp = new URLSearchParams();
    params.forEach(({ key }) => { if (values[key]) qp.set(key, values[key]); });
    const qs = qp.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  };

  const handleExecute = async () => {
    const missing = params.filter((p) => p.required && !values[p.key]?.trim());
    if (missing.length > 0 || loading) return;
    setLoading(true); setResponse(null); setHttpStatus(null);
    const result = await proxyGet(buildUrl());
    setResponse(result.data); setHttpStatus(result.status); setLoading(false);
    if (result.status === 200) onSuccess();
  };

  const allRequired = params.filter((p) => p.required).every((p) => values[p.key]?.trim());

  // Audio player for TTS responses
  const audioUrl = typeof response === 'object' && response !== null
    ? (response as Record<string, unknown>)?.stream_url as string ?? ''
    : '';

  return (
    <div className="space-y-3">
      {params.map(({ key, label, placeholder, required }) => (
        <div key={key}>
          <div className="px-2 py-1 border-t border-l border-r" style={{ borderColor: 'var(--border-medium)', background: 'var(--panel-inner)' }}>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {label}{required ? ' *' : ''}
            </span>
          </div>
          <input type="text" value={values[key] || ''} onChange={(e) => setValue(key, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleExecute(); }}
            placeholder={placeholder} disabled={loading}
            className="w-full px-3 py-2 text-sm font-mono focus:outline-none disabled:opacity-40"
            style={{ background: 'var(--panel-inner)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', borderRadius: '10px' }} />
        </div>
      ))}
      <div className="px-3 py-2 text-[9px] font-mono break-all rounded-xl" style={{ border: '1px solid var(--border-light)', background: 'var(--panel-inner)', color: 'var(--text-muted)' }}>
        <span className="opacity-50">→ </span>{buildUrl().slice(0, 120)}
      </div>
      {httpStatus !== null && <StatusBadge status={httpStatus} />}
      <ExecBtn onClick={handleExecute} loading={loading} disabled={!allRequired && params.some(p => p.required)} label="Execute Request" loadingLabel="Fetching..." />
      {audioUrl && !loading && (
        <div className="border p-3" style={{ borderColor: 'var(--border-medium)', background: '#000' }}>
          <p className="text-[9px] font-mono text-white/30 mb-2 uppercase tracking-widest">AUDIO STREAM</p>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
      <TerminalBlock data={response} loading={loading} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//   ENDPOINT CARD
// ═══════════════════════════════════════════════════════════════════════════════
type TesterType =
  | { type: 'chat'; modelId: number }
  | { type: 'image'; engine: ImageEngine }
  | { type: 'music' }
  | { type: 'ttdl' }
  | { type: 'tempmail' }
  | { type: 'get'; baseUrl: string; params: ParamDef[] };

interface EndpointDef {
  id: string;
  methods: ('GET' | 'POST')[];
  path: string;
  title: string;
  description: string;
  codeEndpointUrl: string;
  codeBody?: string;
  tester: TesterType;
  keywords: string;
}

function EndpointCard({ ep, onSuccess }: { ep: EndpointDef; onSuccess: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  const copyUrl = () => navigator.clipboard.writeText(ep.codeEndpointUrl).then(() => { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); });

  const renderTester = () => {
    const t = ep.tester;
    if (t.type === 'chat') return <ChatTester modelId={t.modelId} onSuccess={onSuccess} />;
    if (t.type === 'image') return <ImageTester engine={t.engine} onSuccess={onSuccess} />;
    if (t.type === 'music') return <MusicTester onSuccess={onSuccess} />;
    if (t.type === 'ttdl') return <TTDLTester onSuccess={onSuccess} />;
    if (t.type === 'tempmail') return <TempMailConsole onSuccess={onSuccess} />;
    if (t.type === 'get') return <GenericGetTester baseUrl={t.baseUrl} params={t.params} onSuccess={onSuccess} />;
    return null;
  };

  return (
    <>
      <div className="endpoint-card">
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
          <div className="flex items-center gap-1.5">
            {ep.methods.map((m) => <MethodPill key={m} method={m} />)}
          </div>
          <LiveDot />
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => setCodeOpen(true)}
              className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase border transition-colors hover:bg-black hover:text-white"
              style={{ border: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
              <Terminal className="w-3 h-3" />CODE
            </button>
            <button onClick={copyUrl}
              className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase border"
              style={{ border: '1px solid var(--border-medium)', color: copiedUrl ? 'var(--status-success)' : 'var(--text-muted)', borderColor: copiedUrl ? 'var(--status-success-border)' : 'var(--border-medium)' }}>
              {copiedUrl ? <><CheckCheck className="w-3 h-3" />COPIED</> : <><Copy className="w-3 h-3" />URL</>}
            </button>
          </div>
        </div>
        <div style={{ padding:'8px 14px', borderBottom:'1px solid var(--border)', background:'rgba(59,130,246,0.03)' }}>
          <code className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{ep.path}</code>
        </div>
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{ep.title}</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ep.description}</p>
        </div>
        <button onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors hover:bg-black hover:text-white"
          style={{ background: expanded ? 'rgba(59,130,246,0.07)' : 'transparent', color: expanded ? 'var(--text-primary)' : 'var(--text-sec)', borderTop:'1px solid var(--border)' }}>
          <span>↳ {expanded ? 'CLOSE TESTER' : 'TRY IT OUT'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {expanded && (
          <div style={{ padding:'14px', borderTop:'1px solid var(--border)' }}>
            {renderTester()}
          </div>
        )}
      </div>
      <CodeModal open={codeOpen} onClose={() => setCodeOpen(false)}
        name={ep.title} method={ep.methods[0]}
        endpointUrl={ep.codeEndpointUrl} bodyExample={ep.codeBody ?? '{}'} />
    </>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────
function CategorySection({ id, icon: Icon, title, count, description, endpoints, onSuccess, visible }: {
  id: string; icon: React.ElementType; title: string; count: number;
  description: string; endpoints: EndpointDef[]; onSuccess: () => void; visible: boolean;
}) {
  if (!visible || endpoints.length === 0) return null;
  return (
    <section id={id}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderRadius:'var(--radius-md)', background:'var(--panel)', border:'1px solid var(--border-md)', marginBottom:10, backdropFilter:'blur(12px)' }}>
        <div style={{ width:32, height:32, borderRadius:6, flexShrink:0, background:'rgba(59,130,246,0.10)', border:'1px solid rgba(59,130,246,0.20)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon style={{ width:15, height:15, color:'var(--blue)' }} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span className="gradient-text" style={{ fontSize:12, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase' }}>{title}</span>
            <span style={{ padding:'1px 7px', borderRadius:3, fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.18)', color:'var(--text-muted)' }}>{count}</span>
          </div>
          <p style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", marginTop:2, color:'var(--text-muted)', margin:'2px 0 0' }}>{description}</p>
        </div>
      </div>
      <div className="space-y-3">
        {endpoints.map((ep) => <EndpointCard key={ep.id} ep={ep} onSuccess={onSuccess} />)}
      </div>
    </section>
  );
}

// ─── Analytics Chart ──────────────────────────────────────────────────────────
function AnalyticsChart({ refreshKey }: { refreshKey: number }) {
  const [chartData, setChartData] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from('api_analytics').select('endpoint_type').then(({ data: rows }) => {
      if (!rows) { setLoading(false); return; }
      const counts: Record<string, number> = {
        'ai-chat': 0, 'ai-image': 0, 'tempmail': 0, 'media-scraper': 0, 'duckduckgo': 0, 'ai-music': 0,
      };
      rows.forEach((r) => { if (r.endpoint_type in counts) counts[r.endpoint_type]++; });
      setChartData([
        { name: 'AI Chat', count: counts['ai-chat'] },
        { name: 'Image', count: counts['ai-image'] },
        { name: 'Mail', count: counts['tempmail'] },
        { name: 'Media', count: counts['media-scraper'] },
        { name: 'DDG', count: counts['duckduckgo'] },
        { name: 'Music', count: counts['ai-music'] },
      ]);
      setLoading(false);
    });
  }, [refreshKey]);

  return (
    <div className="chart-panel">
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border-medium)', background: 'var(--panel-inner)' }}>
        <div className="flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Request Volume</span>
        </div>
        {loading && <RefreshCw className="w-3 h-3 animate-spin" style={{ color: 'var(--text-muted)' }} />}
      </div>
      <div className="p-4">
        {!loading && chartData.every((d) => d.count === 0) ? (
          <p className="text-[10px] font-mono text-center py-4" style={{ color: 'var(--text-muted)' }}>Execute an endpoint to populate chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={chartData} barSize={22}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={18} />
              <Tooltip contentStyle={{ background:'rgba(2,8,22,0.96)', border:'1px solid rgba(59,130,246,0.3)', fontSize:10, fontFamily:'monospace', color:'var(--text-primary)', borderRadius:6 }} cursor={{ fill:'rgba(59,130,246,0.04)' }} />
              <Bar dataKey="count" fill="var(--blue)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//   MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
type CategoryId = 'overview' | 'ai-chat' | 'ai-image' | 'ai-music' | 'ai-voice' | 'anime' | 'tempmail' | 'media' | 'social' | 'research' | 'fun';

interface CategoryMeta {
  id: CategoryId;
  icon: React.ElementType;
  label: string;
}

const CATEGORIES: CategoryMeta[] = [
  { id: 'overview',  icon: Activity,      label: 'Overview'    },
  { id: 'ai-chat',   icon: MessageSquare, label: 'AI Chat'     },
  { id: 'ai-image',  icon: ImageIcon,     label: 'AI Image'    },
  { id: 'ai-music',  icon: Music,         label: 'AI Music'    },
  { id: 'ai-voice',  icon: Mic,           label: 'AI Voice'    },
  { id: 'anime',     icon: Tv2,           label: 'Anime'       },
  { id: 'media',     icon: Film,          label: 'Media'       },
  { id: 'social',    icon: Twitter,       label: 'Social'      },
  { id: 'research',  icon: Globe,         label: 'Research'    },
  { id: 'fun',       icon: Zap,           label: 'Fun'         },
  { id: 'tempmail',  icon: Mail,          label: 'Temp Mail'   },
];

const EDGE = import.meta.env.VITE_EDGE_URL ?? 'https://mxcbspvyqeckbkbomxcb.backend.onspace.ai/functions/v1';

// Backend (Node.js proxy on Render) — update this single string when adding a custom domain
const BACKEND_BASE = import.meta.env.VITE_BACKEND_BASE ?? 'https://daminiapi-1.onrender.com';

export default function Index() {
  const [search, setSearch]           = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('overview');
  const [contactOpen, setContactOpen] = useState(false);
  const [copiedBase, setCopiedBase]   = useState(false);
  const [analyticsKey, setAnalyticsKey] = useState(0);
  const [stats, setStats]             = useState<AnalyticsStats>({ total_requests: 0, success_rate: 0, total_success: 0, total_errors: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [theme, setTheme]             = useState<'dark' | 'light'>(getStoredTheme);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const dynamicBase = window.location.origin;

  useEffect(() => { applyTheme(theme); }, [theme]);
  const toggleTheme = () => setTheme((t) => t === 'dark' ? 'light' : 'dark');
  const onSuccess = useCallback(() => setAnalyticsKey((k) => k + 1), []);

  useEffect(() => {
    setStatsLoading(true);
    fetchAnalyticsStats().then((s) => { setStats(s); setStatsLoading(false); });
  }, [analyticsKey]);

  const copyBase = () => navigator.clipboard.writeText(dynamicBase).then(() => { setCopiedBase(true); setTimeout(() => setCopiedBase(false), 2000); });

  // ── Endpoint Definitions ───────────────────────────────────────────────────

  // AI CHAT
  const aiChatEps: EndpointDef[] = [
    { id: 'gemini-lite',  methods: ['POST'], path: '/api/ai/gemini-lite',  title: 'Gemini 2.5 Flash Lite', description: 'Fastest response. Ideal for high-throughput tasks, quick lookups, and summaries. Lowest cost per token.',              codeEndpointUrl: `${EDGE}/damini-easemate`, codeBody: '{ "prompt": "Hello!", "model_id": 1 }',                                  tester: { type: 'chat', modelId: 1 }, keywords: 'gemini lite fast chat ai' },
    { id: 'gemini-flash', methods: ['POST'], path: '/api/ai/gemini-flash', title: 'Gemini 3 Flash',         description: 'Default recommendation. Frontier-speed intelligence — best balance of speed, accuracy, and cost.',                    codeEndpointUrl: `${EDGE}/damini-easemate`, codeBody: '{ "prompt": "Hello!", "model_id": 2 }',                                  tester: { type: 'chat', modelId: 2 }, keywords: 'gemini flash recommended chat ai' },
    { id: 'gemini-pro',   methods: ['POST'], path: '/api/ai/gemini-pro',   title: 'Gemini 3 Pro',           description: 'Maximum reasoning and accuracy. Best for complex analytical tasks, long-form generation, and research.',               codeEndpointUrl: `${EDGE}/damini-easemate`, codeBody: '{ "prompt": "Explain quantum entanglement.", "model_id": 3 }',          tester: { type: 'chat', modelId: 3 }, keywords: 'gemini pro reasoning complex chat ai' },
    { id: 'gpt5-mini',    methods: ['POST'], path: '/api/ai/gpt5-mini',    title: 'GPT-5 Mini',             description: 'Balanced speed and quality. Great for coding assistance, structured writing, and technical tasks.',                    codeEndpointUrl: `${EDGE}/damini-easemate`, codeBody: '{ "prompt": "Write a Python function.", "model_id": 4 }',               tester: { type: 'chat', modelId: 4 }, keywords: 'gpt5 mini openai chat ai' },
    { id: 'llama-70b',    methods: ['POST'], path: '/api/ai/llama-70b',    title: 'Llama 3.3 70B',          description: 'Meta Llama 3.3 70B — private routing, no data retention. Strong general-purpose intelligence.',                        codeEndpointUrl: `${EDGE}/damini-easemate`, codeBody: '{ "prompt": "Hello!", "model_id": 5 }',                                  tester: { type: 'chat', modelId: 5 }, keywords: 'llama meta private chat ai' },
    { id: 'mixtral-24b',  methods: ['POST'], path: '/api/ai/mixtral-24b',  title: 'Mixtral 24B',            description: 'Mistral Mixtral-Small-24B — fast, strong multilingual capability. No API key required.',                              codeEndpointUrl: `${EDGE}/damini-easemate`, codeBody: '{ "prompt": "Translate this to French.", "model_id": 6 }',              tester: { type: 'chat', modelId: 6 }, keywords: 'mixtral mistral multilingual chat ai' },
    { id: 'claude-pro',   methods: ['POST'], path: '/api/ai/claude-pro',   title: 'Claude Pro',             description: 'Premium reasoning, nuanced writing, and deep comprehension. Supports vision via image attachment.',                    codeEndpointUrl: `${EDGE}/damini-easemate`, codeBody: '{ "prompt": "Analyse this concept.", "model_id": 7 }',                  tester: { type: 'chat', modelId: 7 }, keywords: 'claude pro reasoning vision chat ai' },
    { id: 'deepseek-v3',  methods: ['POST'], path: '/api/ai/deepseek-v3',  title: 'DeepSeek V3.2',          description: 'Deep analytical intelligence. Excels at mathematics, code generation, and structured reasoning. Supports vision.',      codeEndpointUrl: `${EDGE}/damini-easemate`, codeBody: '{ "prompt": "Solve this math problem.", "model_id": 8 }',               tester: { type: 'chat', modelId: 8 }, keywords: 'deepseek v3 math code vision chat ai' },
    { id: 'claude-std',   methods: ['POST'], path: '/api/ai/claude',       title: 'Standard Claude',        description: 'Reliable, thoughtful responses. Great for writing assistance, Q&A, and summarisation tasks.',                          codeEndpointUrl: `${EDGE}/damini-easemate`, codeBody: '{ "prompt": "Summarise this.", "model_id": 9 }',                        tester: { type: 'chat', modelId: 9 }, keywords: 'claude standard writing qa chat ai' },
    {
      id: 'writecream-text', methods: ['GET'], path: '/api/ai/writecream', title: 'Writecream AI Writer',
      description: 'AI-powered text generation engine. Input a topic or prompt and receive a polished written output string.',
      codeEndpointUrl: `${BACKEND_BASE}/api/ai/writecream`, codeBody: `{ "url": "${BACKEND_BASE}/api/ai/writecream?text=Write a poem about space" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/ai/writecream`, params: [{ key: 'text', label: 'TOPIC / PROMPT', placeholder: 'Write a poem about space', required: true }] },
      keywords: 'writecream ai text write chat generate content',
    },
    { id: 'blackbox',   methods: ['GET'], path: '/blackbox',   title: 'Blackbox Core',     description: 'Conversational AI engine optimised for coding, debugging, and technical explanations. Returns result string.', codeEndpointUrl: `${BACKEND_BASE}/blackbox`,   codeBody: `{ "url": "${BACKEND_BASE}/blackbox?q=Hello" }`,                          tester: { type: 'get', baseUrl: `${BACKEND_BASE}/blackbox`,   params: [{ key: 'q', label: 'PROMPT',       placeholder: 'What is recursion?',           required: true }] }, keywords: 'blackbox ai coding chat' },
    { id: 'meta-ai',    methods: ['GET'], path: '/metaai',     title: 'Llama Meta AI',     description: 'Meta conversational AI running on Llama architecture. Returns natural language response string.',               codeEndpointUrl: `${BACKEND_BASE}/metaai`,    codeBody: `{ "url": "${BACKEND_BASE}/metaai?q=Hello" }`,                            tester: { type: 'get', baseUrl: `${BACKEND_BASE}/metaai`,    params: [{ key: 'q', label: 'PROMPT',       placeholder: 'Tell me a joke.',              required: true }] }, keywords: 'meta ai llama chat' },
    { id: 'perplexity', methods: ['GET'], path: '/perplexity', title: 'Perplexity Search', description: 'Web-searched responses with cited sources. Returns result summary plus sources array with links and titles.',   codeEndpointUrl: `${BACKEND_BASE}/perplexity`, codeBody: `{ "url": "${BACKEND_BASE}/perplexity?q=Latest AI breakthroughs" }`,   tester: { type: 'get', baseUrl: `${BACKEND_BASE}/perplexity`, params: [{ key: 'q', label: 'SEARCH QUERY', placeholder: 'Latest AI breakthroughs 2025', required: true }] }, keywords: 'perplexity search web citations ai' },
  ];

  // AI IMAGE
  const aiImageEps: EndpointDef[] = [
    { id: 'nano-banana', methods: ['POST'], path: '/api/image/nano-banana', title: 'Nano Banana Generator', description: 'Fast AI image generation engine. Returns a high-quality hosted image URL from a text prompt.',                                                   codeEndpointUrl: `${EDGE}/damini-image`, codeBody: '{ "prompt": "A futuristic city at night", "engine": "nano-banana" }',          tester: { type: 'image', engine: 'nano-banana' }, keywords: 'image generation nano banana art' },
    { id: 'flux-pro',    methods: ['POST'], path: '/api/image/flux-pro',    title: 'Flux Pro Generator',    description: 'Professional high-fidelity image generation. Ideal for product visuals, creative work, and detailed scenes.',                                    codeEndpointUrl: `${EDGE}/damini-image`, codeBody: '{ "prompt": "Cinematic portrait in golden hour", "engine": "flux-pro" }',    tester: { type: 'image', engine: 'flux-pro' },    keywords: 'flux pro image generation professional' },
    {
      id: 'animagine', methods: ['GET'], path: '/api/ai/animagine', title: 'Animagine Generator',
      description: 'Anime-style AI image generation. Produces high-quality anime art from a text prompt. Returns a hosted image URL.',
      codeEndpointUrl: `${BACKEND_BASE}/api/ai/animagine`, codeBody: `{ "url": "${BACKEND_BASE}/api/ai/animagine?prompt=anime girl with silver hair" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/ai/animagine`, params: [{ key: 'prompt', label: 'IMAGE DESCRIPTION', placeholder: 'Anime girl with silver hair and glowing eyes', required: true }] },
      keywords: 'animagine anime image generate art ai',
    },
    {
      id: 'fluxv2', methods: ['GET'], path: '/api/ai/fluxv2', title: 'Flux V2 Generator',
      description: 'Second-generation Flux image engine. High-resolution photorealistic output. Returns a hosted image URL from a text prompt.',
      codeEndpointUrl: `${BACKEND_BASE}/api/ai/fluxv2`, codeBody: `{ "url": "${BACKEND_BASE}/api/ai/fluxv2?prompt=Mountain lake at dawn" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/ai/fluxv2`, params: [{ key: 'prompt', label: 'IMAGE DESCRIPTION', placeholder: 'Mountain lake at dawn, photorealistic', required: true }] },
      keywords: 'flux v2 image generate photorealistic art ai',
    },
    {
      id: 'writecream-image', methods: ['GET'], path: '/api/ai/writecream-image', title: 'Writecream Image Generator',
      description: 'Text-to-image with aspect ratio control. Options: 1:1, 16:9, 9:16, 4:3. Returns a direct canvas resource URL.',
      codeEndpointUrl: `${BACKEND_BASE}/api/ai/writecream-image`, codeBody: `{ "url": "${BACKEND_BASE}/api/ai/writecream-image?prompt=A dragon flying&ratio=16:9" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/ai/writecream-image`, params: [
        { key: 'prompt', label: 'IMAGE DESCRIPTION', placeholder: 'A dragon flying over a futuristic city', required: true },
        { key: 'ratio',  label: 'ASPECT RATIO (1:1 / 16:9 / 9:16 / 4:3)', placeholder: '1:1' },
      ]},
      keywords: 'writecream image generate art ratio canvas ai',
    },
  ];

  // AI MUSIC
  const aiMusicEps: EndpointDef[] = [
    {
      id: 'suno-v3', methods: ['POST'], path: '/api/music/suno', title: 'Suno V3 Music Generator',
      description: 'Generate complete songs from a style prompt. Returns title, full lyrics, album art thumbnail, and a playable audio stream URL.',
      codeEndpointUrl: `${EDGE}/damini-suno`, codeBody: '{ "prompt": "Chill lo-fi hip hop, 80bpm" }',
      tester: { type: 'music' }, keywords: 'suno music generate song lyrics audio',
    },
    {
      id: 'mubert', methods: ['GET'], path: '/mubert', title: 'Mubert Music Composer',
      description: 'AI-generated ambient and genre music. Specify mood or genre and duration in seconds. Returns a hosted audio track link.',
      codeEndpointUrl: `${BACKEND_BASE}/mubert`, codeBody: `{ "url": "${BACKEND_BASE}/mubert?prompt=Lo-fi&duration=30" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/mubert`, params: [
        { key: 'prompt',   label: 'GENRE / MOOD',        placeholder: 'Lo-fi chill', required: true },
        { key: 'duration', label: 'DURATION (seconds)',   placeholder: '30' },
      ]},
      keywords: 'mubert music ai generate ambient genre audio',
    },
  ];

  // AI VOICE (TTS)
  const aiVoiceEps: EndpointDef[] = [
    {
      id: 'tts-standard', methods: ['GET'], path: '/api/ai/tts', title: 'Standard TTS Engine',
      description: 'Text-to-speech synthesis from a text prompt. Returns an audio/mpeg stream or available voice model list.',
      codeEndpointUrl: `${BACKEND_BASE}/api/ai/tts`, codeBody: `{ "url": "${BACKEND_BASE}/api/ai/tts?text=Hello" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/ai/tts`, params: [
        { key: 'text', label: 'TEXT', placeholder: 'Hello, this is a test.', required: true },
      ]},
      keywords: 'tts text speech voice audio stream',
    },
    {
      id: 'tts-premium', methods: ['GET'], path: '/api/ai/text2speech-v3', title: 'Premium Multi-Voice TTS',
      description: 'High-fidelity voice synthesis with six selectable voices. Options: woman1–3, man1–3. Returns a hosted audio link.',
      codeEndpointUrl: `${BACKEND_BASE}/api/ai/text2speech-v3`, codeBody: `{ "url": "${BACKEND_BASE}/api/ai/text2speech-v3?text=Hello&voice=woman1" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/ai/text2speech-v3`, params: [
        { key: 'text',  label: 'TEXT',  placeholder: 'Hello, this is a test.', required: true },
        { key: 'voice', label: 'VOICE (woman1/woman2/woman3/man1/man2/man3)', placeholder: 'woman1' },
      ]},
      keywords: 'tts premium multi voice text speech audio woman man',
    },
    {
      id: 'tts-rachel', methods: ['GET'], path: '/api/ai/text2speech-v3?voice=woman1', title: 'ElevenLabs — Rachel',
      description: 'Preset: Rachel. Warm, articulate female voice. Ideal for narration, virtual assistants, and professional announcements.',
      codeEndpointUrl: `${BACKEND_BASE}/api/ai/text2speech-v3`, codeBody: `{ "url": "${BACKEND_BASE}/api/ai/text2speech-v3?text=Hello&voice=woman1" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/ai/text2speech-v3`, params: [
        { key: 'text',  label: 'TEXT',  placeholder: 'Hello, I am Rachel.', required: true },
        { key: 'voice', label: 'VOICE (locked: woman1)', placeholder: 'woman1' },
      ]},
      keywords: 'elevenlabs rachel voice tts female woman1 audio speech',
    },
    {
      id: 'tts-drew', methods: ['GET'], path: '/api/ai/text2speech-v3?voice=man1', title: 'ElevenLabs — Drew',
      description: 'Preset: Drew. Deep, confident male voice. Best suited for podcasts, tutorials, and corporate content.',
      codeEndpointUrl: `${BACKEND_BASE}/api/ai/text2speech-v3`, codeBody: `{ "url": "${BACKEND_BASE}/api/ai/text2speech-v3?text=Hello&voice=man1" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/ai/text2speech-v3`, params: [
        { key: 'text',  label: 'TEXT',  placeholder: 'Hello, I am Drew.', required: true },
        { key: 'voice', label: 'VOICE (locked: man1)', placeholder: 'man1' },
      ]},
      keywords: 'elevenlabs drew voice tts male man1 audio speech',
    },
    {
      id: 'tts-clyde', methods: ['GET'], path: '/api/ai/text2speech-v3?voice=man2', title: 'ElevenLabs — Clyde',
      description: 'Preset: Clyde. Expressive, energetic male voice. Great for gaming, entertainment, and dynamic content.',
      codeEndpointUrl: `${BACKEND_BASE}/api/ai/text2speech-v3`, codeBody: `{ "url": "${BACKEND_BASE}/api/ai/text2speech-v3?text=Hello&voice=man2" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/ai/text2speech-v3`, params: [
        { key: 'text',  label: 'TEXT',  placeholder: 'Hello, I am Clyde.', required: true },
        { key: 'voice', label: 'VOICE (locked: man2)', placeholder: 'man2' },
      ]},
      keywords: 'elevenlabs clyde voice tts male man2 audio speech',
    },
    {
      id: 'tts-paul', methods: ['GET'], path: '/api/ai/text2speech-v3?voice=man3', title: 'ElevenLabs — Paul',
      description: 'Preset: Paul. Calm, authoritative male voice. Excellent for audiobooks, news reading, and documentary narration.',
      codeEndpointUrl: `${BACKEND_BASE}/api/ai/text2speech-v3`, codeBody: `{ "url": "${BACKEND_BASE}/api/ai/text2speech-v3?text=Hello&voice=man3" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/ai/text2speech-v3`, params: [
        { key: 'text',  label: 'TEXT',  placeholder: 'Hello, I am Paul.', required: true },
        { key: 'voice', label: 'VOICE (locked: man3)', placeholder: 'man3' },
      ]},
      keywords: 'elevenlabs paul voice tts male man3 audio speech',
    },
  ];

  // ANIME
  const animeEps: EndpointDef[] = [
    {
      id: 'anime-schedule', methods: ['GET'], path: '/anime-schedule', title: 'Airing Calendar',
      description: 'Get the airing schedule for a given weekday. Returns titles, timestamps, and cover artwork strings.',
      codeEndpointUrl: `${BACKEND_BASE}/anime-schedule`, codeBody: `{ "url": "${BACKEND_BASE}/anime-schedule?day=monday" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/anime-schedule`, params: [{ key: 'day', label: 'WEEKDAY', placeholder: 'monday', required: true }] },
      keywords: 'anime schedule airing weekday episode list calendar',
    },
    {
      id: 'anime-character', methods: ['GET'], path: '/anime-character', title: 'Character Database',
      description: 'Search any anime character by name. Returns name details, biography data, and illustration URLs.',
      codeEndpointUrl: `${BACKEND_BASE}/anime-character`, codeBody: `{ "url": "${BACKEND_BASE}/anime-character?name=Naruto" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/anime-character`, params: [{ key: 'name', label: 'CHARACTER NAME', placeholder: 'Naruto', required: true }] },
      keywords: 'anime character search biography illustration database',
    },
    {
      id: 'anime-meta', methods: ['GET'], path: '/anime', title: 'Series Catalog Search',
      description: 'Full series metadata by title. Returns English/Japanese title, episode count, rating, status, and synopsis.',
      codeEndpointUrl: `${BACKEND_BASE}/anime`, codeBody: `{ "url": "${BACKEND_BASE}/anime?name=Attack on Titan" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/anime`, params: [{ key: 'name', label: 'SERIES TITLE', placeholder: 'Attack on Titan', required: true }] },
      keywords: 'anime series metadata title synopsis rating episodes catalog',
    },
  ];

  // MEDIA
  const mediaEps: EndpointDef[] = [
    {
      id: 'ttdl', methods: ['POST'], path: '/api/media/download', title: 'TikTok Downloader (No Watermark)',
      description: 'Extract unwatermarked MP4 links from TikTok. Returns HD URL, cover, author, duration, and engagement stats.',
      codeEndpointUrl: `${EDGE}/damini-ttdl`, codeBody: '{ "url": "https://www.tiktok.com/@user/video/12345" }',
      tester: { type: 'ttdl' }, keywords: 'tiktok video download no watermark hd social media',
    },
    {
      id: 'tiktok-v2', methods: ['GET'], path: '/api/download/tiktokv2', title: 'TikTok Downloader V2',
      description: 'Alternative TikTok downloader engine. Returns video metadata and download link without watermark.',
      codeEndpointUrl: `${BACKEND_BASE}/api/download/tiktokv2`, codeBody: `{ "url": "${BACKEND_BASE}/api/download/tiktokv2?url=https://tiktok.com/..." }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/download/tiktokv2`, params: [{ key: 'url', label: 'TIKTOK URL', placeholder: 'https://www.tiktok.com/@user/video/...', required: true }] },
      keywords: 'tiktok v2 download video no watermark media',
    },
    {
      id: 'instagram-dl', methods: ['GET'], path: '/api/download/instagram', title: 'Instagram Downloader',
      description: 'Download Instagram reels, posts, and stories. Returns media URL and metadata.',
      codeEndpointUrl: `${BACKEND_BASE}/api/download/instagram`, codeBody: `{ "url": "${BACKEND_BASE}/api/download/instagram?url=https://instagram.com/..." }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/download/instagram`, params: [{ key: 'url', label: 'INSTAGRAM URL', placeholder: 'https://www.instagram.com/p/...', required: true }] },
      keywords: 'instagram reel post story download media',
    },
    {
      id: 'facebook-dl', methods: ['GET'], path: '/api/download/facebook', title: 'Facebook Downloader',
      description: 'Download Facebook videos and media assets. Returns HD and SD download links.',
      codeEndpointUrl: `${BACKEND_BASE}/api/download/facebook`, codeBody: `{ "url": "${BACKEND_BASE}/api/download/facebook?url=https://facebook.com/..." }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/download/facebook`, params: [{ key: 'url', label: 'FACEBOOK URL', placeholder: 'https://www.facebook.com/watch?v=...', required: true }] },
      keywords: 'facebook video download media',
    },
    {
      id: 'facebook-dl2', methods: ['GET'], path: '/api/download/facebook2', title: 'Facebook Downloader V2',
      description: 'Alternative Facebook extraction engine. Returns direct media links — use if V1 fails for a URL.',
      codeEndpointUrl: `${BACKEND_BASE}/api/download/facebook2`, codeBody: `{ "url": "${BACKEND_BASE}/api/download/facebook2?url=https://facebook.com/..." }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/download/facebook2`, params: [{ key: 'url', label: 'FACEBOOK URL', placeholder: 'https://www.facebook.com/watch?v=...', required: true }] },
      keywords: 'facebook v2 video download media fallback',
    },
    {
      id: 'twitter-dl', methods: ['GET'], path: '/api/download/twitter', title: 'Twitter/X Downloader',
      description: 'Download Twitter and X video posts. Returns MP4 download URL and metadata.',
      codeEndpointUrl: `${BACKEND_BASE}/api/download/twitter`, codeBody: `{ "url": "${BACKEND_BASE}/api/download/twitter?url=https://x.com/..." }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/download/twitter`, params: [{ key: 'url', label: 'TWITTER/X URL', placeholder: 'https://x.com/user/status/...', required: true }] },
      keywords: 'twitter x video download media social',
    },
    {
      id: 'youtube-dl', methods: ['GET'], path: '/api/download/ytv3', title: 'YouTube Downloader V3',
      description: 'Download YouTube videos in multiple quality formats. Returns stream URLs and format metadata.',
      codeEndpointUrl: `${BACKEND_BASE}/api/download/ytv3`, codeBody: `{ "url": "${BACKEND_BASE}/api/download/ytv3?url=https://youtube.com/watch?v=..." }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/download/ytv3`, params: [{ key: 'url', label: 'YOUTUBE URL', placeholder: 'https://www.youtube.com/watch?v=...', required: true }] },
      keywords: 'youtube video download v3 stream media',
    },
    {
      id: 'mediafire-dl', methods: ['GET'], path: '/api/download/mediafire', title: 'Mediafire Downloader',
      description: 'Resolve and extract direct download links from Mediafire file hosting. Returns filename and direct URL.',
      codeEndpointUrl: `${BACKEND_BASE}/api/download/mediafire`, codeBody: `{ "url": "${BACKEND_BASE}/api/download/mediafire?url=https://mediafire.com/..." }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/download/mediafire`, params: [{ key: 'url', label: 'MEDIAFIRE URL', placeholder: 'https://www.mediafire.com/file/...', required: true }] },
      keywords: 'mediafire download file link resolve',
    },
    {
      id: 'pinterest-dl', methods: ['GET'], path: '/api/download/pinterest', title: 'Pinterest Downloader',
      description: 'Extract original-resolution images and videos from Pinterest pins. Returns direct asset URL.',
      codeEndpointUrl: `${BACKEND_BASE}/api/download/pinterest`, codeBody: `{ "url": "${BACKEND_BASE}/api/download/pinterest?url=https://pinterest.com/pin/..." }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/download/pinterest`, params: [{ key: 'url', label: 'PINTEREST URL', placeholder: 'https://www.pinterest.com/pin/...', required: true }] },
      keywords: 'pinterest image video download pin asset',
    },
    {
      id: 'spotify', methods: ['GET'], path: '/api/Search/Spotify', title: 'Spotify Search',
      description: 'Search Spotify tracks by title. Returns top_results array with type, id, uri, URL, name, and images.',
      codeEndpointUrl: `${BACKEND_BASE}/api/Search/Spotify`, codeBody: `{ "url": "${BACKEND_BASE}/api/Search/Spotify?action=search&query=Bohemian Rhapsody" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/Search/Spotify`, params: [
        { key: 'action', label: 'ACTION', placeholder: 'search' },
        { key: 'query',  label: 'SONG TITLE', placeholder: 'Bohemian Rhapsody', required: true },
      ]},
      keywords: 'spotify track search discover music song',
    },
    {
      id: 'soundcloud', methods: ['GET'], path: '/api/Search/soundcloud', title: 'SoundCloud Search',
      description: 'Search SoundCloud for tracks. Returns count and result array of track objects.',
      codeEndpointUrl: `${BACKEND_BASE}/api/Search/soundcloud`, codeBody: `{ "url": "${BACKEND_BASE}/api/Search/soundcloud?query=Lo-fi" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/Search/soundcloud`, params: [{ key: 'query', label: 'TRACK / ARTIST', placeholder: 'Lo-fi beats', required: true }] },
      keywords: 'soundcloud track search music audio',
    },
  ];

  // SOCIAL
  const socialEps: EndpointDef[] = [
    {
      id: 'fake-tweet', methods: ['GET'], path: '/api/Maker/fake-tweet', title: 'Fake Tweet Creator',
      description: 'Generate a realistic fake tweet image. Specify display name, username, tweet text, avatar URL, and verified status.',
      codeEndpointUrl: `${BACKEND_BASE}/api/Maker/fake-tweet`, codeBody: `{ "url": "${BACKEND_BASE}/api/Maker/fake-tweet?name=Elon&username=elonmusk&comment=Hello+world&verified=true" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/Maker/fake-tweet`, params: [
        { key: 'name',     label: 'DISPLAY NAME',           placeholder: 'Elon Musk',              required: true },
        { key: 'username', label: 'USERNAME',                placeholder: 'elonmusk',               required: true },
        { key: 'comment',  label: 'TWEET TEXT',              placeholder: 'This is a test tweet.' },
        { key: 'avatar',   label: 'AVATAR URL',              placeholder: 'https://...' },
        { key: 'verified', label: 'VERIFIED (true/false)',   placeholder: 'true' },
      ]},
      keywords: 'fake tweet twitter maker image social',
    },
  ];

  // RESEARCH
  const researchEps: EndpointDef[] = [
    {
      id: 'webpilot', methods: ['GET'], path: '/api/ai/Ai-research', title: 'WebPilot Deep Research',
      description: 'Deep web research with source citations. Returns a result summary and sources array containing links and page titles.',
      codeEndpointUrl: `${BACKEND_BASE}/api/ai/Ai-research`, codeBody: `{ "url": "${BACKEND_BASE}/api/ai/Ai-research?message=Elon+Musk" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/api/ai/Ai-research`, params: [{ key: 'message', label: 'RESEARCH QUERY', placeholder: 'Elon Musk latest projects', required: true }] },
      keywords: 'webpilot research web search ai sources citations deep',
    },
  ];

  // FUN / INTERACTIVE
  const funEps: EndpointDef[] = [
    {
      id: 'truth', methods: ['GET'], path: '/truth', title: 'Truth Generator',
      description: 'Returns a random truth-or-dare style truth question. No parameters needed — fire and receive.',
      codeEndpointUrl: `${BACKEND_BASE}/truth`, codeBody: `{ "url": "${BACKEND_BASE}/truth" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/truth`, params: [] },
      keywords: 'truth dare fun interactive random question game',
    },
    {
      id: 'dare', methods: ['GET'], path: '/dare', title: 'Dare Generator',
      description: 'Returns a random dare challenge string. Call with no parameters to receive a fresh dare.',
      codeEndpointUrl: `${BACKEND_BASE}/dare`, codeBody: `{ "url": "${BACKEND_BASE}/dare" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/dare`, params: [] },
      keywords: 'dare truth fun interactive random challenge game',
    },
    {
      id: 'pickupline', methods: ['GET'], path: '/pickupline', title: 'Pick-Up Line Engine',
      description: 'Returns a random pick-up line. No parameters required — instant single string response.',
      codeEndpointUrl: `${BACKEND_BASE}/pickupline`, codeBody: `{ "url": "${BACKEND_BASE}/pickupline" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/pickupline`, params: [] },
      keywords: 'pickup line fun random flirt interactive generator',
    },
    {
      id: 'fact', methods: ['GET'], path: '/fact', title: 'Random Fact Engine',
      description: 'Returns a verified random interesting fact. No parameters required — instant string response.',
      codeEndpointUrl: `${BACKEND_BASE}/fact`, codeBody: `{ "url": "${BACKEND_BASE}/fact" }`,
      tester: { type: 'get', baseUrl: `${BACKEND_BASE}/fact`, params: [] },
      keywords: 'fact random knowledge fun interesting trivia',
    },
  ];

  // TEMP MAIL
  const mailEps: EndpointDef[] = [
    {
      id: 'mail-address', methods: ['POST'], path: '/api/mail/address', title: 'Get Temp Mail Address',
      description: 'Generate a real disposable email address. Inbox live-polls every 20 seconds automatically.',
      codeEndpointUrl: `${EDGE}/damini-tempmail`, codeBody: '{ "action": "get_email_address" }',
      tester: { type: 'tempmail' }, keywords: 'temp mail email address disposable',
    },
    {
      id: 'mail-inbox', methods: ['POST'], path: '/api/mail/inbox', title: 'Check Inbox',
      description: 'Fetch all emails from your active disposable inbox. Session managed automatically — no tokens needed.',
      codeEndpointUrl: `${EDGE}/damini-tempmail`, codeBody: '{ "action": "check_email", "sid_token": "<sid>", "seq": 0 }',
      tester: { type: 'tempmail' }, keywords: 'temp mail inbox fetch emails check',
    },
  ];

  // ── Search filter ─────────────────────────────────────────────────────────
  const q = search.toLowerCase().trim();
  const filter = (list: EndpointDef[]) =>
    !q ? list : list.filter((e) =>
      e.keywords.includes(q) || e.title.toLowerCase().includes(q) || e.path.toLowerCase().includes(q)
    );

  const fChat     = filter(aiChatEps);
  const fImage    = filter(aiImageEps);
  const fMusic    = filter(aiMusicEps);
  const fVoice    = filter(aiVoiceEps);
  const fAnime    = filter(animeEps);
  const fMedia    = filter(mediaEps);
  const fSocial   = filter(socialEps);
  const fResearch = filter(researchEps);
  const fFun      = filter(funEps);
  const fMail     = filter(mailEps);

  const totalEndpoints =
    aiChatEps.length + aiImageEps.length + aiMusicEps.length + aiVoiceEps.length +
    animeEps.length + mediaEps.length + socialEps.length + researchEps.length + funEps.length + mailEps.length;

  const showAll = search.trim() !== '';
  const show = (cat: CategoryId) => showAll || activeCategory === 'overview' || activeCategory === cat;

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="border-b" style={{ borderColor: 'var(--border-medium)', padding: '12px 16px' }}>
        <div className="flex items-center gap-2">
          <DaminiLogo size={22} />
          <div>
            <p className="gradient-text" style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace", margin:'0 0 2px' }}>DAMINĪ API</p>
            <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>v2.0 · {totalEndpoints} endpoints</p>
          </div>
        </div>
      </div>
      <div style={{ borderBottom:'1px solid var(--border)', padding:'8px 14px', display:'flex', alignItems:'center', gap:8, background:'rgba(59,130,246,0.04)' }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--ok)', boxShadow:'0 0 6px rgba(16,185,129,0.5)', flexShrink:0, animation:'pulseBlue 2.2s ease-in-out infinite', display:'inline-block' }} />
        <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ok)' }}>STATUS: 200 / ONLINE</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {CATEGORIES.map(({ id, icon: Icon, label }) => {
          const isActive = activeCategory === id;
          return (
            <button key={id} onClick={() => { setActiveCategory(id); setSidebarOpen(false); }}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}>
              <div className="sidebar-icon">
                <Icon className="w-3.5 h-3.5" style={{ color: isActive ? 'var(--violet)' : 'var(--text-muted)' }} />
              </div>
              <span className="text-[11px] uppercase tracking-wider">{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="px-3 pb-3">
        <DeveloperProfile />
      </div>
      <div className="border-t" style={{ borderColor: 'var(--border-medium)' }}>
        <button onClick={() => setContactOpen(true)}
          className="sidebar-nav-item mx-2 mb-1">
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Contact Dev</span>
        </button>
        <button onClick={toggleTheme}
          className="sidebar-nav-item mx-2">
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </div>
  );

  const isOverview = activeCategory === 'overview' && !search;
  const allFilteredEmpty = showAll && [fChat, fImage, fMusic, fVoice, fAnime, fMedia, fSocial, fResearch, fFun, fMail].every((l) => l.length === 0);

  return (
    <div className="flex min-h-screen relative" style={{ background: 'var(--canvas)', color: 'var(--text-primary)' }}>
      <ThreeBackground />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-52 flex-shrink-0 border-r sticky top-0 h-screen overflow-hidden"
        style={{ borderColor: 'var(--border-md)', background: 'var(--sidebar-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 10, position: 'sticky' }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 h-full flex flex-col border-r" style={{ borderColor: 'var(--border-medium)', background: 'var(--panel)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0" style={{ position: 'relative', zIndex: 5 }}>

        {/* Topbar */}
        <div className="sticky top-0 z-40 border-b" style={{ background: 'var(--header-bg)', borderColor: 'var(--border-md)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 1px 0 rgba(59,130,246,0.15), 0 4px 24px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-3 px-4 h-12">
            <button className="lg:hidden flex items-center gap-1.5" style={{ padding:'6px 10px', borderRadius:'var(--radius-sm)', fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textTransform:'uppercase', border:'1px solid var(--border-md)', color:'var(--text-muted)', background:'transparent', cursor:'pointer' }}
              onClick={() => setSidebarOpen(true)}>
              <span className="flex flex-col gap-0.5">
                <span className="w-3 h-0.5 bg-current" /><span className="w-3 h-0.5 bg-current" /><span className="w-3 h-0.5 bg-current" />
              </span>
              Menu
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <DaminiLogo size={20} />
              <span className="text-[11px] font-mono font-bold uppercase" style={{ color: 'var(--text-primary)' }}>DAMINĪ API</span>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${totalEndpoints} endpoints...`}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono focus:outline-none transition-all"
                style={{ background: 'var(--panel-inner)', border: '1px solid var(--border-md)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }} />
            </div>
            <button onClick={copyBase} className="hidden sm:flex items-center gap-1.5" style={{ padding:'6px 12px', borderRadius:'var(--radius-sm)', fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textTransform:'uppercase', border:'1px solid var(--border-md)', color: copiedBase ? 'var(--ok)' : 'var(--text-muted)', background:'var(--panel-inner)', cursor:'pointer' }}>
              {copiedBase ? <><CheckCheck className="w-3 h-3" />COPIED</> : <><Copy className="w-3 h-3" />BASE URL</>}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={toggleTheme} style={{ width:32, height:32, borderRadius:'var(--radius-sm)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border-md)', color:'var(--text-muted)', background:'transparent', cursor:'pointer' }}>
                {theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
              </button>
              <button onClick={() => setContactOpen(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:'var(--radius-sm)', fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textTransform:'uppercase', border:'1px solid rgba(59,130,246,0.28)', color:'var(--blue-bright)', background:'rgba(59,130,246,0.07)', cursor:'pointer' }}>
                <MessageCircle className="w-3 h-3" />Dev
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 max-w-3xl space-y-6">

          {/* Overview */}
          {(isOverview || search) && (
            <>
              <div style={{ border:'1px solid var(--border-md)', borderRadius:'var(--radius-lg)', overflow:'hidden', background:'var(--panel)', backdropFilter:'blur(16px)' }}>
                <div style={{ display:'flex', alignItems:'center', padding:'10px 18px', borderBottom:'1px solid var(--border)', background:'rgba(59,130,246,0.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span className="w-2 h-2 rounded-full pulse-active" style={{ background:'var(--ok)' }} />
                    <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, letterSpacing:'0.10em', color:'var(--blue-bright)' }}>BASE URL</span>
                  </div>
                  <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:'var(--text-muted)' }}>{totalEndpoints} endpoints live</span>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', padding:'14px 18px', gap:12 }}>
                  <code style={{ flex:1, fontSize:14, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, wordBreak:'break-all', color:'var(--text-primary)' }}>{dynamicBase}</code>
                  <button onClick={copyBase} style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:'var(--radius-sm)', fontSize:10, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textTransform:'uppercase', border:`1px solid ${copiedBase ? 'var(--ok-bd)' : 'var(--border-md)'}`, background:copiedBase ? 'var(--ok-bg)' : 'var(--btn-ghost)', color:copiedBase ? 'var(--ok)' : 'var(--blue-bright)', cursor:'pointer' }}>
                    {copiedBase ? <><CheckCheck className="w-3 h-3" />COPIED</> : <><Copy className="w-3 h-3" />COPY</>}
                  </button>
                </div>
                <div style={{ padding:'8px 18px', borderTop:'1px solid var(--border)', background:'rgba(59,130,246,0.02)' }}>
                  <p style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:'var(--text-muted)', margin:0 }}>
                    Production API by <span className="gradient-text" style={{ fontWeight:700 }}>Dev Daminī</span> · Damini Codesphere
                  </p>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {[
                  { label:'TOTAL',      value:statsLoading?'—':stats.total_requests.toLocaleString(), color:'var(--blue-bright)' },
                  { label:'EFFICIENCY', value:statsLoading?'—':`${stats.success_rate}%`,              color:'var(--cyan)' },
                  { label:'SUCCESS',    value:statsLoading?'—':stats.total_success.toLocaleString(),  color:'var(--ok)' },
                  { label:'ERRORS',     value:statsLoading?'—':stats.total_errors.toLocaleString(),   color:'var(--err)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding:'14px 12px', borderRadius:'var(--radius-md)', background:'var(--panel)', border:'1px solid var(--border-md)', backdropFilter:'blur(12px)' }}>
                    <p style={{ fontSize:20, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color, lineHeight:1, margin:'0 0 6px' }}>{value}</p>
                    <p style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', margin:0 }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Quick category links */}
              {isOverview && (
                <div style={{ border:'1px solid var(--border-md)', borderRadius:'var(--radius-lg)', overflow:'hidden', background:'var(--panel)', backdropFilter:'blur(14px)' }}>
                  <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'rgba(59,130,246,0.04)' }}>
                    <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--blue-bright)' }}>DOCS — ENDPOINT CATEGORIES</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)' }}>
                    {CATEGORIES.filter(c => c.id !== 'overview').map(({ id, icon: Icon, label }, i, arr) => (
                      <button key={id} onClick={() => setActiveCategory(id)}
                        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'16px 8px', fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', cursor:'pointer', border:'none', borderRight: i < arr.length-1 ? '1px solid var(--border)' : 'none', borderBottom: i < 5 ? '1px solid var(--border)' : 'none', background: activeCategory===id ? 'rgba(59,130,246,0.10)' : 'transparent', color: activeCategory===id ? 'var(--blue-bright)' : 'var(--text-muted)', transition:'all 0.18s' }}>
                        <Icon style={{ width:16, height:16, color: activeCategory===id ? 'var(--blue)' : 'var(--text-muted)' }} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AnalyticsChart refreshKey={analyticsKey} />
            </>
          )}

          {/* Sections */}
          <CategorySection id="ai-chat"  icon={MessageSquare} title="AI CHAT"   count={fChat.length}    description={`${aiChatEps.length} models — Gemini, GPT-5, Claude, DeepSeek, Llama, Blackbox, Meta, Perplexity, Writecream`} endpoints={fChat}    onSuccess={onSuccess} visible={show('ai-chat')} />
          <CategorySection id="ai-image" icon={ImageIcon}     title="AI IMAGE"  count={fImage.length}   description="Nano Banana · Flux Pro · Flux V2 · Animagine · Writecream Image — text-to-image generation"                    endpoints={fImage}   onSuccess={onSuccess} visible={show('ai-image')} />
          <CategorySection id="ai-music" icon={Music}         title="AI MUSIC"  count={fMusic.length}   description="Suno V3 full song generation · Mubert ambient music"                                                            endpoints={fMusic}   onSuccess={onSuccess} visible={show('ai-music')} />
          <CategorySection id="ai-voice" icon={Mic}           title="AI VOICE"  count={fVoice.length}   description="Standard TTS · ElevenLabs voice presets (Rachel, Drew, Clyde, Paul) · Premium multi-voice synthesis"           endpoints={fVoice}   onSuccess={onSuccess} visible={show('ai-voice')} />
          <CategorySection id="anime"    icon={Tv2}           title="ANIME"     count={fAnime.length}   description="Airing schedules · character search · series metadata and synopsis"                                             endpoints={fAnime}   onSuccess={onSuccess} visible={show('anime')} />
          <CategorySection id="media"    icon={Film}          title="MEDIA"     count={fMedia.length}   description="TikTok · Instagram · Facebook · Twitter · YouTube · Pinterest · Mediafire · Spotify · SoundCloud"              endpoints={fMedia}   onSuccess={onSuccess} visible={show('media')} />
          <CategorySection id="social"   icon={Twitter}       title="SOCIAL"    count={fSocial.length}  description="Fake tweet image generator with custom name, handle, and avatar"                                               endpoints={fSocial}  onSuccess={onSuccess} visible={show('social')} />
          <CategorySection id="research" icon={Globe}         title="RESEARCH"  count={fResearch.length} description="WebPilot deep web research with cited sources"                                                                 endpoints={fResearch} onSuccess={onSuccess} visible={show('research')} />
          <CategorySection id="fun"      icon={Zap}           title="FUN"       count={fFun.length}     description="Truth · Dare · Pick-Up Lines · Random Facts — no parameters needed"                                           endpoints={fFun}     onSuccess={onSuccess} visible={show('fun')} />
          <CategorySection id="tempmail" icon={Mail}          title="TEMP MAIL" count={fMail.length}    description="Disposable email addresses via live GuerrillaMail integration"                                                endpoints={fMail}    onSuccess={onSuccess} visible={show('tempmail')} />

          {/* No results */}
          {allFilteredEmpty && (
            <div className="border py-12 text-center" style={{ borderColor: 'var(--border-medium)' }}>
              <Search className="w-7 h-7 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.2 }} />
              <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>No endpoints match "<span style={{ color: 'var(--text-primary)' }}>{search}</span>"</p>
              <button onClick={() => setSearch('')} className="mt-3 text-[10px] font-mono uppercase underline" style={{ color: 'var(--text-muted)' }}>Clear search</button>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 pb-6 flex items-center justify-between" style={{ borderColor: 'var(--border-medium)' }}>
            <div className="flex items-center gap-2">
              <DaminiLogo size={16} />
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>© 2025 DAMINĪ API · <span style={{ color: 'var(--text-primary)' }} className="font-bold">DAMINI CODESPHERE</span></span>
            </div>
            <button onClick={() => setContactOpen(true)} className="text-[10px] font-mono underline" style={{ color: 'var(--text-muted)' }}>Dev Daminī</button>
          </div>

        </div>
      </main>

      <ContactDevModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
