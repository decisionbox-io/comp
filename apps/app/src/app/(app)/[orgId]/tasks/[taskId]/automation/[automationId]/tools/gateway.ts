import { createOpenAI } from '@ai-sdk/openai';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import type { LanguageModelV3 } from '@ai-sdk/provider';
import type { JSONValue } from 'ai';

export async function getAvailableModels() {
  // Self-hosted: all models are served by the Bedrock-backed LiteLLM proxy.
  return [{ id: 'anthropic/claude-opus-4-8', name: 'Claude Opus 4.8 (Bedrock)' }];
}

export interface ModelOptions {
  model: LanguageModelV3;
  providerOptions?: Record<string, Record<string, JSONValue>>;
  headers?: Record<string, string>;
}

export function getModelOptions(
  modelId: string,
  options?: { reasoningEffort?: 'minimal' | 'low' | 'medium' },
): ModelOptions {
  const gateway = gatewayInstance();

  return {
    model: gateway(modelId),
    providerOptions: {
      openai: {
        include: ['reasoning.encrypted_content'],
        reasoningEffort: options?.reasoningEffort ?? 'low',
        reasoningSummary: 'auto',
        serviceTier: 'priority',
      } satisfies OpenAIResponsesProviderOptions,
    },
  };
}

function gatewayInstance() {
  return ((p) => (id: string) => p.chat(id))(createOpenAI({ baseURL: process.env.OPENAI_BASE_URL, apiKey: process.env.OPENAI_API_KEY }));
}
