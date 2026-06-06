/**
 * Workers AI input helpers
 */

export const MAX_PROMPT_LENGTH = 8192;
export const MAX_IMAGE_PROMPT_LENGTH = 2000;
export const MAX_OUTPUT_TOKENS = 2048;

interface TextRunOptions {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export function validatePromptLength(
  prompt: string,
  maxLength: number = MAX_PROMPT_LENGTH
): string | null {
  if (prompt.length > maxLength) {
    return `Prompt must be at most ${maxLength} characters`;
  }
  return null;
}

export function buildTextRunInput(prompt: string, options: TextRunOptions = {}) {
  const max_tokens = Math.min(
    Math.max(options.max_tokens ?? 1024, 1),
    MAX_OUTPUT_TOKENS
  );
  const temperature = Math.min(Math.max(options.temperature ?? 0.7, 0), 2);
  const top_p =
    options.top_p !== undefined
      ? Math.min(Math.max(options.top_p, 0), 1)
      : undefined;

  return {
    messages: [{ role: 'user', content: prompt }],
    max_tokens,
    temperature,
    ...(top_p !== undefined ? { top_p } : {}),
  };
}

export function extractTextResponse(result: unknown): string {
  if (typeof result === 'string') {
    return result;
  }

  if (result && typeof result === 'object') {
    const record = result as Record<string, unknown>;

    if (typeof record.response === 'string') {
      return record.response;
    }

    if (typeof record.text === 'string') {
      return record.text;
    }

    const choices = record.choices;
    if (Array.isArray(choices) && choices[0] && typeof choices[0] === 'object') {
      const message = (choices[0] as Record<string, unknown>).message;
      if (message && typeof message === 'object' && typeof (message as Record<string, unknown>).content === 'string') {
        return (message as Record<string, string>).content;
      }
    }
  }

  return JSON.stringify(result);
}
