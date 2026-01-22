'use client';

import { useEffect, useState } from 'react';

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieManager {
  preferences: CookiePreferences;
  hasConsent: boolean;
  canUseAnalytics: boolean;
  canUseMarketing: boolean;
  updatePreferences: (preferences: CookiePreferences) => void;
  resetConsent: () => void;
}

export const useCookieManager = (): CookieManager => {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false
  });
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Load saved preferences on mount
    const savedConsent = localStorage.getItem('cookie-consent');
    if (savedConsent) {
      const savedPrefs = JSON.parse(savedConsent);
      setPreferences(savedPrefs);
      setHasConsent(true);
    }
  }, []);

  const updatePreferences = (newPreferences: CookiePreferences) => {
    setPreferences(newPreferences);
    setHasConsent(true);
    localStorage.setItem('cookie-consent', JSON.stringify(newPreferences));
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('cookiePreferencesChanged', {
      detail: newPreferences
    }));
  };

  const resetConsent = () => {
    localStorage.removeItem('cookie-consent');
    setPreferences({
      essential: true,
      analytics: false,
      marketing: false
    });
    setHasConsent(false);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('cookiePreferencesChanged', {
      detail: { essential: true, analytics: false, marketing: false }
    }));
  };

  return {
    preferences,
    hasConsent,
    canUseAnalytics: hasConsent && preferences.analytics,
    canUseMarketing: hasConsent && preferences.marketing,
    updatePreferences,
    resetConsent
  };
};

// Cookie utility functions
export const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

export const setCookie = (
  name: string, 
  value: string, 
  days: number = 365,
  secure: boolean = true,
  sameSite: 'strict' | 'lax' | 'none' = 'lax'
): void => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  let cookieString = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
  
  if (secure) {
    cookieString += '; secure';
  }
  
  if (sameSite) {
    cookieString += `; samesite=${sameSite}`;
  }
  
  document.cookie = cookieString;
};

export const deleteCookie = (name: string): void => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Hook for conditional analytics loading
export const useAnalytics = () => {
  const { canUseAnalytics } = useCookieManager();
  
  useEffect(() => {
    // This can be used to conditionally load analytics scripts
    if (canUseAnalytics) {
      // Enable analytics tracking
      console.log('Analytics enabled');
    } else {
      // Disable analytics tracking
      console.log('Analytics disabled');
    }
  }, [canUseAnalytics]);
  
  return canUseAnalytics;
};
