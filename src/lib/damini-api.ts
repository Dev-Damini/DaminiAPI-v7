import { supabase } from '@/lib/supabase';
import { logAnalyticsEvent } from '@/lib/analytics';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type { DaminiResponse, StatusCode, MediaResult, SunoResult, ImageEngine } from '@/types';

const EDGE_BASE = 'https://mxcbspvyqeckbkbomxcb.backend.onspace.ai/functions/v1';

const PROVIDER_META = {
  provider: 'Daminī API Engine',
  owner: 'Dev Daminī',
  professional_title: 'Full-Stack Software Developer',
  organization: 'Damini Codesphere',
  contact: '+2349120185747',
};

function buildSuccessResponse(result: string, endpointUrl: string, extra?: Record<string, unknown>): DaminiResponse {
  return {
    status: 200,
    success: true,
    ...PROVIDER_META,
    endpoint_url: endpointUrl,
    response_data: { result, ...extra },
  };
}

function buildErrorResponse(status: 400 | 500, message: string, endpointUrl: string): DaminiResponse {
  return {
    status,
    success: false,
    ...PROVIDER_META,
    endpoint_url: endpointUrl,
    response_data: { result: message },
  };
}

async function readFunctionError(error: unknown): Promise<{ message: string; code: StatusCode }> {
  if (error instanceof FunctionsHttpError) {
    try {
      const statusCode = error.context?.status ?? 500;
      const textContent = await error.context?.text();
      const code: StatusCode = statusCode >= 500 ? 500 : 400;
      return { message: `[${statusCode}] ${textContent || error.message}`, code };
    } catch {
      return { message: error.message || 'Edge Function error', code: 500 };
    }
  }
  return { message: String(error), code: 500 };
}

// DuckDuckGo model IDs
const DDG_MODEL_IDS = new Set([5, 6]);
// OmegaTech model IDs
const OMEGA_MODEL_IDS = new Set([7, 8, 9, 10]);

// ─── AI CHAT (multi-model) ────────────────────────────────────────────────────
export async function sendEaseMateMessage(
  prompt: string,
  modelId: number,
  imageUrl?: string,
): Promise<DaminiResponse> {
  const endpointUrl = `${EDGE_BASE}/damini-easemate`;

  if (!prompt.trim()) {
    const section = DDG_MODEL_IDS.has(modelId) ? 'duckduckgo' : 'ai-chat';
    await logAnalyticsEvent(section, 400, prompt);
    return buildErrorResponse(400, 'Prompt cannot be empty.', endpointUrl);
  }

  const isDDG = DDG_MODEL_IDS.has(modelId);
  const isOmega = OMEGA_MODEL_IDS.has(modelId);
  const section = isDDG ? 'duckduckgo' : 'ai-chat';

  console.log(`[Daminī Chat] model_id=${modelId}, prompt:`, prompt.slice(0, 80));

  const { data, error } = await supabase.functions.invoke('damini-easemate', {
    body: { prompt: prompt.trim(), model_id: modelId, image_url: imageUrl },
  });

  if (error) {
    const { message, code } = await readFunctionError(error);
    console.error('[Daminī Chat] error:', message);
    await logAnalyticsEvent(section, code, prompt);
    return buildErrorResponse(code, `Chat error: ${message}`, endpointUrl);
  }

  const result: string = data?.result || '';
  const model: string = data?.model || `Model ${modelId}`;

  if (!result) {
    await logAnalyticsEvent(section, 500, prompt);
    return buildErrorResponse(500, 'No content returned from AI engine.', endpointUrl);
  }

  await logAnalyticsEvent(section, 200, prompt);
  console.log('[Daminī Chat] Success via', model);
  return buildSuccessResponse(result, endpointUrl, { model });
}

// ─── AI IMAGE ─────────────────────────────────────────────────────────────────
export async function generateImage(prompt: string, engine: ImageEngine = 'nano-banana'): Promise<DaminiResponse> {
  const endpointUrl = `${EDGE_BASE}/damini-image`;

  if (!prompt.trim()) {
    await logAnalyticsEvent('ai-image', 400, prompt);
    return buildErrorResponse(400, 'Image prompt cannot be empty.', endpointUrl);
  }

  console.log('[Daminī AI Image] engine:', engine, 'prompt:', prompt.slice(0, 80));

  const { data, error } = await supabase.functions.invoke('damini-image', {
    body: { prompt: prompt.trim(), aspect_ratio: '1:1', engine },
  });

  if (error) {
    const { message, code } = await readFunctionError(error);
    console.error('[Daminī AI Image] error:', message);
    await logAnalyticsEvent('ai-image', code, prompt);
    return buildErrorResponse(code, `Image error: ${message}`, endpointUrl);
  }

  const outputUrl: string = data?.output_url || '';
  if (!outputUrl) {
    await logAnalyticsEvent('ai-image', 500, prompt);
    return buildErrorResponse(500, 'No output_url returned from image engine.', endpointUrl);
  }

  await logAnalyticsEvent('ai-image', 200, prompt);
  return buildSuccessResponse(outputUrl, endpointUrl, { engine: data?.source || engine });
}

