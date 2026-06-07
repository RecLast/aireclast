/**
 * Image generation API handlers
 */
import { IRequest, Router } from 'itty-router';
import { Env, ImageGenerationRequest, ImageQueueTicketResponse } from '../types';
import { binaryResponse, errorResponse, queuedResponse, successResponse } from '../utils/response';
import { validateRequestBody } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import {
  clampSteps,
  DEFAULT_IMAGE_MODEL,
  getImageModel,
  IMAGE_MODELS,
  resolveImageDimensions,
} from '../config/models';
import { MAX_IMAGE_PROMPT_LENGTH, validatePromptLength } from '../utils/ai';
import { enforceAiRateLimit } from '../utils/rateLimit';
import { scheduleStatsIncrement } from '../utils/stats';
import {
  acquireGlobalSlot,
  consumeImageQueueToken,
  createImageQueueTicket,
  getImageQueueStatus,
  queuePayloadFromRequest,
  releaseGlobalSlot,
  shouldQueueImageGeneration,
} from '../utils/imageQueue';

const imageRouter = Router({ base: '/api/image' });

imageRouter.all('*', requireAuth);

interface ValidatedImageParams {
  prompt: string;
  modelConfig: ReturnType<typeof getImageModel>;
  width: number;
  height: number;
  steps: number;
  confirmPremium: boolean;
}

function validateImageRequest(data: ImageGenerationRequest, request?: Request): ValidatedImageParams | Response {
  const prompt = data.prompt?.trim() || '';

  if (!prompt) {
    return errorResponse('Prompt is required', 400, request);
  }

  const promptError = validatePromptLength(prompt, MAX_IMAGE_PROMPT_LENGTH);
  if (promptError) {
    return errorResponse(promptError, 400, request);
  }

  const modelConfig = getImageModel(data.model || DEFAULT_IMAGE_MODEL);

  if (modelConfig.requiresPremiumConfirm && !data.confirmPremium) {
    return errorResponse(
      'Flux models use more Neurons per image. Set confirmPremium=true to continue.',
      402,
      request
    );
  }

  const requestedWidth = data.width || modelConfig.dimensions[0].width;
  const requestedHeight = data.height || modelConfig.dimensions[0].height;
  const { width, height } = resolveImageDimensions(modelConfig, requestedWidth, requestedHeight);
  const steps = clampSteps(modelConfig, data.steps || modelConfig.defaultSteps);

  return {
    prompt,
    modelConfig,
    width,
    height,
    steps,
    confirmPremium: data.confirmPremium ?? false,
  };
}

async function runImageGeneration(
  env: Env,
  ctx: ExecutionContext,
  params: ValidatedImageParams,
  request?: Request
): Promise<Response> {
  const imageResponse = await env.AI.run(params.modelConfig.id, {
    prompt: params.prompt,
    width: params.width,
    height: params.height,
    steps: params.steps,
  });

  if (!imageResponse || imageResponse.byteLength === 0) {
    return errorResponse('Generated image is empty. Please try again with a different prompt.', 500, request);
  }

  scheduleStatsIncrement(ctx, env, 'image');
  return binaryResponse(imageResponse, 'image/png', request);
}

imageRouter.get('/queue/:token', async (request: IRequest, env: Env) => {
  try {
    const token = request.params?.token;
    if (!token) {
      return errorResponse('Queue token is required', 400, request);
    }

    const email = request.user?.email || 'anonymous';
    const status = await getImageQueueStatus(env, token, email);

    if (status.status === 'not_found') {
      return errorResponse('Queue token not found or expired', 404, request);
    }

    if (status.status === 'forbidden') {
      return errorResponse('Invalid queue token', 403, request);
    }

    return successResponse(status, request);
  } catch (error) {
    console.error('Error checking image queue status:', error);
    return errorResponse('Failed to check queue status', 500, request);
  }
});

imageRouter.post('/generate',
  validateRequestBody(['prompt']),
  async (request: IRequest, env: Env, ctx: ExecutionContext) => {
    let slotAcquired = false;

    try {
      const rateLimited = await enforceAiRateLimit(
        request,
        env,
        request.user?.email || 'anonymous'
      );
      if (rateLimited) return rateLimited;

      const data = (request.data || {}) as ImageGenerationRequest;
      const email = request.user?.email || 'anonymous';
      const validated = validateImageRequest(data, request);

      if (validated instanceof Response) {
        return validated;
      }

      if (data.queueToken) {
        const { entry, remainingSeconds } = await consumeImageQueueToken(env, data.queueToken, email);

        if (!entry) {
          if (remainingSeconds !== undefined && remainingSeconds > 0) {
            return errorResponse(
              `Queue is still active. Please wait ${remainingSeconds} more second(s).`,
              425,
              request
            );
          }

          return errorResponse('Queue token not found or expired', 404, request);
        }

        await acquireGlobalSlot(env);
        slotAcquired = true;

        return await runImageGeneration(
          env,
          ctx,
          {
            prompt: entry.prompt,
            modelConfig: getImageModel(entry.model),
            width: entry.width,
            height: entry.height,
            steps: entry.steps,
            confirmPremium: entry.confirmPremium,
          },
          request
        );
      }

      const needsQueue = await shouldQueueImageGeneration(env, email);
      if (needsQueue) {
        const ticket = await createImageQueueTicket(
          env,
          email,
          queuePayloadFromRequest(
            email,
            data,
            validated.modelConfig.id,
            validated.width,
            validated.height,
            validated.steps
          )
        );

        const response: ImageQueueTicketResponse = {
          queued: true,
          ...ticket,
        };

        return queuedResponse(response, request);
      }

      await acquireGlobalSlot(env);
      slotAcquired = true;

      return await runImageGeneration(env, ctx, validated, request);
    } catch (error) {
      console.error('Error generating image:', error);
      return errorResponse('Error generating image', 500, request);
    } finally {
      if (slotAcquired) {
        await releaseGlobalSlot(env);
      }
    }
  }
);

imageRouter.get('/models', async (request: IRequest) => {
  return successResponse({
    models: IMAGE_MODELS.map(({ id, name, description, neuronCost, neuronNote, maxSteps, defaultSteps, dimensions, requiresPremiumConfirm }) => ({
      id,
      name,
      description,
      neuronCost,
      neuronNote,
      maxSteps,
      defaultSteps,
      dimensions,
      requiresPremiumConfirm: requiresPremiumConfirm ?? false,
    })),
    defaultModel: DEFAULT_IMAGE_MODEL,
  }, request);
});

export default imageRouter;
