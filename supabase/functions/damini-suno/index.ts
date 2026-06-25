import { corsHeaders } from '../_shared/cors.ts';

const SUNO_URL = 'https://omegatech-api.dixonomega.tech/api/ai/suno';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Music prompt is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const encoded = encodeURIComponent(prompt.trim());
    const url = `${SUNO_URL}?action=full&prompt=${encoded}`;

    console.log('[damini-suno] Generating music, prompt:', prompt.slice(0, 100));

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    console.log('[damini-suno] Suno status:', res.status);

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      console.error('[damini-suno] Error:', res.status, errText.slice(0, 300));
      return new Response(
        JSON.stringify({ error: `Suno error ${res.status}: ${errText}` }),
        { status: res.status >= 500 ? 502 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await res.json();
    console.log('[damini-suno] Keys:', Object.keys(data));

    const title: string = data?.title ?? data?.song_title ?? '';
    const lyrics: string = data?.lyrics ?? data?.lyric ?? '';
    const thumbnail: string = data?.thumbnail ?? data?.cover ?? data?.image ?? '';
    const audioUrl: string = data?.url ?? data?.audio_url ?? data?.stream ?? '';

    return new Response(
      JSON.stringify({ title, lyrics, thumbnail, url: audioUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[damini-suno] Fatal:', err);
    return new Response(
      JSON.stringify({ error: `Internal error: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
