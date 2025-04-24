/**
 * Type definitions for the application
 */

// Environment variables and bindings
export interface Env {
  // Cloudflare AI binding
  AI: any;

  // KV namespace for authentication
  AUTH_STORE: KVNamespace;

  // Static assets binding
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };

  // Environment variables
  ALLOWED_EMAILS?: string;
  USER_CREDENTIALS?: string;
  JWT_SECRET: string;
}

// User session data
export interface UserSession {
  email: string;
  isAuthenticated: boolean;
  exp: number;
}



// API response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Stats data
export interface StatsData {
  totalRequests: number;
  textRequests: number;
  imageRequests: number;
  codeRequests: number;
  lastUpdated: string;
}

// Image generation request
export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
}

// Text generation request
export interface TextGenerationRequest {
  prompt: string;
  model?: string;
  options?: Record<string, any>;
}

// Code generation request
export interface CodeGenerationRequest {
  prompt: string;
  model?: string;
  options?: Record<string, any>;
}
