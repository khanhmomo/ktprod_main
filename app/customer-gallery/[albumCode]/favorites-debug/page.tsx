'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function FavoritesDebug() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const params = useParams();

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customer-galleries/favorites-debug/${params.albumCode}`);
      const data = await response.json();
      console.log('Debug response:', data);
      
      if (response.ok) {
        setFavorites(data.favorites || []);
        setDebugInfo(data.debug);
      } else {
        setDebugInfo(data);
      }
    } catch (error) {
      console.error('Error:', error);
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const toggleFavorite = async (photoIndex: number) => {
    try {
      const response = await fetch(`/api/customer-galleries/favorites/${params.albumCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIndex }),
      });

      const result = await response.json();
      console.log('Toggle result:', result);
      
      // Reload favorites after toggle
      loadFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Favorites Debug - Album: {params.albumCode}</h1>
        
        <button
          onClick={loadFavorites}
          disabled={loading}
          className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Reload Favorites'}
        </button>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Global Favorites ({favorites.length})</h2>
          <p className="text-gray-600 mb-4">
            These favorites are shared across all users. Anyone can see and modify these favorites.
          </p>
          <div className="flex flex-wrap gap-2">
            {favorites.length === 0 ? (
              <p className="text-gray-500">No global favorites found</p>
            ) : (
              favorites.map((index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                >
                  Photo {index}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Global Favorites</h2>
          <p className="text-gray-600 mb-4">
            Click any photo to add/remove it from global favorites. All users will see these changes.
          </p>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
              <button
                key={index}
                onClick={() => toggleFavorite(index)}
                className={`p-2 rounded text-sm ${
                  favorites.includes(index)
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Photo {index}
                {favorites.includes(index) && ' ❤️'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
