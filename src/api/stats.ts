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
statsRouter.get('/', async (request: IRequest, env: Env) => {
  try {
    // Get stats from KV
    const statsStr = await env.AUTH_STORE.get('stats');
    
    if (!statsStr) {
      // Initialize stats if they don't exist
      const initialStats: StatsData = {
        totalRequests: 0,
        textRequests: 0,
        imageRequests: 0,
        codeRequests: 0,
        lastUpdated: new Date().toISOString()
      };
      
      await env.AUTH_STORE.put('stats', JSON.stringify(initialStats));
      
      return successResponse(initialStats);
    }
    
    const stats: StatsData = JSON.parse(statsStr);
    return successResponse(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return errorResponse('Failed to fetch statistics', 500);
  }
});

/**
 * Reset statistics
 * POST /api/stats/reset
 */
statsRouter.post('/reset', async (request: IRequest, env: Env) => {
  try {
    // Reset stats
    const resetStats: StatsData = {
      totalRequests: 0,
      textRequests: 0,
      imageRequests: 0,
      codeRequests: 0,
      lastUpdated: new Date().toISOString()
    };
    
    await env.AUTH_STORE.put('stats', JSON.stringify(resetStats));
    
    return successResponse({
      message: 'Statistics reset successfully',
      stats: resetStats
    });
  } catch (error) {
    console.error('Error resetting stats:', error);
    return errorResponse('Failed to reset statistics', 500);
  }
});

export default statsRouter;
