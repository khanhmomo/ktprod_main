'use client';

import { useEffect, useState } from 'react';
import { useCookieManager } from '../hooks/useCookieManager';

interface ConditionalAnalyticsProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ConditionalAnalytics: React.FC<ConditionalAnalyticsProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { canUseAnalytics, hasConsent } = useCookieManager();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything during SSR
  if (!isClient) {
    return null;
  }

  // If user hasn't given consent yet, don't load analytics
  if (!hasConsent) {
    return <>{fallback}</>;
  }

  // If user has consent but declined analytics, don't load analytics
  if (!canUseAnalytics) {
    return <>{fallback}</>;
  }

  // User has consented to analytics, load analytics components
  return <>{children}</>;
};

export default ConditionalAnalytics;
