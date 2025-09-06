'use server';

import { cookies } from 'next/headers';

type AuthResponse = {
  success: boolean;
  error?: string;
  headers?: Headers;
};

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const cookieHeader = cookieStore.toString();
    if (!cookieHeader) return false;
    
    const cookieMap = new Map(
      cookieHeader.split('; ').map(cookie => {
        const [name, ...rest] = cookie.split('=');
        return [name.trim(), rest.join('=')];
      })
    );
    
    return cookieMap.get('isAuthenticated') === 'true';
  } catch (error) {
    console.error('Error reading cookies:', error);
    return false;
  }
}

export async function authenticate(username: string, password: string): Promise<AuthResponse> {
  try {
    // In a real app, verify credentials against your database
    const isValid = username === 'admin' && password === 'password123';
    
    if (isValid) {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      
      // Set secure flag based on environment
      const isProduction = process.env.NODE_ENV === 'production';
      const secureFlag = isProduction ? 'Secure; ' : '';
      
      // Set the cookie with proper attributes
      const cookieValue = [
        'isAuthenticated=true',
        'Path=/',
        'HttpOnly',
        secureFlag,
        'SameSite=Lax',
        'Max-Age=604800' // 1 week
      ].filter(Boolean).join('; ');
      
      headers.append('Set-Cookie', cookieValue);
      
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
