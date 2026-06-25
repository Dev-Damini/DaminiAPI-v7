import { Bot, Image as ImageIcon, Mail, ChevronRight, Zap, Cpu } from 'lucide-react';
import type { SectionType } from '@/types';

interface NavItem {
  id: SectionType;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glow: string;
  activeBg: string;
  activeBorder: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'ai-chat',
    label: 'AI Text Engine',
    sublabel: 'Chat & Completion',
    icon: Bot,
    color: 'text-violet-400',
    glow: 'rgba(139,92,246,0.15)',
    activeBg: 'bg-violet-500/10',
    activeBorder: 'border-violet-500/40',
  },
  {
    id: 'ai-image',
    label: 'AI Image Engine',
    sublabel: 'Text-to-Image',
    icon: ImageIcon,
    color: 'text-cyan-400',
    glow: 'rgba(6,182,212,0.15)',
    activeBg: 'bg-cyan-500/10',
    activeBorder: 'border-cyan-500/40',
  },
  {
    id: 'tempmail',
    label: 'Temp Mail',
    sublabel: 'Disposable Inbox',
    icon: Mail,
    color: 'text-amber-400',
    glow: 'rgba(251,191,36,0.15)',
    activeBg: 'bg-amber-500/10',
    activeBorder: 'border-amber-500/40',
  },
];

interface Props {
  active: SectionType;
  onChange: (section: SectionType) => void;
}

export default function Sidebar({ active, onChange }: Props) {
  return (
    <nav className="space-y-1.5">
      <div className="flex items-center gap-1.5 px-2 mb-3">
        <Cpu className="w-3 h-3 text-violet-400/60" />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          API Modules
        </p>
        <Zap className="w-2.5 h-2.5 text-cyan-400/60 ml-auto" />
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 text-left group relative overflow-hidden ${
              isActive
                ? `${item.activeBg} ${item.activeBorder}`
                : 'border-transparent hover:bg-white/5 hover:border-border'
            }`}
            style={isActive ? { boxShadow: `0 0 20px ${item.glow}, inset 0 1px 0 rgba(255,255,255,0.05)` } : {}}
          >
            {/* Active scan line */}
            {isActive && (
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(139,92,246,0.04) 3px, rgba(139,92,246,0.04) 6px)',
                }} />
            )}

            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
              isActive ? `${item.activeBg} border border-current/20` : 'bg-white/5'
            }`}
              style={isActive ? { boxShadow: `0 0 12px ${item.glow}` } : {}}>
              <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-muted-foreground group-hover:text-foreground/70'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate font-mono ${isActive ? 'text-foreground' : 'text-foreground/60 group-hover:text-foreground/80'}`}>
                {item.label}
              </p>
              <p className="text-[10px] text-muted-foreground truncate font-mono">{item.sublabel}</p>
            </div>

            {isActive && (
              <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${item.color}`} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
