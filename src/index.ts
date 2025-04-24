import { Router } from 'itty-router';
import { Env } from './types';
import { errorResponse } from './utils/response';
import authRouter from './api/auth';
import imageRouter from './api/image';
import textRouter from './api/text';
import codeRouter from './api/code';
import statsRouter from './api/stats';

// Create a router
const router = Router();

// CORS middleware
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Options request handler
router.options('*', () => new Response(null, { headers: corsHeaders }));

// API routes
router.all('/api/auth/*', (request, env) => authRouter.handle(request, env));
router.all('/api/image/*', (request, env) => imageRouter.handle(request, env));
router.all('/api/text/*', (request, env) => textRouter.handle(request, env));
router.all('/api/code/*', (request, env) => codeRouter.handle(request, env));
router.all('/api/stats/*', (request, env) => statsRouter.handle(request, env));

// Add routes for HTML pages
router.get('/login', async (request, env) => {
  return env.ASSETS.fetch(new Request(`${new URL(request.url).origin}/templates/login.html`));
});

// Authentication check middleware for protected pages
async function checkAuth(request: Request, env: Env): Promise<Response | null> {
  try {
    // Import the necessary functions
    const { extractJwtFromCookie, verifyJwtToken } = await import('./utils/jwt');

    // Get the token from cookie
    const token = extractJwtFromCookie(request);
    if (!token) {
      console.log('No auth token found, redirecting to login');
      return Response.redirect(`${new URL(request.url).origin}/login`, 302);
    }

    // Verify the token
    const user = await verifyJwtToken(token, env.JWT_SECRET || 'fallback-secret-for-testing');
    if (!user || !user.isAuthenticated) {
      console.log('Invalid or expired token, redirecting to login');
      return Response.redirect(`${new URL(request.url).origin}/login`, 302);
    }

    // Token is valid, continue
    return null;
  } catch (error) {
    console.error('Auth check error:', error);
    return Response.redirect(`${new URL(request.url).origin}/login`, 302);
  }
}

// Protected routes that require authentication
router.get('/dashboard', async (request, env) => {
  const authResponse = await checkAuth(request, env);
  if (authResponse) return authResponse;

  return env.ASSETS.fetch(new Request(`${new URL(request.url).origin}/templates/dashboard.html`));
});

router.get('/image', async (request, env) => {
  const authResponse = await checkAuth(request, env);
  if (authResponse) return authResponse;

  return env.ASSETS.fetch(new Request(`${new URL(request.url).origin}/templates/image.html`));
});

router.get('/text', async (request, env) => {
  const authResponse = await checkAuth(request, env);
  if (authResponse) return authResponse;

  return env.ASSETS.fetch(new Request(`${new URL(request.url).origin}/templates/text.html`));
});

router.get('/code', async (request, env) => {
  const authResponse = await checkAuth(request, env);
  if (authResponse) return authResponse;

  return env.ASSETS.fetch(new Request(`${new URL(request.url).origin}/templates/code.html`));
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Get the URL path
      const url = new URL(request.url);
      const path = url.pathname;

      console.log(`Handling request for: ${path}`);

      // First, try to handle routes with the router
      const routerResponse = await router.handle(request, env, ctx);
      if (routerResponse) {
        return routerResponse;
      }

      // If no route matched, try to serve a static asset
      try {
        return await env.ASSETS.fetch(request);
      } catch (error) {
        console.error(`Error serving static asset: ${error}`);

        // If we get here, return a 404
        return new Response(`Not found: ${path}`, { status: 404 });
      }
    } catch (error) {
      console.error('Unhandled error:', error);
      return errorResponse(`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  },
};
