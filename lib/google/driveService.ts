import { google } from 'googleapis';
import { Readable } from 'stream';

type DriveFile = {
  id: string | null | undefined;
  name: string | null | undefined;
  mimeType: string | null | undefined;
  webViewLink?: string | null;
  thumbnailLink?: string | null;
  webContentLink?: string | null;
};

export class DriveService {
  private drive;
  private static instance: DriveService;

  private constructor(credentials: any) {
    console.log('Initializing DriveService with credentials:', {
      client_email: credentials.client_email,
      private_key_id: credentials.private_key_id,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        ...credentials,
        private_key: credentials.private_key.replace(/\\n/g, '\n')
      },
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
    });
    
    this.drive = google.drive({ 
      version: 'v3', 
      auth,
      // Enable more detailed error messages
      validateStatus: () => true
    });
    
    console.log('DriveService initialized successfully');
  }

  public static getInstance(credentials?: any): DriveService {
    if (!DriveService.instance && credentials) {
      DriveService.instance = new DriveService(credentials);
    }
    if (!DriveService.instance) {
      throw new Error('DriveService not initialized with credentials');
    }
    return DriveService.instance;
  }

  public static initialize(credentials: any) {
    if (!DriveService.instance) {
      DriveService.instance = new DriveService(credentials);
    }
    return DriveService.instance;
  }

  async listFolderContents(folderId: string): Promise<DriveFile[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, webContentLink)',
        pageSize: 1000, // Maximum allowed by the API
      });

      // Ensure we return an array of DriveFile with required fields
      return (response.data.files || []).map(file => ({
        id: file.id || null,
        name: file.name || null,
        mimeType: file.mimeType || null,
        webViewLink: file.webViewLink || null,
        thumbnailLink: file.thumbnailLink || null,
        webContentLink: file.webContentLink || null
      }));
    } catch (error) {
      console.error('Error listing folder contents:', error);
      throw new Error('Failed to list folder contents');
    }
  }

  async getFileUrl(fileId: string): Promise<{ url: string; thumbnailUrl: string }> {
    try {
      // Get file metadata to check if it's an image
      const file = await this.drive.files.get({
        fileId,
        fields: 'mimeType,thumbnailLink,webContentLink,webViewLink'
      });

      const isImage = file.data.mimeType?.startsWith('image/');
      
      // For images, use the webContentLink or construct a direct link
      if (isImage) {
        // Direct link for viewing the image
        const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        
        // Try to get a thumbnail if available, otherwise use the direct URL
        const thumbnailUrl = file.data.thumbnailLink 
          ? `${file.data.thumbnailLink}&sz=w500-h500`
          : directUrl;
        
        return {
          url: directUrl,
          thumbnailUrl
        };
      }
      
      // For non-image files, return the webViewLink as a fallback
      return {
        url: file.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
        thumbnailUrl: ''
      };
    } catch (error) {
      console.error('Error getting file URL:', error);
      // Fallback to direct URL if there's an error
      return {
        url: `https://drive.google.com/uc?export=view&id=${fileId}`,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w500-h500`
      };
    }
  }

  async getFolderInfo(folderId: string) {
    try {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'id, name, webViewLink, mimeType',
      });
      
      if (!response.data) {
        throw new Error('No data returned from Google Drive API');
      }
      
      if (response.data.mimeType !== 'application/vnd.google-apps.folder') {
        throw new Error('The specified ID is not a folder');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error getting folder info:', error);
      
      if (error.code === 404) {
        throw new Error('Folder not found. Please check if the folder exists and is shared with the service account.');
      } else if (error.code === 403) {
        throw new Error('Permission denied. Please ensure the service account has been granted access to this folder.');
      } else if (error.message) {
        throw new Error(`Failed to get folder information: ${error.message}`);
      } else {
        throw new Error('An unknown error occurred while accessing Google Drive');
      }
    }
  }

  extractFolderId(url: string): string | null {
    // More robust regex to handle various Google Drive URL formats
    const match = url.match(/[\/&?](?:id=|folders\/)([\w-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Fallback for direct ID URLs
    const directMatch = url.match(/^[\w-]+$/);
    if (directMatch) {
      return directMatch[0];
    }
    
    // If no match found with regex, try to extract from URL path as last resort
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const foldersIndex = pathParts.indexOf('folders');
      
      if (foldersIndex !== -1 && pathParts[foldersIndex + 1]) {
        return pathParts[foldersIndex + 1].split('?')[0];
      }
    } catch (e) {
      console.error('Error parsing URL:', e);
    }

    console.warn('Could not extract folder ID from URL:', url);
    return null;
  }
}

export default DriveService;
