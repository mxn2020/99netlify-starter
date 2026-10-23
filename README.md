# 🚀 Ultimate Multi-Platform Hackathon Template

A production-ready React application template built for rapid development during hackathons. Built with modern technologies and best practices to get you from idea to deployment in minutes on **any major platform** (Netlify, Vercel, and more).

## 🎯 Perfect For
- Hackathons and rapid prototyping
- SaaS MVPs
- AI-powered applications
- Real-time applications
- Blog platforms
- Note-taking apps

## ⚡ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Serverless Functions (Platform-agnostic)
- **Deployment**: Netlify, Vercel, or any serverless platform
- **Database**: Upstash Redis
- **Task Queue**: Upstash QStash
- **Authentication**: JWT with httpOnly cookies + bcrypt
- **Development**: Hot reload, ESLint, TypeScript

## 🌟 Features Out of the Box

### ✅ Enhanced Authentication System
- User registration and login with enhanced security
- JWT-based authentication with httpOnly cookies
- Protected routes with server-side token blacklisting
- Admin role system with granular permissions
- Profile management with real-time updates
- **NEW**: Password strength validation with visual indicators
- **NEW**: Rate limiting and brute force protection (5 attempts per 15 minutes)
- **NEW**: Enhanced input validation and XSS prevention
- **NEW**: Secure HTTP headers and CORS configuration
- **NEW**: Automatic welcome emails via QStash task queue

### ✅ Multi-Platform Deployment
- **Automatic Platform Detection** for Netlify and Vercel
- **Universal Serverless Functions** that work across platforms
- **Smart URL Resolution** with environment auto-detection
- **Platform-Agnostic CORS** configuration
- **Webhook URL Generation** for QStash and external services
- **Environment Variable Validation** with fallbacks
- **Zero-Config Deployment** on supported platforms

### ✅ Feature Flags System
- **Admin-controlled feature toggles** with real-time updates
- Category-based organization (Core, AI, Integration, Experimental)
- Status tracking (Active, Shipping Soon, Deprecated)
- Role-based feature visibility (admin-only features)
- **12 pre-configured features ready to implement**
- Live feature status dashboard
- Granular feature control per user role

### ✅ Task Queue (QStash Integration)
- **Asynchronous task processing** with guaranteed delivery
- Welcome email automation (triggered on user registration)
- Scheduled blog post publishing
- Background cleanup tasks
- Custom task scheduling with delays
- Retry mechanism with exponential backoff
- Dead letter queue for failed tasks
- Webhook signature verification for security
- Task monitoring and status tracking

### ✅ Content Management
- Personal notes with advanced categorization and tagging
- Public/private note visibility controls
- Blog system with admin controls and role-based permissions
- Markdown support with live preview
- Rich text editing capabilities
- Advanced search and filtering

### ✅ Real-time Examples
- Redis counter with atomic operations
- Interactive guestbook with live updates
- Live data synchronization
- WebSocket-ready architecture

### ✅ Modern UI/UX
- Dark/light theme toggle with system preference detection
- Fully responsive design (mobile-first approach)
- Configurable navigation layouts (sidebar/header)
- Comprehensive loading states and error handling
- Interactive particle background animations
- **NEW**: Feature status indicators and badges
- **NEW**: Real-time admin controls interface

### ✅ Developer Experience
- Full TypeScript support with strict type checking
- Hot module replacement for instant development feedback
- Built-in test suite with console commands
- Comprehensive ESLint configuration
- **NEW**: Feature flag hooks for easy integration
- **NEW**: QStash task management utilities

## 🚀 Quick Start

