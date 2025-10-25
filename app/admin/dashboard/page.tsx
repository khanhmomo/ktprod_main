'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff, FiYoutube } from 'react-icons/fi';

interface Album {
  _id: string;
  title: string;
  coverImage: string;
  isPublished: boolean;
  createdAt: string;
  date?: string;
  location?: string;
  images: { url: string; alt?: string }[];
  category?: string;
}

interface Film {
  _id: string;
  title: string;
  description: string;
  youtubeId: string;
  thumbnail: string;
  isPublished?: boolean;
  createdAt: string;
}

// Function to process image URLs for display
const processImageUrl = (url: string) => {
  if (!url) return '';
  
  // If it's already using our proxy, return as is
  if (url.startsWith('/api/')) {
    return url;
  }
  
  // Handle Google Drive URLs
  if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
    let fileId = '';
    
    // Extract file ID from different Google Drive URL formats
    if (url.includes('/file/d/')) {
      fileId = url.split('/file/d/')[1]?.split('/')[0] || '';
    } else if (url.includes('id=')) {
      fileId = url.split('id=')[1]?.split('&')[0] || '';
    } else if (url.includes('open?id=')) {
      fileId = url.split('open?id=')[1]?.split('&')[0] || '';
    } else {
      const match = url.match(/[\w-]{25,}/);
      if (match) fileId = match[0];
    }
    
    if (fileId) {
      return `/api/drive/image?id=${encodeURIComponent(fileId)}`;
    }
  }
  
  // For direct HTTP/HTTPS URLs, use them as is
  if (url.startsWith('http')) {
    return url;
  }
  
  // For relative URLs, prepend the base URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
};

export default function DashboardPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'albums' | 'films'>('albums');

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          router.push('/admin');
        } else {
          setIsClient(true);
          fetchAlbums();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin');
      }
    };
    
    checkAuth();
  }, [router]);

  const fetchFilms = async () => {
    try {
      const response = await fetch('/api/admin/films', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch films');
      }
      
      const data = await response.json();
      setFilms(data);
    } catch (error) {
      console.error('Error fetching films:', error);
      setError('Failed to load films');
    }
  };

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const [albumsResponse] = await Promise.all([
        fetch('/api/albums?all=true', {
          credentials: 'include'
        }),
        fetchFilms() // Fetch films in parallel
      ]);
      
      if (!albumsResponse.ok) {
        if (albumsResponse.status === 401) {
          router.push('/admin');
          return;
        }
        throw new Error('Failed to fetch albums');
      }
      
      const data = await albumsResponse.json();
      setAlbums(data);
    } catch (error) {
      console.error('Error fetching albums:', error);
      setError('Failed to load albums. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Force a full page reload to ensure all auth state is cleared
        window.location.href = '/admin';
      } else {
        console.error('Logout failed:', await response.text());
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, still try to redirect to login
      window.location.href = '/admin';
    }
  };

  const toggleFilmPublishStatus = async (id: string, currentStatus: boolean | undefined) => {
    try {
      const response = await fetch(`/api/admin/films/${id}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isPublished: !(currentStatus === true) }),
      });

      if (!response.ok) {
        throw new Error('Failed to update film status');
      }

      setFilms(films.map(film => 
        film._id === id ? { ...film, isPublished: !(currentStatus === true) } : film
      ));
    } catch (error) {
      console.error('Error updating film status:', error);
      setError('Failed to update film status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/albums/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh data after successful deletion
        await fetchAlbums();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete album');
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      setError('Failed to delete album. Please try again.');
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/albums/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update album status';
        try {
          // Only try to parse JSON if there's content
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      // Refresh data after successful update
      await fetchAlbums();
    } catch (error) {
      console.error('Error updating album status:', error);
      setError('Failed to update album status. Please try again.');
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your content</p>
          </div>
          <div className="flex space-x-3">
            {activeTab === 'albums' ? (
              <Link
                href="/admin/albums/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                New Album
              </Link>
            ) : (
              <Link
                href="/admin/films/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                New Film
              </Link>
            )}
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('albums')}
              className={`${activeTab === 'albums' 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Albums
            </button>
            <button
              onClick={() => setActiveTab('films')}
              className={`${activeTab === 'films' 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Films
            </button>
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : activeTab === 'albums' && albums.length === 0 ? (
          <div className="bg-white shadow overflow-hidden rounded-lg p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <p className="text-gray-500 mb-4">No albums found</p>
            <Link
              href="/admin/albums/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create New Album
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'albums' ? 'Album' : 'Film'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'albums' ? 'Photos' : 'Type'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeTab === 'albums' ? (
                  albums.map((album) => (
                    <tr key={`desktop-${album._id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {album.coverImage ? (
                              <div className="relative h-10 w-10 rounded-md overflow-hidden">
                                <Image
                                  src={processImageUrl(album.coverImage)}
                                  alt={album.title}
                                  fill
                                  className="object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = '/images/placeholder.jpg';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{album.title}</div>
                            <div className="text-sm text-gray-500">{album.location || 'No location'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{album.images?.length || 0} photos</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {album.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          album.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {album.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(album.date || album.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => togglePublish(album._id, album.isPublished)}
                            className={`text-${album.isPublished ? 'yellow' : 'green'}-600 hover:text-${album.isPublished ? 'yellow' : 'green'}-900`}
                          >
                            {album.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          <Link
                            href={`/admin/albums/${album._id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(album._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : films.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No films found. Add your first film to get started.
                    </td>
                  </tr>
                ) : (
                  films.map((film) => (
                      <tr key={film._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-28 bg-gray-200 rounded-md overflow-hidden relative">
                              <img
                                className="h-full w-full object-cover"
                                src={film.thumbnail || `https://img.youtube.com/vi/${film.youtubeId}/hqdefault.jpg`}
                                alt={film.title}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/images/placeholder.jpg';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                <FiYoutube className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{film.title}</div>
                              <div className="text-sm text-gray-500">{film.youtubeId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${film.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {film.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(film.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => toggleFilmPublishStatus(film._id, film.isPublished)}
                              className={`${film.isPublished ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                              title={film.isPublished ? 'Unpublish' : 'Publish'}
                            >
                              {film.isPublished ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                            </button>
                            <Link
                              href={`/admin/films/${film._id}`}
                              className="text-gray-400 hover:text-gray-600"
                              title="Edit"
                            >
                              <FiEdit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(film._id)}
                              className="text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
