'use client';

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaSave, FaPlay } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function NewFilmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtubeId: '',
    thumbnail: ''
  });

  const extractYoutubeId = (url: string): string => {
    // Handle youtu.be short URLs
    const shortUrlMatch = url.match(/youtu\.be\/([^?&\n#]+)/);
    if (shortUrlMatch) return shortUrlMatch[1];

    // Handle full URLs with v parameter
    const fullUrlMatch = url.match(/[?&]v=([^?&\n#]+)/);
    if (fullUrlMatch) return fullUrlMatch[1];

    // If no match, assume it's just the ID
    return url;
  };

  const handleVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      youtubeId: value,
      thumbnail: ''
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!formData.youtubeId) {
        throw new Error('YouTube video ID is required');
      }

      const response = await fetch('/api/admin/films', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          youtubeId: formData.youtubeId.replace(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/, function(match, p1, p2) {
            return p2 && p2.length === 11 ? p2 : match;
          })
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Film added successfully');
        router.push('/admin/films');
      } else {
        throw new Error(data.message || 'Failed to add film');
      }
    } catch (error) {
      console.error('Error adding film:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add film');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.youtubeId) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = formData.youtubeId.match(regExp);
      
      if (match && match[2].length === 11) {
        const videoId = match[2];
        setFormData(prev => ({
          ...prev,
          youtubeId: videoId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        }));
      } else if (formData.youtubeId.length === 11) {
        // Direct video ID entered
        setFormData(prev => ({
          ...prev,
          thumbnail: `https://img.youtube.com/vi/${formData.youtubeId}/hqdefault.jpg`
        }));
      }
    }
  }, [formData.youtubeId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/admin/films" 
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FaArrowLeft className="mr-2" /> Back to Films
        </Link>
        <h1 className="text-2xl font-bold">Add New Film</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="youtubeId" className="block text-sm font-medium text-gray-700 mb-2">
              YouTube Video URL or ID
            </label>
            <input
              type="text"
              id="youtubeId"
              name="youtubeId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://www.youtube.com/watch?v=... or Video ID"
              value={formData.youtubeId}
              onChange={handleVideoInputChange}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the full YouTube URL or just the video ID
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail Preview
            </label>
            <div className="mt-1">
              {formData.thumbnail ? (
                <div className="relative w-full max-w-md rounded-md overflow-hidden border border-gray-300">
                  <img
                    src={formData.thumbnail}
                    alt="Video thumbnail preview"
                    className="w-full h-auto"
                    onError={(e) => {
                      // Fallback to a different quality if maxresdefault fails
                      const target = e.target as HTMLImageElement;
                      target.src = `https://img.youtube.com/vi/${formData.youtubeId}/hqdefault.jpg`;
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 bg-gray-100 rounded-md text-gray-400">
                  Enter a YouTube video ID to see the thumbnail
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/admin/films')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              <FaSave className="mr-2" />
              {loading ? 'Saving...' : 'Save Film'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
