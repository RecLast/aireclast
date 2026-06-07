/**
 * Utility functions for handling API responses
 */
import { ApiResponse } from '../types';
import { getCorsHeaders } from './cors';

function buildJsonResponse(data: unknown, status: number, request?: Request): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(request),
    },
    status,
  });
}

/**
 * Create a JSON response with appropriate headers
 */
export function jsonResponse(data: unknown, status: number = 200, request?: Request): Response {
  return buildJsonResponse(data, status, request);
}

/**
 * Create a success API response
 */
export function successResponse<T>(data: T, request?: Request, status = 200): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return jsonResponse(response, status, request);
}

/**
 * Queue accepted — client should wait, poll status, then retry with queueToken
 */
export function queuedResponse<T>(data: T, request?: Request): Response {
  return successResponse(data, request, 202);
}

/**
 * Create an error response
 */
export function errorResponse(message: string, status: number = 400, request?: Request): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
  };
  return jsonResponse(response, status, request);
}

/**
 * Create a binary response (for images, etc.)
 */
export function binaryResponse(data: ArrayBuffer, contentType: string, request?: Request): Response {
  return new Response(data, {
    headers: {
      'Content-Type': contentType,
      ...getCorsHeaders(request),
    },
  });
}

/**
 * Create an HTML response
 */
export function htmlResponse(html: string, status: number = 200): Response {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    status,
  });
}
