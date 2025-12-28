import { NextRequest, NextResponse } from 'next/server';
import { createWriteStream } from 'fs';
import { unlink, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import dbConnect from '@/lib/db';
import CustomerGallery from '@/models/CustomerGallery';
import { promises as fs } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumCode: string }> }
) {
  try {
    const { albumCode } = await params;
    const { searchParams } = new URL(request.url);
    const downloadType = searchParams.get('type') || 'full';

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
    }

    // Create temporary directory
    const tempDir = join('/tmp', `gallery-${albumCode}-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    // Download all images with progress tracking
    const imageFiles: string[] = [];
    let downloadedCount = 0;
    const totalPhotos = photosToDownload.length;
    
    for (let i = 0; i < photosToDownload.length; i++) {
      const photo = photosToDownload[i];
      
      try {
        // Download image from Google Drive
        const imageUrl = processImageUrl(photo.url);
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
          console.error(`Failed to download image ${i}:`, response.statusText);
          continue;
        }

        const imageBuffer = await response.arrayBuffer();
        
        // Generate filename
        const extension = photo.url.includes('.jpg') || photo.url.includes('.jpeg') 
          ? '.jpg' 
          : photo.url.includes('.png') 
          ? '.png' 
          : '.jpg';
        const filename = `${gallery.customerName.replace(/\s+/g, '_')}_${gallery.eventType.replace(/\s+/g, '_')}_${String(i + 1).padStart(3, '0')}${extension}`;
        const filePath = join(tempDir, filename);
        
        // Write image file
        await writeFile(filePath, Buffer.from(imageBuffer));
        imageFiles.push(filePath);
        downloadedCount++;
        
        // Calculate progress (0-30% for downloading)
        const downloadProgress = Math.floor((downloadedCount / totalPhotos) * 30);
        
      } catch (error) {
        console.error(`Error processing photo ${i}:`, error);
        continue;
      }
    }

    if (downloadedCount === 0) {
      // Clean up empty directory
      await fs.rmdir(tempDir).catch(console.error);
      return NextResponse.json(
        { error: 'No images could be downloaded' },
        { status: 500 }
      );
    }

    // Create a simple tar.gz archive (built-in Node.js)
    const archivePath = join('/tmp', `${albumCode}-${Date.now()}.tar.gz`);
    const archiveOutput = createWriteStream(archivePath);
    const gzip = createGzip();
    
    // Create a simple tar format (basic implementation)
    const tarBuffer = await createSimpleTar(imageFiles, tempDir);
    
    // Pipe through gzip
    gzip.pipe(archiveOutput);
    gzip.write(tarBuffer);
    gzip.end();

    // Wait for compression to finish
    await new Promise<void>((resolve, reject) => {
      archiveOutput.on('close', () => resolve());
      archiveOutput.on('error', reject);
    });

    // Read the archive file
    const archiveBuffer = await fs.readFile(archivePath);

    // Clean up temporary files
    try {
      await unlink(archivePath);
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
    const suffix = downloadType === 'favorites' ? '_Favorites' : '';
    headers.set('Content-Disposition', `attachment; filename="${gallery.customerName.replace(/\s+/g, '_')}_${gallery.eventType.replace(/\s+/g, '_')}${suffix}_Photos.tar.gz"`);

    return new NextResponse(new Uint8Array(archiveBuffer), {
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

// Simple tar creation (basic implementation)
async function createSimpleTar(filePaths: string[], baseDir: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  
  for (const filePath of filePaths) {
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
    
    chunks.push(header);
    chunks.push(fileBuffer);
    
    // Add padding to align to 512-byte boundary
    const padding = 512 - (fileBuffer.length % 512);
    if (padding < 512) {
      chunks.push(Buffer.alloc(padding));
    }
  }
  
  // Add end-of-archive marker (2 blocks of zeros)
  chunks.push(Buffer.alloc(1024));
  
  return Buffer.concat(chunks);
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
