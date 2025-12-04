import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthURL } from '@/lib/google-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isWorkspace = searchParams.get('workspace') === 'true';
    
    // Pass the workspace parameter to the auth URL
    const authUrl = getGoogleAuthURL();
    const workspaceParam = isWorkspace ? '&workspace=true' : '';
    
    return NextResponse.redirect(`${authUrl}${workspaceParam}`);
  } catch (error) {
    console.error('Google login error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/admin/login?error=login_failed`
    );
  }
}
