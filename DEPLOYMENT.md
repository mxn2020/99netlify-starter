# Platform Deployment Guide

This template is designed to work seamlessly across multiple deployment platforms. Here's how the platform detection and configuration works:

## 🤖 Automatic Platform Detection

The template automatically detects your deployment platform and configures itself accordingly:

### Netlify Detection
- **Environment Variables**: `URL`, `CONTEXT`
- **Function Path**: `/.netlify/functions/`
- **Contexts**: `production`, `deploy-preview`, `branch-deploy`

### Vercel Detection  
- **Environment Variables**: `VERCEL_URL`, `VERCEL_ENV`
- **Function Path**: `/api/`
- **Environments**: `production`, `preview`, `development`

### Local Development
- **Fallback URL**: `http://localhost:8888`
- **Function Path**: `/.netlify/functions/` (using Netlify CLI)

## 🔧 Environment Variable Handling

### Required Variables (All Platforms)
```env
# Database
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Task Queue
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-current-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# Security
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
```

### Optional Override Variables
```env
# Override auto-detected URL
VITE_APP_URL=https://custom-domain.com

# Custom CORS origins (comma-separated)
CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

### Platform-Specific Variables (Auto-Set)
**Netlify** (automatically provided):
- `URL` - Site URL
- `CONTEXT` - Deployment context

**Vercel** (automatically provided):
- `VERCEL_URL` - Deployment URL  
- `VERCEL_ENV` - Environment type

## 📁 Function Structure

The serverless functions are organized to work on both platforms:

```
netlify/functions/
├── platform-utils.cjs          # Platform detection utilities
├── auth/index.cjs              # Authentication endpoints
├── blog/index.cjs              # Blog management
├── counter/index.cjs           # Redis counter example
├── feature-flags/index.cjs     # Feature flag management
├── guestbook/index.cjs         # Guestbook example
├── notes/index.cjs             # Notes management
└── qstash/index.cjs            # Task queue management
```

### Netlify Functions
- **Path**: `/.netlify/functions/{function-name}`
- **Runtime**: Node.js 18.x
- **Config**: `netlify.toml`

### Vercel API Routes (via rewrites)
- **Path**: `/api/{function-name}`
- **Runtime**: Node.js 18.x  
- **Config**: `vercel.json`

## 🚀 Deployment Instructions

### Deploy to Netlify

1. **Connect Repository**
   ```bash
   # Via Netlify Dashboard
   # 1. Go to https://app.netlify.com
   # 2. Click "New site from Git"
   # 3. Choose your repository
   ```

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

3. **Set Environment Variables**
   ```bash
   # Via Netlify Dashboard → Site Settings → Environment Variables
   # Add all required variables from .env.example
   ```

### Deploy to Vercel

1. **Connect Repository**
   ```bash
   # Via Vercel Dashboard  
   # 1. Go to https://vercel.com/dashboard
   # 2. Click "New Project"
   # 3. Import your repository
   ```

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Set Environment Variables**
   ```bash
   # Via Vercel Dashboard → Project Settings → Environment Variables
   # Add all required variables from .env.example
   ```

## 🔀 URL Resolution Priority

The platform utilities resolve URLs in this order:

1. `VITE_APP_URL` (manual override)
2. `VERCEL_URL` (Vercel automatic)
3. `URL` (Netlify automatic)  
4. `http://localhost:8888` (development fallback)

## 🛠️ CORS Configuration

CORS is automatically configured based on the detected platform:

### Production
- Uses the primary deployment URL
- Strict origin checking

### Development/Preview
- Includes common development ports
- More permissive for testing

### Custom Origins
Set `CORS_ORIGINS` for custom domain configurations:
```env
CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

## 🐛 Troubleshooting

### Function URLs Not Working
1. Check platform-specific function paths:
   - Netlify: `https://your-site.netlify.app/.netlify/functions/auth`
   - Vercel: `https://your-site.vercel.app/api/auth`

2. Verify environment variables are set correctly

3. Check deployment logs for errors

### CORS Issues
1. Ensure `VITE_APP_URL` matches your frontend URL
2. Check `CORS_ORIGINS` configuration
3. Verify platform detection is working

### QStash Webhooks
1. Update webhook URLs in QStash dashboard:
   - Netlify: `https://your-site.netlify.app/.netlify/functions/qstash/webhook`
   - Vercel: `https://your-site.vercel.app/api/qstash/webhook`

## 📝 Migration Between Platforms

To migrate from one platform to another:

1. **Export Environment Variables**
   ```bash
   # Save current environment variables
   ```

2. **Update Webhook URLs**
   - QStash webhook endpoints
   - Any external service callbacks

3. **Deploy to New Platform**
   - Follow deployment instructions above
   - Import environment variables

4. **Test All Endpoints**
   - Authentication flows
   - Database connections
   - Task queue functionality

The platform detection will automatically handle the URL and function path differences.
