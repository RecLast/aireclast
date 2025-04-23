/**
 * JWT utility functions for authentication
 */
import { SignJWT, jwtVerify } from 'jose';
import { UserSession } from '../types';

// JWT expiration time (24 hours)
const JWT_EXPIRATION = 24 * 60 * 60;

/**
 * Create a JWT token for a user session
 */
export async function createJwtToken(email: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);
  
  const now = Math.floor(Date.now() / 1000);
  const exp = now + JWT_EXPIRATION;
  
  const jwt = await new SignJWT({ email, isAuthenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(secretKey);
  
  return jwt;
}

/**
 * Verify a JWT token and return the user session
 */
export async function verifyJwtToken(token: string, secret: string): Promise<UserSession | null> {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);
    
    const { payload } = await jwtVerify(token, secretKey);
    
    return {
      email: payload.email as string,
      isAuthenticated: payload.isAuthenticated as boolean,
      exp: payload.exp as number
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Extract JWT token from Authorization header
 */
export function extractJwtFromHeader(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Extract JWT token from cookie
 */
export function extractJwtFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return null;
  }
  
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  const authCookie = cookies.find(cookie => cookie.startsWith('auth='));
  
  if (!authCookie) {
    return null;
  }
  
  return authCookie.substring(5);
}

/**
 * Create a cookie with the JWT token
 */
export function createAuthCookie(token: string, expiresInSeconds: number = JWT_EXPIRATION): string {
  const expires = new Date(Date.now() + expiresInSeconds * 1000).toUTCString();
  return `auth=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${expires}`;
}

/**
 * Create a cookie to clear the JWT token
 */
export function clearAuthCookie(): string {
  return 'auth=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
}
