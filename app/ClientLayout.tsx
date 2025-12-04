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
  const isAdminPage = pathname?.startsWith('/admin');
  const isWorkspacePage = pathname?.startsWith('/workspace');
  const shouldHideNavFooter = isInvitation || isAdminPage || isWorkspacePage;

  useEffect(() => {
    // Remove any existing nav and footer for pages that should hide them
    if (shouldHideNavFooter) {
      const nav = document.querySelector('nav');
      const footer = document.querySelector('footer');
      
      if (nav) nav.style.display = 'none';
      if (footer) footer.style.display = 'none';
    }
  }, [shouldHideNavFooter]);

  return (
    <div className="min-h-screen flex flex-col">
      {!shouldHideNavFooter && <Navbar />}
      <main className={`flex-grow bg-white ${(!shouldHideNavFooter && !isAcademyPage) ? 'pt-24' : ''}`}>
        {children}
      </main>
      {!shouldHideNavFooter && <Footer />}
    </div>
  );
}
