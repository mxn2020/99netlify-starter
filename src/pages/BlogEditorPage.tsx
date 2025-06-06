import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBlogAdmin } from '../contexts/BlogAdminContext';
import { useAccount } from '../contexts/AccountContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, User } from 'lucide-react';

const BlogEditorPage: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { fetchPost, createPost, updatePost } = useBlogAdmin();
  const { currentAccount } = useAccount();
  const isEditing = Boolean(slug);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    tags: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPost = async () => {
    if (!slug) return;

    try {
      setLoading(true);
      const post = await fetchPost(slug);
      setFormData({
        title: post.title || '',
        summary: post.summary || '',
        content: post.content || '',
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
        imageUrl: post.imageUrl || ''
      });
    } catch (err) {
      setError('Failed to load post');
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (!currentAccount) {
      setError('Please select an account to create or edit blog posts');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const postData = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        imageUrl: formData.imageUrl.trim()
      };

      if (isEditing && slug) {
        await updatePost(slug, postData);
      } else {
        await createPost(postData);
      }

      navigate('/admin/blog');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} post`);
      console.error('Error saving post:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (isEditing) {
      loadPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEditing ? 'Update your blog post' : 'Share your thoughts with the world'}
            </p>
          </div>
          {currentAccount && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
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
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title *
          </Label>
          <Input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your blog post title"
          />
        </div>

        <div>
          <Label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Summary
          </Label>
          <Textarea
            id="summary"
            name="summary"
            rows={3}
            value={formData.summary}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            placeholder="Brief summary of your post (optional)"
          />
        </div>

        <div>
          <Label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Featured Image URL
          </Label>
          <Input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <Label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </Label>
          <Input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="javascript, react, tutorial (comma-separated)"
          />
          <p className="text-sm text-gray-500 mt-1">Separate tags with commas</p>
        </div>

        <div>
          <Label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content *
          </Label>
          <Textarea
            id="content"
            name="content"
            required
            rows={20}
            value={formData.content}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical font-mono text-sm"
            placeholder="Write your blog post content here. You can use Markdown formatting."
          />
          <p className="text-sm text-gray-500 mt-1">
            Supports Markdown formatting. Use # for headers, **bold**, *italic*, etc.
          </p>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <Button
            type="button"
            onClick={() => navigate('/admin/blog')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {saving ? 'Saving...' : (isEditing ? 'Update Post' : 'Create Post')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BlogEditorPage;
