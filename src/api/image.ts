/**
 * Image generation API handlers
 */
import { IRequest, Router } from 'itty-router';
import { Env, ImageGenerationRequest } from '../types';
import { binaryResponse, errorResponse, successResponse } from '../utils/response';
import { validateRequestBody } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const imageRouter = Router({ base: '/api/image' });

// Apply authentication to all routes
imageRouter.all('*', requireAuth);

/**
 * Generate an image
 * POST /api/image/generate
 */
imageRouter.post('/generate',
  validateRequestBody(['prompt']),
  async (request: IRequest, env: Env) => {
    try {
      const data = request.data || {} as ImageGenerationRequest;

      // Default values
      const prompt = data.prompt || '';
      const model = data.model || '@cf/stabilityai/stable-diffusion-xl-base-1.0';
      const width = data.width || 640;
      const height = data.height || 640;
      const steps = data.steps || 30;

      if (!prompt) {
        return errorResponse('Prompt is required', 400);
      }

      // Validate dimensions
      const validDimensions = [
        [540, 960], [960, 540], [640, 640], [1280, 720], [720, 1280]
      ];

      const isDimensionValid = validDimensions.some(([w, h]) =>
        (width === w && height === h) || (width === h && height === w)
      );

      if (!isDimensionValid) {
        return errorResponse('Invalid dimensions. Supported dimensions: 540x960, 960x540, 640x640, 1280x720, 720x1280');
      }

      // Call the AI model
      const imageResponse = await env.AI.run(model, {
        prompt,
        width,
        height,
        steps
      });

      // Update stats
      await updateImageStats(env);

      // Return the image
      return binaryResponse(imageResponse, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      return errorResponse(`Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }
);

/**
 * Get available image models
 * GET /api/image/models
 */
imageRouter.get('/models', async () => {
  // In a real implementation, you would fetch this from Cloudflare's API
  // For now, we'll return a static list
  const models = [
    {
      id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      name: 'Stable Diffusion XL',
      description: 'A state-of-the-art text-to-image model'
    },
    {
      id: '@cf/lykon/dreamshaper-8-lcm',
      name: 'DreamShaper',
      description: 'Fast image generation with Latent Consistency Models'
    },
    {
      id: '@cf/bytedance/stable-diffusion-xl-lightning',
      name: 'SDXL Lightning',
      description: 'Ultra-fast image generation'
    }
  ];

  return successResponse({ models });
});

/**
 * Update image generation stats
 */
async function updateImageStats(env: Env): Promise<void> {
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
    stats.imageRequests += 1;
    stats.lastUpdated = new Date().toISOString();

    // Save stats
    await env.AUTH_STORE.put('stats', JSON.stringify(stats));
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

export default imageRouter;
