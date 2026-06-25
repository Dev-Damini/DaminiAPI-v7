import { corsHeaders } from '../_shared/cors.ts';

const PIXELBIN_URL = 'https://api.pixelbin.io/service/public/transformation/v1.0/predictions/nanoBanana/generate';
const OMEGATECH_BASE = 'https://omegatech-api.dixonomega.tech/api';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { prompt, aspect_ratio = '1:1', engine = 'nano-banana' } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Image prompt is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

    // ── Flux Pro via OmegaTech ──────────────────────────────────────────────
    if (engine === 'flux-pro') {
      const encoded = encodeURIComponent(prompt.trim());
      // action=generate for image generation (not "create" or "chat")
      const url = `${OMEGATECH_BASE}/ai/Claude-pro?action=generate&model=flux-pro&prompt=${encoded}&chatStyle=chat&tools=none&size=portrait&version=hd&clearSession=true`;

      console.log('[damini-image][flux-pro] Fetching:', url.slice(0, 140));

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://omegatech-api.dixonomega.tech/',
          'Origin': 'https://omegatech-api.dixonomega.tech',
        },
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        console.error('[damini-image][flux-pro] Error:', res.status, errText.slice(0, 300));
        return new Response(
          JSON.stringify({ error: `Flux Pro error ${res.status}: ${errText}` }),
          { status: res.status >= 500 ? 502 : 400, headers: jsonHeaders },
        );
      }

      const data = await res.json();
      console.log('[damini-image][flux-pro] Keys:', Object.keys(data));

      // response key contains direct image URL or base64
      const outputUrl: string = data?.response ?? data?.url ?? data?.image ?? data?.result ?? '';

      if (!outputUrl) {
        console.error('[damini-image][flux-pro] No output. Raw:', JSON.stringify(data).slice(0, 300));
        return new Response(
          JSON.stringify({ error: 'No image URL returned from Flux Pro.', raw: data }),
          { status: 502, headers: jsonHeaders },
        );
      }

      console.log('[damini-image][flux-pro] Success');
      return new Response(
        JSON.stringify({ output_url: outputUrl, source: 'flux-pro' }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // ── Pixelbin Nano Banana (default) ──────────────────────────────────────
    console.log('[damini-image] Nano Banana, prompt:', prompt.slice(0, 100));

    const response = await fetch(PIXELBIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, */*',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Origin': 'https://pixelbin.io',
        'Referer': 'https://pixelbin.io/',
      },
      body: JSON.stringify({ input: { prompt: prompt.trim(), aspect_ratio } }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      console.error('[damini-image] Pixelbin error:', response.status, errText);
      return new Response(
        JSON.stringify({ error: `Nano Banana error ${response.status}: ${errText}` }),
        { status: response.status >= 500 ? 502 : response.status, headers: jsonHeaders },
      );
    }

    const data = await response.json();
    const outputUrl: string =
      data?.urls?.[0] || data?.url || data?.output_url || data?.result?.url || data?.imageUrl || '';

    if (!outputUrl) {
      console.error('[damini-image] No URL in Pixelbin response:', JSON.stringify(data).slice(0, 400));
      return new Response(
        JSON.stringify({ error: 'No image URL returned from Nano Banana.', raw: data }),
        { status: 502, headers: jsonHeaders },
      );
    }

    console.log('[damini-image] Nano Banana success');
    return new Response(
      JSON.stringify({ output_url: outputUrl, source: 'nano-banana' }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    console.error('[damini-image] Fatal:', err);
    return new Response(
      JSON.stringify({ error: `Internal error: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
