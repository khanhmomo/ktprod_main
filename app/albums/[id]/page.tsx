// Server Component - No 'use client' directive here
'use server';

import Link from 'next/link';
import { FiArrowLeft, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { env } from '@/app/config/env';
import { ReactNode } from 'react';
import AlbumClient from './AlbumClient';

// Define the Album type for the client component
interface AlbumPageProps {
  album: Album | null;
  id: string;
}

// In Next.js 13+, we should use the full URL in both environments
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
  if (!id) {
    throw new Error('Album ID is required');
  }
  
  // Ensure BASE_URL ends with a slash for proper URL construction
  const baseUrl = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  const apiUrl = `${baseUrl}api/albums/${id}`;
  const requestId = Math.random().toString(36).substring(2, 9);
  
  console.log(`[${requestId}] Fetching album from: ${apiUrl}`);
  
  try {
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    console.log(`[${requestId}] Sending request to: ${apiUrl}`);
    
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'X-Request-ID': requestId
      },
      next: { 
        revalidate: 60, // Cache for 1 minute
        tags: [`album-${id}`]
      },
      signal: controller.signal
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${requestId}] Fetch options:`, JSON.stringify(fetchOptions, null, 2));
    }
    
    const response = await fetch(apiUrl, fetchOptions);
    
    // Clear the timeout if the request completes
    clearTimeout(timeoutId);
    
    let responseData: any;
    try {
      const responseText = await response.text();
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        const error = jsonError as Error;
        console.error(`[${requestId}] Failed to parse JSON. Response text:`, responseText);
        throw new Error(`Invalid JSON response: ${error.message}`);
      }
    } catch (readError) {
      const error = readError as Error;
      console.error(`[${requestId}] Failed to read response:`, error);
      throw new Error(`Failed to process server response: ${error.message}`);
    }
    
    if (!response.ok) {
      console.error(`[${requestId}] API Error:`, {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        response: responseData,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const error = new Error(
        responseData?.error || 
        `API request failed with status ${response.status}: ${response.statusText}`
      ) as Error & {
        status?: number;
        details?: any;
        requestId?: string;
        url?: string;
      };
      
      error.status = response.status;
      error.details = responseData.details || responseData;
      error.requestId = requestId;
      error.url = apiUrl;
      
      throw error;
    }
    
    if (!responseData) {
      throw new Error('No data returned from API');
    }
    
    // Handle both direct album data and wrapped { data: album } format
    const albumData = responseData.data || responseData;
    
    if (!albumData) {
      throw new Error('Invalid album data format');
    }
    
    // Add request ID to the response for debugging
    albumData._requestId = requestId;
    
    // Ensure images array exists
    if (!Array.isArray(albumData.images)) {
      albumData.images = [];
    }
    
    // Optimize image data structure
    albumData.images = albumData.images.map((img: any) => ({
      url: img.url,
      alt: img.alt || '',
    }));
    
    return albumData;
  } catch (error) {
    console.error('Error in getAlbum:', error);
    throw error;
  }
}

interface ErrorResponse extends Error {
  status?: number;
  details?: unknown;
  requestId?: string;
}

// Helper function to safely render error details
function renderErrorDetail(label: string, value: unknown): ReactNode {
  if (value === undefined || value === null) return null;
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return (
      <div className="mb-2">
        <span className="font-mono font-bold">{label}:</span>{' '}
        <span className="font-mono">{String(value)}</span>
      </div>
    );
  }
  
  return (
    <div className="mb-2">
      <p className="font-mono font-bold mb-1">{label}:</p>
      <pre className="whitespace-pre-wrap break-all bg-white p-2 rounded border border-gray-200">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default async function AlbumPage({ params }: { params: { id: string } }) {
  console.log('[Server] Rendering album page with ID:', params.id);
  
  try {
    const album = await getAlbum(params.id);
    return <AlbumClient album={album} id={params.id} />;
  } catch (error: unknown) {
    console.error('[Server] Error in AlbumPage:', error);
    
    // Safely type the error object
    const typedError = error as ErrorResponse;
    
    // Extract error details with type safety
    const errorCode = typeof (error as any)?.status === 'number' ? (error as any).status : 500;
    const requestId = typeof (error as any)?.requestId === 'string' ? (error as any).requestId : undefined;
    const errorDetails = (error as any)?.details;
    
    // Determine error message
    let errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while loading the album.';
    if (errorCode === 404) {
      errorMessage = 'The requested album could not be found.';
    } else if (errorCode === 500) {
      errorMessage = 'A server error occurred while loading the album.';
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 mb-4">
            <FiAlertCircle className="w-16 h-16 mx-auto" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {errorCode === 404 ? 'Album Not Found' : 'Error Loading Album'}
          </h1>
          
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <Link 
              href={`/albums/${params.id}`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiRefreshCw className="mr-2" /> Try Again
            </Link>
            
            <Link 
              href="/albums" 
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiArrowLeft className="mr-2" /> Back to Albums
            </Link>
            
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Contact Support
            </a>
          </div>
          
          {(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left text-sm text-gray-600">
              {renderErrorDetail('Error Code', errorCode || 'N/A')}
              {requestId && renderErrorDetail('Request ID', requestId)}
              {errorDetails && renderErrorDetail('Details', errorDetails)}
              {error instanceof Error && error.stack && renderErrorDetail('Stack Trace', error.stack)}
            </div>
          )}
        </div>
      </div>
    );
  }
}
