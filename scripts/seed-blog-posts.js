const { Redis } = require('@upstash/redis');
const { generateBlogPostId } = require('../netlify/functions/secure-id-utils.cjs');
require('dotenv').config();

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Helper to create a slug
const slugify = (text) => text.toString().toLowerCase()
  .replace(/\s+/g, '-')        // Replace spaces with -
  .replace(/[^\w-]+/g, '')     // Remove all non-word chars
  .replace(/--+/g, '-')        // Replace multiple - with single -
  .replace(/^-+/, '')          // Trim - from start of text
  .replace(/-+$/, '');         // Trim - from end of text

// Blog posts data
const blogPosts = [
  {
    title: "About This Template",
    summary: "An introduction to this versatile React application template and its key features.",
    content: `# About This Template

This modern React application template is designed to help you quickly bootstrap fully-featured web applications. It comes with everything you need to start building right away.

## Key Features

* **TypeScript Integration**: Full TypeScript support with strict type checking for reliable code
* **Responsive UI**: Built with Tailwind CSS and Shadcn UI components
* **Authentication**: Complete user login and registration flows
* **Database Integration**: Ready-to-use Redis database integration
* **Serverless Functions**: Netlify Functions for backend APIs
* **Blog System**: Fully functional blog with admin controls
* **Dark Mode**: Built-in light/dark theme support
* **Component Library**: Rich set of reusable UI components

This template provides an excellent foundation for quickly building professional web applications of any scale.`,
    tags: ["template", "introduction", "react", "features"]
  },
  {
    title: "Detailed Description About the Template",
    summary: "A comprehensive look at the architecture and components of this React template.",
    content: `# Detailed Description of the Template

This template is built with a focus on developer experience and modern best practices. It provides a complete solution for building web applications with React, TypeScript, and Netlify.

## Architecture Overview

The application uses a modern architecture with the following components:

1. **Frontend**: React with TypeScript, built using Vite for ultra-fast development
2. **Styling**: Tailwind CSS with a custom theme configuration
3. **UI Components**: Shadcn UI components that are fully customizable
4. **State Management**: React Context API for global state
5. **Routing**: React Router v6 for navigation
6. **Backend**: Netlify Functions for serverless API endpoints
7. **Data Storage**: Upstash Redis for data persistence
8. **Authentication**: JWT-based authentication with secure token handling

## Directory Structure

- \`/src\`: Frontend React code
  - \`/components\`: Reusable UI components
  - \`/contexts\`: React context providers
  - \`/hooks\`: Custom React hooks
  - \`/pages\`: Page components
  - \`/types\`: TypeScript type definitions
  - \`/utils\`: Utility functions
- \`/netlify/functions\`: Serverless function endpoints
- \`/public\`: Static assets

## Development Workflow

The template is set up for an efficient development workflow:
- Fast refresh with Vite
- TypeScript for type safety
- ESLint and Prettier for code quality
- Easy deployment to Netlify

This template is ideal for both small projects and larger applications that need to scale.`,
    tags: ["architecture", "structure", "components", "development"]
  },
  {
    title: "How It Can Be Used with Bolt.new",
    summary: "Learn how to leverage this template with Bolt.new for rapid development.",
    content: `# Using This Template with Bolt.new

[Bolt.new](https://bolt.new) (a hypothetical service) provides a way to instantly create new projects from templates like this one. Here's how you can use this template with Bolt.new to kickstart your development:

## Quick Start with Bolt.new

1. Visit [bolt.new](https://bolt.new) and select this template
2. Configure your project settings (name, description, etc.)
3. Select your preferred deployment platform (Netlify, Vercel, etc.)
4. Click "Create Project"

Within seconds, you'll have a fully functional project repository with all the code from this template, ready to customize.

## Configuration Steps

After creating your project with Bolt.new, you'll need to:

1. Set up environment variables for your deployment platform
2. Configure the Upstash Redis database
3. Set your authentication settings
4. Customize the theme and branding

## Development and Deployment

Bolt.new integrates with popular Git providers and deployment platforms, allowing you to:
1. Automatically create a new repository
2. Set up continuous deployment
3. Configure preview deployments for pull requests
4. Manage environment variables securely

This integration makes it incredibly easy to go from template to production-ready application in minutes instead of hours or days.`,
    tags: ["boltdotnew", "templates", "quickstart", "deployment"]
  },
  {
    title: "How It Can Be Used to Create a SaaS",
    summary: "A guide on using this template as the foundation for building a SaaS product.",
    content: `# Creating a SaaS with This Template

This template provides an excellent starting point for building a Software as a Service (SaaS) product, saving you weeks of development time.

## SaaS Features Built-In

The template already includes many features essential for SaaS applications:

1. **User Authentication**: Registration, login, and profile management
2. **Admin Controls**: Dashboard for managing users and content
3. **Content Management**: Blog system that can be adapted for other content types
4. **API Architecture**: Well-structured serverless functions
5. **Database Integration**: Redis setup for data persistence
6. **UI Components**: Ready-to-use components for dashboards, forms, and more

## Steps to Transform into a SaaS

1. **Implement Subscription Management**
   - Add Stripe or another payment processor
   - Create subscription plans and pricing pages
   - Build billing and invoice features

2. **Enhance User Management**
   - Add team/organization features
   - Implement role-based access control
   - Create user onboarding flows

3. **Create SaaS-specific Features**
   - Build your core product features
   - Implement usage tracking and analytics
   - Add notification systems

4. **Set Up Monitoring and Scaling**
   - Implement error tracking
   - Set up performance monitoring
   - Prepare for scaling with increased usage

By starting with this template, you can focus on building your unique SaaS features rather than spending time on common infrastructure and components.`,
    tags: ["saas", "business", "subscription", "product"]
  },
  {
    title: "How It Can Be Used to Create an AI SaaS",
    summary: "Learn how to extend this template to build an AI-powered SaaS application.",
    content: `# Building an AI-Powered SaaS with This Template

This template can be extended to create sophisticated AI-powered SaaS applications with minimal effort.

## Integration with AI Services

You can easily integrate with popular AI services:

1. **OpenAI API**
   - Add API integration with Netlify Functions
   - Create chat or completion interfaces
   - Build prompt management systems

2. **Hugging Face**
   - Integrate with Inference API
   - Use open-source models
   - Create specialized AI features

3. **Vector Database Integration**
   - Add Pinecone, Weaviate, or other vector DB
   - Implement retrieval augmented generation (RAG)
   - Build semantic search functionality

## Example AI Features to Implement

1. **AI Chat Interfaces**
   - Extend the UI with chat components
   - Implement streaming responses
   - Add chat history and context management

2. **Content Generation**
   - Create blog post generators
   - Implement AI-assisted writing tools
   - Build image generation features

3. **Data Analysis**
   - Add document processing capabilities
   - Implement data extraction features
   - Create visualization components

4. **Personalization**
   - Build user preference learning
   - Implement AI-driven recommendations
   - Create adaptive user interfaces

The template's architecture makes it particularly well-suited for AI applications, as the serverless functions can handle AI API calls while the React frontend provides a responsive user experience.`,
    tags: ["ai", "machine-learning", "openai", "llm", "saas"]
  },
  {
    title: "Tutorial: How to Use the Template",
    summary: "A step-by-step guide to getting started with this template for your projects.",
    content: `# Step-by-Step Tutorial: How to Use This Template

This tutorial will walk you through setting up and customizing this template for your own projects.

## Getting Started

### Step 1: Clone the Repository
\`\`\`bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
\`\`\`

### Step 2: Install Dependencies
\`\`\`bash
npm install
# or
yarn
# or
pnpm install
\`\`\`

### Step 3: Set Up Environment Variables
Create a \`.env\` file in the root directory:
\`\`\`
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
JWT_SECRET=your-secret-key
VITE_API_BASE_URL=http://localhost:8888/.netlify/functions
\`\`\`

### Step 4: Run the Development Server
\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

## Customization Guide

### Changing the Theme
1. Modify \`tailwind.config.ts\` to update colors and other theme variables
2. Update \`ThemeContext.tsx\` if you need custom theme logic

### Adding New Pages
1. Create a new file in \`src/pages\`
2. Add the route in \`App.tsx\`
3. Link to it from your navigation components

### Creating API Endpoints
1. Add a new file in \`netlify/functions\`
2. Implement your serverless function logic
3. Call it from the frontend using the API utility

### Adding Authentication Requirements
1. Use the \`ProtectedRoute\` component in \`App.tsx\`
2. Add role checks using \`user.role\` from AuthContext
3. Add authorization checks in your API functions

## Deployment

### Deploying to Netlify
1. Connect your GitHub repository to Netlify
2. Set environment variables in the Netlify dashboard
3. Configure build settings if needed

### Setting Up a Custom Domain
1. Add your domain in the Netlify dashboard
2. Configure DNS settings as instructed
3. Enable HTTPS

This template is designed to be flexible and extensible. Feel free to modify any part to suit your specific project requirements.`,
    tags: ["tutorial", "guide", "setup", "deployment"]
  }
];

