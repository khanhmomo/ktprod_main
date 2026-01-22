'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Advertisement {
  id: string;
  title: string;
  content: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function AdvertisementPopup() {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Debug function to clear dismissed ads
  const clearDismissedAds = () => {
    localStorage.removeItem('dismissedAds');
    console.log('Cleared dismissed ads - refresh page to see ads');
  };

  // Add debug button in development
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      (window as any).clearDismissedAds = clearDismissedAds;
      console.log('Type clearDismissedAds() in console to reset ad dismissals');
    }
  }, []);

  useEffect(() => {
    // Fetch active ads from API
    const fetchActiveAd = async () => {
      try {
        const response = await fetch('/api/advertisements/active');
        const data = await response.json();
        if (data && data.isActive) {
          setAd(data);
          // Check if user has dismissed this ad
          const dismissedAds = JSON.parse(localStorage.getItem('dismissedAds') || '{}');
          if (!dismissedAds[data.id]) {
            setIsVisible(true);
          } else {
            console.log('Ad was previously dismissed:', data.id);
          }
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
      }
    };

    fetchActiveAd();
  }, []);

  const handleDismiss = () => {
    if (ad) {
      // Store dismissal in localStorage
      const dismissedAds = JSON.parse(localStorage.getItem('dismissedAds') || '{}');
      dismissedAds[ad.id] = true;
      localStorage.setItem('dismissedAds', JSON.stringify(dismissedAds));
    }
    setIsVisible(false);
  };

  if (!isVisible || !ad) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative overflow-hidden">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
        
        {ad.imageUrl && (
          <div className="h-48 bg-gray-100 overflow-hidden">
            <img 
              src={ad.imageUrl} 
              alt={ad.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center mb-3 text-red-600">{ad.title}</h2>
          <div 
            className="prose prose-sm text-gray-600 mb-6 text-center"
            dangerouslySetInnerHTML={{ __html: ad.content }}
          />
          
          {ad.ctaLink && ad.ctaText && (
            <div className="mt-4 text-center">
              <a
                href={ad.ctaLink}
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
              >
                {ad.ctaText}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
