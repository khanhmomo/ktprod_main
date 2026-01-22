'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaSave, FaYoutube } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Film {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  thumbnail: string;
}

export default function EditFilmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Film>({
    id: '',
    title: '',
    description: '',
    youtubeId: '',
    thumbnail: ''
  });

  useEffect(() => {
    const fetchFilm = async () => {
      try {
        const response = await fetch(`/api/admin/films/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch film');
        }
        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error('Error fetching film:', error);
        toast.error('Failed to load film');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFilm();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch(`/api/admin/films/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Film updated successfully');
        router.push('/admin/films');
      } else {
        throw new Error(data.message || 'Failed to update film');
      }
    } catch (error) {
      console.error('Error updating film:', error);
      toast.error('Failed to update film');
    } finally {
      setSaving(false);
    }
  };

  // Update thumbnail URL when YouTube ID changes
  useEffect(() => {
    if (formData.youtubeId) {
      setFormData(prev => ({
        ...prev,
        thumbnail: `https://img.youtube.com/vi/${formData.youtubeId}/maxresdefault.jpg`
      }));
    }
  }, [formData.youtubeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/admin/films" 
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FaArrowLeft className="mr-2" /> Back to Films
        </Link>
        <h1 className="text-2xl font-bold">Edit Film</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="youtubeId" className="block text-sm font-medium text-gray-700 mb-1">
              YouTube Video ID <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                <FaYoutube className="text-red-600 mr-2" />
                youtube.com/watch?v=
              </span>
              <input
                type="text"
                name="youtubeId"
                id="youtubeId"
                required
                value={formData.youtubeId}
                onChange={handleChange}
                className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                placeholder="dQw4w9WgXcQ"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter just the video ID (e.g., "dQw4w9WgXcQ" from https://www.youtube.com/watch?v=dQw4w9WgXcQ)
            </p>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
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

          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href="/admin/films"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.youtubeId || !formData.title}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : (
                <>
                  <FaSave className="-ml-1 mr-2 h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
