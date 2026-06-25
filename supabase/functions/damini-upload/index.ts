import { corsHeaders } from '../_shared/cors.ts';

const UPLOAD_URL = 'https://omegatech-api.dixonomega.tech/api/upload';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Forward the multipart form data to OmegaTech upload endpoint
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'A file is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[damini-upload] Uploading file:', file.name, 'size:', file.size);

    const uploadForm = new FormData();
    uploadForm.append('file', file);

    const res = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: uploadForm,
    });

    console.log('[damini-upload] OmegaTech status:', res.status);

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return new Response(
        JSON.stringify({ error: `Upload error ${res.status}: ${errText}` }),
        { status: res.status >= 500 ? 502 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await res.json();
    const url: string = data?.url ?? data?.image_url ?? data?.link ?? '';

    if (!url) {
      console.error('[damini-upload] No URL in response:', JSON.stringify(data).slice(0, 200));
      return new Response(
        JSON.stringify({ error: 'No file URL returned from upload service.', raw: data }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[damini-upload] Success, url:', url.slice(0, 80));
    return new Response(
      JSON.stringify({ url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[damini-upload] Fatal:', err);
    return new Response(
      JSON.stringify({ error: `Internal error: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
