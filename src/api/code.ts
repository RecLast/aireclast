/**
 * Code generation API handlers
 */
import { IRequest, Router } from 'itty-router';
import { CodeGenerationRequest, Env } from '../types';
import { errorResponse, successResponse } from '../utils/response';
import { validateRequestBody } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const codeRouter = Router({ base: '/api/code' });

// Apply authentication to all routes
codeRouter.all('*', requireAuth);

/**
 * Generate code
 * POST /api/code/generate
 */
codeRouter.post('/generate',
  validateRequestBody(['prompt']),
  async (request: IRequest, env: Env) => {
    try {
      const data = request.data || {} as CodeGenerationRequest;

      // Get prompt and validate
      const prompt = data.prompt || '';
      if (!prompt) {
        return errorResponse('Prompt is required', 400);
      }

      // Default model - using the same LLMs as text generation but with different prompting
      const model = data.model || '@cf/meta/llama-2-7b-chat-int8';
      const options = data.options || {};

      // Enhance the prompt for code generation
      const enhancedPrompt = `Generate code for the following request. Only provide the code without explanations unless specifically asked for explanations: ${prompt}`;

      // Call the AI model
      const response = await env.AI.run(model, {
        prompt: enhancedPrompt,
        ...options
      });

      // Update stats
      await updateCodeStats(env);

      return successResponse({
        result: response,
        model
      });
    } catch (error) {
      console.error('Code generation error:', error);
      return errorResponse(`Error generating code: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }
);

/**
 * Get available code models
 * GET /api/code/models
 */
codeRouter.get('/models', async (_request: IRequest, _env: Env) => {
  try {
    console.log('Fetching code models');

    // In a real implementation, you would fetch this from Cloudflare's API
    // For now, we'll return a static list - using the same models as text generation
    // but optimized for code
    const models = [
      {
        id: '@cf/meta/llama-2-7b-chat-int8',
        name: 'Llama 2 (7B)',
        description: 'Meta\'s Llama 2 model optimized for code generation'
      },
      {
        id: '@cf/mistral/mistral-7b-instruct-v0.1',
        name: 'Mistral 7B',
        description: 'Mistral AI\'s instruction-tuned model for code'
      },
      {
        id: '@cf/openchat/openchat-3.5-0106',
        name: 'OpenChat 3.5',
        description: 'Open-source model with strong code generation capabilities'
      }
    ];

    console.log(`Returning ${models.length} code models`);
    return successResponse({ models });
  } catch (error) {
    console.error('Error fetching code models:', error);
    return successResponse({
      models: [
        {
          id: '@cf/meta/llama-2-7b-chat-int8',
          name: 'Llama 2 (7B)',
          description: 'Meta\'s Llama 2 model optimized for code generation'
        }
      ]
    });
  }
});

/**
 * Update code generation stats
 */
async function updateCodeStats(env: Env): Promise<void> {
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
    stats.codeRequests += 1;
    stats.lastUpdated = new Date().toISOString();

    // Save stats
    await env.AUTH_STORE.put('stats', JSON.stringify(stats));
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

export default codeRouter;
