/**
 * damini-proxy — Generic GET proxy for external APIs (OmegaTech, David Cyril, etc.)
 * Accepts: { url: string } in body
 * Returns: raw JSON from the target URL
 */
import { corsHeaders } from '../_shared/cors.ts';

// No domain restriction — proxy serves all locally-routed paths

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'url is required.' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    // Validate that URL is from an allowed origin
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL.' }),
        { status: 400, headers: jsonHeaders },
      );
    }

    console.log('[damini-proxy] Fetching:', url.slice(0, 200));

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': `${parsedUrl.protocol}//${parsedUrl.hostname}/`,
        'Origin': `${parsedUrl.protocol}//${parsedUrl.hostname}`,
      },
    });

    console.log('[damini-proxy] Status:', res.status, 'URL:', url.slice(0, 100));

    const contentType = res.headers.get('content-type') ?? '';

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      console.error('[damini-proxy] Error:', res.status, errText.slice(0, 300));
      return new Response(
        JSON.stringify({ error: `Upstream error ${res.status}: ${errText.slice(0, 300)}` }),
        { status: res.status >= 500 ? 502 : res.status, headers: jsonHeaders },
      );
    }

    // If the response is binary (audio/mpeg), return a redirect URL
    if (contentType.includes('audio') || contentType.includes('binary') || contentType.includes('octet-stream')) {
      return new Response(
        JSON.stringify({ stream_url: url, content_type: contentType }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // Try JSON first
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      // Return plain text wrapped
      data = { result: text, raw: true };
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    console.error('[damini-proxy] Fatal:', err);
    return new Response(
      JSON.stringify({ error: `Internal error: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
