/**
 * KV-backed fixed-window rate limiting
 */
import { errorResponse } from './response';

export function getClientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function checkRateLimit(
  env: { AUTH_STORE: KVNamespace },
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const recordKey = `ratelimit:${key}:${windowStart}`;

  const current = await env.AUTH_STORE.get(recordKey);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= limit) {
    return {
      allowed: false,
      retryAfter: windowSeconds - (now % windowSeconds),
    };
  }

  await env.AUTH_STORE.put(recordKey, String(count + 1), {
    expirationTtl: windowSeconds * 2,
  });

  return { allowed: true };
}

export function rateLimitResponse(retryAfter?: number): Response {
  const headers: Record<string, string> = {};
  if (retryAfter !== undefined) {
    headers['Retry-After'] = String(retryAfter);
  }

  const response = errorResponse('Too many requests. Please try again later.', 429);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function enforceAuthRateLimit(
  request: Request,
  env: { AUTH_STORE: KVNamespace },
  action: 'login' | 'check-email'
): Promise<Response | null> {
  const limits = {
    login: { limit: 10, windowSeconds: 900 },
    'check-email': { limit: 20, windowSeconds: 900 },
  } as const;

  const { limit, windowSeconds } = limits[action];
  const ip = getClientIp(request);
  const result = await checkRateLimit(env, `auth:${action}:${ip}`, limit, windowSeconds);

  if (!result.allowed) {
    return rateLimitResponse(result.retryAfter);
  }

  return null;
}

export async function enforceAiRateLimit(
  request: Request,
  env: { AUTH_STORE: KVNamespace },
  userKey: string
): Promise<Response | null> {
  const result = await checkRateLimit(env, `ai:${userKey}`, 60, 3600);

  if (!result.allowed) {
    return rateLimitResponse(result.retryAfter);
  }

  return null;
}
