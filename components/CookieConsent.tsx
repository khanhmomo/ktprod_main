'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Cookie, Shield, BarChart3 } from 'lucide-react';

interface CookieConsentProps {
  onAccept?: (preferences: CookiePreferences) => void;
}

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Essential cookies are always required
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    } else {
      // Apply saved preferences
      const savedPrefs = JSON.parse(consent);
      setPreferences(savedPrefs);
      onAccept?.(savedPrefs);
    }
  }, []); // Remove onAccept from dependencies

  const handleAccept = useCallback((all = false) => {
    const newPreferences: CookiePreferences = {
      essential: true,
      analytics: all,
      marketing: all
    };
    
    localStorage.setItem('cookie-consent', JSON.stringify(newPreferences));
    setPreferences(newPreferences);
    setIsVisible(false);
    onAccept?.(newPreferences);
  }, [onAccept]);

  const handleSavePreferences = useCallback(() => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    setIsVisible(false);
    onAccept?.(preferences);
  }, [preferences, onAccept]);

  const handlePreferenceChange = useCallback((type: keyof Omit<CookiePreferences, 'essential'>) => {
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left side - Icon and message */}
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Cookie Consent</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                Your privacy matters to us - learn more in our{' '}
                <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                  Privacy Policy
                </a>.
              </p>
            </div>
          </div>

          {/* Right side - Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 lg:ml-4">
            {!showDetails ? (
              <>
                <button
                  onClick={() => setShowDetails(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Customize
                </button>
                <button
                  onClick={() => handleAccept(false)}
                  className="px-6 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Accept Essential
                </button>
                <button
                  onClick={() => handleAccept(true)}
                  className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  Accept All
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowDetails(false)}
                  className="lg:hidden p-2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  Save Preferences
                </button>
              </>
            )}
          </div>
        </div>

        {/* Detailed preferences */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Essential Cookies */}
              <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Essential Cookies</h4>
                    <span className="text-xs bg-green-600 px-2 py-1 rounded text-white">Required</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Required for the website to function, including authentication and security.
                  </p>
                  <div className="mt-2">
                    <input
                      type="checkbox"
                      checked={preferences.essential}
                      disabled
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-400">Always enabled</span>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Analytics Cookies</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={() => handlePreferenceChange('analytics')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Help us understand how visitors interact with our website to improve performance.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Used for: Vercel Analytics, Google Analytics
                  </p>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
                <Cookie className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Marketing Cookies</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={() => handlePreferenceChange('marketing')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Used to personalize content and ads based on your interests and browsing behavior.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Used for: Social media integration, personalized content
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="lg:hidden p-2 text-gray-400 hover:text-white mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;
