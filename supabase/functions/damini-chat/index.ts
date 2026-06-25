import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      console.error('[damini-chat] Missing ONSPACE_AI_API_KEY or ONSPACE_AI_BASE_URL');
      return new Response(
        JSON.stringify({ error: 'OnSpace AI not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[damini-chat] Sending prompt to OnSpace AI:', prompt.slice(0, 100));

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a powerful AI assistant built into the Daminī API platform by Damini Codesphere. Be helpful, concise, and accurate.',
          },
          {
            role: 'user',
            content: prompt.trim(),
          },
        ],
      }),
    });

    console.log('[damini-chat] OnSpace AI status:', response.status);

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      console.error('[damini-chat] OnSpace AI error:', response.status, errText);
      return new Response(
        JSON.stringify({ error: `OnSpace AI error ${response.status}: ${errText}` }),
        { status: response.status >= 500 ? 502 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const result: string = data?.choices?.[0]?.message?.content ?? '';

    if (!result) {
      console.error('[damini-chat] No content in OnSpace AI response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'No content returned from AI engine.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[damini-chat] Success, result length:', result.length);

    return new Response(
      JSON.stringify({ result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[damini-chat] Fatal error:', err);
    return new Response(
      JSON.stringify({ error: `Internal error: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
