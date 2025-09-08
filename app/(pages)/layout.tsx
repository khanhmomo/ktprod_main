import { ReactNode } from 'react';

export default function PagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-24">
        {children}
      </main>
    </div>
  );
}
