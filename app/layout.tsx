import type { Metadata } from 'next'
import { Lato, Cormorant_Garamond, Caveat } from 'next/font/google'
import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ClientLayout from './ClientLayout'
import { JsonLd, websiteSchema } from '../components/StructuredData'
import ConditionalAnalytics from '../components/ConditionalAnalytics'
import { Analytics } from "@vercel/analytics/react"
import DynamicComponents from '../components/DynamicComponents'

// Configure Lato as the default sans font
const lato = Lato({ 
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lato'
})

// Configure Cormorant Garamond for display/headings
const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cormorant'
})

// Configure Caveat for signature
const caveat = Caveat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-caveat'
})

const siteName = 'The Wild Studio';
const siteUrl = 'https://thewildstudio.org';
const description = 'Professional photography studio in Houston specializing in portraits, events, and commercial photography. Capturing your wildest moments with creativity and passion.';
const keywords = 'photography, Houston photographer, portrait photography, event photography, commercial photography, The Wild Studio, The Wild Houston, professional photographer';

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description: description,
  keywords: keywords,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: siteName,
    description: description,
    url: siteUrl,
    siteName: siteName,
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: description,
    images: [`${siteUrl}/images/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification here
    google: 'YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE',
    // Add other verification services as needed
  },
  icons: {
    icon: '/web_logo.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

// This is a Server Component by default in Next.js 13+
// We'll use a client component to handle the routing logic
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${lato.variable} ${cormorant.variable} ${caveat.variable}`}>
      <head>
        <JsonLd data={websiteSchema} />
        <meta name="google-site-verification" content="Sf3ro2PG_KzNpl7DsGzzobYwQGSeZk5tEMYbBn8W804" />
      </head>
      <body className="font-sans bg-white text-gray-900">
        <ClientLayout>
          {children}
        </ClientLayout>
        <DynamicComponents />
        <ConditionalAnalytics>
          <Analytics />
        </ConditionalAnalytics>
      </body>
    </html>
  )
}
