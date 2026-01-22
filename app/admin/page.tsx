'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if user is authenticated
        const response = await fetch('/api/auth/check', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            // Get user info to check role
            const userResponse = await fetch('/api/auth/me', {
              credentials: 'include'
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              
              // Redirect based on role
              if (userData.role === 'crew') {
                router.replace('/workspace');
              } else {
                router.replace('/admin/dashboard');
              }
              return;
            }
          }
        }
        
        // User is not authenticated, redirect to login
        router.replace('/admin/login');
      } catch (error) {
        // Error checking auth, redirect to login
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return null;
}
