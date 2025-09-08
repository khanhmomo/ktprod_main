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
    const authCookie = cookieStore.get('isAuthenticated');
    return authCookie?.value === 'true';
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
