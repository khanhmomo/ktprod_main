'use server';

import { cookies } from 'next/headers';

type AuthResponse = {
  success: boolean;
  error?: string;
  headers?: Headers;
};

// In Next.js 13+, we need to handle cookies through the headers in the response
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  // Use type assertion to access the cookies
  const authCookie = (cookieStore as any).get('isAuthenticated');
  return authCookie?.value === 'true';
}

export async function authenticate(username: string, password: string): Promise<AuthResponse> {
  try {
    // In a real app, verify credentials against your database
    const isValid = username === 'admin' && password === 'password123';
    
    if (isValid) {
      const headers = new Headers();
      headers.append('Set-Cookie', 
        `isAuthenticated=true; Path=/; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Strict`
      );
      
      return { 
        success: true,
        headers
      };
    }
    
    return { 
      success: false, 
      error: 'Invalid username or password' 
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { 
      success: false, 
      error: 'An error occurred during authentication' 
    };
  }
}

export async function logout(): Promise<AuthResponse> {
  try {
    const headers = new Headers();
    headers.append('Set-Cookie', 
      'isAuthenticated=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict'
    );
    
    return { 
      success: true,
      headers
    };
  } catch (error) {
    console.error('Logout failed:', error);
    return { 
      success: false, 
      error: 'Logout failed' 
    };
  }
}
