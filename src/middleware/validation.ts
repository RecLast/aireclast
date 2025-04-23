/**
 * Middleware for validating API requests
 */
import { IRequest } from 'itty-router';
import { errorResponse } from '../utils/response';
import { isEmailAllowed } from '../utils/email';
import { Env } from '../types';

/**
 * Validate that the request has the required fields
 */
export function validateRequestBody(requiredFields: string[]) {
  return async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response | void> => {
    // Check if request is a POST
    if (request.method !== 'POST') {
      return errorResponse('Method not allowed. Please use POST.', 405);
    }

    // Parse JSON body
    let data: Record<string, any>;
    try {
      data = await request.clone().json() as Record<string, any>;
    } catch (error) {
      return errorResponse('Invalid JSON in request body.', 400);
    }

    // Check for required fields
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        return errorResponse(`Missing required field: ${field}`, 400);
      }
    }

    // Add the parsed data to the request for use in handlers
    request.data = data;
  };
}

/**
 * Validate email format and check if it's in the allowed list
 */
export function validateEmail() {
  return async (request: IRequest, env: Env, ctx: ExecutionContext): Promise<Response | void> => {
    const data = request.data;

    if (!data || !data.email) {
      return errorResponse('Email is required', 400);
    }

    const email = data.email.trim();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Invalid email format', 400);
    }

    // Check if email is in the allowed list
    if (!isEmailAllowed(email, env.ALLOWED_EMAILS)) {
      return errorResponse('Email not authorized to access this application', 403);
    }
  };
}

/**
 * Validate verification code format
 */
export function validateVerificationCode() {
  return (request: IRequest, env: Env, ctx: ExecutionContext): Response | void => {
    const data = request.data;

    if (!data || !data.code) {
      return errorResponse('Verification code is required', 400);
    }

    const code = data.code.trim();

    // Verification code should be 6 digits
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(code)) {
      return errorResponse('Invalid verification code format', 400);
    }
  };
}
