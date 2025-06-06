// DEPRECATED: This file is maintained for backward compatibility only.
// Please import from the modular API structure instead:
// import { authApi } from './api/auth';
// import { blogApi } from './api/blog';
// etc.

// Re-export base API utilities
export { api, apiWithAccount } from './api/base';

// Re-export all domain-specific APIs
export { authApi } from './api/auth';
export { accountsApi } from './api/accounts';
export { blogApi } from './api/blog';
export { notesApi } from './api/notes';
export { featureFlagsApi } from './api/featureFlags';
export { qstashApi } from './api/qstash';
export { guestbookApi } from './api/guestbook';
export { counterApi } from './api/counter';
