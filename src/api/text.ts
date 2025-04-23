/**
 * Text generation API handlers
 */
import { IRequest, Router } from 'itty-router';
import { Env, TextGenerationRequest } from '../types';
import { errorResponse, successResponse } from '../utils/response';
import { validateRequestBody } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const textRouter = Router({ base: '/api/text' });

// Apply authentication to all routes
textRouter.all('*', requireAuth);

/**
 * Generate text
 * POST /api/text/generate
 */
textRouter.post('/generate',
  validateRequestBody(['prompt']),
  async (request: IRequest, env: Env) => {
    try {
      const data = request.data || {} as TextGenerationRequest;

      // Get prompt and validate
      const prompt = data.prompt || '';
      if (!prompt) {
        return errorResponse('Prompt is required', 400);
      }

      // Default model
      const model = data.model || '@cf/meta/llama-2-7b-chat-int8';
      const options = data.options || {};

      // Call the AI model
      const response = await env.AI.run(model, {
        prompt,
        ...options
      });

      // Update stats
      await updateTextStats(env);

      return successResponse({
        result: response,
        model
      });
    } catch (error) {
      console.error('Text generation error:', error);
      return errorResponse(`Error generating text: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }
);

/**
 * Get available text models
 * GET /api/text/models
 */
textRouter.get('/models', async () => {
  // In a real implementation, you would fetch this from Cloudflare's API
  // For now, we'll return a static list
  const models = [
    {
      id: '@cf/meta/llama-2-7b-chat-int8',
      name: 'Llama 2 (7B)',
      description: 'Meta\'s Llama 2 model optimized for chat'
    },
    {
      id: '@cf/mistral/mistral-7b-instruct-v0.1',
      name: 'Mistral 7B',
      description: 'Mistral AI\'s instruction-tuned model'
    },
    {
      id: '@cf/openchat/openchat-3.5-0106',
      name: 'OpenChat 3.5',
      description: 'Open-source chat model with strong performance'
    }
  ];

  return successResponse({ models });
});

/**
 * Update text generation stats
 */
async function updateTextStats(env: Env): Promise<void> {
  try {
    // Get current stats
    const statsStr = await env.AUTH_STORE.get('stats');
    let stats = statsStr ? JSON.parse(statsStr) : {
      totalRequests: 0,
      textRequests: 0,
      imageRequests: 0,
      codeRequests: 0,
      lastUpdated: new Date().toISOString()
    };

    // Update stats
    stats.totalRequests += 1;
    stats.textRequests += 1;
    stats.lastUpdated = new Date().toISOString();

    // Save stats
    await env.AUTH_STORE.put('stats', JSON.stringify(stats));
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

export default textRouter;
