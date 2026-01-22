'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';

// Font classes are handled by the root layout

export default function ClientLayout({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  const [mounted, setMounted] = useState(false);

  // Combine all side effects into a single useEffect
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    setMounted(true);
    
    // Remove any existing nav and footer
    const nav = document.querySelector('nav');
    const footer = document.querySelector('footer');
    
    if (nav) nav.style.display = 'none';
    if (footer) footer.style.display = 'none';

    // Add global styles
    const bodyStyle = document.createElement('style');
    bodyStyle.textContent = `
      body {
        margin: 0;
        padding: 0;
        background-color: #ffffff;
        color: #1f2937;
        min-height: 100vh;
      }
      [class*="pt-24"] {
        padding-top: 0 !important;
      }
    `;
    
    document.head.appendChild(bodyStyle);

    return () => {
      // Cleanup
      document.head.removeChild(bodyStyle);
      if (nav) nav.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  // Don't render anything during SSR or initial render
  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>
      <div className="min-h-screen bg-white text-gray-800">
        {children}
      </div>
    </>
  );
}
