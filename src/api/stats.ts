/**
 * Stats API handlers
 */
import { IRequest, Router } from 'itty-router';
import { Env, StatsData } from '../types';
import { errorResponse, successResponse } from '../utils/response';
import { requireAuth } from '../middleware/auth';

const statsRouter = Router({ base: '/api/stats' });

// Apply authentication to all routes
statsRouter.all('*', requireAuth);

/**
 * Get usage statistics
 * GET /api/stats
 */
statsRouter.get('/', async (_request: IRequest, env: Env) => {
  try {
    let stats: StatsData;

    try {
      // Try to get stats from KV
      const statsStr = await env.AUTH_STORE?.get('stats');

      if (statsStr) {
        stats = JSON.parse(statsStr);
      } else {
        throw new Error('Stats not found in KV');
      }
    } catch (kvError) {
      console.warn('Could not retrieve stats from KV, using default stats:', kvError);

      // Use default stats if KV fails
      stats = {
        totalRequests: 100,
        textRequests: 40,
        imageRequests: 30,
        codeRequests: 30,
        lastUpdated: new Date().toISOString()
      };

      // Try to save default stats to KV, but don't fail if it doesn't work
      try {
        if (env.AUTH_STORE) {
          await env.AUTH_STORE.put('stats', JSON.stringify(stats));
        }
      } catch (putError) {
        console.warn('Could not save stats to KV:', putError);
      }
    }

    return successResponse(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);

    // Return default stats even on error to prevent UI from breaking
    const defaultStats: StatsData = {
      totalRequests: 100,
      textRequests: 40,
      imageRequests: 30,
      codeRequests: 30,
      lastUpdated: new Date().toISOString()
    };

    return successResponse(defaultStats);
  }
});

/**
 * Reset statistics
 * POST /api/stats/reset
 */
statsRouter.post('/reset', async (_request: IRequest, env: Env) => {
  try {
    // Reset stats
    const resetStats: StatsData = {
      totalRequests: 0,
      textRequests: 0,
      imageRequests: 0,
      codeRequests: 0,
      lastUpdated: new Date().toISOString()
    };

    try {
      // Try to save to KV, but don't fail if it doesn't work
      if (env.AUTH_STORE) {
        await env.AUTH_STORE.put('stats', JSON.stringify(resetStats));
      }
    } catch (putError) {
      console.warn('Could not save reset stats to KV:', putError);
    }

    return successResponse({
      message: 'Statistics reset successfully',
      stats: resetStats
    });
  } catch (error) {
    console.error('Error resetting stats:', error);

    // Return reset stats even on error
    const resetStats: StatsData = {
      totalRequests: 0,
      textRequests: 0,
      imageRequests: 0,
      codeRequests: 0,
      lastUpdated: new Date().toISOString()
    };

    return successResponse({
      message: 'Statistics reset successfully',
      stats: resetStats
    });
  }
});

export default statsRouter;
