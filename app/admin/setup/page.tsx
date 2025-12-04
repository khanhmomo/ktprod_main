'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupSuperAdmin() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSetup = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      console.log('Attempting to create super admin...');
      const response = await fetch('/api/admin/setup-superadmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setMessage(data.message);
        // Redirect to login after successful setup
        setTimeout(() => {
          router.push('/admin/login');
        }, 2000);
      } else {
        setError(data.error || 'Setup failed');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setError('Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Setup Super Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create the super admin account for admin/password123
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Account Details:</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Email:</strong> admin@company.com</p>
              <p><strong>Password:</strong> password123</p>
              <p><strong>Role:</strong> Super Admin</p>
            </div>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : null}
            Create Super Admin Account
          </button>

          <div className="text-center">
            <button
              onClick={() => router.push('/admin/login')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Skip and go to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
