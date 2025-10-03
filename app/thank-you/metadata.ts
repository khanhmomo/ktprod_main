import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thank You - The Wild Studio',
  description: "Thank you for celebrating with us at The Wild Studio's Grand Opening",
  openGraph: {
    title: 'Thank You - The Wild Studio',
    description: "Thank you for celebrating with us at The Wild Studio's Grand Opening",
    url: 'https://thewildstudio.org/thank-you',
    type: 'website',
    images: [
      {
        url: 'https://thewildstudio.org/images/thank-you-bg.jpg',
        width: 1200,
        height: 630,
        alt: 'The Wild Studio Thank You',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thank You - The Wild Studio',
    description: "Thank you for celebrating with us at The Wild Studio's Grand Opening",
    images: ['https://thewildstudio.org/images/thank-you-bg.jpg'],
  },
};
