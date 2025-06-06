// Modular API exports
// This file serves as the main entry point for all API modules

// Re-export base API utilities
export { api, apiWithAccount } from './base';

// Re-export all domain-specific APIs
export { authApi } from './auth';
export { accountsApi } from './accounts';
export { blogApi } from './blog';
export { notesApi } from './notes';
export { featureFlagsApi } from './featureFlags';
export { qstashApi } from './qstash';
export { guestbookApi } from './guestbook';
export { counterApi } from './counter';

// For convenience, you can also import individual APIs directly:
// import { authApi } from '../utils/api/auth';
// import { blogApi } from '../utils/api/blog';
// etc.
