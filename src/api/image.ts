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
      let width = data.width || 640;
      let height = data.height || 640;
      const steps = data.steps || 30;

      if (!prompt) {
        return errorResponse('Prompt is required', 400);
      }

      // Validate dimensions based on the selected model
      let validDimensions = [];

      // Set valid dimensions based on the model
      // Reference: https://developers.cloudflare.com/workers-ai/models/

      // Log original dimensions
      console.log(`Original requested dimensions: ${width}x${height}`);

      if (model.includes('stable-diffusion-xl-base')) {
        // SDXL supports these dimensions
        validDimensions = [
          [1024, 1024], // square
          [1152, 896],  // landscape
          [896, 1152],  // portrait
          [1216, 832],  // wide landscape
          [832, 1216]   // tall portrait
        ];
      } else if (model.includes('stable-diffusion-xl-lightning')) {
        // SDXL Lightning supports these dimensions
        validDimensions = [
          [1024, 1024], // square
          [1152, 896],  // landscape
          [896, 1152]   // portrait
        ];
      } else if (model.includes('dreamshaper')) {
        // DreamShaper supports these dimensions
        validDimensions = [
          [512, 512],   // square
          [768, 512],   // landscape
          [512, 768]    // portrait
        ];
      } else if (model.includes('flux')) {
        // Flux supports these dimensions
        validDimensions = [
          [1024, 1024]  // square - only support square for Flux
        ];
        // Force dimensions to 1024x1024 for Flux
        console.log(`Forcing dimensions to 1024x1024 for Flux model`);
        width = 1024;
        height = 1024;
      } else {
        // Default to SDXL dimensions for other models
        validDimensions = [
          [1024, 1024], // square
          [1152, 896],  // landscape
          [896, 1152]   // portrait
        ];
      }

      // Log the valid dimensions for this model
      console.log(`Valid dimensions for model ${model}:`, validDimensions.map(d => `${d[0]}x${d[1]}`).join(', '));

      console.log(`Using model: ${model}, checking if dimensions ${width}x${height} are valid`);

      const isDimensionValid = validDimensions.some(([w, h]) =>
        (width === w && height === h)
      );

      if (!isDimensionValid) {
        // Default to the first valid dimension for the model
        console.log(`Requested dimensions ${width}x${height} not supported for model ${model}`);
        console.log(`Using default dimensions ${validDimensions[0][0]}x${validDimensions[0][1]} instead`);
        width = validDimensions[0][0];
        height = validDimensions[0][1];
      }

      // Check if the model is a premium model (Flux)
      if (model.includes('flux') && !data.confirmPremium) {
        return errorResponse(
          'This is a premium model that may incur additional costs. Please confirm usage by setting confirmPremium=true in your request.',
          402 // Payment Required
        );
      }

      // Adjust steps based on model
      let adjustedSteps = steps;
      if (model.includes('flux') && steps > 8) {
        console.log(`Adjusting steps from ${steps} to 8 for Flux model`);
        adjustedSteps = 8; // Flux model has a maximum of 8 steps
      } else if (model.includes('dreamshaper') && steps > 10) {
        console.log(`Adjusting steps from ${steps} to 10 for DreamShaper model`);
        adjustedSteps = 10; // DreamShaper has a lower step limit
      } else if (model.includes('lightning') && steps > 4) {
        console.log(`Adjusting steps from ${steps} to 4 for SDXL Lightning model`);
        adjustedSteps = 4; // SDXL Lightning is optimized for fewer steps
      }

      // Call the AI model
      console.log(`Generating image with model: ${model}, dimensions: ${width}x${height}, steps: ${adjustedSteps}`);

      try {
        // Add detailed logging
        console.log(`AI.run parameters:`, {
          model,
          prompt: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
          width,
          height,
          steps: adjustedSteps,
          confirmPremium: data.confirmPremium
        });

        // Special handling for Flux model
        let imageResponse;

        if (model.includes('flux')) {
          console.log('Using special parameters for Flux model');

          // For Flux, we need to ensure these exact parameters
          imageResponse = await env.AI.run(model, {
            prompt,
            width: 1024,
            height: 1024,
            steps: Math.min(adjustedSteps, 8),
            // Add any other required parameters for Flux
            num_images: 1
          });
        } else {
          // Standard parameters for other models
          imageResponse = await env.AI.run(model, {
            prompt,
            width,
            height,
            steps: adjustedSteps
          });
        }

        // Check if we got a valid response
        if (!imageResponse || imageResponse.byteLength === 0) {
          console.error('Empty image response received from AI model');
          return errorResponse('Generated image is empty. The model may not support the requested parameters.', 500);
        }

        console.log(`Image generated successfully, size: ${imageResponse.byteLength} bytes`);

        // Update stats
        await updateImageStats(env);

        return binaryResponse(imageResponse, 'image/png');
      } catch (aiError) {
        console.error('AI model error:', aiError);
        return errorResponse(`AI model error: ${aiError instanceof Error ? aiError.message : 'Unknown AI error'}`, 500);
      }

      // This line is unreachable now, as we return inside the try/catch block
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
imageRouter.get('/models', async (_request: IRequest, _env: Env) => {
  try {
    console.log('Fetching image models');

    // In a real implementation, you would fetch this from Cloudflare's API
    // For now, we'll return a static list
    const models = [
      {
        id: '@cf/black-forest-labs/flux-1-schnell',
        name: 'Flux-1 Schnell (Premium)',
        description: 'High-performance image model with advanced capabilities (may incur additional costs)'
      },
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

    console.log(`Returning ${models.length} image models`);
    return successResponse({ models });
  } catch (error) {
    console.error('Error fetching image models:', error);
    return successResponse({
      models: [
        {
          id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
          name: 'Stable Diffusion XL',
          description: 'A state-of-the-art text-to-image model'
        }
      ]
    });
  }
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