// ─── MEDIA UPLOAD (vision) ────────────────────────────────────────────────────
export async function uploadFileForVision(file: File): Promise<{ url: string } | { error: string }> {
  const endpointUrl = `${EDGE_BASE}/damini-upload`;
  console.log('[Daminī Upload] Uploading file:', file.name);

  const formData = new FormData();
  formData.append('file', file);

  const { data, error } = await supabase.functions.invoke('damini-upload', {
    body: formData,
  });

  if (error) {
    const { message } = await readFunctionError(error);
    console.error('[Daminī Upload] error:', message);
    return { error: message };
  }

  if (!data?.url) {
    return { error: 'No URL returned from upload.' };
  }

  console.log('[Daminī Upload] Success:', data.url.slice(0, 80));
  return { url: data.url };
}

// ─── AI MUSIC (Suno V3) ───────────────────────────────────────────────────────
export async function generateMusic(prompt: string): Promise<{ response: DaminiResponse; suno: SunoResult | null }> {
  const endpointUrl = `${EDGE_BASE}/damini-suno`;

  if (!prompt.trim()) {
    await logAnalyticsEvent('ai-music', 400, prompt);
    return {
      response: buildErrorResponse(400, 'Music prompt cannot be empty.', endpointUrl),
      suno: null,
    };
  }

  console.log('[Daminī Suno] Generating music:', prompt.slice(0, 80));

  const { data, error } = await supabase.functions.invoke('damini-suno', {
    body: { prompt: prompt.trim() },
  });

  if (error) {
    const { message, code } = await readFunctionError(error);
    console.error('[Daminī Suno] error:', message);
    await logAnalyticsEvent('ai-music', code, prompt);
    return {
      response: buildErrorResponse(code, `Music error: ${message}`, endpointUrl),
      suno: null,
    };
  }

  const suno: SunoResult = {
    title: data?.title || 'Untitled',
    lyrics: data?.lyrics || '',
    thumbnail: data?.thumbnail || '',
    url: data?.url || '',
  };

  if (!suno.url && !suno.lyrics) {
    await logAnalyticsEvent('ai-music', 500, prompt);
    return {
      response: buildErrorResponse(500, 'No music data returned from Suno.', endpointUrl),
      suno: null,
    };
  }

  await logAnalyticsEvent('ai-music', 200, prompt);
  return {
    response: buildSuccessResponse(suno.title, endpointUrl, { audio_url: suno.url, thumbnail: suno.thumbnail }),
    suno,
  };
}

// Render backend base — kept in sync with the BACKEND_BASE constant in Index.tsx
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE ?? 'https://daminiapi-1.onrender.com';

// ─── GENERIC GET PROXY ────────────────────────────────────────────────────────
// Routes directly to the Render backend when the target URL lives there;
// falls back to the Supabase damini-proxy edge function for all other URLs.
export async function proxyGet(targetUrl: string): Promise<{ data: unknown; status: number }> {
  console.log('[Daminī Proxy] GET:', targetUrl.slice(0, 100));

  // ── Direct fetch for Render backend endpoints (CORS already enabled) ─────
  if (targetUrl.startsWith(BACKEND_BASE_URL)) {
    try {
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: { Accept: 'application/json, */*' },
      });
      const contentType = res.headers.get('content-type') ?? '';

      // Binary audio — return a stream_url wrapper
      if (contentType.includes('audio') || contentType.includes('octet-stream')) {
        return { data: { stream_url: targetUrl, content_type: contentType }, status: 200 };
      }

      const text = await res.text();
      let parsed: unknown;
      try { parsed = JSON.parse(text); } catch { parsed = { result: text, raw: true }; }

      if (!res.ok) return { data: parsed, status: res.status };
      return { data: parsed, status: 200 };
    } catch (err) {
      console.error('[Daminī Proxy] Direct fetch error:', err);
      return { data: { error: String(err) }, status: 500 };
    }
  }

  // ── Supabase edge function proxy for all other origins ────────────────────
  const { data, error } = await supabase.functions.invoke('damini-proxy', {
    body: { url: targetUrl },
  });

  if (error) {
    const { message, code } = await readFunctionError(error);
    console.error('[Daminī Proxy] error:', message);
    return { data: { error: message }, status: code };
  }

  if (data?.error) {
    return { data, status: 400 };
  }

  return { data, status: 200 };
}

// ─── MEDIA SCRAPER (TikWM) ────────────────────────────────────────────────────
export async function downloadMedia(url: string): Promise<{ response: DaminiResponse; media: MediaResult | null }> {
  const endpointUrl = `${EDGE_BASE}/damini-ttdl`;

  if (!url.trim()) {
    await logAnalyticsEvent('media-scraper', 400, url);
    return {
      response: buildErrorResponse(400, 'Media URL cannot be empty.', endpointUrl),
      media: null,
    };
  }

  console.log('[Daminī TTDL] url:', url.slice(0, 80));

  const { data, error } = await supabase.functions.invoke('damini-ttdl', {
    body: { url: url.trim() },
  });

  if (error) {
    const { message, code } = await readFunctionError(error);
    console.error('[Daminī TTDL] error:', message);
    await logAnalyticsEvent('media-scraper', code, url);
    return {
      response: buildErrorResponse(code, `TTDL error: ${message}`, endpointUrl),
      media: null,
    };
  }

  if (data?.error) {
    await logAnalyticsEvent('media-scraper', 400, url);
    return {
      response: buildErrorResponse(400, data.error, endpointUrl),
      media: null,
    };
  }

  const media: MediaResult = data as MediaResult;
  await logAnalyticsEvent('media-scraper', 200, url);
  console.log('[Daminī TTDL] Success, title:', media.title?.slice(0, 60));

  return {
    response: buildSuccessResponse(media.download_url, endpointUrl, {
      title: media.title,
      author: media.author,
      duration: media.duration,
    }),
    media,
  };
}
