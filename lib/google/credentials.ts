import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

let credentials: any = null;

/**
 * Get Google Drive API credentials from environment variables
 * Looks for GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY
 */
export async function getCredentials() {
  // Return cached credentials if available
  if (credentials) {
    console.log('Using cached Google Drive credentials');
    return credentials;
  }

  // Get credentials from environment variables
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Log environment variable status (without sensitive data)
  console.log('Environment variables status:', {
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKey,
    nodeEnv: process.env.NODE_ENV
  });

  // Check if required environment variables are present
  if (clientEmail && privateKey) {
    try {
      credentials = {
        type: 'service_account',
        project_id: 'khanhtran-prod',
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || '',
        private_key: privateKey,
        client_email: clientEmail,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
        universe_domain: 'googleapis.com'
      };
      
      console.log('Successfully loaded Google Drive credentials from environment variables');
      return credentials;
    } catch (error) {
      console.error('Error creating credentials from environment variables:', error);
      throw new Error('Failed to create Google Drive credentials from environment variables');
    }
  }

  // Fallback to JSON file in development
  if (process.env.NODE_ENV === 'development') {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Try the specific file name first
      const credentialsPath = path.join(process.cwd(), 'config', 'khanhtran-prod-a904df1a3b7f.json');
      if (fs.existsSync(credentialsPath)) {
        console.log('Loading credentials from:', credentialsPath);
        const file = fs.readFileSync(credentialsPath, 'utf-8');
        credentials = JSON.parse(file);
        return credentials;
      }
      
      // Fallback to the default filename
      const defaultCredentialsPath = path.join(process.cwd(), 'config', 'google-credentials.json');
      if (fs.existsSync(defaultCredentialsPath)) {
        console.log('Loading credentials from:', defaultCredentialsPath);
        const file = fs.readFileSync(defaultCredentialsPath, 'utf-8');
        credentials = JSON.parse(file);
        return credentials;
      }
    } catch (error) {
      console.error('Error loading credentials file:', error);
      throw new Error('Failed to load Google Drive credentials from file');
    }
  }

  // If we get here, no valid credentials were found
  const errorMessage = 'Google Drive credentials not found. ' +
    'Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables.';
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export async function getAuthClient() {
  try {
    const credentials = await getCredentials();
    
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Missing required credentials: client_email or private_key');
    }

    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
    });

    // Test the authentication
    try {
      await auth.authorize();
      console.log('Successfully authenticated with Google Drive API');
      return auth;
    } catch (authError) {
      console.error('Failed to authorize with Google Drive API:', authError);
      throw new Error(`Failed to authenticate with Google Drive: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error in getAuthClient:', error);
    throw new Error(`Failed to initialize Google Drive client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default {
  getCredentials,
  getAuthClient,
};
