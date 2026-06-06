/**
 * Authentication API handlers
 */
import { IRequest, Router } from 'itty-router';
import { Env } from '../types';
import { errorResponse, successResponse } from '../utils/response';
import { isEmailAllowed, verifyCredentials } from '../utils/email';
import { regenerateApiKey, storeApiKey, generateApiKey, getApiKeyForUser } from '../utils/apiKey';
import { createAuthCookie, createJwtToken, clearAuthCookie } from '../utils/jwt';
import { validateEmailFormat, validateRequestBody } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import { enforceAuthRateLimit } from '../utils/rateLimit';
import { getCorsHeaders } from '../utils/cors';

const authRouter = Router({ base: '/api/auth' });

/**
 * Check if email is allowed
 * POST /api/auth/check-email
 */
authRouter.post('/check-email',
  validateRequestBody(['email']),
  validateEmailFormat(),
  async (request: IRequest, env: Env) => {
    try {
      const rateLimited = await enforceAuthRateLimit(request, env, 'check-email');
      if (rateLimited) return rateLimited;

      return successResponse({
        message: 'If your email is authorized, enter your credentials to continue.',
      }, request);
    } catch (error) {
      console.error('Error checking email:', error);
      return errorResponse('Failed to verify email', 500, request);
    }
  }
);

/**
 * Login with username and password after email verification
 * POST /api/auth/login
 */
authRouter.post('/login',
  validateRequestBody(['email', 'username', 'password']),
  validateEmailFormat(),
  async (request: IRequest, env: Env) => {
    try {
      const rateLimited = await enforceAuthRateLimit(request, env, 'login');
      if (rateLimited) return rateLimited;

      const data = request.data || {};
      const email = data.email as string;
      const username = data.username as string;
      const password = data.password as string;

      if (!isEmailAllowed(email, env.ALLOWED_EMAILS)) {
        return errorResponse('Invalid email or credentials', 401, request);
      }

      const isValid = verifyCredentials(username, password, env.USER_CREDENTIALS);

      if (!isValid) {
        return errorResponse('Invalid email or credentials', 401, request);
      }

      if (!env.JWT_SECRET) {
        return errorResponse('Authentication is not configured', 500, request);
      }

      const token = await createJwtToken(email, env.JWT_SECRET);

      let apiKey = await getApiKeyForUser(email, env);
      if (!apiKey) {
        apiKey = generateApiKey();
      }
      await storeApiKey(email, apiKey, env);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: 'Authentication successful',
            email,
            username,
            apiKey,
          },
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': createAuthCookie(token),
            ...getCorsHeaders(request),
          },
        }
      );
    } catch (error: unknown) {
      console.error('Error during login:', error);
      return errorResponse('Login failed', 500, request);
    }
  }
);

/**
 * Check if the user is authenticated
 * GET /api/auth/check
 */
authRouter.get('/check', requireAuth, async (request: IRequest) => {
  return successResponse({
    isAuthenticated: true,
    user: request.user,
  }, request);
});

/**
 * Regenerate API key for the authenticated user
 * POST /api/auth/regenerate-key
 */
authRouter.post('/regenerate-key', requireAuth, async (request: IRequest, env: Env) => {
  try {
    const email = request.user?.email;

    if (!email) {
      return errorResponse('Authentication required', 401, request);
    }

    const apiKey = await regenerateApiKey(email, env);

    return successResponse({
      message: 'API key regenerated successfully',
      apiKey,
    }, request);
  } catch (error) {
    console.error('Error regenerating API key:', error);
    return errorResponse('Failed to regenerate API key', 500, request);
  }
});

/**
 * Logout
 * POST /api/auth/logout
 */
authRouter.post('/logout', (request: IRequest) => {
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearAuthCookie(),
        ...getCorsHeaders(request),
      },
    }
  );
});

export default authRouter;