// Function to seed blog posts
async function seedBlogPosts() {
  try {
    console.log('Starting blog post seeding process...');
    
    // Check if posts already exist
    const postsExist = await redis.exists('blog:posts_list');
    if (postsExist) {
      const existingCount = await redis.llen('blog:posts_list');
      console.log(`Found ${existingCount} existing posts. Checking if seeding is necessary...`);
    }
    
    // Process each post
    const pipeline = redis.pipeline();
    let addedCount = 0;
    
    for (const post of blogPosts) {
      const slug = slugify(post.title);
      
      // Check if this post already exists
      const postExists = await redis.exists(`blog:post:${slug}`);
      if (postExists) {
        console.log(`Post "${post.title}" already exists, skipping...`);
        continue;
      }
      
      // Create unique ID and prepare post data
      const id = generateBlogPostId();
      const postData = {
        id,
        slug,
        title: post.title,
        content: post.content,
        summary: post.summary,
        author: 'Template Admin',
        authorId: 'system',
        publishedDate: new Date().toISOString(),
        tags: JSON.stringify(post.tags || []),
        imageUrl: post.imageUrl || '',
        updatedDate: new Date().toISOString()
      };
      
      // Add to pipeline
      pipeline.hset(`blog:post:${slug}`, postData);
      pipeline.lpush('blog:posts_list', slug);
      addedCount++;
      console.log(`Added "${post.title}" to seeding pipeline`);
    }
    
    // Execute pipeline if we have posts to add
    if (addedCount > 0) {
      await pipeline.exec();
      console.log(`Successfully seeded ${addedCount} blog posts.`);
    } else {
      console.log('No new posts to seed.');
    }
    
    // Check final count
    const finalCount = await redis.llen('blog:posts_list');
    console.log(`Total posts in database: ${finalCount}`);
    
  } catch (error) {
    console.error('Error seeding blog posts:', error);
  }
}

// Main execution
(async () => {
  try {
    console.log('Blog post seeding script started...');
    await seedBlogPosts();
    console.log('Blog post seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during blog post seeding:', error);
    process.exit(1);
  }
})();
