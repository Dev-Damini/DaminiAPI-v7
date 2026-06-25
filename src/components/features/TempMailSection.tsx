
import { useState, useEffect, useCallback, useRef } from 'react';
import { Mail, RefreshCw, Copy, CheckCheck, Trash2, ExternalLink, Inbox, Clock, Download, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  getNewEmailAddress,
  getSession,
  clearSession,
  checkInbox,
  fetchEmailBody,
  sessionToMailbox,
  formatTimeAgo,
  formatExpiry,
} from '@/lib/tempmail';
import type { MailSession } from '@/lib/tempmail';
import type { TempMailbox, TempMailMessage } from '@/types';
import { logAnalyticsEvent } from '@/lib/analytics';

interface Props {
  onSuccess: () => void;
}

export default function TempMailSection({ onSuccess }: Props) {
  const [session, setSession] = useState<MailSession | null>(null);
  const [mailbox, setMailbox] = useState<TempMailbox | null>(null);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<TempMailMessage | null>(null);
  const [expandedBody, setExpandedBody] = useState<Record<string, string>>({});
  const [loadingBody, setLoadingBody] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);
  const autoCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : ''; // Handle SSR for window.location.origin
  const testerUrl = `${origin}/#tempmail`;

  // Define runInboxCheck with useCallback to ensure stable reference if used in dependencies
  const runInboxCheck = useCallback(async (sess: MailSession, existingMessages: TempMailMessage[]) => {
    console.log('[TempMail] Auto/manual inbox check for:', sess.email_addr);
    try {
      const messages = await checkInbox(sess, 0);
      // Merge: keep existing fetched bodies, add new messages
      // This merge logic might need refinement if 'existingMessages' truly represents
      // messages with *already fetched* bodies.
      // Given `expandedBody` holds the fetched bodies, let's use that.
      const merged = messages.map((m) => ({
        ...m,
        // If the body for this message ID is in expandedBody, use it. Otherwise, use the body from the API.
        body: expandedBody[m.id] || m.body,
      }));
      // Using `prevMailbox?.messages` to correctly merge if previous messages exist,
      // otherwise use the new messages. This logic needs to be careful with `existingMessages` vs current state.
      // The original `existingMessages` parameter is meant for the messages *before* this check.
      // If we want to preserve previously loaded bodies, the `merged` array already handles that by looking at `expandedBody`.
      // The `existingMessages` from the parameter is typically what was there *before* the check.
      // So the logic here `merged.length > 0 ? merged : existingMessages` implies if new messages are found, use them, otherwise stick to old.
      // This might overwrite already loaded bodies if `messages` from `checkInbox` doesn't include them fully.
      // Let's refine this to explicitly prefer `expandedBody` for bodies and ensure all messages are considered.
      const allMessages = Array.from(new Set([...existingMessages, ...merged].map(m => m.id))) // Unique message IDs
        .map(id => {
          const existing = existingMessages.find(m => m.id === id);
          const fresh = merged.find(m => m.id === id);
          return {
            ...(existing || fresh), // Prefer existing for stability, then fresh
            body: expandedBody[id] || fresh?.body || existing?.body || '', // Always prefer expandedBody, then fresh, then existing
          } as TempMailMessage; // Type assertion
        })
        .filter(Boolean); // Remove any undefined/null if filtering non-existent IDs earlier

      // Sort messages by date descending, or other relevant order if needed.
      allMessages.sort((a, b) => b.received_at - a.received_at);

      const updated = sessionToMailbox(sess, allMessages);
      setMailbox(updated);
      onSuccess();
    } catch (err) {
      console.error('[TempMail] Inbox check failed:', err);
    }
  }, [expandedBody, onSuccess]); // `expandedBody` is a dependency because `runInboxCheck` uses it directly.

  // Restore session on mount
  useEffect(() => {
    const stored = getSession();
    if (stored) {
      setSession(stored);
      runInboxCheck(stored, []);
    }
  }, [runInboxCheck]); // Added runInboxCheck to dependency array

  // Tick every second for expiry display
  useEffect(() => {
    const t = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-poll inbox every 20 seconds when session is active
  useEffect(() => {
    if (!session) {
      if (autoCheckRef.current) clearInterval(autoCheckRef.current);
      autoCheckRef.current = null; // Ensure ref is nulled when not active
      return;
    }

    if (autoCheckRef.current) {
      clearInterval(autoCheckRef.current);
    }

    autoCheckRef.current = setInterval(() => {
      // Pass mailbox?.messages directly. useCallback for runInboxCheck will handle its own dependencies.
      if (session) runInboxCheck(session, mailbox?.messages ?? []);
    }, 20000);

    return () => {
      if (autoCheckRef.current) clearInterval(autoCheckRef.current);
      autoCheckRef.current = null; // Ensure ref is nulled on cleanup
    };
  }, [session, mailbox?.messages, runInboxCheck]); // Added runInboxCheck to dependency array

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setSelectedMsg(null);
    setExpandedBody({}); // Clear expanded bodies for new session
    console.log('[TempMail] Generating new address...');
    try {
      const sess = await getNewEmailAddress();
      setSession(sess);
      const box = sessionToMailbox(sess, []); // New session, new empty mailbox initially
      setMailbox(box);
      onSuccess();
      // Start polling immediately for the new session
      runInboxCheck(sess, []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      await logAnalyticsEvent('tempmail', 500, 'Address generation failed');
      console.error('[TempMail] Generation error:', msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleCheckInbox = useCallback(async () => {
    if (!session || checking) return;
    setChecking(true);
    setError(null);
    console.log('[TempMail] Manual inbox check...');
    try {
      await runInboxCheck(session, mailbox?.messages ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      await logAnalyticsEvent('tempmail', 500, 'Inbox check failed');
    } finally {
      setChecking(false);
    }
  }, [session, checking, mailbox?.messages, runInboxCheck]); // Dependencies are correctly listed

  const handleFetchBody = async (msg: TempMailMessage) => {
    if (!session || !msg.raw_id || expandedBody[msg.id]) return; // Already fetched or no raw_id
    setLoadingBody(msg.id);
    try {
      const body = await fetchEmailBody(session, msg.raw_id);
      setExpandedBody((prev) => ({ ...prev, [msg.id]: body }));
      setMailbox((prevMailbox) => {
        if (!prevMailbox) return null;
        const updatedMessages = prevMailbox.messages.map((m) =>
          m.id === msg.id ? { ...m, body: body } : m
        );
        return { ...prevMailbox, messages: updatedMessages };
      });
    } catch (err) {
      console.error('[TempMail] fetchEmailBody error:', err);
    } finally {
      setLoadingBody(null);
    }
  };

  const handleToggleMsg = async (msg: TempMailMessage) => {
    if (selectedMsg?.id === msg.id) {
      setSelectedMsg(null);
    } else {
      setSelectedMsg(msg);
      // Fetch body only if it's not already in expandedBody and raw_id exists
      if (!expandedBody[msg.id] && msg.raw_id) {
        await handleFetchBody(msg);
      }
    }
  };

  const handleCopyAddress = () => {
    if (!mailbox) return;
    navigator.clipboard.writeText(mailbox.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    clearSession();
    setSession(null);
    setMailbox(null);
    setSelectedMsg(null);
    setExpandedBody({});
    setError(null);
    if (autoCheckRef.current) {
      clearInterval(autoCheckRef.current);
      autoCheckRef.current = null; // Also set ref to null
    }
    logAnalyticsEvent('tempmail', 200, 'Mailbox cleared');
  };

  return (
    <div id="tempmail" className="space-y-5 fade-in-up">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Temporary Mail</h2>
            <p className="text-[11px] text-muted-foreground font-mono">
              api.guerrillamail.com · Real inbox
            </p>
          </div>
        </div>
        <a
          href={testerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-amber-400 transition-colors font-mono"
        >
          <ExternalLink className="w-3 h-3" />
          Tester Link
        </a>
      </div>

      {/* Tester URL display */}
      <div className="bg-[#0a0d1a] border border-amber-500/10 rounded-lg px-4 py-2 font-mono text-[11px] text-muted-foreground flex items-center gap-2">
        <span className="text-amber-500">UTIL</span>
        <span className="text-amber-400/70 break-all">{testerUrl}</span>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="text-red-400 text-xs font-mono mt-0.5">ERROR</span>
          <p className="text-xs text-red-300 leading-relaxed">{error}</p>
        </div>
      )}

      {/* No session: generate */}
      {!mailbox ? (
        <div className="glass-panel rounded-xl p-8 flex flex-col items-center gap-4 border border-amber-500/15">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            {generating ? (
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            ) : (
              <Mail className="w-8 h-8 text-amber-400/60" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground/80">No active mailbox</p>
            <p className="text-xs text-muted-foreground mt-1">
              {generating ? 'Connecting to GuerrillaMail...' : 'Generate a real disposable inbox via GuerrillaMail API'}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {generating ? 'Generating...' : 'Generate Real Inbox'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Address display */}
          <div className="glass-panel border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                  Active GuerrillaMail Address
                </p>
                <p className="text-base font-bold text-amber-300 font-mono break-all">
                  {mailbox.address}
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Expires in {formatExpiry(mailbox.created_at)}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    SID: {session?.sid_token?.slice(0, 12)}...
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-active" />
                    Auto-poll 20s
                  </span>
                </div>
              </div>
              <button
                onClick={handleCopyAddress}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs font-medium"
                aria-label="Copy email address"
              >
                {copied ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Messages', value: mailbox.messages.length },
              { label: 'Domain', value: mailbox.address.split('@')[1]?.split('.')[0] || 'N/A' },
              { label: 'Status', value: 'LIVE' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#0a0d1a] border border-amber-500/10 rounded-lg px-3 py-2.5 text-center">
                <p className="text-sm font-bold text-amber-300 font-mono">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5">
            <button
              onClick={handleCheckInbox}
              disabled={checking}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-sm font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Polling GuerrillaMail...' : 'Refresh Inbox'}
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all text-sm disabled:opacity-50"
              title="Get New Address"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'New'}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
              title="Delete mailbox"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Inbox list */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5" />
              Inbox ({mailbox.messages.length})
            </p>

            <div className="terminal-bg rounded-xl overflow-hidden">
              {/* Terminal header */}
              <div className="px-4 py-2.5 bg-[#0a0d1a] border-b border-amber-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-amber-400/70" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400/70" />
                  <span className="ml-2 text-[11px] font-mono text-muted-foreground">
                    {mailbox.address} · live inbox
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  guerrillamail.com API
                </span>
              </div>

              {mailbox.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Inbox className="w-8 h-8 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground font-mono">Inbox empty</p>
                  <p className="text-[11px] text-muted-foreground/60">
                    Send an email to <span className="text-amber-400">{mailbox.address}</span> to test
                  </p>
                  <p className="text-[11px] text-muted-foreground/40">Auto-polling every 20 seconds</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {mailbox.messages.map((msg) => {
                    const isOpen = selectedMsg?.id === msg.id;
                    const bodyContent = expandedBody[msg.id] || msg.body;
                    const isLoadingThisBody = loadingBody === msg.id;

                    return (
                      <div key={msg.id} className="w-full text-left">
                        <button
                          onClick={() => handleToggleMsg(msg)}
                          className="w-full px-4 py-3 hover:bg-violet-500/5 transition-colors flex items-start justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-semibold text-foreground/90 truncate">{msg.subject}</p>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                              From: {msg.from}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimeAgo(msg.received_at)}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4 border-t border-border/20 pt-3 bg-[#020408]/50">
                            {/* Email meta */}
                            <div className="mb-2 space-y-1">
                              <p className="text-[11px] font-mono">
                                <span className="text-violet-300">From:</span>{' '}
                                <span className="text-muted-foreground">{msg.from}</span>
                              </p>
                              <p className="text-[11px] font-mono">
                                <span className="text-violet-300">Subject:</span>{' '}
                                <span className="text-muted-foreground">{msg.subject}</span>
                              </p>
                            </div>

                            {isLoadingThisBody ? (
                              <div className="flex items-center gap-2 py-4 text-amber-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs font-mono">Fetching full message from GuerrillaMail...</span>
                              </div>
                            ) : (
                              <pre className="text-xs text-foreground/80 font-mono whitespace-pre-wrap break-words leading-relaxed mt-2 max-h-60 overflow-y-auto">
                                {bodyContent}
                              </pre>
                            )}

                            {msg.raw_id && !expandedBody[msg.id] && !isLoadingThisBody && (
                              <button
                                onClick={() => handleFetchBody(msg)}
                                className="mt-2 flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                Load full message body
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
