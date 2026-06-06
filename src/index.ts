import { Router } from 'itty-router';
import { Env } from './types';
import { errorResponse } from './utils/response';
import { getCorsHeaders } from './utils/cors';
import authRouter from './api/auth';
import imageRouter from './api/image';
import textRouter from './api/text';
import codeRouter from './api/code';
import statsRouter from './api/stats';

const router = Router();

router.options('*', (request: Request) => new Response(null, { headers: getCorsHeaders(request) }));

router.all('/api/auth/*', (request, env, ctx) => authRouter.handle(request, env, ctx));
router.all('/api/image/*', (request, env, ctx) => imageRouter.handle(request, env, ctx));
router.all('/api/text/*', (request, env, ctx) => textRouter.handle(request, env, ctx));
router.all('/api/code/*', (request, env, ctx) => codeRouter.handle(request, env, ctx));
router.all('/api/stats/*', (request, env, ctx) => statsRouter.handle(request, env, ctx));

router.get('/favicon.ico', async (request, env) => {
  return env.ASSETS.fetch(new Request(`${new URL(request.url).origin}/images/favicon.ico`));
});

router.get('/login', async (request, env) => {
  return env.ASSETS.fetch(new Request(`${new URL(request.url).origin}/templates/login.html`));
});

async function checkAuth(request: Request, env: Env): Promise<Response | null> {
  try {
    const { extractJwtFromCookie, verifyJwtToken } = await import('./utils/jwt');

    const token = extractJwtFromCookie(request);
    if (!token) {
      return Response.redirect(`${new URL(request.url).origin}/login`, 302);
    }

    if (!env.JWT_SECRET) {
      return Response.redirect(`${new URL(request.url).origin}/login`, 302);
    }

    const user = await verifyJwtToken(token, env.JWT_SECRET);
    if (!user || !user.isAuthenticated) {
      return Response.redirect(`${new URL(request.url).origin}/login`, 302);
    }

    return null;
  } catch {
    return Response.redirect(`${new URL(request.url).origin}/login`, 302);
  }
}

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
      const routerResponse = await router.handle(request, env, ctx);
      if (routerResponse) {
        return routerResponse;
      }

      try {
        return await env.ASSETS.fetch(request);
      } catch {
        const path = new URL(request.url).pathname;
        return new Response(`Not found: ${path}`, { status: 404 });
      }
    } catch (error) {
      console.error('Unhandled error:', error);
      return errorResponse('Server error', 500, request);
    }
  },
};
