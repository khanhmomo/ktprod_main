import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const getGoogleAuthURL = (includeCalendar: boolean = false) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  // Add calendar scope if requested
  if (includeCalendar) {
    scopes.push('https://www.googleapis.com/auth/calendar');
  }

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });
};

export const getGoogleTokens = async (code: string) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    throw new Error('Failed to get Google tokens');
  }
};

export const getGoogleUserInfo = async (accessToken: string) => {
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const response = await oauth2.userinfo.get();
    const data = response.data;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture
    };
  } catch (error) {
    throw new Error('Failed to get Google user info');
  }
};
