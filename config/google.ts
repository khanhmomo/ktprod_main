export const googleConfig = {
  // Google OAuth 2.0 credentials
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google',
  
  // Google Drive API settings
  drive: {
    // Public folder ID if you have one
    publicFolderId: process.env.GOOGLE_DRIVE_PUBLIC_FOLDER_ID,
    
    // API key for public access (if using API key instead of OAuth)
    apiKey: process.env.GOOGLE_API_KEY,
    
    // Scopes required for Google Drive API
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ],
    
    // Cache settings
    cacheMaxAge: 60 * 60 * 24 * 7, // 1 week in seconds
    
    // Timeout for API requests (in milliseconds)
    requestTimeout: 10000, // 10 seconds
    
    // Maximum number of retries for failed requests
    maxRetries: 3,
    
    // Base URL for Google Drive API
    apiBaseUrl: 'https://www.googleapis.com/drive/v3',
    
    // Base URL for Google OAuth 2.0
    oauthBaseUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    
    // Token endpoint for OAuth 2.0
    tokenEndpoint: 'https://oauth2.googleapis.com/token'
  }
} as const;

export type GoogleConfig = typeof googleConfig;
