'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit, FiTrash2, FiArrowUp, FiArrowDown, FiEye, FiEyeOff } from 'react-icons/fi';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'draft' | 'published';
  publishedAt: string;
  updatedAt: string;
};

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Fetch blog posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        // Replace with your actual API endpoint
        const response = await fetch('/api/admin/blog');
        const data = await response.json();
        console.log('Admin blog posts:', data.posts);
        setPosts(data.posts || []);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(posts.filter(post => post.id !== id));
      } else {
        alert('Failed to delete blog post');
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      alert('Failed to delete blog post');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'draft' | 'published') => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const action = newStatus === 'published' ? 'publish' : 'unpublish';
    
    if (!confirm(`Are you sure you want to ${action} this blog post?`)) {
      return;
    }

    // Find the current post to get its data
    const currentPost = posts.find(post => post.id === id);
    if (!currentPost) {
      alert('Blog post not found');
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          publishedAt: newStatus === 'published' ? new Date().toISOString() : null
        }),
      });

      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === id 
            ? { ...post, status: newStatus, publishedAt: newStatus === 'published' ? new Date().toISOString() : post.publishedAt }
            : post
        ));
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert(`Failed to ${action} blog post: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing blog post:`, error);
      alert(`Failed to ${action} blog post`);
    }
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    } else {
      return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
        <Link
          href="/admin/blog/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FiPlus className="mr-2" />
          New Post
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Sort by:</span>
            <button
              onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
            >
              {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
              {sortBy === 'newest' ? (
                <FiArrowDown className="ml-1" />
              ) : (
                <FiArrowUp className="ml-1" />
              )}
            </button>
          </div>
          <span className="text-sm text-gray-500">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        </div>

        <div className="divide-y divide-gray-200">
          {sortedPosts.length > 0 ? (
            sortedPosts.map((post) => (
              <div key={post.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center">
                      <h2 className="text-lg font-medium text-gray-900 truncate">
                        {post.title}
                      </h2>
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {post.excerpt}
                    </p>
                    <div className="mt-1 text-xs text-gray-500">
                      Last updated: {new Date(post.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleStatus(post.id, post.status)}
                      className={`p-2 rounded-md transition-colors ${
                        post.status === 'published'
                          ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                      title={post.status === 'published' ? 'Unpublish post' : 'Publish post'}
                    >
                      {post.status === 'published' ? (
                        <FiEye className="h-4 w-4" />
                      ) : (
                        <FiEyeOff className="h-4 w-4" />
                      )}
                    </button>
                    <Link
                      href={`/admin/blog/edit/${post.id}`}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit post"
                    >
                      <FiEdit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete post"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="text-gray-500">No blog posts found.</p>
              <Link
                href="/admin/blog/new"
                className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <FiPlus className="mr-1" /> Create your first post
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
