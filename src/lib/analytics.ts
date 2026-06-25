import { supabase } from '@/lib/supabase';
import type { AnalyticsStats, SectionType, StatusCode } from '@/types';

// ─── Real Supabase INSERT ────────────────────────────────────────────────────
export async function logAnalyticsEvent(
  endpoint_type: SectionType,
  http_status_code: StatusCode,
  user_prompt: string
): Promise<void> {
  const { error } = await supabase
    .from('api_analytics')
    .insert({
      endpoint_type,
      http_status_code,
      user_prompt: user_prompt.slice(0, 500),
    });

  if (error) {
    console.error('[Daminī Analytics] INSERT failed:', error.message);
  } else {
    console.log('[Daminī Analytics] Logged:', endpoint_type, http_status_code);
  }
}

// ─── Real Supabase SELECT for metric tiles ───────────────────────────────────
export async function fetchAnalyticsStats(): Promise<AnalyticsStats> {
  const { data, error } = await supabase
    .from('api_analytics')
    .select('http_status_code');

  if (error) {
    console.error('[Daminī Analytics] SELECT failed:', error.message);
    return { total_requests: 0, success_rate: 0, total_success: 0, total_errors: 0 };
  }

  const rows = data ?? [];
  const total_requests = rows.length;
  const total_success = rows.filter((r) => r.http_status_code === 200).length;
  const total_errors = total_requests - total_success;
  const success_rate =
    total_requests === 0 ? 0 : Math.round((total_success / total_requests) * 100);

  const stats: AnalyticsStats = { total_requests, success_rate, total_success, total_errors };
  console.log('[Daminī Analytics] Real stats from DB:', stats);
  return stats;
}
