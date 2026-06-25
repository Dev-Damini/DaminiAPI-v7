/**
 * Daminī API — Backend Proxy Layer
 * Node.js / Express server that silently bridges upstream scraped sources.
 * All upstream identities are hidden from the client at all times.
 */

const express = require('express');
const cors    = require('cors');
const axios   = require('axios');

const app = express();

app.use(cors());
app.use(express.json());

// ─── Hidden Upstream Sources ──────────────────────────────────────────────────
const SOURCE_OMEGA = 'https://omegatech-api.dixonomega.tech';
const SOURCE_CYRIL = 'https://apis.davidcyril.name.ng';

// Shared axios config
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const axiosOpts = { timeout: 25000, headers: { 'User-Agent': UA, Accept: 'application/json, */*' } };

// ─── Ultimate Zero-Leak Ironclad Firewall ────────────────────────────────────
function scrubAndSanitise(inputData, fallbackMessage = 'Engine operational exception') {
  if (!inputData) return { success: false, error: fallbackMessage };

  let serialized = '';
  if (typeof inputData === 'object') {
    try { serialized = JSON.stringify(inputData); } catch (e) { serialized = String(inputData); }
  } else {
    serialized = String(inputData);
  }

  // Block raw HTML responses entirely
  if (serialized.trim().startsWith('<') || serialized.includes('<!DOCTYPE html>') || serialized.includes('<html')) {
    return {
      success: false,
      status: 502,
      error: fallbackMessage,
      provider: 'Daminī API Engine',
      owner: 'Dev Daminī',
    };
  }

  // Strip ALL third-party traces
  serialized = serialized
    .replace(/OMEGATECH/gi, 'Daminī API Engine')
    .replace(/@Omegatech-01/gi, '@DaminiCodesphere')
    .replace(/OmegaTech API/gi, 'Daminī API Engine')
    .replace(/David Cyril/gi, 'Dev Daminī')
    .replace(/davidcyril/gi, 'daminicodesphere')
    .replace(/dixonomega/gi, 'daminicodesphere')
    .replace(/omegatech-api/gi, 'damini-api')
    .replace(/apis\.daminicodesphere\.name\.ng/gi, 'api.damini.dev')
    .replace(/onspace/gi, 'Daminī Cloud')
    .replace(/supabase/gi, 'Daminī Cloud')
    .replace(/mxcbspvyqeckbkbomxcb\.backend\.[^\s"']*/gi, 'api.damini.dev');

  try {
    const parsed = JSON.parse(serialized);

    if (parsed.error && (String(parsed.error).includes('<') || String(parsed.error).includes('404'))) {
      parsed.error = fallbackMessage;
    }
    if (parsed.response_data?.result && String(parsed.response_data.result).includes('<')) {
      parsed.response_data.result = fallbackMessage;
    }

    return parsed;
  } catch {
    if (serialized.includes('error') || serialized.includes('failed')) {
      return { success: false, error: fallbackMessage };
    }
    return { success: true, result: serialized };
  }
}

function sendCleanError(res, err, defaultMsg) {
  const status = err.response?.status || 500;
  const rawData = err.response?.data;

  if (rawData) return res.status(status).json(scrubAndSanitise(rawData, defaultMsg));

  res.status(status).json({
    success: false,
    status,
    error: defaultMsg,
    provider: 'Daminī API Engine',
    owner: 'Dev Daminī',
  });
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Daminī Proxy Layer',
    developer: 'Dev Daminī',
    endpoints: 36,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//   CATEGORY 1 — AUDIO & TTS LAYER
// ═══════════════════════════════════════════════════════════════════════════════

// 1. Standard Gemini TTS
app.get('/api/ai/tts', async (req, res) => {
  try {
    const text = req.query.text || req.query.q || '';
    const upstream = await axios.get(`${SOURCE_OMEGA}/api/ai/Gemini-tts`, {
      ...axiosOpts,
      params: { text },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'TTS Generation engine down'));
  } catch (err) {
    sendCleanError(res, err, 'TTS Generation engine down');
  }
});

// 2. Premium Multi-Voice TTS V3
app.get('/api/ai/text2speech-v3', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_OMEGA}/api/ai/text2speech-v3`, {
      ...axiosOpts,
      params: req.query,
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Premium Voice Engine disconnected'));
  } catch (err) {
    sendCleanError(res, err, 'Premium Voice Engine disconnected');
  }
});

// 3. Spotify Search Index
app.get('/api/Search/Spotify', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_OMEGA}/api/Search/Spotify`, {
      ...axiosOpts,
      params: req.query,
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Search index unreachable'));
  } catch (err) {
    sendCleanError(res, err, 'Search index unreachable');
  }
});

// 4. SoundCloud Search
app.get('/api/Search/soundcloud', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_OMEGA}/api/Search/soundcloud`, {
      ...axiosOpts,
      params: req.query,
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'SoundCloud bridge failure'));
  } catch (err) {
    sendCleanError(res, err, 'SoundCloud bridge failure');
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//   CATEGORY 2 — ADVANCED RESEARCH, CHAT & AGENTS
// ═══════════════════════════════════════════════════════════════════════════════

// 5. WebPilot Dynamic Web Research
app.get('/api/ai/Ai-research', async (req, res) => {
  try {
    // Accept ?message=, ?query=, ?q=, or ?text= interchangeably
    const queryTerm = req.query.message || req.query.query || req.query.q || req.query.text || '';
    const upstream = await axios.get(`${SOURCE_CYRIL}/ai/webpilot`, {
      ...axiosOpts,
      params: { query: queryTerm },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'WebPilot research engine node down'));
  } catch (err) {
    sendCleanError(res, err, 'WebPilot research engine node down');
  }
});

// 6. Blackbox Intelligence Core
app.get('/blackbox', async (req, res) => {
  try {
    const queryTerm = req.query.q || req.query.query || req.query.text || '';
    const upstream = await axios.get(`${SOURCE_CYRIL}/ai/blackbox`, {
      ...axiosOpts,
      params: { text: queryTerm },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Computational stream parsing crash'));
  } catch (err) {
    sendCleanError(res, err, 'Computational stream parsing crash');
  }
});

// 7. Llama Meta AI
app.get('/metaai', async (req, res) => {
  try {
    const queryTerm = req.query.q || req.query.query || req.query.text || '';
    const upstream = await axios.get(`${SOURCE_CYRIL}/ai/metaai`, {
      ...axiosOpts,
      params: { text: queryTerm },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Core LLM instance handling fault'));
  } catch (err) {
    sendCleanError(res, err, 'Core LLM instance handling fault');
  }
});

// 8. Perplexity Conversational Search
app.get('/perplexity', async (req, res) => {
  try {
    const queryTerm = req.query.q || req.query.query || req.query.text || '';
    const upstream = await axios.get(`${SOURCE_CYRIL}/ai/perplexity`, {
      ...axiosOpts,
      params: { text: queryTerm },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Search optimization parsing crash'));
  } catch (err) {
    sendCleanError(res, err, 'Search optimization parsing crash');
  }
});

// 9. Writecream AI Text Engine (text/chat mode)
app.get('/api/ai/writecream', async (req, res) => {
  try {
    const textPrompt = req.query.text || req.query.prompt || req.query.q || '';
    const upstream = await axios.get(`${SOURCE_CYRIL}/ai/writecream`, {
      ...axiosOpts,
      params: { text: textPrompt },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Writecream text engine error'));
  } catch (err) {
    sendCleanError(res, err, 'Writecream text engine error');
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//   CATEGORY 3 — MUSIC & IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

// 10. Suno Track Engine
app.get('/api/ai/suno', async (req, res) => {
  try {
    const params = {
      query: req.query.prompt || req.query.q || '',
      model: req.query.model || 'chirp-v3-5',
    };
    const upstream = await axios.get(`${SOURCE_CYRIL}/ai/suno`, { ...axiosOpts, params });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Suno track generation failure'));
  } catch (err) {
    sendCleanError(res, err, 'Suno track generation failure');
  }
});

// 11. Mubert Ambient Music Composer
app.get('/mubert', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_CYRIL}/mubert`, { ...axiosOpts, params: req.query });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Audio composition node down'));
  } catch (err) {
    sendCleanError(res, err, 'Audio composition node down');
  }
});

