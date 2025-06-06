/**
 * Platform-agnostic utility functions for handling environment variables
 * across different deployment platforms (Netlify, Vercel, etc.)
 */

/**
 * Get the current deployment URL based on the platform
 * Handles both Netlify and Vercel environment variables
 */
export function getDeploymentUrl(): string {
  // Development environment
  if (process.env.NODE_ENV === 'development') {
    return process.env.VITE_APP_URL || 'http://localhost:8888';
  }

  // Production/staging environments
  // Priority order: Custom URL > Vercel URL > Netlify URL > fallback
  return (
    process.env.VITE_APP_URL ||           // Custom override
    process.env.VERCEL_URL ||             // Vercel automatic
    process.env.URL ||                    // Netlify automatic
    'https://localhost:8888'              // Fallback
  );
}

/**
 * Get the deployment context/environment
 * Handles both Netlify and Vercel context variables
 */
export function getDeploymentContext(): string {
  // Vercel environments
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV; // 'production', 'preview', or 'development'
  }
  
  // Netlify environments
  if (process.env.CONTEXT) {
    return process.env.CONTEXT; // 'production', 'deploy-preview', 'branch-deploy', etc.
  }

  // Fallback based on NODE_ENV
  return process.env.NODE_ENV || 'development';
}

/**
 * Check if we're running in production
 */
export function isProduction(): boolean {
  const context = getDeploymentContext();
  return context === 'production';
}

/**
 * Check if we're running in a preview/staging environment
 */
export function isPreview(): boolean {
  const context = getDeploymentContext();
  return context === 'preview' || context === 'deploy-preview' || context === 'branch-deploy';
}

/**
 * Get CORS origins based on environment
 */
export function getCorsOrigins(): string[] {
  const corsOrigins = process.env.CORS_ORIGINS;
  
  if (corsOrigins) {
    return corsOrigins.split(',').map(origin => origin.trim());
  }

  // Default origins based on environment
  const deploymentUrl = getDeploymentUrl();
  const baseOrigins = [deploymentUrl];

  // Add common development origins in non-production
  if (!isProduction()) {
    baseOrigins.push(
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8888'
    );
  }

  return baseOrigins;
}

/**
 * Get the primary CORS origin for Access-Control-Allow-Origin header
 */
export function getPrimaryCorsOrigin(): string {
  const corsOrigins = getCorsOrigins();
  return corsOrigins[0] || '*';
}
