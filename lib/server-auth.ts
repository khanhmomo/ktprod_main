'use server';

import { cookies } from 'next/headers';

type AuthResponse = {
  success: boolean;
  error?: string;
  headers?: Headers;
};

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Log all cookies for debugging
    console.log('All cookies:', JSON.stringify(allCookies, null, 2));
    
    const authCookie = cookieStore.get('isAuthenticated');
    
    // For debugging - log the cookie we found
    console.log('Auth cookie:', authCookie);
    
    // Check if the cookie exists and has the correct value
    const isAuth = authCookie?.value === 'true';
    
    // Log the authentication status for debugging
    console.log('Authentication status:', isAuth ? 'Authenticated' : 'Not authenticated');
    
    return isAuth;
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
      const cookieStore = await cookies();
      const isProduction = process.env.NODE_ENV === 'production';
      
      cookieStore.set({
        name: 'isAuthenticated',
        value: 'true',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      
      return {
        success: true
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
    const cookieStore = await cookies();
    cookieStore.delete('isAuthenticated');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Logout error:', error);
    return { 
      success: false, 
      error: 'An error occurred during logout' 
    };
  }
}
