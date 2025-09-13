import { Metadata } from 'next';
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: 'Grand Opening Invitation | The Wild Studio',
  description: 'You are cordially invited to the grand opening of The Wild Studio',
  // Prevent any layout components from being rendered
  other: {
    'disable-nav': 'true',
    'disable-footer': 'true',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout 
      title={metadata.title?.toString() || 'Grand Opening Invitation'}
      description={metadata.description || 'You are cordially invited to the grand opening of The Wild Studio'}
    >
      {children}
    </ClientLayout>
  );
}
