'use client';

import { useState, useEffect } from 'react';

export default function MigrateGlobalFavorites() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/admin/migrate-global-favorites');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking status:', error);
      setStatus({ error: 'Failed to check status' });
    }
  };

  const runMigration = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/migrate-global-favorites', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
      
      // Refresh status after migration
      setTimeout(checkStatus, 1000);
    } catch (error) {
      console.error('Error running migration:', error);
      setResult({ error: 'Migration failed' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Migrate to Global Favorites</h1>
        
        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Migration Status</h2>
          {status ? (
            <div className="space-y-2">
              <p><strong>Total Galleries:</strong> {status.totalGalleries}</p>
              <p><strong>Migrated:</strong> {status.migratedGalleries}</p>
              <p><strong>Pending:</strong> {status.pendingGalleries}</p>
              <p><strong>Complete:</strong> {status.migrationComplete ? '✅ Yes' : '❌ No'}</p>
            </div>
          ) : (
            <p>Loading status...</p>
          )}
        </div>

        {/* Migration Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Run Migration</h2>
          <p className="text-gray-600 mb-4">
            This will migrate existing IP-based favorites to the new global favorites system.
            All existing favorites will be combined into a shared pool for each gallery.
          </p>
          
          <button
            onClick={runMigration}
            disabled={loading || status?.migrationComplete}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loading || status?.migrationComplete
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loading ? 'Running Migration...' : status?.migrationComplete ? 'Migration Complete' : 'Run Migration'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className={`bg-white rounded-lg shadow p-6 mb-6 ${
            result.success ? 'border-green-200' : 'border-red-200'
          }`}>
            <h2 className="text-xl font-semibold mb-4">Migration Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">What This Migration Does:</h2>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>Finds all existing galleries without globalFavorites field</li>
            <li>Collects all IP-based favorites from CustomerFavorite collection</li>
            <li>Combines all users' favorites into a single shared pool per gallery</li>
            <li>Removes duplicates and sorts the favorites</li>
            <li>Updates each gallery with the new globalFavorites array</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-4 mb-2 text-blue-800">After Migration:</h3>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>All existing favorites will be visible to all users</li>
            <li>New favorites will be shared across all users</li>
            <li>No more IP-based favorites (fixes disappearing favorites issue)</li>
            <li>Old CustomerFavorite collection can be safely deleted</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
