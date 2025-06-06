const crypto = require('crypto');

/**
 * Secure ID generation utilities for consistent and strong ID creation
 * across all Netlify functions.
 */

/**
 * Generate a cryptographically secure random ID with optional prefix
 * @param {string} prefix - Optional prefix for the ID (e.g., 'user', 'note', 'task')
 * @param {number} length - Length of the random part (default: 16)
 * @returns {string} Secure random ID
 */
function generateSecureId(prefix = '', length = 16) {
  // Use crypto.randomBytes for cryptographically secure random generation
  const randomBytes = crypto.randomBytes(Math.ceil(length * 3 / 4));
  const randomString = randomBytes
    .toString('base64')
    .replace(/[+/]/g, '') // Remove URL-unsafe characters
    .replace(/=/g, '') // Remove padding
    .slice(0, length);
  
  const timestamp = Date.now().toString(36); // Base36 encoded timestamp
  
  if (prefix) {
    return `${prefix}_${timestamp}_${randomString}`;
  }
  
  return `${timestamp}_${randomString}`;
}

/**
 * Generate a secure user ID
 * @returns {string} Secure user ID with 'user' prefix
 */
function generateUserId() {
  return generateSecureId('user', 20);
}

/**
 * Generate a secure note ID
 * @returns {string} Secure note ID with 'note' prefix
 */
function generateNoteId() {
  return generateSecureId('note', 16);
}

/**
 * Generate a secure blog post ID
 * @returns {string} Secure blog post ID with 'post' prefix
 */
function generateBlogPostId() {
  return generateSecureId('post', 16);
}

/**
 * Generate a secure task ID
 * @returns {string} Secure task ID with 'task' prefix
 */
function generateTaskId() {
  return generateSecureId('task', 16);
}

/**
 * Generate a secure notification ID
 * @returns {string} Secure notification ID with 'notif' prefix
 */
function generateNotificationId() {
  return generateSecureId('notif', 16);
}

/**
 * Generate a secure account ID
 * @returns {string} Secure account ID with 'acc' prefix
 */
function generateAccountId() {
  return generateSecureId('acc', 18);
}

/**
 * Generate a secure invite ID
 * @returns {string} Secure invite ID with 'inv' prefix
 */
function generateInviteId() {
  return generateSecureId('inv', 16);
}

/**
 * Generate a secure session ID
 * @returns {string} Secure session ID with 'sess' prefix
 */
function generateSessionId() {
  return generateSecureId('sess', 24);
}

/**
 * Generate a secure API key
 * @returns {string} Secure API key (64 characters)
 */
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure token for various purposes (reset tokens, verification codes, etc.)
 * @param {number} length - Length in bytes (default: 32)
 * @returns {string} Secure hex token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a URL-safe secure ID (useful for slugs or public identifiers)
 * @param {string} prefix - Optional prefix
 * @param {number} length - Length of the random part
 * @returns {string} URL-safe secure ID
 */
function generateUrlSafeId(prefix = '', length = 12) {
  const randomBytes = crypto.randomBytes(length);
  const randomString = randomBytes
    .toString('base64')
    .replace(/[+/=]/g, '') // Remove URL-unsafe characters
    .slice(0, length);
  
  if (prefix) {
    return `${prefix}_${randomString}`;
  }
  
  return randomString;
}

/**
 * Validate if an ID follows the secure format
 * @param {string} id - ID to validate
 * @param {string} expectedPrefix - Expected prefix (optional)
 * @returns {boolean} True if ID is valid format
 */
function validateSecureId(id, expectedPrefix = null) {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Check for minimum length
  if (id.length < 12) {
    return false;
  }
  
  // Check prefix if provided
  if (expectedPrefix && !id.startsWith(`${expectedPrefix}_`)) {
    return false;
  }
  
  // Check for secure format (no weak patterns)
  const weakPatterns = [
    /^\d+$/, // Only numbers
    /^[a-f0-9]+$/, // Only hex (but could be weak)
    /(.)\1{4,}/, // Repeated characters
  ];
  
  return !weakPatterns.some(pattern => pattern.test(id));
}

module.exports = {
  generateSecureId,
  generateUserId,
  generateNoteId,
  generateBlogPostId,
  generateTaskId,
  generateNotificationId,
  generateAccountId,
  generateInviteId,
  generateSessionId,
  generateApiKey,
  generateSecureToken,
  generateUrlSafeId,
  validateSecureId,
};
