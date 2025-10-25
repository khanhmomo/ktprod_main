'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isInvitation = pathname === '/invitation';
  const isAcademyPage = pathname?.startsWith('/academy');

  useEffect(() => {
    // Remove any existing nav and footer for invitation page
    if (isInvitation) {
      const nav = document.querySelector('nav');
      const footer = document.querySelector('footer');
      
      if (nav) nav.style.display = 'none';
      if (footer) footer.style.display = 'none';
    }
  }, [isInvitation]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isInvitation && <Navbar />}
      <main className={`flex-grow bg-white ${(!isInvitation && !isAcademyPage) ? 'pt-24' : ''}`}>
        {children}
      </main>
      {!isInvitation && <Footer />}
    </div>
  );
}
