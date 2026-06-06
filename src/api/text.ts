/**
 * Text generation API handlers
 */
import { IRequest, Router } from 'itty-router';
import { Env, TextGenerationRequest } from '../types';
import { errorResponse, successResponse } from '../utils/response';
import { validateRequestBody } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import { DEFAULT_TEXT_MODEL, getTextModel, TEXT_MODELS } from '../config/models';
import { buildTextRunInput, extractTextResponse, validatePromptLength } from '../utils/ai';
import { enforceAiRateLimit } from '../utils/rateLimit';
import { scheduleStatsIncrement } from '../utils/stats';

const textRouter = Router({ base: '/api/text' });

textRouter.all('*', requireAuth);

textRouter.post('/generate',
  validateRequestBody(['prompt']),
  async (request: IRequest, env: Env, ctx: ExecutionContext) => {
    try {
      const rateLimited = await enforceAiRateLimit(
        request,
        env,
        request.user?.email || 'anonymous'
      );
      if (rateLimited) return rateLimited;

      const data = request.data || {} as TextGenerationRequest;
      const prompt = data.prompt?.trim() || '';

      if (!prompt) {
        return errorResponse('Prompt is required', 400, request);
      }

      const promptError = validatePromptLength(prompt);
      if (promptError) {
        return errorResponse(promptError, 400, request);
      }

      const modelConfig = getTextModel(data.model || DEFAULT_TEXT_MODEL);
      const options = data.options || {};

      const response = await env.AI.run(modelConfig.id, buildTextRunInput(prompt, options));

      scheduleStatsIncrement(ctx, env, 'text');

      return successResponse({
        result: extractTextResponse(response),
        model: modelConfig.id,
      }, request);
    } catch (error) {
      console.error('Text generation error:', error);
      return errorResponse('Error generating text', 500, request);
    }
  }
);

textRouter.get('/models', async (request: IRequest) => {
  return successResponse({
    models: TEXT_MODELS,
    defaultModel: DEFAULT_TEXT_MODEL,
  }, request);
});

export default textRouter;