### Method 1a: Bolt.new
1. Visit [bolt.new](https://bolt.new)
2. Fork this repository
3. Create a new project from your fork
4. Follow setup steps below

### Method 1b: v0.dev
1. Visit [v0.dev](https://v0.dev)
2. Fork this repository
3. Create a new project from your fork
4. Follow setup steps below

### Method 1c: lovable.dev
1. Visit [lovable.dev](https://lovable.dev)
2. Fork this repository
3. Create a new project from your fork
4. Follow setup steps below

### Method 2: Traditional Setup
```bash
git clone https://github.com/mxn2020/99netlify-starter
cd 99netlify-starter
npm install
```

### Method 3: Deploy to Netlify/Vercel
1. Fork this repository
2. Connect to Netlify/Vercel via GitHub
3. Configure environment variables (see below)
4. Deploy automatically

> 📖 **Detailed Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete platform-specific instructions and troubleshooting.
> 
> 🔧 **Implementation Details**: See [PLATFORM_IMPLEMENTATION.md](./PLATFORM_IMPLEMENTATION.md) for technical details about the platform-agnostic implementation.

## 🔧 Configuration

### 1. Create Upstash Redis Database
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create new Redis database
3. Copy the REST URL and Token

### 2. Create Upstash QStash (Required for Task Queue)
1. In [Upstash Console](https://console.upstash.com/), navigate to QStash
2. Create a new QStash instance
3. Copy the QStash Token and Signing Keys
4. Note your webhook endpoint URL for production

### 3. Deploy to Your Platform

#### Option A: Netlify
1. Connect your GitHub repository to Netlify
2. Deploy with default settings
3. Note your Netlify URL (e.g., `https://your-app.netlify.app`)

#### Option B: Vercel
1. Connect your GitHub repository to Vercel  
2. Deploy with default settings
3. Note your Vercel URL (e.g., `https://your-app.vercel.app`)

### 4. Environment Variables
Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Then edit `.env` and update the required values:

```env
# Upstash Redis Configuration (required)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Upstash QStash Configuration (required for task queue)
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-current-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# JWT Secret (required - generate a random string)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Application URL (optional - auto-detected on most platforms)
VITE_APP_URL=https://your-app.your-platform.app
```

> 💡 **Platform Detection**: The template automatically detects your deployment platform (Netlify, Vercel, etc.) and handles URL configuration accordingly. You only need to set `VITE_APP_URL` if you want to override the auto-detection.

### 5. Platform Environment Variables

#### For Netlify:
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add each variable from your `.env` file
3. Redeploy your site

#### For Vercel:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add each variable from your `.env` file  
3. Redeploy your project

> 💡 **Auto-Configuration**: Both platforms automatically provide `URL`/`VERCEL_URL` and `CONTEXT`/`VERCEL_ENV` variables. You don't need to set these manually.

### 6. Create Admin User
```bash
# In your project terminal
npm run create_admin
```

Default admin credentials:
- Email: `admin@example.com`
- Password: `admin123`

## 🔒 Security Features

This template implements enterprise-grade security measures:

### Authentication Security
- **httpOnly Cookies**: JWTs stored in secure, httpOnly cookies (not localStorage)
- **Token Blacklisting**: Server-side token invalidation for secure logout
- **Rate Limiting**: 5 login attempts per 15 minutes per IP
- **Password Security**: bcrypt with 12 rounds + strength validation
- **Session Management**: 1-hour token expiration with auto-refresh

### API Security
- **Input Validation**: Comprehensive request validation and sanitization
- **XSS Prevention**: Content Security Policy and input escaping
- **CORS Configuration**: Strict origin controls
- **Security Headers**: HSTS, X-Frame-Options, and more
- **Webhook Verification**: QStash signature validation

### Feature Security
- **Role-based Access**: Admin-only features and routes
- **Feature Flag Protection**: Secure feature toggle controls
- **Task Queue Security**: Signed webhooks and payload validation

## 🛠️ Development

```bash
# Start development server
npm run dev

# Start Netlify development (with functions)
npm run dev:netlify

# Build for production
npm run build

# Run tests
npm run test-api
npm run test-auth-security
npm run test-feature-flags
npm run test-platform
npm run validate-env

# Create admin user
npm run create_admin

# Manage blog posts
npm run manage-blog list
npm run manage-blog delete-all

# Test QStash integration
npm run test-qstash
```

## 🧪 Testing Features

### Console Testing
Open browser console and try:
```javascript
// Test profile updates
appTests.testProfileUpdate()

// Check responsive design
appTests.testViewportSize()

// Test navigation layout switching
appTests.testNavigationLayout()

// Test feature flags
appTests.testFeatureFlags()

// Test QStash integration
appTests.testQStash()

// Measure performance
appTests.testPerformance()

// Run all tests
appTests.runAllTests()
```

### Built-in Test Page
Visit `/test` in your app for comprehensive GUI testing tools.

## 📁 Project Structure

```
├── netlify/
│   └── functions/           # Serverless functions
│       ├── auth/           # Enhanced authentication endpoints
│       ├── blog/           # Blog management with permissions
│       ├── notes/          # Notes management
│       ├── feature-flags/  # 🆕 Feature flag management (admin only)
│       ├── qstash/         # 🆕 Task queue handling and webhooks
│       ├── counter/        # Example: Redis counter
│       └── guestbook/      # Example: Redis guestbook
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── shared/        # Common components
│   │   │   └── FeatureFlagDemo.tsx  # 🆕 Feature status display
│   │   └── layout/        # Layout components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   │   ├── useFeatureFlags.ts  # 🆕 Feature flag management
│   │   └── useAuth.ts     # Enhanced authentication
│   ├── pages/             # Page components
│   │   └── admin/         # 🆕 Admin-only pages
│   │       └── FeatureFlagsPage.tsx  # Feature flag control panel
│   ├── types/             # TypeScript types
│   │   └── featureFlags.ts     # 🆕 Feature flag type definitions
│   └── utils/             # Utility functions
├── scripts/               # Utility scripts
└── public/               # Static assets
```

## 🔌 API Endpoints

### Enhanced Authentication
- `POST /auth/register` - User registration (+ automatic QStash welcome email)
- `POST /auth/login` - User login with rate limiting
- `GET /auth/me` - Get current user (cookie-based)
- `PUT /auth/profile` - Update profile
- `PUT /auth/password` - Secure password change with validation
- `DELETE /auth/logout` - Logout with server-side token blacklisting

### Feature Flags (Admin Only)
- `GET /feature-flags` - List feature flags (role-filtered)
- `PUT /feature-flags/:id` - Update feature flag (admin only)
- `POST /feature-flags/reset` - Reset to defaults (admin only)

### QStash Task Queue
- `POST /qstash/schedule` - Schedule a custom task
- `POST /qstash/welcome-email` - Send welcome email
- `GET /qstash/tasks` - Get user's task history
- `POST /qstash/webhook` - QStash webhook endpoint (internal)

### Content Management
- `GET /notes` - List user notes with advanced filtering
- `POST /notes` - Create note
- `GET /notes/:id` - Get specific note
- `PUT /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note

### Blog System
- `GET /blog` - List all posts (public)
- `GET /blog/:slug` - Get specific post (public)
- `POST /blog` - Create post (auth + role required)
- `PUT /blog/:slug` - Update post (auth + role required)
- `DELETE /blog/:slug` - Delete post (auth + role required)

### Interactive Examples
- `GET /counter` - Get counter value
- `POST /counter` - Increment counter
- `DELETE /counter` - Reset counter
- `GET /guestbook` - Get guestbook entries
- `POST /guestbook` - Add guestbook entry

## 🎛️ Feature Flags

The template includes a comprehensive feature flag system with 12 pre-configured features:

### 🟢 Active Features
- **Upstash QStash**: Task queue for async operations and email automation

### 🔵 Shipping Soon Features
- **Upstash Vector Search**: AI-powered semantic search for notes
- **Upstash Workflow**: Multi-step process orchestration with state management
- **Upstash Search**: Full-text search across all content
- **Netlify Identity**: Social login integration (Google, GitHub)
- **Netlify Blobs**: File upload handling for avatars and images
- **Sentry Monitoring**: Error tracking and performance monitoring
- **Web3 Token Gating**: Blockchain-based premium content access
- **ElevenLabs TTS**: AI text-to-speech for article narration
- **Tavus Personalized Video**: AI-generated welcome and milestone videos
- **Advanced Analytics**: Usage insights and behavior tracking (admin only)
- **API Rate Limiting**: Advanced rate controls with burst allowances (admin only)

### Admin Control Features
- Real-time feature toggle controls
- Category-based organization and filtering
- Status management (Active/Shipping Soon/Deprecated)
- Role-based visibility controls
- Bulk operations and reset functionality

## 🚀 QStash Task Queue

The template includes full QStash integration for reliable background processing:

### Core Features
- **Welcome Emails**: Automatically queued and sent after user registration
- **Scheduled Tasks**: Blog post publishing, cleanup operations, notifications
- **Retry Logic**: Automatic retry with exponential backoff (up to 5 attempts)
- **Dead Letter Queue**: Failed task recovery and debugging
- **Webhook Security**: Cryptographic signature verification for all incoming tasks
- **Task Monitoring**: Real-time status tracking and history

### Usage Examples
```typescript
// Schedule a welcome email (automatic on registration)
await api.post('/qstash/welcome-email', {
  email: 'user@example.com',
  name: 'John Doe'
});

// Schedule a custom task with delay
await api.post('/qstash/schedule', {
  type: 'notification',
  payload: { 
    userId: 'user123',
    message: 'Your report is ready!' 
  },
  delay: 3600 // 1 hour delay
});

// Schedule a blog post for future publication
// Note: postId should be the slug of an existing blog post
await api.post('/qstash/schedule', {
  type: 'scheduled_blog_post',
  payload: { 
    postId: 'hello-ai-world', // slug of existing blog post
    action: 'publish'         // action to perform: 'publish'
  },
  scheduledFor: '2024-01-01T10:00:00Z'
});
```

## 👤 Enhanced User Management

### Profile & Settings
Comprehensive user management with security-first approach:

**Profile Management:**
- Real-time profile updates
- Avatar upload support (when Netlify Blobs feature is enabled)
- Preference management (theme, layout, notifications)

**Security Settings:**
- **Secure Password Change**: Multi-step validation with current password verification
- **Password Strength Meter**: Real-time visual feedback with security requirements
- **Rate Limiting**: Protection against brute force attacks
- **Session Management**: View and manage active sessions
- **Two-Factor Authentication**: Ready for TOTP integration

**Admin Features:**
- **Feature Flag Control**: Real-time toggle controls for all platform features
- **User Management**: View and manage user accounts (coming soon)
- **System Monitoring**: QStash task queue status and performance metrics
- **Analytics Dashboard**: User behavior and feature usage insights

## 🎨 Customization

### Adding New Features
1. **Define the feature flag**:
   ```typescript
   // Add to src/types/featureFlags.ts
   {
     id: 'my_new_feature',
     name: 'My New Feature',
     description: 'Description of what this feature does',
     enabled: false,
     category: 'core',
     status: 'shipping_soon'
   }
   ```

2. **Use in components**:
   ```typescript
   const { isFeatureEnabled } = useFeatureFlags();
   
   if (isFeatureEnabled('my_new_feature')) {
     // Render feature
   }
   ```

3. **Enable via admin panel** at `/admin/feature-flags`

### Theme Customization
Edit `src/index.css` for comprehensive theming:
```css
:root {
  --primary: your-primary-color;
  --secondary: your-secondary-color;
  /* Full color system available */
}
```

### Database Schema
Redis patterns used in the template:
```
user:{userId}                    # User data with enhanced security
user:email:{email}              # Email to user ID mapping
note:{noteId}                   # Note data with metadata
user:{userId}:notes             # User's note IDs list
blog:post:{slug}                # Blog post data
blog:posts_list                 # List of post slugs
feature_flags                   # Global feature flag configuration
task:{taskId}                   # QStash task data and status
user:{userId}:tasks             # User's task IDs list
session:{sessionId}             # Session management data
token_blacklist:{tokenId}       # Blacklisted JWT tokens
rate_limit:{ip}:{endpoint}      # Rate limiting counters
```

## 🚢 Deployment

### Netlify (Automatic)
1. Push to your connected GitHub repository
2. Netlify automatically deploys frontend and functions
3. QStash webhooks are automatically configured

### Manual Deployment
```bash
npm run build
netlify deploy --prod
```

### Production Checklist
- [ ] Set secure JWT_SECRET (32+ characters)
- [ ] Configure QStash webhook URLs
- [ ] Set CORS_ORIGIN to your domain
- [ ] Enable SECURE_COOKIES=true
- [ ] Configure rate limiting for your scale
- [ ] Set up monitoring and alerting
- [ ] Test all feature flags
- [ ] Verify QStash webhook signatures

## 🔍 Troubleshooting

### Common Issues

**QStash webhooks not working:**
- Verify QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY are set
- Check that webhook URL is publicly accessible
- Ensure feature flag 'upstash_qstash' is enabled
- **All Environments**: QStash is used directly in all environments (development and production)

**Feature flags not updating:**
- Check super admin permissions (user.role === 'super-admin')
- Verify Redis connection is stable
- Clear browser cache and retry

**Authentication issues:**
- Ensure JWT_SECRET is set and matches across deployments
- Check that cookies are being sent (CORS settings)
- Verify rate limiting isn't blocking requests

**Performance issues:**
- Enable Redis connection pooling
- Optimize feature flag caching
- Monitor QStash task queue length

### Debug Mode
Enable comprehensive debugging:
```env
DEBUG=true
QSTASH_DEBUG=true
LOG_LEVEL=debug
```

## 🆕 What's New in v2.0

### 🎯 Major Features
- **Complete Feature Flag System**: Admin-controlled toggles for 12+ features
- **QStash Task Queue**: Reliable async processing with welcome emails
- **Enhanced Security**: httpOnly cookies, rate limiting, and token blacklisting
- **Advanced Admin Panel**: Real-time feature management and system monitoring
- **Production Monitoring**: Comprehensive error handling and status tracking

### 🔧 Developer Experience
- **Feature Flag Hooks**: Easy integration with `useFeatureFlag()`
- **Task Queue Utilities**: Simple API for scheduling background jobs
- **Enhanced Testing**: Console commands for all new features
- **Better Documentation**: Comprehensive setup and usage guides

### 🛡️ Security Improvements
- **Cookie-based Auth**: More secure than localStorage-based tokens
- **Rate Limiting**: Prevents brute force and abuse
- **Input Validation**: Comprehensive request sanitization
- **Webhook Security**: Cryptographic verification for all external calls

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

Apache License 2.0 - feel free to use this template for your projects!

## 🆘 Support

- Create an issue on GitHub
- Check the troubleshooting section
- Review the built-in test suite at `/test`
- Visit the admin panel at `/admin/feature-flags` for system status

## 🔮 Coming Soon

The following features are pre-configured and ready to implement:

- **🔍 AI-Powered Search**: Semantic search using Upstash Vector
- **🎵 Voice Features**: Text-to-speech with ElevenLabs
- **🎥 Video Personalization**: AI-generated videos with Tavus
- **🔐 Social Authentication**: GitHub and Google login via Netlify Identity
- **📁 File Management**: Image uploads with Netlify Blobs
- **📊 Advanced Analytics**: User behavior insights and performance monitoring
- **🌐 Web3 Integration**: Token-gated content and blockchain features

---

**Happy Hacking! 🎉**

*Built with ❤️ for the developer community. This template powers hackathon winners and production apps alike.*

---

> **License note:** As of 2026-10-23 this project is licensed under the Apache License 2.0 (previously MIT). Versions released before this change remain available under MIT to those who received them.
