import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type AuthResponse = {
  success: boolean;
  error?: string;
};

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('isAuthenticated');
  return authCookie?.value === 'true';
}

export async function authenticate(username: string, password: string): Promise<AuthResponse> {
  // In a real app, verify credentials against your database
  const isValid = username === 'admin' && password === 'password123';
  
  if (isValid) {
    const response = NextResponse.json({ success: true });
    
    // Set the cookie in the response
    response.cookies.set({
      name: 'isAuthenticated',
      value: 'true',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    
    return { success: true };
  }
  
  return { 
    success: false, 
    error: 'Invalid username or password' 
  };
}

export async function logout(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  
  // Delete the cookie in the response
  response.cookies.set({
    name: 'isAuthenticated',
    value: '',
    expires: new Date(0),
    path: '/',
  });
  
  return response;
}
