/**
 * Code generation API handlers
 */
import { IRequest, Router } from 'itty-router';
import { CodeGenerationRequest, Env } from '../types';
import { errorResponse, successResponse } from '../utils/response';
import { validateRequestBody } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import { CODE_MODELS, DEFAULT_CODE_MODEL, getCodeModel } from '../config/models';
import { buildTextRunInput, extractTextResponse, validatePromptLength } from '../utils/ai';
import { enforceAiRateLimit } from '../utils/rateLimit';
import { scheduleStatsIncrement } from '../utils/stats';

const codeRouter = Router({ base: '/api/code' });

codeRouter.all('*', requireAuth);

codeRouter.post('/generate',
  validateRequestBody(['prompt']),
  async (request: IRequest, env: Env, ctx: ExecutionContext) => {
    try {
      const rateLimited = await enforceAiRateLimit(
        request,
        env,
        request.user?.email || 'anonymous'
      );
      if (rateLimited) return rateLimited;

      const data = request.data || {} as CodeGenerationRequest;
      const prompt = data.prompt?.trim() || '';

      if (!prompt) {
        return errorResponse('Prompt is required', 400, request);
      }

      const promptError = validatePromptLength(prompt);
      if (promptError) {
        return errorResponse(promptError, 400, request);
      }

      const modelConfig = getCodeModel(data.model || DEFAULT_CODE_MODEL);
      const options = data.options || {};
      const enhancedPrompt = `Generate code for the following request. Return only the code unless explanations are explicitly requested:\n\n${prompt}`;

      const response = await env.AI.run(modelConfig.id, buildTextRunInput(enhancedPrompt, {
        ...options,
        temperature: options.temperature ?? 0.2,
      }));

      scheduleStatsIncrement(ctx, env, 'code');

      return successResponse({
        result: extractTextResponse(response),
        model: modelConfig.id,
      }, request);
    } catch (error) {
      console.error('Code generation error:', error);
      return errorResponse('Error generating code', 500, request);
    }
  }
);

codeRouter.get('/models', async (request: IRequest) => {
  return successResponse({
    models: CODE_MODELS,
    defaultModel: DEFAULT_CODE_MODEL,
  }, request);
});

export default codeRouter;
