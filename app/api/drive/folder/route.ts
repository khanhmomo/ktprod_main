import { NextResponse } from 'next/server';
import { getCredentials } from '@/lib/google/credentials';
import { DriveService } from '@/lib/google/driveService';

export async function POST(request: Request) {
  try {
    // Get the folder URL or ID from the request body
    const { folderUrl } = await request.json();
    
    if (!folderUrl) {
      return NextResponse.json(
        { error: 'Folder URL is required' },
        { status: 400 }
      );
    }

    // Initialize the DriveService with credentials
    let driveService;
    try {
      const credentials = await getCredentials();
      driveService = DriveService.initialize(credentials);
    } catch (error: any) {
      console.error('Failed to initialize DriveService:', error);
      return NextResponse.json(
        { error: 'Failed to authenticate with Google Drive. Please check your credentials.' },
        { status: 500 }
      );
    }

    // Extract folder ID from URL
    let folderId;
    try {
      folderId = driveService.extractFolderId(folderUrl);
      if (!folderId) {
        throw new Error('Could not extract folder ID from URL');
      }
    } catch (error: any) {
      console.error('Invalid folder URL:', folderUrl, error);
      return NextResponse.json(
        { 
          error: 'Invalid Google Drive folder URL. Please provide a valid Google Drive folder URL.',
          details: error.message
        },
        { status: 400 }
      );
    }

    // Get folder info and contents
    const folderInfo = await driveService.getFolderInfo(folderId);
    const files = await driveService.listFolderContents(folderId);

    // Process files to get direct URLs and filter for images
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        try {
          const urls = await driveService.getFileUrl(file.id!);
          return {
            id: file.id,
            name: file.name || 'Untitled',
            mimeType: file.mimeType,
            url: urls.url,
            thumbnailUrl: urls.thumbnailUrl || urls.url,
            originalUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
            source: 'google-drive',
          };
        } catch (error) {
          console.error(`Error processing file ${file.id}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed files and non-image files
    const images = filesWithUrls.filter((file): file is NonNullable<typeof file> => {
      if (!file) return false;
      if (!file.mimeType || !file.url) return false;
      return file.mimeType.startsWith('image/');
    });

    if (images.length === 0 && files.length > 0) {
      console.warn('No valid image files found in folder, but non-image files exist');
    }

    return NextResponse.json({
      success: true,
      folder: {
        id: folderId,
        name: folderInfo.name,
        url: `https://drive.google.com/drive/folders/${folderId}`,
        imageCount: images.length,
      },
      images,
    });

  } catch (err: any) {
    console.error('Error processing Google Drive folder:', err);
    
    let statusCode = 500;
    let errorMessage = 'Failed to process folder';
    
    if (err.message.includes('permission') || err.message.includes('403')) {
      statusCode = 403;
      errorMessage = 'Permission denied. Please make sure the folder is shared with the service account.';
    } else if (err.message.includes('not found') || err.message.includes('404')) {
      statusCode = 404;
      errorMessage = 'Folder not found. Please check the folder URL and try again.';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      { status: statusCode }
    );
  }
}
