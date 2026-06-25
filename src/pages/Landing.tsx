import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Shield, Code2, Cpu, Globe, ChevronRight, TrendingUp, Users,
  MessageSquare, Image as ImageIcon, Mail, Music,
  Film, Radio, Moon, Sun, ArrowRight, Sparkles,
  Terminal, Activity, BarChart2, Layers,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';

/* ── tiny theme helpers ─────────────────────────────────── */
function getTheme(): 'dark' | 'light' {
  try { return (localStorage.getItem('damini-theme') as 'dark' | 'light') || 'dark'; }
  catch { return 'dark'; }
}
function applyTheme(t: 'dark' | 'light') {
  const h = document.documentElement;
  if (t === 'dark') { h.classList.add('dark'); h.style.background = '#04040f'; }
  else              { h.classList.remove('dark'); h.style.background = '#f4f2ff'; }
  try { localStorage.setItem('damini-theme', t); } catch { /* noop */ }
}

/* ── animated code snippet ─────────────────────────────── */
const CODE_LINES = [
  { t: 'comment', v: '// Daminī API — zero auth, just fetch' },
  { t: 'kw', v: 'const' },     { t: 'plain', v: ' res = ' },
  { t: 'kw', v: 'await' },     { t: 'plain', v: ' fetch(' },
  { t: 'str', v: '"https://damiapis.zone.id/api/chat"' },
  { t: 'plain', v: ', {' },
  { t: 'plain', v: '  method:' }, { t: 'str', v: '"POST"' }, { t: 'plain', v: ',' },
  { t: 'plain', v: '  body: JSON.stringify({ prompt:' },
  { t: 'str', v: '"Hello Daminī"' }, { t: 'plain', v: ' })' },
  { t: 'plain', v: '});' },
  { t: 'comment', v: '// → { reply: "Hello! How can I help?" }' },
];

