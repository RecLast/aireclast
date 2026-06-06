/**
 * API key storage and validation via KV
 */

const USER_API_KEY_PREFIX = 'user:';
const API_KEY_LOOKUP_PREFIX = 'apikey:';

function userApiKeyKey(email: string): string {
  return `${USER_API_KEY_PREFIX}${email}:apikey`;
}

function apiKeyLookupKey(apiKey: string): string {
  return `${API_KEY_LOOKUP_PREFIX}${apiKey}`;
}

export function generateApiKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const randomPart = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `reclast_${randomPart}`;
}

export async function storeApiKey(email: string, apiKey: string, env: { AUTH_STORE: KVNamespace }): Promise<void> {
  const existingKey = await env.AUTH_STORE.get(userApiKeyKey(email));

  if (existingKey && existingKey !== apiKey) {
    await env.AUTH_STORE.delete(apiKeyLookupKey(existingKey));
  }

  await env.AUTH_STORE.put(userApiKeyKey(email), apiKey);
  await env.AUTH_STORE.put(apiKeyLookupKey(apiKey), email);
}

export async function getApiKeyForUser(email: string, env: { AUTH_STORE: KVNamespace }): Promise<string | null> {
  return env.AUTH_STORE.get(userApiKeyKey(email));
}

export async function validateApiKey(apiKey: string, env: { AUTH_STORE: KVNamespace }): Promise<string | null> {
  if (!apiKey.startsWith('reclast_')) {
    return null;
  }

  return env.AUTH_STORE.get(apiKeyLookupKey(apiKey));
}

export async function regenerateApiKey(email: string, env: { AUTH_STORE: KVNamespace }): Promise<string> {
  const apiKey = generateApiKey();
  await storeApiKey(email, apiKey, env);
  return apiKey;
}
