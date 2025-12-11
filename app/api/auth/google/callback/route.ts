import { NextRequest, NextResponse } from 'next/server';
import { getGoogleTokens, getGoogleUserInfo } from '@/lib/google-auth';
import dbConnect from '@/lib/db';
import { Crew } from '@/models/Crew';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // Return URL
    const isWorkspace = searchParams.get('workspace') === 'true';

    if (error) {
      const redirectUrl = isWorkspace ? '/workspace/login' : '/admin/login';
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}${redirectUrl}?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      const redirectUrl = isWorkspace ? '/workspace/login' : '/admin/login';
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}${redirectUrl}?error=missing_code`
      );
    }

    // Get tokens from Google
    const tokens = await getGoogleTokens(code);
    
    // Get user info from Google
    const userInfo = await getGoogleUserInfo(tokens.access_token!);

    await dbConnect();

    // Find or create crew member
    let crewMember = await Crew.findOne({ googleId: userInfo.id! });
    
    if (!crewMember) {
      // Check if user exists by email (pre-invited)
      crewMember = await Crew.findOne({ email: userInfo.email?.toLowerCase() || '' });
      
      if (crewMember) {
        // Update existing crew member with Google info
        crewMember.googleId = userInfo.id;
        crewMember.avatar = userInfo.picture || '';
        await crewMember.save();
      } else {
        // Auto-create crew member for first-time users
        crewMember = new Crew({
          googleId: userInfo.id!,
          email: userInfo.email?.toLowerCase() || '',
          name: userInfo.name || '',
          avatar: userInfo.picture || '',
          role: 'crew', // Default to crew for new users
          permissions: []
        });
        await crewMember.save();
      }
    } else {
      // Update avatar if changed
      if (!crewMember.avatar && userInfo.picture) {
        crewMember.avatar = userInfo.picture || '';
        await crewMember.save();
      }
    }

    // Set authentication cookie
    const baseUrl = process.env.NEXTAUTH_URL;
    
    // Use state parameter for return URL, or fallback to default
    let redirectUrl = state || (isWorkspace ? '/workspace' : '/admin');
    
    // Ensure redirect URL is relative
    if (redirectUrl.startsWith('http')) {
      redirectUrl = new URL(redirectUrl).pathname + new URL(redirectUrl).search;
    }
    
    const response = NextResponse.redirect(`${baseUrl}${redirectUrl}`);
    
    response.cookies.set('isAuthenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    // Store user info in cookie for easy access
    response.cookies.set('user', JSON.stringify({
      id: crewMember._id,
      email: crewMember.email,
      name: crewMember.name,
      role: crewMember.role,
      avatar: crewMember.avatar
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Store Google access token for calendar integration
    response.cookies.set('google_access_token', tokens.access_token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Store refresh token if available
    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/workspace/login?error=authentication_failed`
    );
  }
}