/* ── 3-D tilt card ─────────────────────────────────────── */
function TiltCard({ children, className = '', style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(4px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = 'perspective(700px) rotateY(0) rotateX(0) translateZ(0)'; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      className={`transition-transform duration-200 ease-out ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ── particles canvas ──────────────────────────────────── */
function ParticleBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.5 + 0.1,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.o})`;
        ctx.fill();
      }
      // lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139,92,246,${0.08 * (1 - d/100)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return (
    <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', opacity:0.8 }} />
  );
}

/* ── main ───────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'dark'|'light'>(getTheme);
  const [codeIdx, setCodeIdx] = useState(0);

  useEffect(() => { applyTheme(theme); }, [theme]);

  // typing effect for code
  useEffect(() => {
    const id = setInterval(() => {
      setCodeIdx(i => (i + 1) % CODE_LINES.length);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const isDark = theme === 'dark';

  const features = [
    { icon: Zap,          title: 'Lightning Fast',       desc: 'High-performance endpoints with minimal latency. Built for production workloads.' },
    { icon: Shield,       title: 'No Auth Required',     desc: 'Start building immediately without complex setup, API keys, or registration.' },
    { icon: Code2,        title: 'Easy Integration',     desc: 'Simple JSON responses with comprehensive docs for any language or framework.' },
    { icon: Cpu,          title: 'AI-Powered',           desc: 'State-of-the-art models for text, image, music, and media generation.' },
    { icon: Globe,        title: 'Always Online',        desc: 'High availability infrastructure. 99.9% uptime SLA backed by Damini Codesphere.' },
    { icon: BarChart2,    title: 'Usage Analytics',      desc: 'Track your API calls with built-in analytics. Monitor performance in real-time.' },
  ];

  const endpoints = [
    { icon: MessageSquare, label: 'AI Chat',        color: '#8b5cf6', desc: 'EaseMate GPT-powered chat' },
    { icon: ImageIcon,     label: 'AI Image',       color: '#22d3ee', desc: 'Generate stunning images' },
    { icon: Music,         label: 'AI Music',       color: '#e879f9', desc: 'Suno music generation' },
    { icon: Film,          label: 'Media DL',       color: '#f59e0b', desc: 'TikTok, YouTube & more' },
    { icon: Mail,          label: 'Temp Mail',      color: '#10b981', desc: 'Disposable email inbox' },
    { icon: Radio,         label: 'Social Data',    color: '#f43f5e', desc: 'Twitter, Instagram tools' },
  ];

  const stats = [
    { value: '50+',   label: 'API Endpoints' },
    { value: '∞',     label: 'Free Requests' },
    { value: '0',     label: 'Auth Required' },
    { value: '99.9%', label: 'Uptime SLA' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? '#04040f' : '#f4f2ff',
      color: isDark ? '#e8e2ff' : '#1a1040',
      fontFamily: "'Inter', 'JetBrains Mono', sans-serif",
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <ParticleBg />

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60,
        background: isDark ? 'rgba(4,4,15,0.85)' : 'rgba(244,242,255,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.15)'}`,
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background:'linear-gradient(135deg,#8b5cf6,#22d3ee)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 16px rgba(139,92,246,0.4)',
          }}>
            <Terminal style={{ width:16, height:16, color:'#fff' }} />
          </div>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:14, letterSpacing:'0.04em' }}>
            DAMINĪ <span style={{ background:'linear-gradient(135deg,#8b5cf6,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>API</span>
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{
            padding:'4px 14px', borderRadius:999,
            border:`1px solid ${isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.25)'}`,
            fontSize:11, fontFamily:"'JetBrains Mono',monospace",
            color: isDark ? 'rgba(139,92,246,0.8)' : '#7c3aed',
            background: isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.07)',
          }}>
            #Powered by Damini Codesphere
          </span>

          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{
              width:36, height:36, borderRadius:10,
              border:`1px solid ${isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.2)'}`,
              background:'transparent', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              color: isDark ? 'rgba(139,92,246,0.7)' : '#7c3aed',
              transition:'all 0.2s',
            }}>
            {isDark ? <Sun style={{ width:15, height:15 }} /> : <Moon style={{ width:15, height:15 }} />}
          </button>

          <button onClick={() => navigate('/dashboard')}
            style={{
              padding:'8px 18px', borderRadius:999, cursor:'pointer',
              background:'linear-gradient(135deg,#8b5cf6,#22d3ee)',
              color:'#fff', fontSize:12, fontWeight:600,
              border:'none', fontFamily:"'JetBrains Mono',monospace",
              letterSpacing:'0.03em',
              boxShadow:'0 4px 16px rgba(139,92,246,0.3)',
              transition:'all 0.2s',
              display:'flex', alignItems:'center', gap:6,
            }}>
            Dashboard <ArrowRight style={{ width:13, height:13 }} />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position:'relative', zIndex:1,
        paddingTop:160, paddingBottom:100,
        paddingLeft:32, paddingRight:32,
        maxWidth:900, margin:'0 auto',
        textAlign:'center',
      }}>
        {/* Powered badge */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'6px 18px', borderRadius:999, marginBottom:28,
          border:`1px solid ${isDark ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.3)'}`,
          background: isDark ? 'rgba(139,92,246,0.07)' : 'rgba(139,92,246,0.08)',
          fontSize:11, fontFamily:"'JetBrains Mono',monospace",
          color: isDark ? 'rgba(139,92,246,0.85)' : '#7c3aed',
        }}>
          <Sparkles style={{ width:12, height:12 }} />
          #Powered by Damini Codesphere
        </div>

        {/* Main heading */}
        <h1 style={{
          fontSize:'clamp(42px,7vw,80px)',
          fontWeight:700, lineHeight:1.08,
          margin:'0 0 24px',
          letterSpacing:'-0.02em',
          fontFamily:"'Inter',sans-serif",
        }}>
          <span style={{ color: isDark ? '#e8e2ff' : '#1a1040' }}>Daminī</span>
          {' '}
          <span style={{
            background:'linear-gradient(135deg,#8b5cf6 0%,#22d3ee 60%,#e879f9 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>Apis</span>
        </h1>

        {/* Sub */}
        <p style={{
          fontSize:'clamp(15px,2vw,18px)', lineHeight:1.7,
          color: isDark ? 'rgba(232,226,255,0.6)' : 'rgba(26,16,64,0.65)',
          maxWidth:600, margin:'0 auto 40px',
          fontWeight:400,
        }}>
          Daminī API is a comprehensive collection of RESTful APIs designed for developers.
          Integrate powerful AI features into your applications without the hassle of authentication.
        </p>

        {/* CTAs */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, flexWrap:'wrap' }}>
          <button onClick={() => navigate('/dashboard')}
            style={{
              padding:'14px 32px', borderRadius:999, cursor:'pointer',
              background:'linear-gradient(135deg,#8b5cf6,#22d3ee)',
              color:'#fff', fontSize:14, fontWeight:600,
              border:'none', letterSpacing:'0.02em',
              boxShadow:'0 8px 32px rgba(139,92,246,0.35)',
              display:'flex', alignItems:'center', gap:8,
              transition:'all 0.22s',
            }}>
            Get Started <ChevronRight style={{ width:16, height:16 }} />
          </button>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"
            style={{
              padding:'13px 28px', borderRadius:999, cursor:'pointer',
              background:'transparent',
              color: isDark ? 'rgba(232,226,255,0.8)' : '#4c3d9a',
              fontSize:14, fontWeight:500,
              border:`1px solid ${isDark ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.3)'}`,
              textDecoration:'none',
              display:'flex', alignItems:'center', gap:8,
              transition:'all 0.2s',
            }}>
            <Code2 style={{ width:15, height:15 }} /> View Docs
          </a>
        </div>

        {/* Stats row */}
        <div style={{
          display:'flex', justifyContent:'center', gap:48,
          marginTop:64, flexWrap:'wrap',
        }}>
          {stats.map(({ value, label }) => (
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{
                fontSize:28, fontWeight:700, fontFamily:"'Inter',sans-serif",
                background:'linear-gradient(135deg,#8b5cf6,#22d3ee)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              }}>{value}</div>
              <div style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", color: isDark ? 'rgba(232,226,255,0.4)' : 'rgba(26,16,64,0.45)', marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CODE PREVIEW ── */}
      <section style={{ position:'relative', zIndex:1, padding:'0 24px 80px', maxWidth:820, margin:'0 auto' }}>
        <TiltCard>
          <div style={{
            borderRadius:16,
            background: isDark ? 'rgba(8,6,24,0.9)' : 'rgba(255,255,255,0.88)',
            border:`1px solid ${isDark ? 'rgba(139,92,246,0.22)' : 'rgba(139,92,246,0.18)'}`,
            backdropFilter:'blur(20px)',
            overflow:'hidden',
            boxShadow:`0 24px 64px rgba(0,0,0,0.3), 0 0 0 1px ${isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.12)'}`,
          }}>
            {/* Window bar */}
            <div style={{
              padding:'12px 16px', display:'flex', alignItems:'center', gap:8,
              background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(139,92,246,0.05)',
              borderBottom:`1px solid ${isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.1)'}`,
            }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:'#f43f5e' }} />
              <span style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b' }} />
              <span style={{ width:10, height:10, borderRadius:'50%', background:'#10b981' }} />
              <span style={{ flex:1, textAlign:'center', fontSize:10, fontFamily:"'JetBrains Mono',monospace", color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>
                damini-api.js
              </span>
            </div>
            {/* Code */}
            <div style={{ padding:'24px 28px', fontFamily:"'JetBrains Mono',monospace", fontSize:13, lineHeight:2 }}>
              {CODE_LINES.map((line, i) => {
                const active = i <= codeIdx;
                const color = !active ? 'transparent' :
                  line.t === 'comment' ? 'rgba(139,92,246,0.5)' :
                  line.t === 'kw'      ? '#22d3ee' :
                  line.t === 'str'     ? '#10b981' :
                  isDark               ? 'rgba(232,226,255,0.8)' : 'rgba(26,16,64,0.8)';
                return (
                  <div key={i} style={{ color, transition:'color 0.3s', whiteSpace:'pre' }}>
                    {line.t === 'comment' && <span style={{ opacity:.7 }}>{line.v}</span>}
                    {line.t !== 'comment' && line.v}
                    {i === codeIdx && <span style={{ animation:'blink 1s step-end infinite', color:'#8b5cf6' }}>▍</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </TiltCard>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position:'relative', zIndex:1, padding:'0 24px 80px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ fontSize:32, fontWeight:700, margin:'0 0 12px', letterSpacing:'-0.01em' }}>
            Everything you need to{' '}
            <span style={{ background:'linear-gradient(135deg,#8b5cf6,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              build fast
            </span>
          </h2>
          <p style={{ fontSize:14, color: isDark ? 'rgba(232,226,255,0.5)' : 'rgba(26,16,64,0.5)', margin:0 }}>
            No registration. No API keys. Just fetch and ship.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <TiltCard key={title} style={{
              borderRadius:16,
              background: isDark ? 'rgba(10,8,30,0.7)' : 'rgba(255,255,255,0.85)',
              border:`1px solid ${isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.15)'}`,
              backdropFilter:'blur(16px)',
              padding:'24px 22px',
              boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
              transition:'all 0.22s',
              cursor:'default',
            }}>
              <div style={{
                width:44, height:44, borderRadius:12, marginBottom:16,
                background:'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(34,211,238,0.1))',
                border:'1px solid rgba(139,92,246,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Icon style={{ width:20, height:20, color:'#8b5cf6' }} />
              </div>
              <h3 style={{ fontSize:15, fontWeight:600, margin:'0 0 8px', color: isDark ? '#e8e2ff' : '#1a1040' }}>{title}</h3>
              <p style={{ fontSize:13, color: isDark ? 'rgba(232,226,255,0.5)' : 'rgba(26,16,64,0.55)', margin:0, lineHeight:1.7 }}>{desc}</p>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ── ENDPOINTS SHOWCASE ── */}
      <section style={{ position:'relative', zIndex:1, padding:'0 24px 80px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ fontSize:32, fontWeight:700, margin:'0 0 12px', letterSpacing:'-0.01em' }}>
            <span style={{ background:'linear-gradient(135deg,#8b5cf6,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              50+
            </span>{' '}
            powerful endpoints
          </h2>
          <p style={{ fontSize:14, color: isDark ? 'rgba(232,226,255,0.5)' : 'rgba(26,16,64,0.5)', margin:0 }}>
            From AI chat to media downloads — one API, infinite possibilities.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
          {endpoints.map(({ icon: Icon, label, color, desc }) => (
            <TiltCard key={label}
              style={{
                borderRadius:14,
                background: isDark ? 'rgba(10,8,30,0.6)' : 'rgba(255,255,255,0.8)',
                border:`1px solid ${isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.12)'}`,
                padding:'20px 18px',
                backdropFilter:'blur(12px)',
                boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
                cursor:'pointer',
              }}
              className=""
            >
              <div style={{
                width:40, height:40, borderRadius:10, marginBottom:12,
                background:`${color}18`,
                border:`1px solid ${color}35`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Icon style={{ width:18, height:18, color }} />
              </div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4, color: isDark ? '#e8e2ff' : '#1a1040' }}>{label}</div>
              <div style={{ fontSize:11, color: isDark ? 'rgba(232,226,255,0.4)' : 'rgba(26,16,64,0.45)', fontFamily:"'JetBrains Mono',monospace" }}>{desc}</div>
            </TiltCard>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign:'center', marginTop:48 }}>
          <button onClick={() => navigate('/dashboard')}
            style={{
              padding:'14px 40px', borderRadius:999, cursor:'pointer',
              background:'linear-gradient(135deg,#8b5cf6,#22d3ee)',
              color:'#fff', fontSize:14, fontWeight:600,
              border:'none',
              boxShadow:'0 8px 32px rgba(139,92,246,0.3)',
              display:'inline-flex', alignItems:'center', gap:8,
              transition:'all 0.22s',
            }}>
            <Layers style={{ width:15, height:15 }} />
            Explore All Endpoints
            <ArrowRight style={{ width:15, height:15 }} />
          </button>
        </div>
      </section>


      {/* ── ANALYTICS SECTION ── */}
      <section style={{ position:'relative', zIndex:1, padding:'0 24px 100px', maxWidth:1060, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'5px 16px', borderRadius:999, marginBottom:20,
            border:'1px solid rgba(34,211,238,0.22)', background:'rgba(34,211,238,0.06)',
            fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:'rgba(34,211,238,0.85)',
          }}>
            <TrendingUp style={{ width:11, height:11 }} />
            LIVE PLATFORM STATS
          </div>
          <h2 style={{ fontSize:30, fontWeight:700, margin:'0 0 12px', letterSpacing:'-0.015em' }}>
            Trusted by{' '}
            <span style={{ background:'linear-gradient(135deg,#22d3ee,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              3,300+ developers
            </span>
          </h2>
          <p style={{ fontSize:13, color: isDark ? 'rgba(232,226,255,0.48)' : 'rgba(26,16,64,0.48)', margin:0 }}>
            Real usage. Real growth. No fluff.
          </p>
        </div>

        {/* Stat tiles */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:32 }}>
          {[
            { label:'Total Users',     value:'3,312',  sub:'+248 this month',  color:'#8b5cf6', icon: Users },
            { label:'API Calls Today', value:'18.4k',  sub:'↑ 12% vs yesterday', color:'#22d3ee', icon: Activity },
            { label:'Endpoints Live',  value:'54',     sub:'4 added this week',  color:'#10b981', icon: Zap },
            { label:'Avg Response',    value:'142ms',  sub:'p95 under 300ms',    color:'#e879f9', icon: TrendingUp },
          ].map(({ label, value, sub, color, icon: Icon }) => (
            <div key={label} style={{
              borderRadius:16,
              background: isDark ? 'rgba(10,8,30,0.75)' : 'rgba(255,255,255,0.88)',
              border:`1px solid ${color}28`,
              backdropFilter:'blur(16px)',
              padding:'20px 18px',
              boxShadow:`0 4px 20px rgba(0,0,0,0.15), 0 0 20px ${color}0a`,
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle,${color}1a 0%,transparent 70%)`, pointerEvents:'none' }} />
              <div style={{
                width:36, height:36, borderRadius:10, marginBottom:14,
                background:`${color}18`, border:`1px solid ${color}35`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Icon style={{ width:17, height:17, color }} />
              </div>
              <div style={{ fontSize:24, fontWeight:700, color, marginBottom:4, fontFamily:"'Inter',sans-serif" }}>{value}</div>
              <div style={{ fontSize:12, fontWeight:600, color: isDark ? '#e8e2ff' : '#1a1040', marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:11, color: isDark ? 'rgba(232,226,255,0.4)' : 'rgba(26,16,64,0.45)', fontFamily:"'JetBrains Mono',monospace" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
          {/* Area chart — user growth */}
          <div style={{
            borderRadius:16,
            background: isDark ? 'rgba(10,8,30,0.75)' : 'rgba(255,255,255,0.88)',
            border:'1px solid rgba(139,92,246,0.15)',
            backdropFilter:'blur(16px)',
            padding:'24px 20px',
            boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color: isDark ? '#e8e2ff' : '#1a1040', marginBottom:3 }}>User Growth</div>
                <div style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color: isDark ? 'rgba(232,226,255,0.38)' : 'rgba(26,16,64,0.42)' }}>Last 12 months</div>
              </div>
              <div style={{ padding:'4px 12px', borderRadius:999, background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)', fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:'rgba(139,92,246,0.8)' }}>+37% YoY</div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={[
                { m:'Jul', u:420 }, { m:'Aug', u:680 }, { m:'Sep', u:890 },
                { m:'Oct', u:1100 },{ m:'Nov', u:1380 },{ m:'Dec', u:1620 },
                { m:'Jan', u:1870 },{ m:'Feb', u:2140 },{ m:'Mar', u:2450 },
                { m:'Apr', u:2730 },{ m:'May', u:3050 },{ m:'Jun', u:3312 },
              ]} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="ugFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" />
                <XAxis dataKey="m" tick={{ fontSize:10, fill:'rgba(139,92,246,0.5)', fontFamily:"'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:'rgba(139,92,246,0.5)', fontFamily:"'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background:'rgba(10,8,30,0.95)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:10, fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#e8e2ff' }}
                  itemStyle={{ color:'#8b5cf6' }} labelStyle={{ color:'rgba(232,226,255,0.6)' }}
                />
                <Area type="monotone" dataKey="u" stroke="#8b5cf6" strokeWidth={2} fill="url(#ugFill)" dot={false} activeDot={{ r:4, fill:'#8b5cf6', stroke:'rgba(139,92,246,0.3)', strokeWidth:3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart — daily calls by endpoint */}
          <div style={{
            borderRadius:16,
            background: isDark ? 'rgba(10,8,30,0.75)' : 'rgba(255,255,255,0.88)',
            border:'1px solid rgba(34,211,238,0.15)',
            backdropFilter:'blur(16px)',
            padding:'24px 20px',
            boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:600, color: isDark ? '#e8e2ff' : '#1a1040', marginBottom:3 }}>Calls by Type</div>
              <div style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", color: isDark ? 'rgba(232,226,255,0.38)' : 'rgba(26,16,64,0.42)' }}>Today's breakdown</div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { name:'Chat',  v:6200, fill:'#8b5cf6' },
                { name:'Image', v:3400, fill:'#22d3ee' },
                { name:'Music', v:1800, fill:'#e879f9' },
                { name:'Mail',  v:2800, fill:'#10b981' },
                { name:'Media', v:4200, fill:'#f59e0b' },
              ]} margin={{ top:4, right:4, left:-24, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.07)" />
                <XAxis dataKey="name" tick={{ fontSize:9, fill:'rgba(34,211,238,0.5)', fontFamily:"'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:9, fill:'rgba(34,211,238,0.5)', fontFamily:"'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background:'rgba(10,8,30,0.95)', border:'1px solid rgba(34,211,238,0.3)', borderRadius:10, fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#e8e2ff' }}
                  itemStyle={{ color:'#22d3ee' }} labelStyle={{ color:'rgba(232,226,255,0.6)' }}
                />
                <Bar dataKey="v" radius={[5,5,0,0]} maxBarSize={36}>
                  {['#8b5cf6','#22d3ee','#e879f9','#10b981','#f59e0b'].map((fill, i) => (
                    <Cell key={i} fill={fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ── DEV SECTION ── */}
      <section style={{ position:'relative', zIndex:1, padding:'0 24px 100px', maxWidth:700, margin:'0 auto', textAlign:'center' }}>
        <div style={{
          borderRadius:24,
          background: isDark ? 'rgba(10,8,30,0.75)' : 'rgba(255,255,255,0.85)',
          border:`1px solid ${isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.18)'}`,
          backdropFilter:'blur(20px)',
          padding:'40px 32px',
          boxShadow:'0 0 60px rgba(139,92,246,0.08)',
          position:'relative', overflow:'hidden',
        }}>
          {/* ambient */}
          <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)', top:-60, right:-40, pointerEvents:'none' }} />
          <div style={{ position:'absolute', width:150, height:150, borderRadius:'50%', background:'radial-gradient(circle,rgba(34,211,238,0.1) 0%,transparent 70%)', bottom:-40, left:-30, pointerEvents:'none' }} />

          <div style={{
            width:72, height:72, borderRadius:'50%', margin:'0 auto 20px',
            background:'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(34,211,238,0.15))',
            border:'2px solid rgba(139,92,246,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 30px rgba(139,92,246,0.2)',
          }}>
            <Activity style={{ width:28, height:28, color:'#8b5cf6' }} />
          </div>

          <div style={{
            display:'inline-block', marginBottom:16,
            padding:'3px 14px', borderRadius:999,
            background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)',
            fontSize:10, fontFamily:"'JetBrains Mono',monospace", color:'rgba(139,92,246,0.8)',
            letterSpacing:'0.1em',
          }}>DEVELOPER</div>

          <h3 style={{ fontSize:22, fontWeight:700, margin:'0 0 8px' }}>
            Built by{' '}
            <span style={{ background:'linear-gradient(135deg,#8b5cf6,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Dev Daminī
            </span>
          </h3>
          <p style={{ fontSize:13, color: isDark ? 'rgba(232,226,255,0.55)' : 'rgba(26,16,64,0.55)', margin:'0 0 24px', lineHeight:1.7 }}>
            Full-Stack Software Developer · Founder of Damini Codesphere.<br />
            Building developer tools, AI APIs, and open infrastructure.
          </p>

          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <a href="https://www.damini-dev.name.ng" target="_blank" rel="noopener noreferrer"
              style={{
                padding:'9px 20px', borderRadius:999, fontSize:12, fontWeight:600, cursor:'pointer',
                background:'linear-gradient(135deg,#8b5cf6,#22d3ee)',
                color:'#fff', textDecoration:'none', display:'flex', alignItems:'center', gap:6,
                boxShadow:'0 4px 16px rgba(139,92,246,0.25)',
              }}>
              <Globe style={{ width:13, height:13 }} /> Portfolio
            </a>
            <a href="https://wa.me/2349120185747" target="_blank" rel="noopener noreferrer"
              style={{
                padding:'9px 20px', borderRadius:999, fontSize:12, fontWeight:500, cursor:'pointer',
                background:'transparent', border:'1px solid rgba(139,92,246,0.25)',
                color: isDark ? 'rgba(232,226,255,0.75)' : '#4c3d9a',
                textDecoration:'none', display:'flex', alignItems:'center', gap:6,
              }}>
              <MessageSquare style={{ width:13, height:13 }} /> Contact
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position:'relative', zIndex:1,
        borderTop:`1px solid ${isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.12)'}`,
        padding:'24px 32px',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12,
        background: isDark ? 'rgba(4,4,15,0.6)' : 'rgba(244,242,255,0.6)',
        backdropFilter:'blur(12px)',
      }}>
        <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", color: isDark ? 'rgba(232,226,255,0.3)' : 'rgba(26,16,64,0.4)' }}>
          © 2025 Damini Codesphere · Dev Daminī
        </span>
        <div style={{ display:'flex', gap:6 }}>
          {['#8b5cf6','#22d3ee','#10b981'].map(c => (
            <span key={c} style={{ width:8, height:8, borderRadius:'50%', background:c, opacity:.6 }} />
          ))}
        </div>
        <span style={{ fontSize:11, fontFamily:"'JetBrains Mono',monospace", color: isDark ? 'rgba(232,226,255,0.3)' : 'rgba(26,16,64,0.4)' }}>
          v3.0 · 50+ endpoints · always free
        </span>
      </footer>

      {/* blink keyframe */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
