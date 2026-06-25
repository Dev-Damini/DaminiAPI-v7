import { supabase } from '@/lib/supabase';
import { logAnalyticsEvent } from '@/lib/analytics';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type { TempMailbox, TempMailMessage } from '@/types';

const STORAGE_KEY = 'damini_tempmail_session';

// ─── Session persistence (store sid_token + email address locally) ───────────
export interface MailSession {
  email_addr: string;
  sid_token: string;
  alias: string;
  email_timestamp: number;
  created_at: number;
}

export function saveSession(session: MailSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): MailSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MailSession) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Helper: read edge function error ─────────────────────────────────────────
async function readEdgeError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const text = await error.context?.text();
      return `[${error.context?.status}] ${text || error.message}`;
    } catch {
      return error.message;
    }
  }
  return String(error);
}

// ─── Get a new GuerrillaMail address ─────────────────────────────────────────
export async function getNewEmailAddress(): Promise<MailSession> {
  console.log('[Daminī TempMail] Requesting new address from GuerrillaMail...');

  const { data, error } = await supabase.functions.invoke('damini-tempmail', {
    body: { action: 'get_email_address' },
  });

  if (error) {
    const msg = await readEdgeError(error);
    console.error('[Daminī TempMail] get_email_address error:', msg);
    throw new Error(`GuerrillaMail error: ${msg}`);
  }

  console.log('[Daminī TempMail] Raw response:', JSON.stringify(data));

  const session: MailSession = {
    email_addr: data.email_addr || data.email_address || '',
    sid_token: data.sid_token || '',
    alias: data.alias || '',
    email_timestamp: data.email_timestamp || Date.now(),
    created_at: Date.now(),
  };

  if (!session.email_addr) {
    throw new Error('GuerrillaMail returned no email address. Try again.');
  }

  saveSession(session);
  await logAnalyticsEvent('tempmail', 200, `Generated: ${session.email_addr}`);
  console.log('[Daminī TempMail] Address obtained:', session.email_addr);
  return session;
}

// ─── Check inbox ──────────────────────────────────────────────────────────────
export async function checkInbox(session: MailSession, seq = 0): Promise<TempMailMessage[]> {
  console.log('[Daminī TempMail] Checking inbox for:', session.email_addr, 'seq:', seq);

  const { data, error } = await supabase.functions.invoke('damini-tempmail', {
    body: {
      action: 'check_email',
      sid_token: session.sid_token,
      seq,
    },
  });

  if (error) {
    const msg = await readEdgeError(error);
    console.error('[Daminī TempMail] check_email error:', msg);
    throw new Error(`Inbox check error: ${msg}`);
  }

  // GuerrillaMail returns { list: [...], count: N, alias: ... }
  const rawList: Record<string, string>[] = data?.list ?? [];
  console.log('[Daminī TempMail] Inbox count:', rawList.length);

  const messages: TempMailMessage[] = rawList.map((item) => ({
    id: String(item.mail_id || item.id || Math.random()),
    from: item.mail_from || item.from || 'unknown@sender.com',
    subject: item.mail_subject || item.subject || '(No subject)',
    body: item.mail_excerpt || item.body || item.mail_body || '(Empty)',
    received_at: item.mail_timestamp
      ? parseInt(String(item.mail_timestamp)) * 1000
      : Date.now(),
    raw_id: item.mail_id || item.id || '',
  }));

  await logAnalyticsEvent('tempmail', 200, `Inbox check: ${session.email_addr}`);
  return messages;
}

// ─── Fetch full email body ────────────────────────────────────────────────────
export async function fetchEmailBody(session: MailSession, email_id: string): Promise<string> {
  console.log('[Daminī TempMail] Fetching full body for email_id:', email_id);

  const { data, error } = await supabase.functions.invoke('damini-tempmail', {
    body: {
      action: 'fetch_email',
      sid_token: session.sid_token,
      email_id,
    },
  });

  if (error) {
    const msg = await readEdgeError(error);
    console.error('[Daminī TempMail] fetch_email error:', msg);
    throw new Error(`Fetch email error: ${msg}`);
  }

  return data?.mail_body || data?.body || '(Empty message body)';
}

// ─── Build TempMailbox shape from session + messages ─────────────────────────
export function sessionToMailbox(session: MailSession, messages: TempMailMessage[]): TempMailbox {
  return {
    address: session.email_addr,
    token: session.sid_token,
    created_at: session.created_at,
    messages,
  };
}

// ─── Formatting utils ─────────────────────────────────────────────────────────
export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function formatExpiry(created_at: number): string {
  // GuerrillaMail addresses are valid for ~1 hour
  const expiresAt = created_at + 60 * 60 * 1000;
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return 'Expired';
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
