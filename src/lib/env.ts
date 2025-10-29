import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // Google OAuth (removed - not needed)
  // GOOGLE_CLIENT_ID: z.string().optional(),
  // GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // AWS S3
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  S3_BUCKET: z.string().min(1, 'S3_BUCKET is required'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  S3_PUBLIC_BASE_URL: z.string().url('Invalid S3_PUBLIC_BASE_URL'),
  
  // Instagram (optional)
  INSTAGRAM_APP_ID: z.string().optional(),
  INSTAGRAM_APP_SECRET: z.string().optional(),
  INSTAGRAM_REDIRECT_URI: z.string().url().optional(),
  
  // Facebook/Instagram Graph API (optional)
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  FACEBOOK_REDIRECT_URI: z.string().url().optional(),
  
  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  
  // Performance (optional)
  REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  CDN_URL: z.string().url().optional(),
  
  // Security
  RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').optional(),
  CORS_ORIGIN: z.string().url().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

// Lazy validation - only validate when actually needed
let validatedEnv: z.infer<typeof envSchema> | null = null;

function getValidatedEnv() {
  if (validatedEnv === null) {
    validatedEnv = validateEnv();
  }
  return validatedEnv;
}

// Export validated environment variables with lazy loading
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(target, prop) {
    const validated = getValidatedEnv();
    return validated[prop as keyof typeof validated];
  }
});

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;

// Helper functions
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

// Required environment variables for production
export const requiredProductionVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'AWS_REGION',
  'S3_BUCKET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_PUBLIC_BASE_URL',
] as const;

// Check if all required production variables are set
export function validateProductionEnv(): boolean {
  if (!isProduction) return true;
  
  const missing = requiredProductionVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}

// Safe environment variable access for build time
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

// Check if we're in build mode (when environment variables might not be available)
export function isBuildTime(): boolean {
  return process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;
}
