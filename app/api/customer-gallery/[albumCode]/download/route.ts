import { NextRequest, NextResponse } from 'next/server';
import { createWriteStream } from 'fs';
import { unlink, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import dbConnect from '@/lib/db';
import CustomerGallery from '@/models/CustomerGallery';
import { promises as fs } from 'fs';

// Progress reporting function
function reportProgress(progress: number, status: string) {
  return `data: ${JSON.stringify({ progress, status })}\n\n`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumCode: string }> }
) {
  try {
    const { albumCode } = await params;
    const { searchParams } = new URL(request.url);
    const downloadType = searchParams.get('type') || 'full';
    const withProgress = searchParams.get('progress') === 'true';

    await dbConnect();

    // Find gallery by album code
    const gallery = await CustomerGallery.findOne({ 
      albumCode: albumCode.toLowerCase(),
      status: { $in: ['published', 'draft'] },
      isActive: true 
    });
    
    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }

    // Filter photos based on download type
    let photosToDownload = gallery.photos;
    if (downloadType === 'favorites') {
      const favoritesParam = searchParams.get('favorites');
      if (favoritesParam) {
        const favoriteIndices = favoritesParam.split(',').map(idx => parseInt(idx)).filter(idx => !isNaN(idx));
        photosToDownload = favoriteIndices.map(idx => gallery.photos[idx]).filter(photo => photo);
        
        if (photosToDownload.length === 0) {
          return NextResponse.json(
            { error: 'No valid favorites found' },
            { status: 400 }
          );
        }
      } else {
        // No favorites specified, return empty
        return NextResponse.json(
          { error: 'No favorites specified' },
          { status: 400 }
        );
      }
    } else if (downloadType === 'face-matches') {
      const facesParam = searchParams.get('faces');
      if (facesParam) {
        const faceIndices = facesParam.split(',').map(idx => parseInt(idx)).filter(idx => !isNaN(idx));
        photosToDownload = faceIndices.map(idx => gallery.photos[idx]).filter(photo => photo);
        
        if (photosToDownload.length === 0) {
          return NextResponse.json(
            { error: 'No valid face matches found' },
            { status: 400 }
          );
        }
      } else {
        // No face matches specified, return empty
        return NextResponse.json(
          { error: 'No face matches specified' },
          { status: 400 }
        );
      }
    }

    // Create temporary directory
    const tempDir = join('/tmp', `gallery-${albumCode}-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    // Download all images with parallel processing for better performance
    const imageFiles: string[] = [];
    const totalPhotos = photosToDownload.length;
    
    // Process downloads in parallel batches of 10 for better performance
    const batchSize = 10;
    const results: Array<{ filePath: string; success: boolean }> = [];
    
    for (let batchStart = 0; batchStart < totalPhotos; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalPhotos);
      const batch = photosToDownload.slice(batchStart, batchEnd);
      
      const batchPromises = batch.map(async (photo: any, batchIndex: number) => {
        const globalIndex = batchStart + batchIndex;
        
        try {
          // Download image from Google Drive
          const imageUrl = processImageUrl(photo.url);
          const response = await fetch(imageUrl, { 
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (!response.ok) {
            console.error(`Failed to download image ${globalIndex}:`, response.statusText);
            return { filePath: '', success: false };
          }

          const imageBuffer = await response.arrayBuffer();
          
          // Generate filename with better naming
          const extension = photo.url.includes('.jpg') || photo.url.includes('.jpeg') 
            ? '.jpg' 
            : photo.url.includes('.png') 
            ? '.png' 
            : photo.url.includes('.webp')
            ? '.webp'
            : '.jpg';
          const filename = `${gallery.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${gallery.eventType.replace(/[^a-zA-Z0-9]/g, '_')}_${String(globalIndex + 1).padStart(3, '0')}${extension}`;
          const filePath = join(tempDir, filename);
          
          // Write image file
          await writeFile(filePath, Buffer.from(imageBuffer));
          return { filePath, success: true };
          
        } catch (error) {
          console.error(`Error processing photo ${globalIndex}:`, error);
          return { filePath: '', success: false };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          imageFiles.push(result.value.filePath);
        }
      });
    }

    if (imageFiles.length === 0) {
      // Clean up empty directory
      await fs.rmdir(tempDir).catch(console.error);
      return NextResponse.json(
        { error: 'No images could be downloaded' },
        { status: 500 }
      );
    }

    // Create optimized tar.gz archive with streaming
    const archivePath = join('/tmp', `${albumCode}-${Date.now()}.tar.gz`);
    
    // Create archive with streaming for better memory usage
    const archiveBuffer = await createOptimizedTar(imageFiles, tempDir);

    // Clean up temporary files immediately after creating archive
    try {
      for (const filePath of imageFiles) {
        await unlink(filePath);
      }
      await fs.rmdir(tempDir);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/gzip');
    headers.set('Cache-Control', 'no-cache');
    const suffix = downloadType === 'favorites' ? '_Favorites' : downloadType === 'face-matches' ? '_Face_Matches' : '';
    headers.set('Content-Disposition', `attachment; filename="${gallery.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${gallery.eventType.replace(/[^a-zA-Z0-9]/g, '_')}${suffix}_Photos.tar.gz"`);

    return new NextResponse(archiveBuffer as any, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate download' },
      { status: 500 }
    );
  }
}

// Optimized tar creation with streaming compression
async function createOptimizedTar(filePaths: string[], baseDir: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  
  // Process files in parallel to speed up tar creation
  const fileDataPromises = filePaths.map(async (filePath) => {
    const filename = filePath.replace(baseDir + '/', '');
    const fileBuffer = await fs.readFile(filePath);
    
    // Simple tar header (512 bytes)
    const header = Buffer.alloc(512);
    header.write(filename, 0, 100); // filename
    header.write('0000644', 100, 8); // mode (octal)
    header.write('0000000', 108, 8); // uid
    header.write('0000000', 116, 8); // gid
    header.write(fileBuffer.length.toString(8).padStart(11, '0'), 124, 12); // size
    header.write(Math.floor(Date.now() / 1000).toString(8).padStart(11, '0'), 136, 12); // mtime
    header.write('        ', 148, 8); // checksum placeholder
    
    // Calculate checksum
    let checksum = 0;
    for (let i = 0; i < 512; i++) {
      checksum += header[i];
    }
    header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8);
    
    // Add padding to align to 512-byte boundary
    const padding = 512 - (fileBuffer.length % 512);
    const paddingBuffer = padding < 512 ? Buffer.alloc(padding) : Buffer.alloc(0);
    
    return {
      header,
      fileBuffer,
      paddingBuffer
    };
  });
  
  // Wait for all file data to be processed
  const fileDataResults = await Promise.allSettled(fileDataPromises);
  
  // Concatenate all chunks
  for (const result of fileDataResults) {
    if (result.status === 'fulfilled') {
      chunks.push(result.value.header);
      chunks.push(result.value.fileBuffer);
      if (result.value.paddingBuffer.length > 0) {
        chunks.push(result.value.paddingBuffer);
      }
    }
  }
  
  // Add end-of-archive marker (2 blocks of zeros)
  chunks.push(Buffer.alloc(1024));
  
  const tarBuffer = Buffer.concat(chunks);
  
  // Apply gzip compression
  return new Promise((resolve, reject) => {
    const gzip = createGzip({ level: 6 }); // Balanced compression level
    const chunks: Buffer[] = [];
    
    gzip.on('data', (chunk) => chunks.push(chunk));
    gzip.on('end', () => resolve(Buffer.concat(chunks)));
    gzip.on('error', reject);
    
    gzip.write(tarBuffer);
    gzip.end();
  });
}

// Helper function to process image URLs (same as in GalleryClient)
function processImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  try {
    if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
      let fileId = '';
      
      if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1]?.split('/')[0];
      } else if (url.includes('id=')) {
        fileId = new URL(url).searchParams.get('id') || '';
      } else {
        const match = url.match(/[\w-]{25,}/);
        if (match) fileId = match[0];
      }
      
      if (fileId) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        return `${baseUrl}/api/drive/image?id=${fileId}`;
      }
    }
  } catch (e) {
    console.error("Error processing image URL:", url, e);
  }
  
  return url;
}
