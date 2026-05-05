import OpenAI from "openai";

const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const defaultModel = process.env.OPENROUTER_DEFAULT_MODEL ?? "anthropic/claude-3.5-sonnet";

if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY is not set in environment variables");
}

export const openrouter = new OpenAI({
  apiKey,
  baseURL,
  defaultHeaders: {
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_SITE_NAME ?? "Team Akhil",
  },
  timeout: 30_000,
});

export const DEFAULT_MODEL = defaultModel;

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 2048 } = options;

  const response = await openrouter.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature,
    max_tokens: maxTokens,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenRouter");
  }

  return content;
}

export async function generateJSON<T = unknown>(
  prompt: string,
  options: GenerateOptions = {}
): Promise<T> {
  const text = await generateText(prompt, { ...options, temperature: 0.3 });
  // Strip markdown code blocks if present
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned) as T;
}
