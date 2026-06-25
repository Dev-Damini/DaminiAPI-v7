import { corsHeaders } from '../_shared/cors.ts';

const OMEGATECH_BASE = 'https://omegatech-api.dixonomega.tech/api';

// ─── OnSpace AI model registry ────────────────────────────────────────────────
const ONSPACE_MODELS: Record<number, { modelId: string; label: string }> = {
  1: { modelId: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
  2: { modelId: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  3: { modelId: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro' },
  4: { modelId: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
};

// ─── DuckDuckGo model registry ────────────────────────────────────────────────
const DDG_MODELS: Record<number, { ddgModel: string; label: string }> = {
  5: { ddgModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B (DDG)' },
  6: { ddgModel: 'mistralai/Mistral-Small-24B-Instruct-2501', label: 'Mixtral (DDG)' },
};

// ─── OmegaTech model registry ────────────────────────────────────────────────
const OMEGA_MODELS: Record<number, { type: 'claude-pro' | 'standard-claude' | 'tools'; model?: string; label: string }> = {
  7: { type: 'claude-pro', model: 'claude-pro', label: 'Claude Pro' },
  8: { type: 'claude-pro', model: 'deepseek-v3.2', label: 'DeepSeek V3.2' },
  9: { type: 'standard-claude', label: 'Standard Claude AI' },
  10: { type: 'tools', label: 'Tools AI Agent' },
};

// ─── DuckDuckGo handler ───────────────────────────────────────────────────────
async function runDuckDuckGo(prompt: string, ddgModel: string, label: string): Promise<Response> {
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  const statusRes = await fetch('https://duckduckgo.com/duckchat/v1/status', {
    method: 'GET',
    headers: {
      'x-vqd-accept': '1',
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://duckduckgo.com/',
      'Origin': 'https://duckduckgo.com',
    },
  });

  const vqdToken = statusRes.headers.get('x-vqd-4');
  if (!vqdToken) {
    return new Response(
      JSON.stringify({ error: 'DuckDuckGo: Failed to obtain session token.' }),
      { status: 502, headers: jsonHeaders },
    );
  }

  const chatRes = await fetch('https://duckduckgo.com/duckchat/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-vqd-4': vqdToken,
      'Accept': 'text/event-stream',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://duckduckgo.com/',
      'Origin': 'https://duckduckgo.com',
    },
    body: JSON.stringify({ model: ddgModel, messages: [{ role: 'user', content: prompt.trim() }] }),
  });

  if (!chatRes.ok) {
    const errText = await chatRes.text().catch(() => chatRes.statusText);
    return new Response(
      JSON.stringify({ error: `DDG chat error ${chatRes.status}: ${errText}` }),
      { status: chatRes.status >= 500 ? 502 : 400, headers: jsonHeaders },
    );
  }

  const rawText = await chatRes.text();
  let result = '';
  for (const line of rawText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const jsonStr = trimmed.slice(5).trim();
    if (jsonStr === '[DONE]') break;
    try {
      const chunk = JSON.parse(jsonStr);
      result += chunk?.choices?.[0]?.delta?.content ?? chunk?.message ?? '';
    } catch { /* skip malformed */ }
  }

  result = result.trim();
  if (!result) {
    return new Response(
      JSON.stringify({ error: 'DuckDuckGo returned an empty response.' }),
      { status: 502, headers: jsonHeaders },
    );
  }

  return new Response(JSON.stringify({ result, model: label }), { status: 200, headers: jsonHeaders });
}

// ─── OmegaTech handler ────────────────────────────────────────────────────────
async function runOmegaTech(
  prompt: string,
  modelEntry: { type: 'claude-pro' | 'standard-claude' | 'tools'; model?: string; label: string },
  imageUrl?: string,
): Promise<Response> {
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
  const encoded = encodeURIComponent(prompt.trim());

  let url: string;
  let resultKey: string;

  switch (modelEntry.type) {
    case 'claude-pro': {
      const action = imageUrl ? 'upload' : 'chat';
      const modelParam = imageUrl ? 'deepseek-v3.2' : (modelEntry.model ?? 'claude-pro');
      url = `${OMEGATECH_BASE}/ai/Claude-pro?action=${action}&model=${encodeURIComponent(modelParam)}&prompt=${encoded}&chatStyle=chat&tools=none&size=portrait&version=hd&clearSession=true`;
      if (imageUrl) url += `&url=${encodeURIComponent(imageUrl)}`;
      resultKey = 'response';
      break;
    }
    case 'standard-claude':
      url = `${OMEGATECH_BASE}/ai/Claude?text=${encoded}`;
      resultKey = 'result';
      break;
    case 'tools':
      url = `${OMEGATECH_BASE}/ai/Tools?text=${encoded}`;
      resultKey = 'result';
      break;
  }

  console.log('[damini-easemate][OmegaTech]', modelEntry.label, url.slice(0, 120));

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    console.error('[damini-easemate][OmegaTech] error:', res.status, errText.slice(0, 200));
    return new Response(
      JSON.stringify({ error: `${modelEntry.label} error ${res.status}: ${errText}` }),
      { status: res.status >= 500 ? 502 : 400, headers: jsonHeaders },
    );
  }

  const data = await res.json();
  console.log('[damini-easemate][OmegaTech] keys:', Object.keys(data));

  const result: string = data?.[resultKey] ?? data?.response ?? data?.result ?? '';
  if (!result) {
    console.error('[damini-easemate][OmegaTech] No result key. Raw:', JSON.stringify(data).slice(0, 300));
    return new Response(
      JSON.stringify({ error: `No response text from ${modelEntry.label}.` }),
      { status: 502, headers: jsonHeaders },
    );
  }

  return new Response(JSON.stringify({ result, model: modelEntry.label }), { status: 200, headers: jsonHeaders });
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { prompt, model_id = 2, image_url } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const numId = Number(model_id);

    // ── DuckDuckGo route ──
    if (numId in DDG_MODELS) {
      const { ddgModel, label } = DDG_MODELS[numId];
      return await runDuckDuckGo(prompt, ddgModel, label);
    }

    // ── OmegaTech route ──
    if (numId in OMEGA_MODELS) {
      return await runOmegaTech(prompt, OMEGA_MODELS[numId], image_url);
    }

    // ── OnSpace AI route ──
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({ error: 'AI backend not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const model = ONSPACE_MODELS[numId] ?? ONSPACE_MODELS[2];
    console.log(`[damini-easemate] model=${model.modelId}, prompt:`, prompt.slice(0, 100));

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model.modelId,
        messages: [
          { role: 'system', content: 'You are a powerful AI assistant built into the Daminī API platform by Damini Codesphere. Be helpful, concise, and accurate.' },
          { role: 'user', content: prompt.trim() },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      return new Response(
        JSON.stringify({ error: `AI error ${response.status}: ${errText}` }),
        { status: response.status >= 500 ? 502 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await response.json();
    const result: string = data?.choices?.[0]?.message?.content ?? '';

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'No content returned from AI model.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ result, model: model.label }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[damini-easemate] Fatal:', err);
    return new Response(
      JSON.stringify({ error: `Internal error: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
