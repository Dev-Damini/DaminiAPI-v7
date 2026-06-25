import { useState } from 'react';
import { X, MessageCircle, Mail, Globe, Copy, CheckCheck, ExternalLink, Cpu, Zap, Terminal } from 'lucide-react';

// Tanjiro image
const TANJIRO_URL = 'https://static.wikia.nocookie.net/kimetsu-no-yaiba/images/7/7b/Tanjiro_Kamado_Anime.png';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ContactDevModal({ open, onClose }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!open) return null;

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div
        className="relative w-full max-w-sm overflow-hidden fade-in-up"
        style={{
          background: 'linear-gradient(135deg, rgba(8,8,24,0.98) 0%, rgba(15,10,35,0.98) 100%)',
          border: '1px solid rgba(139,92,246,0.35)',
          borderRadius: '12px',
          boxShadow: '0 0 60px rgba(139,92,246,0.2), 0 0 120px rgba(6,182,212,0.1), 0 32px 64px rgba(0,0,0,0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scanlines */}
        <div className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(139,92,246,0.02) 3px,rgba(139,92,246,0.02) 6px)' }} />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-violet-500/60 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyan-500/60 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-violet-500/30 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyan-500/30 rounded-br-xl" />

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.08)' }}>
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] font-mono font-bold text-violet-300 tracking-widest uppercase">DEV_CONTACT.sys</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-active" />
            <button onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded border border-violet-500/20 text-violet-400/60 hover:text-violet-300 hover:border-violet-500/50 transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero section — Tanjiro avatar */}
        <div className="relative flex border-b" style={{ borderColor: 'rgba(139,92,246,0.15)', minHeight: 180 }}>
          {/* Left - avatar panel */}
          <div className="w-40 border-r flex-shrink-0 relative overflow-hidden"
            style={{ borderColor: 'rgba(139,92,246,0.15)', background: 'rgba(5,5,16,0.8)' }}>
            {/* Gradient overlay on image */}
            <div className="absolute inset-0 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to right, transparent 60%, rgba(8,8,24,0.8) 100%), linear-gradient(to top, rgba(8,8,24,0.6) 0%, transparent 40%)' }} />
            <img
              src={TANJIRO_URL}
              alt="Dev Daminī — Tanjiro"
              className="w-full h-full object-cover object-top"
              style={{ maxHeight: 180, minHeight: 180, objectFit: 'cover' }}
              onError={(e) => {
                const t = e.currentTarget;
                t.style.display = 'none';
              }}
            />
            {/* Overlay glow */}
            <div className="absolute inset-0 z-10"
              style={{ background: 'radial-gradient(circle at 50% 100%, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
          </div>

          {/* Right - identity */}
          <div className="flex-1 p-4 flex flex-col justify-between relative z-10">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Cpu className="w-3 h-3 text-violet-400" />
                <p className="text-[9px] font-mono uppercase tracking-widest text-violet-400/70">DEVELOPER</p>
              </div>
              <h2 className="text-lg font-bold font-mono leading-tight gradient-text-violet-cyan">Dev Daminī</h2>
              <p className="text-[10px] font-mono mt-1 text-slate-400">Full-Stack Software Developer</p>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <Zap className="w-2.5 h-2.5 text-violet-400" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-violet-300">DAMINI CODESPHERE</span>
              </div>
            </div>

            {/* Status */}
            <div className="mt-3 flex items-center gap-1.5 px-2 py-1 rounded-full w-fit"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-active" />
              <span className="text-[9px] font-mono text-emerald-400">online · maybe</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.1)', background: 'rgba(139,92,246,0.03)' }}>
          <p className="text-[11px] font-mono leading-relaxed text-slate-400">
            <span className="text-violet-400/50 select-none">// </span>
            Mendokusei. Send the payload or don't — I'm probably debugging anyway
          </p>
        </div>

        {/* Contact rows */}
        <div className="divide-y" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
          {[
            { id: 'whatsapp', label: 'WHATSAPP', value: '+2349120185747', href: 'https://wa.me/2349120185747', Icon: MessageCircle, color: 'text-emerald-400', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
            { id: 'email', label: 'EMAIL', value: 'damibotzinc@gmail.com', href: 'mailto:damibotzinc@gmail.com', Icon: Mail, color: 'text-violet-400', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
          ].map(({ id, label, value, href, Icon, color, bg, border }) => (
            <div key={id} className="flex items-center"
              style={{ borderTopColor: 'rgba(139,92,246,0.1)', background: 'rgba(5,5,16,0.5)' }}>
              <div className="w-10 h-12 border-r flex items-center justify-center flex-shrink-0"
                style={{ borderColor: 'rgba(139,92,246,0.1)', background: bg }}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <div className="flex-1 px-3 py-2 min-w-0">
                <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-600">{label}</p>
                <a href={href} target="_blank" rel="noopener noreferrer"
                  className={`text-[11px] font-mono font-semibold truncate block hover:underline ${color} transition-colors`}>
                  {value}
                </a>
              </div>
              <button onClick={() => copyText(value, id)}
                className="w-10 h-12 border-l flex items-center justify-center transition-all hover:bg-violet-500/10"
                style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
                {copiedField === id
                  ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  : <Copy className="w-3.5 h-3.5 text-slate-600 hover:text-violet-400" />}
              </button>
            </div>
          ))}
        </div>

        {/* Portfolio links */}
        <div className="divide-y" style={{ borderTopColor: 'rgba(139,92,246,0.1)' }}>
          {[
            { label: 'PORTFOLIO', url: 'https://www.damini-dev.name.ng', desc: 'Founder profile' },
            { label: 'ORGANIZATION', url: 'https://daminicodes.zone.id', desc: 'Damini Codesphere' },
          ].map(({ label, url, desc }) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center group transition-all hover:bg-violet-500/8"
              style={{ borderTopColor: 'rgba(139,92,246,0.1)', background: 'rgba(5,5,16,0.3)' }}>
              <div className="w-10 h-12 border-r flex items-center justify-center flex-shrink-0"
                style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
                <Globe className="w-3.5 h-3.5 text-cyan-400/60 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div className="flex-1 px-3 py-2 min-w-0">
                <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-600 group-hover:text-violet-400/70 transition-colors">{label}</p>
                <p className="text-[11px] font-mono font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">{desc}</p>
              </div>
              <div className="w-10 h-12 border-l flex items-center justify-center flex-shrink-0"
                style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
                <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ background: 'rgba(139,92,246,0.04)', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
          <span className="text-[9px] font-mono text-slate-700">© Damini Codesphere 2025</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-violet-500/50" />
            <div className="w-1 h-1 rounded-full bg-cyan-500/50" />
            <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
