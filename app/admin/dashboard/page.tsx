'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';

interface Album {
  _id: string;
  title: string;
  coverImage: string;
  isPublished: boolean;
  createdAt: string;
  date?: string;
  location?: string;
  images: { url: string; alt?: string }[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

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

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/albums?all=true', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin');
          return;
        }
        throw new Error('Failed to fetch albums');
      }
      
      const data = await response.json();
      console.log('Raw API response:', JSON.stringify(data, null, 2));
      
      // Log details about each album's cover image
      if (Array.isArray(data)) {
        data.forEach((album, index) => {
          console.log(`Album ${index + 1}:`, {
            title: album.title,
            coverImage: album.coverImage,
            processedUrl: processImageUrl(album.coverImage || ''),
            hasImages: album.images?.length > 0,
            firstImageUrl: album.images?.[0]?.url
          });
        });
      }
      
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

  // Stats
  const [stats, setStats] = useState({
    totalAlbums: 0,
    publishedAlbums: 0,
    totalImages: 0
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch albums
      const albumsRes = await fetch('/api/albums?all=true');
      if (albumsRes.ok) {
        const albumsData = await albumsRes.json();
        const sortedAlbums = [...albumsData].sort((a: Album, b: Album) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAlbums(sortedAlbums);

        // Calculate album stats
        const publishedAlbums = albumsData.filter((a: Album) => a.isPublished).length;
        const totalImages = albumsData.reduce((sum: number, album: Album) => sum + album.images.length, 0);

        // Update stats
        setStats({
          totalAlbums: albumsData.length,
          publishedAlbums,
          totalImages
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (!response.ok) {
        router.push('/admin');
        return false;
      }
      
      const data = await response.json();
      if (!data.authenticated) {
        router.push('/admin');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin');
      return false;
    }
  }, [router]);

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        await fetchData();
      }
    };

    setIsClient(true);
    verifyAuth();
  }, [checkAuth, fetchData]);

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
        await fetchData();
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
      await fetchData();
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Albums</h2>
            <Link
              href="/admin/albums/new"
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Album
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p>{error}</p>
            </div>
          )}

          {albums.length === 0 ? (
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
            <div className="bg-white shadow overflow-hidden rounded-lg">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Album
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photos
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
                  {albums.map((album) => (
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          album.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {album.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {album.images?.length || 0} photos
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {album.date ? new Date(album.date).toLocaleDateString() : 'No date'}
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden">
              <div className="divide-y divide-gray-200">
                {albums.map((album) => (
                  <div key={`mobile-${album._id}`} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start">
                      <div className="bg-white rounded-lg shadow-md overflow-hidden group w-full">
                        <div className="relative h-48 bg-gray-100">
                          {album.coverImage ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={processImageUrl(album.coverImage)}
                                alt={album.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 100%"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  console.error('Error loading image:', {
                                    originalUrl: album.coverImage,
                                    processedUrl: processImageUrl(album.coverImage),
                                    error: e
                                  });
                                  target.onerror = null;
                                  if (target.src !== album.coverImage && album.coverImage) {
                                    target.src = album.coverImage;
                                  } else {
                                    target.src = '/images/placeholder.jpg';
                                  }
                                }}
                                onLoad={() => console.log('Image loaded successfully:', album.coverImage)}
                                priority
                                unoptimized
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                                {album.coverImage}
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <span className="text-gray-400">No cover image</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Link 
                              href={`/admin/albums/${album._id}`}
                              className="bg-white text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
                            >
                              Edit Album
                            </Link>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-gray-900">{album.title}</h3>
                            <span
                              className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                album.isPublished
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {album.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {album.images?.length || 0} {album.images?.length === 1 ? 'photo' : 'photos'}
                          </div>
                          {album.location && (
                            <div className="mt-1 text-sm text-gray-500">
                              {album.location}
                            </div>
                          )}
                          {album.date && (
                            <div className="mt-1 text-sm text-gray-500">
                              {new Date(album.date).toLocaleDateString()}
                            </div>
                          )}
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={() => togglePublish(album._id, album.isPublished)}
                              className={`px-2 py-1 rounded text-xs ${
                                album.isPublished
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {album.isPublished ? 'Unpublish' : 'Publish'}
                            </button>
                            <Link
                              href={`/admin/albums/${album._id}`}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(album._id)}
                              className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  </div>
);
}
