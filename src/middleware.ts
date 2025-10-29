import { NextRequest, NextResponse } from 'next/server';
import { authRateLimit, apiRateLimit, uploadRateLimit, contactRateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Apply rate limiting based on route
  if (pathname.startsWith('/api/auth/')) {
    const result = isDevelopment ? { success: true, limit: 1000, remaining: 999, reset: Date.now() + 60000 } : await authRateLimit(request);
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many authentication attempts. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
          }
        }
      );
    }
  }

  if (pathname.startsWith('/api/upload')) {
    const result = isDevelopment ? { success: true, limit: 1000, remaining: 999, reset: Date.now() + 60000 } : await uploadRateLimit(request);
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Upload limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
          }
        }
      );
    }
  }

  if (pathname.startsWith('/api/contact')) {
    const result = isDevelopment ? { success: true, limit: 1000, remaining: 999, reset: Date.now() + 60000 } : await contactRateLimit(request);
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Contact form limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
          }
        }
      );
    }
  }

  if (pathname.startsWith('/api/')) {
    const result = isDevelopment ? { success: true, limit: 1000, remaining: 999, reset: Date.now() + 60000 } : await apiRateLimit(request);
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'API rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
          }
        }
      );
    }
  }

  // Security headers for all responses
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
