/**
 * Usage statistics stored in KV
 */
import { Env, StatsData } from '../types';

export type StatsRequestType = 'text' | 'code' | 'image';

const DEFAULT_STATS: StatsData = {
  totalRequests: 0,
  textRequests: 0,
  imageRequests: 0,
  codeRequests: 0,
  lastUpdated: new Date().toISOString(),
};

export async function incrementStats(env: Env, type: StatsRequestType): Promise<void> {
  const statsStr = await env.AUTH_STORE.get('stats');
  const stats: StatsData = statsStr ? JSON.parse(statsStr) : { ...DEFAULT_STATS };

  stats.totalRequests += 1;
  if (type === 'text') stats.textRequests += 1;
  if (type === 'code') stats.codeRequests += 1;
  if (type === 'image') stats.imageRequests += 1;
  stats.lastUpdated = new Date().toISOString();

  await env.AUTH_STORE.put('stats', JSON.stringify(stats));
}

export function scheduleStatsIncrement(
  ctx: ExecutionContext | undefined,
  env: Env,
  type: StatsRequestType
): void {
  const task = incrementStats(env, type);

  if (ctx?.waitUntil) {
    ctx.waitUntil(task);
    return;
  }

  void task.catch((error) => console.error('Error updating stats:', error));
}