// 12. Flux Pro Image Generator (via Cyril)
app.get('/api/ai/damini-image', async (req, res) => {
  try {
    const imagePrompt = req.query.prompt || req.query.q || '';
    const upstream = await axios.get(`${SOURCE_CYRIL}/ai/fluxpro`, {
      timeout: 28000,
      headers: { 'User-Agent': UA, Accept: 'application/json, */*' },
      params: { text: imagePrompt },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Flux Pro engine connection dropped'));
  } catch (err) {
    sendCleanError(res, err, 'Flux Pro engine connection dropped');
  }
});

// 13. Animagine Image Generator
app.get('/api/ai/animagine', async (req, res) => {
  try {
    const prompt = req.query.prompt || req.query.q || '';
    const upstream = await axios.get(`${SOURCE_CYRIL}/animagine`, {
      ...axiosOpts,
      params: { prompt },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Animagine render engine error'));
  } catch (err) {
    sendCleanError(res, err, 'Animagine render engine error');
  }
});

// 14. Flux V2 Image Generator
app.get('/api/ai/fluxv2', async (req, res) => {
  try {
    const prompt = req.query.prompt || req.query.q || '';
    const upstream = await axios.get(`${SOURCE_CYRIL}/fluxv2`, {
      ...axiosOpts,
      params: { prompt },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Flux V2 engine connection dropped'));
  } catch (err) {
    sendCleanError(res, err, 'Flux V2 engine connection dropped');
  }
});

// 15. Writecream Image Generator (image mode — separate from text mode)
app.get('/api/ai/writecream-image', async (req, res) => {
  try {
    const prompt = req.query.prompt || req.query.q || '';
    const ratio  = req.query.ratio  || '1:1';
    const upstream = await axios.get(`${SOURCE_CYRIL}/ai/writecream/image`, {
      ...axiosOpts,
      params: { prompt, ratio },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Writecream image canvas error'));
  } catch (err) {
    sendCleanError(res, err, 'Writecream image canvas error');
  }
});

// 16. Fake Tweet Render Pipeline
app.get('/api/Maker/fake-tweet', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_OMEGA}/api/Maker/fake-tweet`, {
      ...axiosOpts,
      params: req.query,
    });

    if (upstream.data && (upstream.data.status === false || upstream.data.error)) {
      return res.status(200).json({
        statusCode: 200,
        status: false,
        error: 'Failed to generate fake tweet image.',
        credit: 'Daminī API Engine',
        timestamp: new Date().toISOString(),
        attribution: '@DaminiCodesphere',
      });
    }

    res.status(200).json(scrubAndSanitise(upstream.data, 'Graphic render buffer mismatch'));
  } catch (err) {
    sendCleanError(res, err, 'Graphic render buffer mismatch');
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//   CATEGORY 4 — ANIME EXTRACTOR AGENTS
// ═══════════════════════════════════════════════════════════════════════════════

// 17. Anime Schedule
app.get('/anime-schedule', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_CYRIL}/anime/schedule`, {
      ...axiosOpts,
      params: req.query,
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Schedule parsing timeout'));
  } catch (err) {
    sendCleanError(res, err, 'Schedule parsing timeout');
  }
});

// 18. Anime Character Database
app.get('/anime-character', async (req, res) => {
  try {
    // Accept ?name= or ?q= from frontend
    const name = req.query.name || req.query.q || req.query.query || '';
    const upstream = await axios.get(`${SOURCE_CYRIL}/anime/characters`, {
      ...axiosOpts,
      params: { name },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Character registry query fault'));
  } catch (err) {
    sendCleanError(res, err, 'Character registry query fault');
  }
});

// 19. Anime Series Catalog Search
app.get('/anime', async (req, res) => {
  try {
    // Accept ?name= or ?q= from frontend
    const q = req.query.name || req.query.q || req.query.query || '';
    const upstream = await axios.get(`${SOURCE_CYRIL}/anime/search`, {
      ...axiosOpts,
      params: { q },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Catalog engine lookup failure'));
  } catch (err) {
    sendCleanError(res, err, 'Catalog engine lookup failure');
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//   CATEGORY 5 — MEDIA DOWNLOADER LAYER
// ═══════════════════════════════════════════════════════════════════════════════

// 20. Facebook Downloader V1
app.get('/api/download/facebook', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_CYRIL}/facebook`, {
      ...axiosOpts,
      params: { url: req.query.url || '' },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Facebook extraction pipeline fault'));
  } catch (err) {
    sendCleanError(res, err, 'Facebook extraction pipeline fault');
  }
});

// 21. Facebook Downloader V2
app.get('/api/download/facebook2', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_CYRIL}/facebook2`, {
      ...axiosOpts,
      params: { url: req.query.url || '' },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Facebook V2 extraction fault'));
  } catch (err) {
    sendCleanError(res, err, 'Facebook V2 extraction fault');
  }
});

// 22. Instagram Downloader
app.get('/api/download/instagram', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_CYRIL}/instagram`, {
      ...axiosOpts,
      params: { url: req.query.url || '' },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Instagram media extraction fault'));
  } catch (err) {
    sendCleanError(res, err, 'Instagram media extraction fault');
  }
});

// 23. Mediafire Downloader
app.get('/api/download/mediafire', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_CYRIL}/mediafire`, {
      ...axiosOpts,
      params: { url: req.query.url || '' },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Mediafire link resolution fault'));
  } catch (err) {
    sendCleanError(res, err, 'Mediafire link resolution fault');
  }
});

// 24. Pinterest Downloader
app.get('/api/download/pinterest', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_CYRIL}/download/pinterest`, {
      ...axiosOpts,
      params: { url: req.query.url || '' },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Pinterest asset extraction fault'));
  } catch (err) {
    sendCleanError(res, err, 'Pinterest asset extraction fault');
  }
});

// 25. TikTok Downloader V2
app.get('/api/download/tiktokv2', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_CYRIL}/download/tiktokv2`, {
      ...axiosOpts,
      params: { url: req.query.url || '' },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'TikTok V2 extraction fault'));
  } catch (err) {
    sendCleanError(res, err, 'TikTok V2 extraction fault');
  }
});

// 26. Twitter/X Downloader
app.get('/api/download/twitter', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_CYRIL}/twitter`, {
      ...axiosOpts,
      params: { url: req.query.url || '' },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'Twitter media extraction fault'));
  } catch (err) {
    sendCleanError(res, err, 'Twitter media extraction fault');
  }
});

// 27. YouTube Downloader V3
app.get('/api/download/ytv3', async (req, res) => {
  try {
    const upstream = await axios.get(`${SOURCE_CYRIL}/download/ytv3`, {
      ...axiosOpts,
      params: { url: req.query.url || '' },
    });
    res.status(200).json(scrubAndSanitise(upstream.data, 'YouTube V3 extraction fault'));
  } catch (err) {
    sendCleanError(res, err, 'YouTube V3 extraction fault');
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//   CATEGORY 6 — INTERACTIVE & FUN ENGINES
// ═══════════════════════════════════════════════════════════════════════════════

['/truth', '/pickupline', '/fact', '/dare'].forEach((route) => {
  app.get(route, async (req, res) => {
    const routeName = route.replace('/', '');
    try {
      const upstream = await axios.get(`${SOURCE_CYRIL}${route}`, axiosOpts);
      res.status(200).json(scrubAndSanitise(upstream.data, `${routeName} engine error`));
    } catch (err) {
      sendCleanError(res, err, `${routeName} engine error`);
    }
  });
});

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    error: 'Route not found on proxy layer',
    provider: 'Daminī API Engine',
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[Daminī Proxy] Active on port ${PORT}`));
