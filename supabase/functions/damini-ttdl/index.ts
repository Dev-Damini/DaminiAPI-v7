import { corsHeaders } from '../_shared/cors.ts';

const TIKWM_URL = 'https://api.tikwm.com/api/';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return new Response(
        JSON.stringify({ error: 'TikTok/media URL is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[damini-ttdl] Fetching media for URL:', url.slice(0, 120));

    // TikWM prefers form-urlencoded
    const formData = new URLSearchParams();
    formData.append('url', url.trim());
    formData.append('count', '12');
    formData.append('cursor', '0');
    formData.append('web', '1');
    formData.append('hd', '1');

    const response = await fetch(TIKWM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, */*',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://tikwm.com/',
        'Cache-Control': 'no-cache',
      },
      body: formData.toString(),
    });

    console.log('[damini-ttdl] TikWM status:', response.status);

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      console.error('[damini-ttdl] TikWM error:', response.status, errText);
      return new Response(
        JSON.stringify({ error: `TikWM error ${response.status}: ${errText}` }),
        { status: response.status >= 500 ? 502 : response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('[damini-ttdl] TikWM response code:', data?.code, 'msg:', data?.msg);

    if (data?.code !== 0) {
      return new Response(
        JSON.stringify({ error: data?.msg || 'TikWM returned an error response.', code: data?.code }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videoData = data?.data;
    if (!videoData) {
      return new Response(
        JSON.stringify({ error: 'No media data in TikWM response.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract all useful fields
    const result = {
      title: videoData.title || videoData.desc || '',
      author: videoData.author?.nickname || videoData.author?.unique_id || '',
      cover: videoData.cover || videoData.origin_cover || '',
      duration: videoData.duration || 0,
      play_count: videoData.play_count || 0,
      digg_count: videoData.digg_count || 0,
      comment_count: videoData.comment_count || 0,
      // Unwatermarked MP4
      download_url: videoData.play || videoData.wmplay || '',
      hd_download_url: videoData.hdplay || videoData.play || '',
      // Music
      music_title: videoData.music_info?.title || '',
      music_author: videoData.music_info?.author || '',
      music_url: videoData.music || '',
      // Images (for carousel posts)
      images: videoData.images || [],
    };

    if (!result.download_url) {
      return new Response(
        JSON.stringify({ error: 'No download URL found in media data.', raw: videoData }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[damini-ttdl] Success, title:', result.title.slice(0, 60));

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[damini-ttdl] Fatal error:', err);
    return new Response(
      JSON.stringify({ error: `Internal error: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
