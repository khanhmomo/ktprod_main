import { Metadata } from 'next';
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: 'The Wild - Grand Opening',
  description: 'You\'re invited to the grand opening of The Wild Studio',
  openGraph: {
    title: 'The Wild - Grand Opening',
    description: 'You\'re invited to the grand opening of The Wild Studio',
    images: [
      {
        url: 'https://www.thewildstudio.org/images/invitation-bg.jpg',
        width: 1200,
        height: 800,
        alt: 'The Wild Studio Grand Opening',
      },
    ],
    siteName: 'The Wild Studio',
    type: 'website',
    url: 'https://www.thewildstudio.org/invitation',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Wild - Grand Opening',
    description: 'You\'re invited to the grand opening of The Wild Studio',
    images: ['https://www.thewildstudio.org/images/invitation-bg.jpg'],
  },
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
