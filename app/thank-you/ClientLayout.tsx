'use client';

import { useEffect, useState } from 'react';
import Head from 'next/head';

// Font classes are handled by the root layout

export default function ClientLayout({
  children,
  title = 'Thank You - The Wild Studio',
  description = 'Thank you for celebrating with us at The Wild Studio\'s Grand Opening',
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
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
      document.head.removeChild(bodyStyle);
    };
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thewildstudio.org/thank-you" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="https://thewildstudio.org/images/thank-you-bg.jpg" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://thewildstudio.org/thank-you" />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content="https://thewildstudio.org/images/thank-you-bg.jpg" />
      </Head>
      {mounted && children}
    </>
  );
}
