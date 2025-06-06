import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBlogAdmin } from '../contexts/BlogAdminContext';
import { useAuth } from '../hooks/useAuth';
import { useAccount } from '../contexts/AccountContext';
import { Button } from '@/components/ui/button';
import { BlogPost } from '../types';
import { Building2, User } from 'lucide-react';

const BlogAdminPage: React.FC = () => {
  const { user } = useAuth();
  const { currentAccount } = useAccount();
  const { fetchPosts, deletePost } = useBlogAdmin();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = React.useCallback(async () => {
    try {
      setLoading(true);
      const fetchedPosts = await fetchPosts();
      setPosts(fetchedPosts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchPosts]);

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await deletePost(slug);
      setPosts(posts.filter(post => post.slug !== slug));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post');
      console.error('Error deleting post:', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPosts();
    }
  }, [loadPosts, user?.role]);

  // Check if user is admin after hooks
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Link to="/blog" className="text-blue-600 hover:underline">
            Go back to Blog
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Blog Management</h1>
          <p className="text-gray-600 mt-2">Create, edit, and manage your blog posts</p>
          {currentAccount && (
            <div className="flex items-center space-x-2 mt-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 inline-flex">
              {currentAccount.type === 'personal' ? (
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {currentAccount.name}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 capitalize">
                ({currentAccount.type})
              </span>
            </div>
          )}
        </div>
        <Link
          to="/admin/blog/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Create New Post
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No blog posts yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first blog post.</p>
          <Link
            to="/admin/blog/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create First Post
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {post.summary}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {post.author || 'Unknown Author'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(post.publishedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {post.tags?.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {(post.tags?.length || 0) > 2 && (
                          <span className="text-xs text-gray-500">
                            +{(post.tags?.length || 0) - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/blog/${post.slug}`}
                          className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          to={`/admin/blog/${post.slug}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 px-3 py-1 rounded transition-colors"
                        >
                          Edit
                        </Link>
                        <Button
                          onClick={() => handleDelete(post.slug)}
                          className="text-red-600 hover:text-red-900 px-3 py-1 rounded transition-colors"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogAdminPage;
