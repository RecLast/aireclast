/**
 * Stats API handlers
 */
import { IRequest, Router } from 'itty-router';
import { Env, StatsData } from '../types';
import { errorResponse, successResponse } from '../utils/response';
import { requireAuth } from '../middleware/auth';

const statsRouter = Router({ base: '/api/stats' });

statsRouter.all('*', requireAuth);

const EMPTY_STATS: StatsData = {
  totalRequests: 0,
  textRequests: 0,
  imageRequests: 0,
  codeRequests: 0,
  lastUpdated: new Date().toISOString(),
};

/**
 * Get usage statistics
 * GET /api/stats
 */
statsRouter.get('/', async (_request: IRequest, env: Env) => {
  try {
    const statsStr = await env.AUTH_STORE?.get('stats');

    if (!statsStr) {
      return successResponse(EMPTY_STATS);
    }

    return successResponse(JSON.parse(statsStr) as StatsData);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return errorResponse('Failed to load statistics', 500);
  }
});

/**
 * Reset statistics
 * POST /api/stats/reset
 */
statsRouter.post('/reset', async (_request: IRequest, env: Env) => {
  try {
    const resetStats: StatsData = {
      ...EMPTY_STATS,
      lastUpdated: new Date().toISOString(),
    };

    await env.AUTH_STORE.put('stats', JSON.stringify(resetStats));

    return successResponse({
      message: 'Statistics reset successfully',
      stats: resetStats,
    });
  } catch (error) {
    console.error('Error resetting stats:', error);
    return errorResponse('Failed to reset statistics', 500);
  }
});

export default statsRouter;
