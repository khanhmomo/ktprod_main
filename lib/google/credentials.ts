import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

let credentials: any = null;

export async function getCredentials() {
  if (credentials) return credentials;

  // Try to get credentials from environment variables
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  if (credentialsJson) {
    try {
      credentials = JSON.parse(credentialsJson);
      return credentials;
    } catch (error) {
      console.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS_JSON:', error);
    }
  }

  // Try to load from file (for development)
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Try the specific file name first
    const credentialsPath = path.join(process.cwd(), 'config', 'khanhtran-prod-a904df1a3b7f.json');
    if (fs.existsSync(credentialsPath)) {
      const file = fs.readFileSync(credentialsPath, 'utf-8');
      credentials = JSON.parse(file);
      return credentials;
    }
    
    // Fallback to the default filename
    const defaultCredentialsPath = path.join(process.cwd(), 'config', 'google-credentials.json');
    if (fs.existsSync(defaultCredentialsPath)) {
      const file = fs.readFileSync(defaultCredentialsPath, 'utf-8');
      credentials = JSON.parse(file);
      return credentials;
    }
  } catch (error) {
    console.error('Error loading credentials file:', error);
  }

  throw new Error('Google Drive credentials not found. Please set GOOGLE_APPLICATION_CREDENTIALS_JSON or add credentials file to config/google-credentials.json');
}

export async function getAuthClient() {
  const credentials = await getCredentials();
  
  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key.replace(/\\n/g, '\n'), // Ensure proper newline formatting
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata',
      'https://www.googleapis.com/auth/drive.readonly'
    ],
  });
}

export default {
  getCredentials,
  getAuthClient,
};
