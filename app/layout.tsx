import type { Metadata } from 'next'
import { Lato, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

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

export const metadata: Metadata = {
  title: 'KTProd - Professional Photography',
  description: 'Professional photography studio specializing in portraits, events, and commercial photography',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${lato.variable} ${cormorant.variable} font-sans`}>
      <body className="bg-white text-gray-800">
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow bg-white">
            <div className="pt-24">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
