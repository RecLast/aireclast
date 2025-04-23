/**
 * Authentication API handlers
 */
import { IRequest, Router } from 'itty-router';
import { Env } from '../types';
import { errorResponse, successResponse } from '../utils/response';
import { generateVerificationCode, sendVerificationEmail } from '../utils/email';
import { createAuthCookie, createJwtToken } from '../utils/jwt';
import { storeVerificationCode, verifyCode } from '../middleware/auth';
import { validateEmail, validateRequestBody, validateVerificationCode } from '../middleware/validation';

const authRouter = Router({ base: '/api/auth' });

/**
 * Request a verification code
 * POST /api/auth/request-code
 */
authRouter.post('/request-code',
  validateRequestBody(['email']),
  validateEmail(),
  async (request: IRequest, env: Env) => {
    try {
      const data = request.data || {};
      const email = data.email as string;

      // Generate a verification code
      const code = generateVerificationCode();

      // Store the verification code
      await storeVerificationCode(env, email, code);

      // Send the verification code via email
      await sendVerificationEmail(email, code);

      return successResponse({
        message: 'Verification code sent to your email'
      });
    } catch (error) {
      console.error('Error requesting verification code:', error);
      return errorResponse('Failed to send verification code', 500);
    }
  }
);

/**
 * Verify the code and login
 * POST /api/auth/verify
 */
authRouter.post('/verify',
  validateRequestBody(['email', 'code']),
  validateEmail(),
  validateVerificationCode(),
  async (request: IRequest, env: Env) => {
    try {
      const data = request.data || {};
      const email = data.email as string;
      const code = data.code as string;

      // Verify the code
      const isValid = await verifyCode(env, email, code);

      if (!isValid) {
        return errorResponse('Invalid or expired verification code', 400);
      }

      // Create a JWT token
      const token = await createJwtToken(email, env.JWT_SECRET);

      // Create an auth cookie
      const authCookie = createAuthCookie(token);

      // Return success with the token
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: 'Authentication successful',
            email
          }
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': authCookie
          }
        }
      );
    } catch (error) {
      console.error('Error verifying code:', error);
      return errorResponse('Failed to verify code', 500);
    }
  }
);

/**
 * Check if the user is authenticated
 * GET /api/auth/check
 */
authRouter.get('/check', async (request: IRequest) => {
  // The requireAuth middleware will handle authentication
  // If we get here, the user is authenticated
  return successResponse({
    isAuthenticated: true,
    user: request.user
  });
});

/**
 * Logout
 * POST /api/auth/logout
 */
authRouter.post('/logout', () => {
  return new Response(
    JSON.stringify({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'auth=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    }
  );
});

export default authRouter;
