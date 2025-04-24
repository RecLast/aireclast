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
  try {
    // Log request path for debugging
    console.log(`Auth check for path: ${request.url}`);

    // Try to get token from cookie first, then from header
    const token = extractJwtFromCookie(request) || extractJwtFromHeader(request);

    if (!token) {
      console.log('No token found in cookie or header');
      return errorResponse('Authentication required', 401);
    }

    console.log('Token found, verifying...');

    // For debugging only - log a small part of the token
    if (token.length > 10) {
      console.log(`Token starts with: ${token.substring(0, 10)}...`);
    }

    // Check if JWT_SECRET exists
    if (!env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      // Use a fallback secret for development
      const fallbackSecret = 'development-fallback-secret-do-not-use-in-production';
      const session = await verifyJwtToken(token, fallbackSecret);

      if (!session || !session.isAuthenticated) {
        console.log('Token verification failed with fallback secret');
        // For development only - bypass authentication
        request.user = {
          email: 'dev@example.com',
          isAuthenticated: true,
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
        };
        console.log('Using development bypass authentication');
        return; // Continue to the handler
      }

      // Add the user session to the request for use in handlers
      request.user = session;
      return;
    }

    // Normal verification with JWT_SECRET
    const session = await verifyJwtToken(token, env.JWT_SECRET);

    if (!session || !session.isAuthenticated) {
      console.log('Token verification failed');
      return errorResponse('Invalid or expired authentication', 401);
    }

    console.log('Token verified successfully');

    // Add the user session to the request for use in handlers
    request.user = session;
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return errorResponse('Authentication error', 500);
  }
}


