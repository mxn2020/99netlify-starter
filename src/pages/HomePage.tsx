import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TypeWriter from '../components/shared/TypeWriter';
import ParticleBackground from '../components/shared/ParticleBackground';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from 'next-themes';
import { 
  BookOpen, Info, Home as HomeIcon, FileText, Users, Sun, Moon, Calendar, User, Tag,
  Shield, Database, Zap, Globe, Code2, Layers, Smartphone, Lock, 
  Cloud, Palette, RefreshCw, Activity, Cog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { blogApi } from '../utils/api';
import { BlogPost } from '../types';
import dayjs from 'dayjs';
import { ShadcnLogo, VitejsLogo, TailwindcssLogo, ReactLogo, TypescriptLogo, UpstashLogo, NetlifyLogo, ZodLogo } from './Logos';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  const handleThemeToggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };
  
  const greetings = [
    "Welcome to App Template",
    "A React & TypeScript Starter",
    "Build Modern Web Apps",
    "Powered by Vite & Tailwind"
  ];

  // Fetch blog posts for the homepage preview
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoadingPosts(true);
        const response = await blogApi.getPosts();
        if (response.data.success) {
          // Get only the latest 3 posts for homepage preview
          setBlogPosts(response.data.data.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        // Keep loading state to false even on error so page still renders
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchBlogPosts();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <ParticleBackground />
      
      {/* Header Navigation */}
      <header className="relative z-10 py-4 border-b border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="App Logo" className="h-8 w-8" />
              <span className="font-semibold text-xl text-foreground">AppTemplate</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/blog" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <BookOpen className="h-4 w-4 mr-1" />
                Blog
              </Link>
              <Link to="/examples" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4 mr-1" />
                Examples
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <HomeIcon className="h-4 w-4 mr-1" />
                    Dashboard
                  </Link>
                  <Link to="/notes" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <FileText className="h-4 w-4 mr-1" />
                    Notes
                  </Link>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={handleThemeToggle}
                    aria-label="Toggle theme"
                    className="mr-2"
                    title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  <Link to="/login" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    Sign In
                  </Link>
                </>
              )}
            </nav>
            
            {/* Mobile menu Button */}
            <Button 
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent" 
              aria-label="Open mobile menu"
              onClick={() => {
                // Add mobile menu functionality
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                  mobileMenu.classList.toggle('hidden');
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
          
          {/* Mobile menu dropdown */}
          <div id="mobile-menu" className="hidden md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border z-50 py-4 px-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Menu</h3>
              <Button 
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => {
                  const mobileMenu = document.getElementById('mobile-menu');
                  if (mobileMenu) {
                    mobileMenu.classList.add('hidden');
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <nav className="flex flex-col space-y-4">
              <Link to="/blog" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <BookOpen className="h-4 w-4 mr-1" />
                Blog
              </Link>
              <Link to="/examples" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4 mr-1" />
                Examples
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <HomeIcon className="h-4 w-4 mr-1" />
                    Dashboard
                  </Link>
                  <Link to="/notes" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <FileText className="h-4 w-4 mr-1" />
                    Notes
                  </Link>
                </>
              ) : (
                <>
                <Button
                  onClick={handleThemeToggle}
                  className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  {resolvedTheme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4 mr-1" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-1" />
                      Dark Mode
                    </>
                  )}
                </Button>
                <Link to="/login" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  Sign In
                </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative z-10 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center transform transition-all duration-700">
            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-8">
              <TypeWriter texts={greetings} delay={150} pauseBetweenTexts={2000} />
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              A modern React application starter with authentication, blog functionality, and more.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/dashboard" className="px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5">
                  Go to Dashboard
                </Link>
              ) : (
                <Link to="/login" className="px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5">
                  Sign In
                </Link>
              )}
              <Link to="/blog" className="px-6 py-3 rounded-full bg-card hover:bg-accent text-foreground font-medium border border-border transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Read Our Blog
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="relative z-10 py-12 md:py-20 bg-accent/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-16">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">User Authentication</h3>
              <p className="text-muted-foreground">Secure login and registration with JWT authentication and protected routes.</p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Notes Management</h3>
              <p className="text-muted-foreground">Create, edit, and organize your notes with categories and tags. Fully private and secure.</p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Blog Platform</h3>
              <p className="text-muted-foreground">Publish and manage blog posts with public reading and secure admin controls.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">API Security</h3>
              <p className="text-muted-foreground">Multi-level security: public APIs for demos, auth-required for personal data, and admin controls for content.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6">
                <Database className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Redis Database</h3>
              <p className="text-muted-foreground">Lightning-fast data storage with Upstash Redis for optimal performance and reliability.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Features</h3>
              <p className="text-muted-foreground">Live counter updates, instant guestbook posts, and dynamic content loading for engaging user experience.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Serverless Architecture</h3>
              <p className="text-muted-foreground">Built on Netlify Functions for infinite scalability, zero server maintenance, and global edge deployment.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Responsive Design</h3>
              <p className="text-muted-foreground">Mobile-first design that looks perfect on any device with Tailwind CSS and modern UI components.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6">
                <Palette className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Dark Mode Support</h3>
              <p className="text-muted-foreground">Beautiful dark and light themes with system preference detection and smooth transitions.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Developer Features Section */}
      <section className="relative z-10 py-12 md:py-20 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 dark:from-violet-600/20 dark:to-indigo-600/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Developer Experience</h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
            Built with developer productivity in mind. Everything you need to ship fast and maintain easily.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">TypeScript Ready</h3>
              <p className="text-sm text-muted-foreground">Full TypeScript support with strict type checking and IntelliSense.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Component Library</h3>
              <p className="text-sm text-muted-foreground">Pre-built shadcn/ui components for rapid development.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Hot Reload</h3>
              <p className="text-sm text-muted-foreground">Instant development feedback with Vite's lightning-fast HMR.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <Cog className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Zero Config</h3>
              <p className="text-sm text-muted-foreground">Preconfigured build tools, linting, and deployment ready.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Architecture Highlights */}
      <section className="relative z-10 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Modern Architecture</h2>
            <p className="text-lg text-muted-foreground">
              Built on proven technologies and best practices for production-ready applications.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Security First</h3>
              <p className="text-muted-foreground">JWT authentication, secure API endpoints, and protection against common vulnerabilities.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Performance Optimized</h3>
              <p className="text-muted-foreground">Code splitting, lazy loading, and optimized bundles for lightning-fast user experience.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Cloud Native</h3>
              <p className="text-muted-foreground">Serverless functions, global CDN, and automatic scaling for worldwide performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="relative z-10 py-12 md:py-20 bg-gradient-to-br from-slate-500/10 to-gray-500/10 dark:from-slate-600/20 dark:to-gray-600/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built with Modern Tech Stack</h2>
            <p className="text-lg text-muted-foreground">
              Powered by cutting-edge technologies for optimal performance and developer experience.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            <div className="flex flex-col items-center p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <ReactLogo size="64px" />
              </div>
              <h3 className="font-semibold text-sm">React</h3>
              <p className="text-xs text-muted-foreground text-center">Frontend Library</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <TypescriptLogo size="64px" />
              </div>
              <h3 className="font-semibold text-sm">TypeScript</h3>
              <p className="text-xs text-muted-foreground text-center">Type Safety</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <VitejsLogo size="64px" />
              </div>
              <h3 className="font-semibold text-sm">Vite</h3>
              <p className="text-xs text-muted-foreground text-center">Build Tool</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <ShadcnLogo size="64px" />
              </div>
              <h3 className="font-semibold text-sm">shadcn/ui</h3>
              <p className="text-xs text-muted-foreground text-center">UI Components</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <TailwindcssLogo size="64px" />
              </div>
              <h3 className="font-semibold text-sm">Tailwind</h3>
              <p className="text-xs text-muted-foreground text-center">CSS Framework</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <UpstashLogo size="64px" />
              </div>
              <h3 className="font-semibold text-sm">Upstash Redis</h3>
              <p className="text-xs text-muted-foreground text-center">Database</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <NetlifyLogo size="64px" />
              </div>
              <h3 className="font-semibold text-sm">Netlify</h3>
              <p className="text-xs text-muted-foreground text-center">Deployment</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                <ZodLogo size="64px" />
              </div>
              <h3 className="font-semibold text-sm">Zod</h3>
              <p className="text-xs text-muted-foreground text-center">Schema Validation</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6">
              Plus many more powerful tools: shadcn/ui, Lucide Icons, JWT, bcrypt, and more
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                  <circle cx="6" cy="6" r="2" fill="currentColor"/>
                  <path d="M6 2L7 5L6 6L5 5Z" fill="currentColor"/>
                  <path d="M10 6L7 7L6 6L7 5Z" fill="currentColor"/>
                  <path d="M6 10L5 7L6 6L7 7Z" fill="currentColor"/>
                  <path d="M2 6L5 5L6 6L5 7Z" fill="currentColor"/>
                </svg>
                Lucide Icons
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="3" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                  <path d="M3 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="0.8"/>
                  <circle cx="6" cy="6" r="1" fill="currentColor"/>
                </svg>
                JWT Auth
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                  <path d="M4 6L5.5 7.5L8 4.5" stroke="currentColor" strokeWidth="1" fill="none"/>
                </svg>
                bcrypt
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 6L6 2L10 6L6 10Z" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                  <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
                </svg>
                Axios
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                  <path d="M6 3V6L8 8" stroke="currentColor" strokeWidth="1" fill="none"/>
                </svg>
                Day.js
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="6" cy="4" r="2" fill="currentColor"/>
                  <circle cx="6" cy="8" r="2" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                  <path d="M4 6h4" stroke="currentColor" strokeWidth="0.8"/>
                </svg>
                next-themes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="relative z-10 py-12 md:py-20 bg-accent/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Try It Live</h2>
            <p className="text-lg text-muted-foreground">
              Experience the power of our real-time features right here on the homepage.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Quick Stats Preview */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                App Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-accent/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">12</div>
                  <div className="text-sm text-muted-foreground">Total Notes</div>
                </div>
                <div className="text-center p-4 bg-accent/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">3</div>
                  <div className="text-sm text-muted-foreground">Blog Posts</div>
                </div>
                <div className="text-center p-4 bg-accent/30 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">8</div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </div>
                <div className="text-center p-4 bg-accent/30 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">156</div>
                  <div className="text-sm text-muted-foreground">Users</div>
                </div>
              </div>
              <Link to="/examples" className="mt-4 inline-flex items-center text-primary hover:text-primary/80 font-medium">
                See Live Examples
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Feature Highlights */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                What You Get
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Secure user authentication with JWT</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Real-time data with Redis backend</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Responsive design for all devices</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Serverless architecture</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Link to="/login" className="flex-1">
                  <Button variant="default" className="w-full">Get Started</Button>
                </Link>
                <Link to="/blog" className="flex-1">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Blog Preview Section */}
      <section className="relative z-10 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 sm:mb-0">Latest Blog Posts</h2>
            <Link to="/blog" className="text-primary hover:text-primary/80 font-medium flex items-center">
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {loadingPosts ? (
              // Loading skeleton for blog posts
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                    <div className="h-8 bg-muted rounded w-24 mt-4"></div>
                  </div>
                </div>
              ))
            ) : blogPosts.length > 0 ? (
              // Real blog posts
              blogPosts.map((post) => (
                <div key={post.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {post.imageUrl ? (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{dayjs(post.publishedDate).format('MMM DD, YYYY')}</span>
                      </div>
                      {post.author && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{post.author}</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-3 hover:text-primary transition-colors">
                      <Link to={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {post.summary || 'No summary available.'}
                    </p>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <div className="flex gap-2 flex-wrap">
                          {post.tags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{post.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Link to={`/blog/${post.slug}`} className="text-primary hover:text-primary/80 font-medium text-sm">
                      Read More
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // No posts fallback
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No blog posts available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Sign Up Section */}
      <section className="relative z-10 py-12 md:py-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-600/20 dark:to-purple-600/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">Ready to Get Started?</h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 md:mb-10">Join our community today and start building amazing applications.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5">
                Create an Account
              </Link>
              <Link to="/examples" className="px-6 py-3 rounded-full bg-card hover:bg-accent text-foreground font-medium border border-border transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                View Examples
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 py-10 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src="/logo.svg" alt="App Logo" className="h-8 w-8" />
                <span className="font-semibold text-lg">AppTemplate</span>
              </Link>
              <p className="text-muted-foreground">A modern React application starter with everything you need.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link to="/examples" className="text-muted-foreground hover:text-foreground transition-colors">Examples</Link></li>
                <li><Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-0">
              <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} AppTemplate. All rights reserved.</p>
              
              <Button
                onClick={handleThemeToggle}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors md:ml-4"
                aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {resolvedTheme === 'dark' ? (
                  <>
                    <Sun className="h-4 w-4" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    <span>Dark Mode</span>
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
