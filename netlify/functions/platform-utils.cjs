/**
 * Platform-agnostic utility functions for serverless functions
 * Handles environment variables across different deployment platforms
 */

/**
 * Get the current deployment URL based on the platform
 * Handles both Netlify and Vercel environment variables
 */
function getDeploymentUrl() {
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
function getDeploymentContext() {
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
function isProduction() {
  const context = getDeploymentContext();
  return context === 'production';
}

/**
 * Check if we're running in a preview/staging environment
 */
function isPreview() {
  const context = getDeploymentContext();
  return context === 'preview' || context === 'deploy-preview' || context === 'branch-deploy';
}

/**
 * Get CORS origins based on environment
 */
function getCorsOrigins() {
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
function getPrimaryCorsOrigin() {
  const corsOrigins = getCorsOrigins();
  return corsOrigins[0] || '*';
}

/**
 * Get webhook URL for QStash or other webhook services
 * Handles both Netlify Functions and Vercel API routes
 */
function getWebhookUrl(path) {
  const baseUrl = getDeploymentUrl();
  
  // Determine the correct function path based on platform
  if (process.env.VERCEL_ENV) {
    // Vercel uses /api/ for serverless functions
    return `${baseUrl}/api/${path}`;
  } else {
    // Netlify uses /.netlify/functions/
    return `${baseUrl}/.netlify/functions/${path}`;
  }
}

/**
 * Get standard CORS headers for serverless functions
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': getPrimaryCorsOrigin(),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };
}

module.exports = {
  getDeploymentUrl,
  getDeploymentContext,
  isProduction,
  isPreview,
  getCorsOrigins,
  getPrimaryCorsOrigin,
  getWebhookUrl,
  getCorsHeaders
};
