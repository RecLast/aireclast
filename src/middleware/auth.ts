/**
 * Authentication middleware
 */
import { IRequest } from 'itty-router';
import { Env } from '../types';
import { errorResponse } from '../utils/response';
import { validateApiKey } from '../utils/apiKey';
import { extractJwtFromCookie, extractJwtFromHeader, verifyJwtToken } from '../utils/jwt';

/**
 * Middleware to check if the user is authenticated
 */
export async function requireAuth(request: IRequest, env: Env): Promise<Response | void> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      if (token.startsWith('reclast_')) {
        const email = await validateApiKey(token, env);

        if (!email) {
          return errorResponse('Invalid API key', 401);
        }

        request.user = {
          email,
          isAuthenticated: true,
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        };

        return;
      }
    }

    const jwtToken = extractJwtFromCookie(request) || extractJwtFromHeader(request);

    if (!jwtToken || jwtToken.startsWith('reclast_')) {
      return errorResponse('Authentication required', 401);
    }

    if (!env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return errorResponse('Authentication is not configured', 500);
    }

    const session = await verifyJwtToken(jwtToken, env.JWT_SECRET);

    if (!session?.isAuthenticated) {
      return errorResponse('Invalid or expired authentication', 401);
    }

    request.user = session;
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return errorResponse('Authentication error', 500);
  }
}
