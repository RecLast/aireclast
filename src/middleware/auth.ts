/**
 * Authentication middleware
 */
import { IRequest } from 'itty-router';
import { Env, UserSession } from '../types';
import { errorResponse } from '../utils/response';
import { extractJwtFromCookie, extractJwtFromHeader, verifyJwtToken } from '../utils/jwt';

/**
 * Middleware to check if the user is authenticated
 */
export async function requireAuth(request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response | void> {
  // Try to get token from cookie first, then from header
  const token = extractJwtFromCookie(request) || extractJwtFromHeader(request);

  if (!token) {
    return errorResponse('Authentication required', 401);
  }

  const session = await verifyJwtToken(token, env.JWT_SECRET);

  if (!session || !session.isAuthenticated) {
    return errorResponse('Invalid or expired authentication', 401);
  }

  // Add the user session to the request for use in handlers
  request.user = session;
}


