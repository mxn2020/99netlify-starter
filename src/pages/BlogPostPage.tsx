import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { blogApi } from '../utils/api';
import { BlogPost } from '../types';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import BlogPostDisplay from '../components/blog/BlogPostDisplay';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await blogApi.getPost(slug);
        if (response.data.success) {
          setPost(response.data.data);
        } else {
          setError(response.data.error || 'Failed to load blog post.');
        }
      } catch (err) {
        setError('An error occurred while fetching the blog post.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
  
  if (error) return (
    <div className="text-center text-red-600 dark:text-red-400 py-10">{error}</div>
  );
  
  if (!post) return (
    <div className="text-center text-muted-foreground py-10">Blog post not found.</div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <BlogPostDisplay post={post} />
    </div>
  );
};

export default BlogPostPage;
