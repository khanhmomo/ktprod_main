'use client';

import { useState } from 'react';
import { Cookie, Settings, X } from 'lucide-react';
import { useCookieManager, CookiePreferences } from '../hooks/useCookieManager';

const CookieSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { preferences, updatePreferences } = useCookieManager();

  const handleSave = () => {
    updatePreferences(preferences);
    setIsOpen(false);
  };

  const handlePreferenceChange = (type: 'analytics' | 'marketing') => {
    updatePreferences({
      ...preferences,
      [type]: !preferences[type]
    });
  };

  return (
    <>
      {/* Cookie Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-40"
        title="Cookie Settings"
      >
        <Cookie className="w-5 h-5" />
      </button>

      {/* Cookie Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-gray-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Cookie Settings</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Manage your cookie preferences. You can change these settings at any time.
              </p>

              <div className="space-y-6">
                {/* Essential Cookies */}
                <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Essential Cookies</h3>
                      <span className="text-xs bg-green-600 px-2 py-1 rounded text-white">Required</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Required for the website to function, including authentication, security, and basic functionality.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.essential}
                      disabled
                      className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded"
                    />
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Analytics Cookies</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.analytics}
                          onChange={() => handlePreferenceChange('analytics')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      Help us understand how visitors interact with our website to improve performance and user experience.
                    </p>
                    <p className="text-xs text-gray-500">
                      Used for: Vercel Analytics, Google Analytics, performance monitoring
                    </p>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start gap-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Marketing Cookies</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.marketing}
                          onChange={() => handlePreferenceChange('marketing')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      Used to personalize content and ads based on your interests and browsing behavior.
                    </p>
                    <p className="text-xs text-gray-500">
                      Used for: Social media integration, personalized content, retargeting
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Privacy Impact</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Essential cookies: No impact on privacy (required for functionality)</li>
                  <li>• Analytics cookies: Minimal impact (anonymous usage data only)</li>
                  <li>• Marketing cookies: Higher impact (personalized tracking)</li>
                </ul>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    updatePreferences({ essential: true, analytics: true, marketing: true });
                    setIsOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Accept All
                </button>
                <button
                  onClick={() => {
                    updatePreferences({ essential: true, analytics: false, marketing: false });
                    setIsOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Accept Essential Only
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieSettings;
