import { NextRequest } from 'next/server';
import { join } from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { createGzip } from 'zlib';
import dbConnect from '@/lib/db';
import CustomerGallery from '@/models/CustomerGallery';
import { promises as fs } from 'fs';

// Progress reporting function
function reportProgress(progress: number, status: string) {
  return `data: ${JSON.stringify({ progress, status })}\n\n`;
}

// Helper function to process image URLs with size control
function processImageUrl(url: string, forProgress = false): string {
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
        // Use medium size only for progress estimation, not actual download
        if (forProgress) {
          return `${baseUrl}/api/drive/image?id=${fileId}&size=medium`;
        }
        // Full size for actual download
        return `${baseUrl}/api/drive/image?id=${fileId}`;
      }
    }
  } catch (e) {
    console.error("Error processing image URL:", url, e);
  }
  
  return url;
}

// Optimized download function with retry logic and size control
async function downloadImageWithRetry(url: string, maxRetries = 3): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { 
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*,*/*;q=0.8'
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(30000) // 30 second timeout for full-size images
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error(`Download attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        return null;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  return null;
}

// Fast progress estimation function
async function estimateDownloadProgress(photos: any[]): Promise<void> {
  // Download a few small samples to estimate timing
  const sampleSize = Math.min(5, photos.length);
  const samplePromises = photos.slice(0, sampleSize).map(async (photo) => {
    try {
      const imageUrl = processImageUrl(photo.url, true); // Use medium size for estimation
      const response = await fetch(imageUrl, { 
        signal: AbortSignal.timeout(10000) // 10 second timeout for samples
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  });
  
  const results = await Promise.allSettled(samplePromises);
  const successRate = results.filter(r => r.status === 'fulfilled' && r.value).length / sampleSize;
  
  // If we can download samples quickly, proceed with full downloads
  // If not, we'll still try but manage expectations
  console.log(`Download speed test: ${Math.round(successRate * 100)}% success rate`);
}

// Optimized tar creation with streaming compression
async function createOptimizedTar(filePaths: string[], baseDir: string, onProgress?: (progress: number, status: string) => void): Promise<Buffer> {
  const chunks: Buffer[] = [];
  
  onProgress?.(10, 'Creating archive...');
  
  // Process files in parallel to speed up tar creation
  const fileDataPromises = filePaths.map(async (filePath, index) => {
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
    
    // Report progress
    if (index % 10 === 0) {
      onProgress?.(10 + Math.floor((index / filePaths.length) * 30), 'Processing files...');
    }
    
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
  
  onProgress?.(40, 'Compressing files...');
  
  const tarBuffer = Buffer.concat(chunks);
  
  // Apply gzip compression
  return new Promise((resolve, reject) => {
    const gzip = createGzip({ level: 6 }); // Balanced compression level
    const chunks: Buffer[] = [];
    let processedBytes = 0;
    const totalBytes = tarBuffer.length;
    
    gzip.on('data', (chunk) => {
      chunks.push(chunk);
      processedBytes += chunk.length;
      const progress = 40 + Math.floor((processedBytes / (totalBytes * 2)) * 50); // Compression takes 50% of remaining time
      onProgress?.(Math.min(progress, 90), 'Compressing archive...');
    });
    
    gzip.on('end', () => {
      onProgress?.(95, 'Finalizing download...');
      resolve(Buffer.concat(chunks));
    });
    
    gzip.on('error', reject);
    
    gzip.write(tarBuffer);
    gzip.end();
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumCode: string }> }
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { albumCode } = await params;
        const { searchParams } = new URL(request.url);
        const downloadType = searchParams.get('type') || 'full';

        // Send initial headers for SSE
        controller.enqueue(encoder.encode('HTTP/1.1 200 OK\r\n'));
        controller.enqueue(encoder.encode('Content-Type: text/event-stream\r\n'));
        controller.enqueue(encoder.encode('Cache-Control: no-cache\r\n'));
        controller.enqueue(encoder.encode('Connection: keep-alive\r\n'));
        controller.enqueue(encoder.encode('\r\n'));

        // Send initial progress
        controller.enqueue(encoder.encode(reportProgress(0, 'Starting download...')));

        await dbConnect();

        // Find gallery by album code
        const gallery = await CustomerGallery.findOne({ 
          albumCode: albumCode.toLowerCase(),
          status: { $in: ['published', 'draft'] },
          isActive: true 
        });
        
        if (!gallery) {
          controller.enqueue(encoder.encode(reportProgress(0, 'Gallery not found')));
          controller.close();
          return;
        }

        // Filter photos based on download type
        let photosToDownload = gallery.photos;
        if (downloadType === 'favorites') {
          const favoritesParam = searchParams.get('favorites');
          if (favoritesParam) {
            const favoriteIndices = favoritesParam.split(',').map(idx => parseInt(idx)).filter(idx => !isNaN(idx));
            photosToDownload = favoriteIndices.map(idx => gallery.photos[idx]).filter(photo => photo);
          }
        } else if (downloadType === 'face-matches') {
          const facesParam = searchParams.get('faces');
          if (facesParam) {
            const faceIndices = facesParam.split(',').map(idx => parseInt(idx)).filter(idx => !isNaN(idx));
            photosToDownload = faceIndices.map(idx => gallery.photos[idx]).filter(photo => photo);
          }
        }

        if (photosToDownload.length === 0) {
          controller.enqueue(encoder.encode(reportProgress(0, 'No photos to download')));
          controller.close();
          return;
        }

        // Create temporary directory
        const tempDir = join('/tmp', `gallery-${albumCode}-${Date.now()}`);
        await mkdir(tempDir, { recursive: true });

        controller.enqueue(encoder.encode(reportProgress(5, 'Estimating download speed...')));

        // Quick speed estimation with small samples
        await estimateDownloadProgress(photosToDownload);

        controller.enqueue(encoder.encode(reportProgress(8, 'Starting full-quality downloads...')));

        // Download all images with full quality for customer
        const imageFiles: string[] = [];
        const totalPhotos = photosToDownload.length;
        
        // Use optimal batch size for full-size images
        const batchSize = 15; // Slightly reduced for full-size images
        let successfulDownloads = 0;
        let totalBytesDownloaded = 0;
        
        for (let batchStart = 0; batchStart < totalPhotos; batchStart += batchSize) {
          const batchEnd = Math.min(batchStart + batchSize, totalPhotos);
          const batch = photosToDownload.slice(batchStart, batchEnd);
          
          controller.enqueue(encoder.encode(reportProgress(
            8 + Math.floor((batchStart / totalPhotos) * 32), 
            `Downloading batch ${Math.floor(batchStart / batchSize) + 1}/${Math.ceil(totalPhotos / batchSize)} (full quality)...`
          )));
          
          const batchPromises = batch.map(async (photo: any, batchIndex: number) => {
            const globalIndex = batchStart + batchIndex;
            
            try {
              // Use full-size images for actual download
              const imageUrl = processImageUrl(photo.url, false); // false = full size
              const imageBuffer = await downloadImageWithRetry(imageUrl);
              
              if (!imageBuffer) {
                return { filePath: '', success: false, size: 0 };
              }

              const extension = photo.url.includes('.jpg') || photo.url.includes('.jpeg') 
                ? '.jpg' 
                : photo.url.includes('.png') 
                ? '.png' 
                : photo.url.includes('.webp')
                ? '.webp'
                : '.jpg';
              
              // Use original filename from alt field if available
              let filename;
              if (photo.alt) {
                filename = photo.alt; // Use original filename like "DSC05430.JPG"
              } else {
                // Fallback to generic naming
                filename = `${gallery.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${gallery.eventType.replace(/[^a-zA-Z0-9]/g, '_')}_${String(globalIndex + 1).padStart(3, '0')}${extension}`;
              }
              
              const filePath = join(tempDir, filename);
              
              await writeFile(filePath, imageBuffer);
              
              return { 
                filePath, 
                success: true, 
                size: imageBuffer.length 
              };
              
            } catch (error) {
              console.error(`Error processing photo ${globalIndex}:`, error);
              return { filePath: '', success: false, size: 0 };
            }
          });
          
          const batchResults = await Promise.allSettled(batchPromises);
          batchResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success) {
              imageFiles.push(result.value.filePath);
              successfulDownloads++;
              totalBytesDownloaded += result.value.size;
            }
          });

          // Report detailed progress with file size info
          const downloadProgress = 8 + Math.floor(((batchStart + batchSize) / totalPhotos) * 32);
          const avgSize = successfulDownloads > 0 ? Math.round(totalBytesDownloaded / successfulDownloads / 1024) : 0;
          controller.enqueue(encoder.encode(reportProgress(
            Math.min(downloadProgress, 40), 
            `Downloaded ${successfulDownloads}/${totalPhotos} full-quality photos (${avgSize}KB avg)...`
          )));
        }

        if (imageFiles.length === 0) {
          await fs.rmdir(tempDir).catch(console.error);
          controller.enqueue(encoder.encode(reportProgress(0, 'No images could be downloaded')));
          controller.close();
          return;
        }

        // Create archive with progress reporting
        const archiveBuffer = await createOptimizedTar(imageFiles, tempDir, (progress, status) => {
          controller.enqueue(encoder.encode(reportProgress(progress, status)));
        });

        // Clean up temporary files
        try {
          for (const filePath of imageFiles) {
            await unlink(filePath);
          }
          await fs.rmdir(tempDir);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }

        // Generate download URL
        const suffix = downloadType === 'favorites' ? '_Favorites' : downloadType === 'face-matches' ? '_Face_Matches' : '';
        const filename = `${gallery.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${gallery.eventType.replace(/[^a-zA-Z0-9]/g, '_')}${suffix}_Photos.tar.gz`;
        
        // Store the archive temporarily for download
        const archivePath = join('/tmp', `${albumCode}-${Date.now()}.tar.gz`);
        await writeFile(archivePath, archiveBuffer);
        
        // Send final progress with download URL
        controller.enqueue(encoder.encode(reportProgress(100, 'Download ready!')));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          progress: 100, 
          status: 'Download ready!', 
          downloadUrl: `/api/customer-gallery/${albumCode}/download-file?file=${archivePath.split('/').pop()}&filename=${filename}`
        })}\n\n`));
        
        controller.close();

      } catch (error) {
        console.error('Download error:', error);
        controller.enqueue(encoder.encode(reportProgress(0, 'Download failed')));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
