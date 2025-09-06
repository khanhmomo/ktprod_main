import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/photoslibrary.readonly'];

export async function getAuthUrl() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_PHOTOS_CLIENT_ID,
    process.env.GOOGLE_PHOTOS_CLIENT_SECRET,
    process.env.GOOGLE_PHOTOS_REDIRECT_URI
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  return url;
}

export async function getPhotos(accessToken: string, albumId?: string) {
  const photos = google.photoslibrary({
    version: 'v1',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  try {
    let response;
    if (albumId) {
      response = await photos.mediaItems.search({
        requestBody: {
          albumId,
          pageSize: 100,
        },
      });
    } else {
      response = await photos.mediaItems.list({
        pageSize: 100,
      });
    }

    return response.data.mediaItems?.map(item => ({
      id: item.id,
      baseUrl: `${item.baseUrl}=w800-h800-c`,
      filename: item.filename || 'photo.jpg',
    })) || [];
  } catch (error) {
    console.error('Error fetching photos:', error);
    throw error;
  }
}

export async function getAlbums(accessToken: string) {
  const photos = google.photoslibrary({
    version: 'v1',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  try {
    const response = await photos.albums.list({
      pageSize: 50,
    });
    return response.data.albums || [];
  } catch (error) {
    console.error('Error fetching albums:', error);
    throw error;
  }
}
