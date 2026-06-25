export type SectionType = 'ai-chat' | 'ai-image' | 'tempmail' | 'media-scraper' | 'duckduckgo' | 'ai-music';

export type StatusCode = 200 | 400 | 500;

export interface DaminiResponse {
  status: number;
  success: boolean;
  provider: string;
  owner: string;
  professional_title: string;
  organization: string;
  contact: string;
  endpoint_url: string;
  response_data: {
    result: string;
    [key: string]: unknown;
  };
}

export interface AnalyticsRecord {
  id: string;
  endpoint_type: SectionType;
  http_status_code: StatusCode;
  user_prompt: string;
  created_at: string;
}

export interface AnalyticsStats {
  total_requests: number;
  success_rate: number;
  total_success: number;
  total_errors: number;
}

export interface TempMailbox {
  address: string;
  token: string;
  created_at: number;
  messages: TempMailMessage[];
}

export interface TempMailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  received_at: number;
  raw_id?: string;
}

export interface MediaResult {
  title: string;
  author: string;
  cover: string;
  duration: number;
  play_count: number;
  digg_count: number;
  comment_count: number;
  download_url: string;
  hd_download_url: string;
  music_title: string;
  music_author: string;
  music_url: string;
  images: string[];
}

export interface SunoResult {
  title: string;
  lyrics: string;
  thumbnail: string;
  url: string;
}

export interface EaseMateModel {
  id: number;
  label: string;
  description: string;
  group: 'gemini' | 'ddg' | 'omega';
}

export const EASEMATE_MODELS: EaseMateModel[] = [
  { id: 1, label: 'Gemini 2.5 Flash Lite', description: 'Fastest — great for simple tasks', group: 'gemini' },
  { id: 2, label: 'Gemini 3 Flash', description: 'Fast frontier intelligence — recommended', group: 'gemini' },
  { id: 3, label: 'Gemini 3 Pro', description: 'Maximum reasoning & accuracy', group: 'gemini' },
  { id: 4, label: 'GPT-5 Mini', description: 'Balanced speed and quality', group: 'gemini' },
  { id: 5, label: 'Llama 3.3 70B', description: 'Meta Llama via DuckDuckGo — private', group: 'ddg' },
  { id: 6, label: 'Mixtral 24B', description: 'Mistral via DuckDuckGo — fast', group: 'ddg' },
  { id: 7, label: 'Claude Pro', description: 'Anthropic Claude Pro — premium reasoning', group: 'omega' },
  { id: 8, label: 'DeepSeek V3.2', description: 'DeepSeek — deep analytical intelligence', group: 'omega' },
  { id: 9, label: 'Standard Claude', description: 'Anthropic Claude standard tier', group: 'omega' },
  { id: 10, label: 'Tools AI Agent', description: 'Agentic tools-enabled AI model', group: 'omega' },
];

export const IMAGE_ENGINES = [
  { id: 'nano-banana', label: 'Nano Banana', description: 'Pixelbin — fast creative generation' },
  { id: 'flux-pro', label: 'Flux Pro', description: 'Flux — high-fidelity professional images' },
] as const;

export type ImageEngine = typeof IMAGE_ENGINES[number]['id'];
