/**
 * Utility functions for handling API responses
 */
import { ApiResponse } from '../types';

/**
 * Create a JSON response with appropriate headers
 */
export function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    status,
  });
}

/**
 * Create a success API response
 */
export function successResponse<T>(data: T): Response {
  const response: ApiResponse<T> = {
    success: true,
    data
  };
  return jsonResponse(response);
}

/**
 * Create an error response
 */
export function errorResponse(message: string, status: number = 400): Response {
  const response: ApiResponse = {
    success: false,
    error: message
  };
  return jsonResponse(response, status);
}

/**
 * Create a binary response (for images, etc.)
 */
export function binaryResponse(data: ArrayBuffer, contentType: string): Response {
  return new Response(data, {
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
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
    },
    status,
  });
}
