/**
 * Authentication API handlers
 */
import { IRequest, Router } from 'itty-router';
import { Env } from '../types';
import { errorResponse, successResponse } from '../utils/response';
import { isEmailAllowed, verifyCredentials } from '../utils/email';
import { createAuthCookie, createJwtToken } from '../utils/jwt';
import { validateEmail, validateRequestBody } from '../middleware/validation';

const authRouter = Router({ base: '/api/auth' });

/**
 * Check if email is allowed
 * POST /api/auth/check-email
 */
authRouter.post('/check-email',
  validateRequestBody(['email']),
  validateEmail(),
  async (request: IRequest, env: Env) => {
    try {
      const data = request.data || {};
      const email = data.email as string;

      console.log(`Checking if email is allowed: ${email}`);

      // Check if email is in the allowed list
      const isAllowed = isEmailAllowed(email, env.ALLOWED_EMAILS);

      if (!isAllowed) {
        return errorResponse('Email not authorized to access this application', 403);
      }

      // Return success
      return successResponse({
        message: 'Email verified successfully. Please enter your credentials.',
        email: email
      });
    } catch (error) {
      console.error('Error checking email:', error);
      return errorResponse('Failed to verify email', 500);
    }
  }
);

/**
 * Login with username and password after email verification
 * POST /api/auth/login
 */
authRouter.post('/login',
  validateRequestBody(['email', 'username', 'password']),
  validateEmail(),
  async (request: IRequest, env: Env) => {
    try {
      const data = request.data || {};
      const email = data.email as string;
      const username = data.username as string;
      const password = data.password as string;

      console.log(`Login attempt for ${email} with username: ${username}`);

      // Verify credentials
      const isValid = verifyCredentials(username, password, env.USER_CREDENTIALS);

      if (!isValid) {
        return errorResponse('Invalid username or password', 401);
      }

      console.log('Credentials verified successfully, creating JWT token');
      console.log(`JWT_SECRET exists: ${!!env.JWT_SECRET}`);

      try {
        // Create a JWT token
        const token = await createJwtToken(email, env.JWT_SECRET || 'fallback-secret-for-testing');
        console.log('JWT token created successfully');

        // Create an auth cookie
        const authCookie = createAuthCookie(token);
        console.log('Auth cookie created successfully');

        // Return success with the token
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              message: 'Authentication successful',
              email,
              username
            }
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': authCookie
            }
          }
        );
      } catch (jwtError: any) {
        console.error('Error creating JWT token:', jwtError);
        return errorResponse(`JWT creation failed: ${jwtError.message || 'Unknown error'}`, 500);
      }
    } catch (error: any) {
      console.error('Error during login:', error);
      return errorResponse(`Login failed: ${error.message || 'Unknown error'}`, 500);
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
