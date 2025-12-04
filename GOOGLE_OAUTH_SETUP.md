# Google OAuth Setup Guide

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
7. For production, add: `https://yourdomain.com/api/auth/google/callback`
8. Copy the Client ID and Client Secret

## 2. Environment Variables

Create a `.env.local` file in your project root:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

## 3. Enable Required APIs

Make sure these APIs are enabled in Google Cloud Console:
- Google OAuth2 API
- Google+ API (if available) or People API

## 4. Test the Setup

1. Restart your Next.js development server
2. Go to `/admin/login` 
3. Click "Sign in with Google"
4. You should be redirected to Google OAuth
5. After authentication, you'll be redirected back to the app

## 5. User Roles

- **First-time Google users** will be created as 'crew' members
- **Super admin** needs to manually update their role to 'super_admin' in the database
- **Traditional login** uses admin/password123 for super admin access

## 6. Production Deployment

For production, update:
- `GOOGLE_REDIRECT_URI` to your production domain
- `NEXTAUTH_URL` to your production domain
- Ensure HTTPS is enabled (required for OAuth)
