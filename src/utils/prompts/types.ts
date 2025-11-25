export type PromptMode = 'system' | 'legacy';

export type PromptIntent = 'generate' | 'regenerate';

export interface PromptPayload {
  userPrompt: string;
  systemPrompt?: string;
}

