import React, { useEffect, useState } from 'react';
import { blogApi } from '../utils/api';
import { BlogPost } from '../types';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import BlogCard from '../components/blog/BlogCard';

const BlogListPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await blogApi.getPosts();
        if (response.data.success) {
          setPosts(response.data.data);
        } else {
          setError(response.data.error || 'Failed to load blog posts.');
        }
      } catch (err) {
        setError('An error occurred while fetching blog posts.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );
  
  if (error) return (
    <div className="text-center text-red-600 dark:text-red-400 py-10">{error}</div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-foreground mb-8 text-center">Our Blog</h1>
      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground">No blog posts available yet. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogListPage;
