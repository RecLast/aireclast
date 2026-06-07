/**
 * Image generation queue — load balancing during high demand
 */
import { Env, ImageGenerationRequest } from '../types';

const MAX_CONCURRENT = 2;
const TOKEN_TTL_SECONDS = 300;
const BASE_WAIT_SECONDS = 8;
const POSITION_WAIT_SECONDS = 3;
const CADENCE_MIN = 3;
const CADENCE_MAX = 5;

export interface ImageQueuePayload {
  email: string;
  prompt: string;
  model: string;
  width: number;
  height: number;
  steps: number;
  confirmPremium: boolean;
  waitUntil: number;
  position: number;
}

export interface ImageQueueTicket {
  queueToken: string;
  position: number;
  waitSeconds: number;
  message: string;
}

export interface ImageQueueStatus {
  status: 'waiting' | 'ready' | 'not_found' | 'forbidden';
  position?: number;
  remainingSeconds?: number;
  waitSeconds?: number;
}

interface UserQueueMeta {
  generationCount: number;
  nextQueueAfter: number;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function globalActiveKey(): string {
  return 'imgqueue:global:active';
}

function userMetaKey(email: string): string {
  return `imgqueue:user:${email}:meta`;
}

function tokenKey(token: string): string {
  return `imgqueue:token:${token}`;
}

async function getGlobalActive(env: Env): Promise<number> {
  const value = await env.AUTH_STORE.get(globalActiveKey());
  return value ? parseInt(value, 10) : 0;
}

export async function acquireGlobalSlot(env: Env): Promise<void> {
  const active = await getGlobalActive(env);
  await env.AUTH_STORE.put(globalActiveKey(), String(active + 1), {
    expirationTtl: 120,
  });
}

export async function releaseGlobalSlot(env: Env): Promise<void> {
  const active = await getGlobalActive(env);
  const next = Math.max(0, active - 1);
  await env.AUTH_STORE.put(globalActiveKey(), String(next), {
    expirationTtl: 120,
  });
}

async function getUserMeta(env: Env, email: string): Promise<UserQueueMeta> {
  const raw = await env.AUTH_STORE.get(userMetaKey(email));
  if (!raw) {
    return {
      generationCount: 0,
      nextQueueAfter: randomInt(CADENCE_MIN, CADENCE_MAX),
    };
  }

  try {
    return JSON.parse(raw) as UserQueueMeta;
  } catch {
    return {
      generationCount: 0,
      nextQueueAfter: randomInt(CADENCE_MIN, CADENCE_MAX),
    };
  }
}

async function saveUserMeta(env: Env, email: string, meta: UserQueueMeta): Promise<void> {
  await env.AUTH_STORE.put(userMetaKey(email), JSON.stringify(meta), {
    expirationTtl: 86400,
  });
}

async function recordGenerationAttempt(env: Env, email: string): Promise<boolean> {
  const meta = await getUserMeta(env, email);
  meta.generationCount += 1;
  const cadenceReached = meta.generationCount >= meta.nextQueueAfter;
  await saveUserMeta(env, email, meta);
  return cadenceReached;
}

async function resetCadenceAfterQueue(env: Env, email: string): Promise<void> {
  await saveUserMeta(env, email, {
    generationCount: 0,
    nextQueueAfter: randomInt(CADENCE_MIN, CADENCE_MAX),
  });
}

export async function shouldQueueImageGeneration(env: Env, email: string): Promise<boolean> {
  const active = await getGlobalActive(env);
  if (active >= MAX_CONCURRENT) {
    return true;
  }

  const cadenceReached = await recordGenerationAttempt(env, email);
  return cadenceReached;
}

function buildQueuePosition(active: number): number {
  return Math.min(Math.max(active, 1) + randomInt(0, 2), 5);
}

function calculateWaitSeconds(position: number): number {
  return BASE_WAIT_SECONDS + Math.max(0, position - 1) * POSITION_WAIT_SECONDS + randomInt(0, 2);
}

export async function createImageQueueTicket(
  env: Env,
  email: string,
  payload: ImageQueuePayload
): Promise<ImageQueueTicket> {
  await resetCadenceAfterQueue(env, email);

  const active = await getGlobalActive(env);
  const position = buildQueuePosition(active);
  const waitSeconds = calculateWaitSeconds(position);
  const queueToken = crypto.randomUUID();

  const entry: ImageQueuePayload = {
    ...payload,
    email,
    waitUntil: nowSeconds() + waitSeconds,
    position,
  };

  await env.AUTH_STORE.put(tokenKey(queueToken), JSON.stringify(entry), {
    expirationTtl: TOKEN_TTL_SECONDS,
  });

  return {
    queueToken,
    position,
    waitSeconds,
    message: 'Image generation is queued due to high demand. Please wait.',
  };
}

export async function getImageQueueStatus(
  env: Env,
  token: string,
  email: string
): Promise<ImageQueueStatus> {
  const raw = await env.AUTH_STORE.get(tokenKey(token));
  if (!raw) {
    return { status: 'not_found' };
  }

  let entry: ImageQueuePayload;
  try {
    entry = JSON.parse(raw) as ImageQueuePayload;
  } catch {
    return { status: 'not_found' };
  }

  if (entry.email !== email) {
    return { status: 'forbidden' };
  }

  const remainingSeconds = Math.max(0, entry.waitUntil - nowSeconds());
  if (remainingSeconds > 0) {
    return {
      status: 'waiting',
      position: entry.position,
      remainingSeconds,
      waitSeconds: entry.waitUntil - (entry.waitUntil - remainingSeconds),
    };
  }

  return {
    status: 'ready',
    position: entry.position,
    remainingSeconds: 0,
  };
}

export async function consumeImageQueueToken(
  env: Env,
  token: string,
  email: string
): Promise<{ entry: ImageQueuePayload | null; remainingSeconds?: number }> {
  const raw = await env.AUTH_STORE.get(tokenKey(token));
  if (!raw) {
    return { entry: null };
  }

  let entry: ImageQueuePayload;
  try {
    entry = JSON.parse(raw) as ImageQueuePayload;
  } catch {
    return { entry: null };
  }

  if (entry.email !== email) {
    return { entry: null };
  }

  const remainingSeconds = entry.waitUntil - nowSeconds();
  if (remainingSeconds > 0) {
    return { entry: null, remainingSeconds };
  }

  await env.AUTH_STORE.delete(tokenKey(token));
  return { entry };
}

export function queuePayloadFromRequest(
  email: string,
  data: ImageGenerationRequest,
  modelId: string,
  width: number,
  height: number,
  steps: number
): ImageQueuePayload {
  return {
    email,
    prompt: data.prompt.trim(),
    model: modelId,
    width,
    height,
    steps,
    confirmPremium: data.confirmPremium ?? false,
    waitUntil: 0,
    position: 0,
  };
}
