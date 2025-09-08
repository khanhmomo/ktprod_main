// Server Component - No 'use client' directive here
import Link from 'next/link';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import AlbumPageClient from './AlbumPageClient';
import { env } from '@/app/config/env';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

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
    const apiUrl = `${BASE_URL}/api/albums/${id}`;
    console.log(`Fetching album from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      next: { 
        revalidate: 60, // Cache for 1 minute (shorter for testing)
        tags: [`album-${id}`]
      },
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch album';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('API Error:', errorData);
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data) {
      throw new Error('No data returned from API');
    }
    
    // Optimize image data structure before sending to client
    if (data.images && Array.isArray(data.images)) {
      data.images = data.images.map((img: any) => ({
        url: img.url,
        alt: img.alt || '',
      }));
    } else {
      data.images = [];
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
  } catch (error: any) {
    console.error('[Server] Error in AlbumPage:', error);
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 mb-4">
            <FiAlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {error.message?.includes('not found') ? 'Album Not Found' : 'Error Loading Album'}
          </h1>
          <p className="text-gray-600 mb-4">
            {error.message || 'An unexpected error occurred while loading the album.'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please try again later or contact support if the problem persists.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/albums" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiArrowLeft className="mr-2" /> Back to Albums
            </Link>
            <a
              href="/contact"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Contact Support
            </a>
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
