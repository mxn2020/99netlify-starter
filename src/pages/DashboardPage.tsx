// src/pages/DashboardPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFeatureFlag, useFeatureFlags } from '../hooks/useFeatureFlags';
import { Button } from '../components/ui/button';
import TypeWriter from '../components/shared/TypeWriter';
import FeatureFlagDemo from '../components/shared/FeatureFlagDemo';
import {
  FileText,
  PlusCircle,
  BookOpen,
  FlaskConical,
  Settings,
  Flag,
  Zap,
  Clock,
  CheckCircle
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { flags } = useFeatureFlags();
  const qstashEnabled = useFeatureFlag('upstash_qstash');

  const welcomeMessages = [
    `Welcome back, ${user?.name || 'User'}!`,
    `Hello ${user?.name || 'User'}!`,
    `Good to see you, ${user?.name || 'User'}!`,
    `Ready to create, ${user?.name || 'User'}?`
  ];

  const quickActions = [
    {
      title: 'Create Note',
      description: 'Start writing a new note',
      icon: PlusCircle,
      href: '/notes/new',
      color: 'bg-blue-500'
    },
    {
      title: 'View Notes',
      description: 'Browse all your notes',
      icon: FileText,
      href: '/notes',
      color: 'bg-green-500'
    },
    {
      title: 'Read Blog',
      description: 'Check out the latest posts',
      icon: BookOpen,
      href: '/blog',
      color: 'bg-purple-500'
    },
    {
      title: 'Try Examples',
      description: 'Explore Redis examples',
      icon: FlaskConical,
      href: '/examples',
      color: 'bg-orange-500'
    }
  ];

  // Add admin actions if user is super-admin
  if (user?.role === 'super-admin') {
    quickActions.push({
      title: 'Feature Flags',
      description: 'Manage feature toggles',
      icon: Flag,
      href: '/admin/feature-flags',
      color: 'bg-indigo-500'
    });
  }

  const activeFeatures = flags.filter(f => f.enabled && f.status === 'active').length;
  const shippingSoonFeatures = flags.filter(f => f.status === 'shipping_soon').length;

  const stats = [
    { label: 'Total Notes', value: '12', icon: FileText },
    { label: 'Active Features', value: activeFeatures.toString(), icon: CheckCircle, color: 'text-green-600' },
    { label: 'Coming Soon', value: shippingSoonFeatures.toString(), icon: Clock, color: 'text-blue-600' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <div className="relative backdrop-blur-sm bg-white/5 dark:bg-gray-900/30 rounded-2xl p-8 md:p-12 border border-white/10 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-600/20 dark:to-purple-600/20" />

          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-4">
              <TypeWriter texts={welcomeMessages} delay={100} pauseBetweenTexts={3000} />
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Your creative workspace powered by AI. Manage notes, explore examples, and stay productive.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/notes/new">
                <Button size="lg" className="min-w-40">
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Create Note
                </Button>
              </Link>
              <Link to="/examples">
                <Button variant="outline" size="lg" className="min-w-40">
                  <FlaskConical className="h-5 w-5 mr-2" />
                  Explore Examples
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats with Feature Integration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-bold ${stat.color || 'text-foreground'}`}>
                    {stat.value}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color || 'text-primary'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className="group bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center mb-3">
                  <div className={`p-2 rounded-lg ${action.color} bg-opacity-10`}>
                    <Icon className={`h-5 w-5 ${action.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Feature Flags Demo */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Platform Features</h2>
        </div>
        <FeatureFlagDemo />
      </div>

      {/* Recent Activity with QStash Integration */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-muted-foreground">Created note "Project Ideas"</span>
            <span className="text-xs text-muted-foreground">2 hours ago</span>
          </div>
          {qstashEnabled && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-muted-foreground">Welcome email queued via QStash</span>
              <span className="text-xs text-muted-foreground">1 day ago</span>
            </div>
          )}
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-muted-foreground">Updated "Meeting Notes"</span>
            <span className="text-xs text-muted-foreground">1 day ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-muted-foreground">Read blog post "Getting Started"</span>
            <span className="text-xs text-muted-foreground">3 days ago</span>
          </div>
          {user?.role === 'super-admin' && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span className="text-muted-foreground">Feature flags system initialized</span>
              <span className="text-xs text-muted-foreground">1 week ago</span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <Link to="/notes">
            <Button variant="outline" size="sm">
              View All Notes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;