import { corsHeaders } from '../_shared/cors.ts';

const GUERRILLA_BASE = 'https://api.guerrillamail.com/ajax.php';

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36',
  'Accept': 'application/json, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

Deno.serve(async (req: Request) => {
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action: string = body?.action || '';

    console.log('[damini-tempmail] Action:', action);

    if (action === 'get_email_address') {
      // Get a new guerrillamail address
      const url = new URL(GUERRILLA_BASE);
      url.searchParams.set('f', 'get_email_address');
      url.searchParams.set('lang', 'en');

      const resp = await fetch(url.toString(), {
        method: 'GET',
        headers: BROWSER_HEADERS,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => resp.statusText);
        console.error('[damini-tempmail] get_email_address upstream error:', resp.status, text);
        return new Response(
          JSON.stringify({ error: `GuerrillaMail error ${resp.status}: ${text}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await resp.json();
      console.log('[damini-tempmail] Email address response:', JSON.stringify(data));

      // GuerrillaMail returns: { email_addr, email_timestamp, alias, sid_token, ... }
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check_email') {
      const { sid_token, seq = 0 } = body;

      if (!sid_token) {
        return new Response(
          JSON.stringify({ error: 'sid_token is required for check_email.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const url = new URL(GUERRILLA_BASE);
      url.searchParams.set('f', 'check_email');
      url.searchParams.set('seq', String(seq));
      url.searchParams.set('sid_token', sid_token);

      const resp = await fetch(url.toString(), {
        method: 'GET',
        headers: BROWSER_HEADERS,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => resp.statusText);
        console.error('[damini-tempmail] check_email upstream error:', resp.status, text);
        return new Response(
          JSON.stringify({ error: `GuerrillaMail check_email error ${resp.status}: ${text}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await resp.json();
      console.log('[damini-tempmail] check_email response, count:', data?.list?.length ?? 0);

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'fetch_email') {
      const { sid_token, email_id } = body;

      if (!sid_token || !email_id) {
        return new Response(
          JSON.stringify({ error: 'sid_token and email_id are required for fetch_email.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const url = new URL(GUERRILLA_BASE);
      url.searchParams.set('f', 'fetch_email');
      url.searchParams.set('email_id', String(email_id));
      url.searchParams.set('sid_token', sid_token);

      const resp = await fetch(url.toString(), {
        method: 'GET',
        headers: BROWSER_HEADERS,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => resp.statusText);
        console.error('[damini-tempmail] fetch_email upstream error:', resp.status, text);
        return new Response(
          JSON.stringify({ error: `GuerrillaMail fetch_email error ${resp.status}: ${text}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await resp.json();
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'set_email_user') {
      // Set a custom username on the guerrillamail address
      const { email_user, sid_token, lang = 'en' } = body;

      if (!email_user) {
        return new Response(
          JSON.stringify({ error: 'email_user is required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const url = new URL(GUERRILLA_BASE);
      url.searchParams.set('f', 'set_email_user');
      url.searchParams.set('email_user', email_user);
      url.searchParams.set('lang', lang);
      if (sid_token) url.searchParams.set('sid_token', sid_token);

      const resp = await fetch(url.toString(), {
        method: 'GET',
        headers: BROWSER_HEADERS,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => resp.statusText);
        return new Response(
          JSON.stringify({ error: `GuerrillaMail set_email_user error ${resp.status}: ${text}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await resp.json();
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: "${action}". Valid: get_email_address, check_email, fetch_email, set_email_user` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[damini-tempmail] Fatal error:', err);
    return new Response(
      JSON.stringify({ error: `Internal error: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
