import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type AuthResponse = {
  success: boolean;
  error?: string;
};

type UserResponse = {
  user?: {
    email: string;
    name: string;
    role: string;
    id: string;
  };
  success: boolean;
  error?: string;
};

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('isAuthenticated');
  return authCookie?.value === 'true';
}

export async function getCurrentUser(): Promise<UserResponse> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('isAuthenticated');
  const userCookie = cookieStore.get('user');
  
  if (!authCookie?.value || authCookie.value !== 'true') {
    return { success: false, error: 'Not authenticated' };
  }
  
  if (!userCookie?.value) {
    return { success: false, error: 'User data not found' };
  }
  
  try {
    const user = JSON.parse(userCookie.value);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Invalid user data' };
  }
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
