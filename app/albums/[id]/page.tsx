// Server Component - No 'use client' directive here
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import AlbumPageClient from './AlbumPageClient';
import { env } from '@/app/config/env';

interface AlbumImage {
  url: string;
  alt?: string;
}

interface Album {
  _id: string;
  title: string;
  images: AlbumImage[];
  date: string;
  location: string;
  description?: string;
  isPublished: boolean;
}

// Server Component that fetches the album data with optimizations
async function getAlbum(id: string) {
  try {
    // Use the edge runtime for faster responses
    const response = await fetch(`${env.baseUrl}/api/albums/${id}`, {
      next: { 
        revalidate: 3600, // Cache for 1 hour (longer cache time)
        tags: [`album-${id}`] // Add cache tag for on-demand revalidation
      },
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch album');
    }
    
    const data = await response.json();
    
    // Optimize image data structure before sending to client
    if (data.images && Array.isArray(data.images)) {
      data.images = data.images.map((img: any) => ({
        url: img.url,
        alt: img.alt || '',
        // Add any other necessary fields, but keep it minimal
      }));
    }
    
    return data;
  } catch (error) {
    console.error('Error in getAlbum:', error);
    throw error;
  }
}

export default async function AlbumPage({ params }: { params: { id: string } }) {
  console.log('[Server] Rendering album page with ID:', params.id);
  
  try {
    const album = await getAlbum(params.id);
    return <AlbumPageClient initialAlbum={album} id={params.id} />;
  } catch (error) {
    console.error('[Server] Error in AlbumPage:', error);
    
    let errorMessage = 'Failed to load album. Please try again later.';
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        errorMessage = 'Album not found. It may have been removed or the link is incorrect.';
      } else if (error.message.includes('Invalid album ID')) {
        errorMessage = 'Invalid album ID format. Please check the URL and try again.';
      }
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h1>
          <p className="text-gray-700 mb-6">{errorMessage}</p>
          
          <div className="space-y-4">
            <Link 
              href="/albums" 
              className="inline-block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to All Albums
            </Link>
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left text-sm text-gray-600">
              <p className="font-mono font-bold mb-2">Error Details:</p>
              <pre className="whitespace-pre-wrap break-all">
                {error instanceof Error 
                  ? `${error.name}: ${error.message}\n${error.stack || 'No stack trace available'}`
                  : JSON.stringify(error, null, 2)
                }
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }
}
