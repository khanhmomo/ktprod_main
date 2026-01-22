import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumCode: string }> }
) {
  try {
    const { albumCode } = await params;
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');
    const filename = searchParams.get('filename');

    if (!file || !filename) {
      return NextResponse.json(
        { error: 'Missing file or filename parameter' },
        { status: 400 }
      );
    }

    const filePath = join('/tmp', file);
    
    try {
      const fileBuffer = await readFile(filePath);
      
      // Set appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', 'application/gzip');
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);

      // Schedule file cleanup after download
      setTimeout(async () => {
        try {
          await unlink(filePath);
        } catch (error) {
          console.error('Error cleaning up file:', error);
        }
      }, 5000); // Clean up after 5 seconds

      return new NextResponse(fileBuffer as any, {
        status: 200,
        headers,
      });

    } catch (fileError) {
      return NextResponse.json(
        { error: 'File not found or expired' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Download file error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
