import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Get Google Drive API credentials
    const credentials = process.env.GOOGLE_DRIVE_CREDENTIALS;
    if (!credentials) {
      return NextResponse.json(
        { error: 'Google Drive credentials not configured' },
        { status: 500 }
      );
    }

    // Parse credentials
    const serviceAccount = JSON.parse(credentials);
    const jwt = require('jsonwebtoken');
    const { google } = require('googleapis');

    // Create JWT token for authentication
    const token = jwt.sign(
      {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      },
      serviceAccount.private_key,
      { algorithm: 'RS256' }
    );

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return NextResponse.json(
        { error: 'Failed to authenticate with Google Drive' },
        { status: 500 }
      );
    }

    // Initialize Google Drive API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: tokenData.access_token });
    const drive = google.drive({ version: 'v3', auth });

    // Get file information
    const fileResponse = await drive.files.get({
      fileId: fileId,
      fields: 'id,name,mimeType,webViewLink,webContentLink,size',
    });

    const file = fileResponse.data;

    // Check if it's an image file
    const imageMimeTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/svg+xml'
    ];

    if (!imageMimeTypes.includes(file.mimeType)) {
      return NextResponse.json(
        { error: 'File is not an image. Supported formats: JPEG, PNG, GIF, BMP, WebP, SVG' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
      size: file.size,
    });

  } catch (error: any) {
    console.error('Error fetching file info:', error);
    
    // Handle specific Google Drive errors
    if (error.code === 404) {
      return NextResponse.json(
        { error: 'File not found. Please check the file ID and permissions.' },
        { status: 404 }
      );
    } else if (error.code === 403) {
      return NextResponse.json(
        { error: 'Access denied. Please ensure the file is publicly accessible or shared with the service account.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch file information' },
      { status: 500 }
    );
  }
}
