'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiEdit, FiTrash2, FiEye, FiEyeOff, FiYoutube, FiPlus } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Film {
  _id: string;
  title: string;
  description: string;
  youtubeId: string;
  thumbnail: string;
  isPublished?: boolean;
  createdAt: string;
}

export default function AdminFilmsPage() {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchFilms();
  }, []);

  const fetchFilms = async () => {
    try {
      const response = await fetch('/api/admin/films');
      const data = await response.json();
      if (response.ok) {
        setFilms(data);
      } else {
        throw new Error(data.message || 'Failed to fetch films');
      }
    } catch (error) {
      console.error('Error fetching films:', error);
      toast.error('Failed to load films');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this film?')) return;
    
    try {
      const response = await fetch(`/api/admin/films/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success('Film deleted successfully');
        fetchFilms(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to delete film');
      }
    } catch (error) {
      console.error('Error deleting film:', error);
      toast.error('Failed to delete film');
    }
  };
  
  // Format date to a readable string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const togglePublishStatus = async (id: string, currentStatus: boolean | undefined) => {
    try {
      const response = await fetch(`/api/admin/films/${id}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update film status');
      }

      setFilms(films.map(film => 
        film._id === id ? { ...film, isPublished: !(currentStatus === true) } : film
      ));
      toast.success(`Film ${currentStatus ? 'unpublished' : 'published'} successfully`);
    } catch (error) {
      console.error('Error updating film status:', error);
      toast.error('Failed to update film status');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Films</h1>
        <Link
          href="/admin/films/new"
          className="bg-black text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <FiPlus /> Add New Film
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Film
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {films.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No films found. Add your first film to get started.
                  </td>
                </tr>
              ) : (
                films.map((film) => (
                  <tr key={film._id} className="hover:bg-gray-50 border-t border-gray-100">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => film._id && togglePublishStatus(film._id, film.isPublished)}
                        className={`p-1.5 rounded-full ${film.isPublished ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={film.isPublished ? 'Published - Click to unpublish' : 'Draft - Click to publish'}
                      >
                        {film.isPublished ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-16 w-24 bg-gray-100 rounded-md overflow-hidden">
                          <img
                            src={film.thumbnail || `https://img.youtube.com/vi/${film.youtubeId}/hqdefault.jpg`}
                            alt={film.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://img.youtube.com/vi/${film.youtubeId}/hqdefault.jpg`;
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{film.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {film.youtubeId ? (
                              <span className="inline-flex items-center">
                                <FiYoutube className="text-red-500 mr-1" />
                                {film.youtubeId}
                              </span>
                            ) : (
                              'No YouTube ID'
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(film.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/films/${film._id}`}
                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
                          title="Edit film"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => film._id && handleDelete(film._id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50"
                          title="Delete film"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
