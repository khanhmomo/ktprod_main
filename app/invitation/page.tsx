'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Head from 'next/head';

export default function InvitationPage() {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>The Wild - Grand Opening</title>
        <meta name="description" content="You're invited to the grand opening of The Wild Studio" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thewildstudio.org/invitation" />
        <meta property="og:title" content="The Wild - Grand Opening" />
        <meta property="og:description" content="You're invited to the grand opening of The Wild Studio" />
        <meta property="og:image" content="https://thewildstudio.org/images/invitation-bg.jpg" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://thewildstudio.org/invitation" />
        <meta property="twitter:title" content="The Wild - Grand Opening" />
        <meta property="twitter:description" content="You're invited to the grand opening of The Wild Studio" />
        <meta property="twitter:image" content="https://thewildstudio.org/images/invitation-bg.jpg" />
      </Head>
      {/* Hero Section with Overlapping Nav */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0">
            <Image
              src="/images/invitation-bg.jpg"
              alt="Elegant Wedding Studio"
              fill
              className="object-cover blur-sm scale-105 transform-gpu"
              style={{
                filter: 'blur(8px)',
                transform: 'scale(1.05)',
                transformOrigin: 'center',
                willChange: 'transform',
              }}
              priority
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 bg-black/40 bg-gradient-to-b from-black/30 to-black/70"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            
            
            <div className="relative w-64 h-32 mx-auto my-6">
              <Image 
                src="/thewildlogo.png" 
                alt="The Wild Studio Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
            
            <p className="text-xl md:text-2xl tracking-widest mb-2" style={{ fontFamily: 'var(--font-lato)' }}>You&apos;re Invited To</p>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-6 leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
              The Grand Opening
            </h1>
            <div className="w-24 h-px bg-white/50 mx-auto my-8"></div>
            
            
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        
      </section>

      {/* Details Section */}
      <section className="py-20 md:py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12 text-left"
          >
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-12 text-center" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Grand Opening Invitation
            </h2>
            
            <div className="mb-8 text-gray-700 leading-relaxed space-y-6">
              <p>Dear our valuable customers/partners,</p>
              
              <p>It is with great pleasure that we extend to you our warmest invitation to attend the Grand Opening of The Wild Studio, a wedding photography studio committed to preserving life's most treasured moments with elegance and artistry.</p>
              
              <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gold-500">
                <h3 className="text-2xl font-medium mb-4" style={{ fontFamily: 'var(--font-cormorant)' }}>Event Details</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="mr-3">📍</span>
                    <span><strong>Venue:</strong> The Wild Studio - 9710 S Kirkwood Rd, Houston, TX</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3">📅</span>
                    <span><strong>Date:</strong> October 1st, 2025</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3">🕒</span>
                    <span><strong>Time:</strong> 6:00 PM</span>
                  </li>
                </ul>
              </div>
              
              <p>The grand opening will mark an important milestone for our team, and we would be honored to have your presence as we officially introduce our studio to the community. This occasion will provide an opportunity to tour our facilities, meet our creative team, and learn more about the vision and services we are proud to offer.</p>
              
              <p>A reception will follow the ribbon-cutting ceremony, with light refreshments served.</p>
              
              <p>Your attendance would be a valued gesture of support as we embark on this new chapter, and we sincerely hope you will be able to join us in celebration.</p>
              
              <p>For more infomation, please contact to 
              thewildstudio.nt@gmail.com or (832) 992-7879.</p>
              
              <p>We look forward to welcoming you.</p>
              
              <p>With appreciation,<br/>The Wild Studio Team</p>
            </div>
          </motion.div>

          <motion.div 
            className="mt-16 pt-12 border-t border-gray-100"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h3 className="text-2xl font-cormorant font-medium mb-6 text-gray-800">Location</h3>
            <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg shadow-lg mb-8">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3465.09057432746!2d-95.5905428!3d29.6728603!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8640dd6220040151%3A0x48e78577c66002f9!2s9710%20S%20Kirkwood%20Rd%2C%20Houston%2C%20TX%2077099!5e0!3m2!1sen!2sus!4v1633024000000!5m2!1sen!2sus" 
                width="100%" 
                height="450" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              ></iframe>
            </div>
            <p className="text-center text-gray-600 mb-8">
              9710 S Kirkwood Rd, Houston, TX 77099
            </p>
            
            <div className="mt-12 pt-8 border-t border-gray-100">
              <p className="text-sm text-gray-500 tracking-wider text-center">
              Your presence is our honor
              </p>
              <p className="text-xs text-gray-400 mt-4 text-center">
                This is a private invitation. Kindly keep the details confidential.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
