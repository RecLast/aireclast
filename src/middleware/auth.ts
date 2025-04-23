/**
 * Authentication middleware
 */
import { IRequest } from 'itty-router';
import { Env, UserSession, VerificationCode } from '../types';
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

/**
 * Store a verification code in KV
 */
export async function storeVerificationCode(
  env: Env,
  email: string,
  code: string,
  expiresInMinutes: number = 10
): Promise<void> {
  const verificationData: VerificationCode = {
    code,
    email,
    expires: Date.now() + expiresInMinutes * 60 * 1000
  };

  // Store the verification code with the email as the key
  await env.AUTH_STORE.put(
    `verification:${email}`,
    JSON.stringify(verificationData),
    { expirationTtl: expiresInMinutes * 60 }
  );
}

/**
 * Verify a code for an email
 */
export async function verifyCode(env: Env, email: string, code: string): Promise<boolean> {
  const verificationDataStr = await env.AUTH_STORE.get(`verification:${email}`);

  if (!verificationDataStr) {
    return false;
  }

  const verificationData: VerificationCode = JSON.parse(verificationDataStr);

  // Check if the code has expired
  if (verificationData.expires < Date.now()) {
    // Clean up expired code
    await env.AUTH_STORE.delete(`verification:${email}`);
    return false;
  }

  // Check if the code matches
  if (verificationData.code !== code) {
    return false;
  }

  // Clean up used code
  await env.AUTH_STORE.delete(`verification:${email}`);

  return true;
}
