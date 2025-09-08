import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-800`}>
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
