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
  category?: string;
}

// Server Component that fetches the album data with optimizations
async function getAlbum(id: string) {
  if (!id) {
    throw new Error('Album ID is required');
  }
  
  const requestId = Math.random().toString(36).substring(2, 9);
  
  try {
    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL 
                     ? `https://${process.env.VERCEL_URL}` 
                     : 'http://localhost:3000');
    
    // Ensure BASE_URL ends with a slash for proper URL construction
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const apiUrl = `${normalizedBaseUrl}api/albums/${id}`;
    
    console.log(`[${requestId}] Fetching album from: ${apiUrl}`);
    
    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
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
      console.log(`[${requestId}] Environment:`, {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        API_URL: apiUrl
      });
    }
    
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

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log('[Server] Rendering album page with ID:', id);
  
  try {
    const album = await getAlbum(id);
    return <AlbumClient album={album} id={id} />;
  } catch (error: unknown) {
    console.error('[Server] Error in AlbumPage:', error);
    
    // Extract error information with type safety
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    let errorDetails = '';
    let requestId = '';
    
    if (error && typeof error === 'object') {
      if ('details' in error && typeof error.details === 'string') {
        errorDetails = error.details;
      }
      if ('requestId' in error && typeof error.requestId === 'string') {
        requestId = error.requestId;
      } else if ('requestId' in error && typeof error.requestId === 'number') {
        requestId = String(error.requestId);
      }
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <FiAlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading album</h3>
          <p className="mt-1 text-sm text-gray-700">{errorMessage}</p>
          
          {(errorDetails || requestId) && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-left overflow-auto">
              <details>
                <summary className="cursor-pointer text-gray-600">Show details</summary>
                <div className="mt-2 space-y-1">
                  {requestId && <p><span className="font-medium">Request ID:</span> {requestId}</p>}
                  {errorDetails && <pre className="whitespace-pre-wrap break-words">{errorDetails}</pre>}
                </div>
              </details>
            </div>
          )}
          
          <div className="mt-6">
            <Link
              href="/albums"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" />
              Back to albums
            </Link>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
              <p className="font-medium">Development Mode:</p>
              <p>Check the browser console for more detailed error information.</p>
              <p className="mt-1">NEXT_PUBLIC_BASE_URL: {process.env.NEXT_PUBLIC_BASE_URL || 'Not set'}</p>
              <p>VERCEL_URL: {process.env.VERCEL_URL || 'Not set'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}
