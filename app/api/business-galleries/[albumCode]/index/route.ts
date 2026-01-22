import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BusinessGallery from '@/models/BusinessGallery';
import { spawn } from 'child_process';
import path from 'path';

let indexingProcess: any = null;
let currentProgress = { status: 'not_started', progress: 0, indexedPhotos: 0, totalPhotos: 0 };

export async function POST(request: NextRequest, { params }: { params: { albumCode: string } }) {
  try {
    await connectDB();
    
    const albumCode = params.albumCode;
    
    // Find the business gallery
    const gallery = await BusinessGallery.findOne({ albumCode });
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    // Check if face recognition is enabled
    if (!gallery.faceRecognitionEnabled) {
      return NextResponse.json({ error: 'Face recognition is not enabled for this gallery' }, { status: 400 });
    }

    // Check if indexing is already running
    if (gallery.faceIndexing?.status === 'in_progress') {
      return NextResponse.json({ error: 'Indexing is already in progress' }, { status: 400 });
    }

    // Reset progress
    currentProgress = {
      status: 'in_progress',
      progress: 0,
      indexedPhotos: 0,
      totalPhotos: gallery.photos?.length || 0
    };

    // Update gallery status
    await BusinessGallery.updateOne(
      { albumCode },
      { 
        $set: { 
          'faceIndexing.status': 'in_progress',
          'faceIndexing.indexedPhotos': 0,
          'faceIndexing.lastIndexedAt': new Date()
        }
      }
    );

    // Start indexing process
    const scriptPath = path.join(process.cwd(), 'scripts', 'index-faces.js');
    indexingProcess = spawn('node', [scriptPath, albumCode, 'business'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    indexingProcess.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log(`Indexing output for ${albumCode}:`, output);
      
      // Parse progress from output (you may need to adjust this based on your script output)
      const progressMatch = output.match(/Progress: (\d+)\/(\d+)/);
      if (progressMatch) {
        const indexed = parseInt(progressMatch[1]);
        const total = parseInt(progressMatch[2]);
        currentProgress.indexedPhotos = indexed;
        currentProgress.totalPhotos = total;
        currentProgress.progress = total > 0 ? (indexed / total) * 100 : 0;
      }
    });

    indexingProcess.on('close', async (code: number) => {
      console.log(`Indexing process for ${albumCode} exited with code ${code}`);
      
      if (code === 0) {
        // Success
        currentProgress.status = 'completed';
        currentProgress.progress = 100;
        await BusinessGallery.updateOne(
          { albumCode },
          { 
            $set: { 
              'faceIndexing.status': 'completed',
              'faceIndexing.indexedPhotos': currentProgress.totalPhotos,
              'faceIndexing.lastIndexedAt': new Date()
            }
          }
        );
      } else {
        // Error
        currentProgress.status = 'error';
        await BusinessGallery.updateOne(
          { albumCode },
          { 
            $set: { 
              'faceIndexing.status': 'error',
              'faceIndexing.errorMessage': 'Indexing process failed'
            }
          }
        );
      }
      
      indexingProcess = null;
    });

    indexingProcess.on('error', async (error: Error) => {
      console.error(`Indexing process error for ${albumCode}:`, error);
      currentProgress.status = 'error';
      await BusinessGallery.updateOne(
        { albumCode },
        { 
          $set: { 
            'faceIndexing.status': 'error',
            'faceIndexing.errorMessage': error.message
          }
        }
      );
      indexingProcess = null;
    });

    return NextResponse.json({ 
      message: 'Indexing started successfully',
      status: currentProgress.status,
      progress: currentProgress.progress,
      totalPhotos: currentProgress.totalPhotos
    });

  } catch (error) {
    console.error('Error starting indexing:', error);
    return NextResponse.json(
      { error: 'Failed to start indexing' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { albumCode: string } }) {
  try {
    await connectDB();
    
    const albumCode = params.albumCode;
    
    // Kill the indexing process if it's running
    if (indexingProcess) {
      indexingProcess.kill();
      indexingProcess = null;
    }

    // Update gallery status
    await BusinessGallery.updateOne(
      { albumCode },
      { 
        $set: { 
          'faceIndexing.status': 'stopped',
          'faceIndexing.errorMessage': 'Indexing was stopped by user'
        }
      }
    );

    currentProgress.status = 'stopped';

    return NextResponse.json({ 
      message: 'Indexing stopped successfully',
      status: 'stopped'
    });

  } catch (error) {
    console.error('Error stopping indexing:', error);
    return NextResponse.json(
      { error: 'Failed to stop indexing' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { albumCode: string } }) {
  try {
    await connectDB();
    
    const albumCode = params.albumCode;
    
    // Get current status from database
    const gallery = await BusinessGallery.findOne({ albumCode });
    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    const faceIndexing = gallery.faceIndexing || {};
    
    // If indexing is in progress, return current progress
    if (faceIndexing.status === 'in_progress') {
      return NextResponse.json({
        status: 'in_progress',
        progress: currentProgress.progress,
        indexedPhotos: currentProgress.indexedPhotos,
        totalPhotos: currentProgress.totalPhotos,
        lastIndexedAt: faceIndexing.lastIndexedAt
      });
    }

    // Return stored status
    return NextResponse.json({
      status: faceIndexing.status || 'not_started',
      progress: faceIndexing.indexedPhotos && gallery.photos ? 
        (faceIndexing.indexedPhotos / gallery.photos.length) * 100 : 0,
      indexedPhotos: faceIndexing.indexedPhotos || 0,
      totalPhotos: gallery.photos?.length || 0,
      lastIndexedAt: faceIndexing.lastIndexedAt,
      errorMessage: faceIndexing.errorMessage
    });

  } catch (error) {
    console.error('Error getting indexing status:', error);
    return NextResponse.json(
      { error: 'Failed to get indexing status' },
      { status: 500 }
    );
  }
}
