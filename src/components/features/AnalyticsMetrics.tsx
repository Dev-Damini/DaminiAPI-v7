import { useEffect, useState } from 'react';
import { Activity, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { fetchAnalyticsStats } from '@/lib/analytics';
import type { AnalyticsStats } from '@/types';

interface MetricTileProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'violet' | 'cyan' | 'emerald' | 'amber';
  loading?: boolean;
}

function MetricTile({ label, value, sub, icon: Icon, color, loading }: MetricTileProps) {
  const colorMap = {
    violet: {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      icon: 'text-violet-400',
      value: 'text-violet-300',
      glow: 'shadow-violet-500/10',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      icon: 'text-cyan-400',
      value: 'text-cyan-300',
      glow: 'shadow-cyan-500/10',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400',
      value: 'text-emerald-300',
      glow: 'shadow-emerald-500/10',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: 'text-amber-400',
      value: 'text-amber-300',
      glow: 'shadow-amber-500/10',
    },
  };

  const c = colorMap[color];

  return (
    <div className={`glass-panel rounded-xl p-4 border ${c.border} shadow-lg ${c.glow}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-[18px] h-[18px] ${c.icon}`} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-white/5 rounded animate-pulse mb-1" />
      ) : (
        <p className={`text-2xl font-bold mono ${c.value}`}>{value}</p>
      )}
      <p className="text-xs font-semibold text-foreground/80 mt-0.5">{label}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

interface Props {
  refreshKey: number;
}

export default function AnalyticsMetrics({ refreshKey }: Props) {
  const [stats, setStats] = useState<AnalyticsStats>({
    total_requests: 0,
    success_rate: 0,
    total_success: 0,
    total_errors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAnalyticsStats()
      .then((s) => {
        setStats(s);
        console.log('[Daminī Analytics] Real DB stats loaded:', s);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <div className="space-y-2">
      {/* DB source indicator */}
      <div className="flex items-center gap-1.5 mb-1">
        <RefreshCw className={`w-3 h-3 text-violet-400 ${loading ? 'animate-spin' : ''}`} />
        <span className="text-[10px] text-muted-foreground font-mono">
          {loading ? 'Querying api_analytics...' : `Live · ${stats.total_requests} rows in DB`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricTile
          label="Total API Requests"
          value={stats.total_requests.toLocaleString()}
          sub="All logged transactions"
          icon={Activity}
          color="violet"
          loading={loading}
        />
        <MetricTile
          label="System Efficiency"
          value={`${stats.success_rate}%`}
          sub="200 OK vs error states"
          icon={TrendingUp}
          color="cyan"
          loading={loading}
        />
        <MetricTile
          label="Successful Calls"
          value={stats.total_success.toLocaleString()}
          sub="HTTP 200 responses"
          icon={CheckCircle2}
          color="emerald"
          loading={loading}
        />
        <MetricTile
          label="Error Events"
          value={stats.total_errors.toLocaleString()}
          sub="4xx / 5xx responses"
          icon={AlertTriangle}
          color="amber"
          loading={loading}
        />
      </div>
    </div>
  );
}
