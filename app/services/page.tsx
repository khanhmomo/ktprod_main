'use client';

import { motion } from 'framer-motion';
import { FaCamera, FaVideo, FaGift, FaClipboardList } from 'react-icons/fa';
import Link from 'next/link';

const photographyPackages = [
  {
    name: 'Gold Package',
    features: [
      '1 photographer',
      'Wedding day coverage (full day)',
      'Planning with other suppliers',
      '30 sneak peek photos after 1 week',
      'All images edited (800 - 1000 files)',
      'Online download and sharing library',
      'Full quality, no logo'
    ]
  },
  {
    name: 'Diamond Package',
    features: [
      '2 photographers',
      'Wedding day coverage (full day)',
      'Planning with other suppliers',
      '50 sneak peek photos after 1 week',
      'All images edited (1200 - 1500 files)',
      'Private online gallery for view, share & download',
      'Full quality, no logo'
    ]
  },
  {
    name: 'Special Package',
    features: [
      '3 photographers',
      'Wedding day coverage (full day)',
      'Planning with other suppliers',
      '80 sneak peek photos after 1 week',
      'All images edited (1500 - 2000 files)',
      'Private online gallery for view, share & download',
      'Full quality, no logo'
    ]
  }
];

const videographyPackages = [
  {
    name: 'Gold Package',
    features: [
      '1 Videographer',
      'Wedding Day coverage',
      'Planning with other suppliers',
      'Video Highlight 4-6 mins full HD',
      'Music license, full quality, no logo',
      'Private online gallery for view, share and download'
    ]
  },
  {
    name: 'Diamond Package',
    features: [
      '2 Videographers',
      'Drone footage',
      'Wedding Day coverage',
      'Planning with other suppliers',
      'Video Highlight 4-6 mins full HD',
      'Video full document 45 - 60 mins full HD',
      'Music license, full quality, no logo',
      'Private online gallery for view, share and download'
    ]
  }
];

const addOns = [
  'Instant photos',
  '24x36 canvas',
  'Fine Art photo book 11x14 30 pages',
  'Fine Art photo book 11x14 50 pages'
];

const bookingProcess = [
  'Initial contact',
  'Consultation',
  'Electronic Contract (e-Contract)',
  'Contract Adjustments',
  'Deposit to secure your date',
  'Information Exchange',
  'Wedding/Event Day Coverage',
  'Final Payment',
  'Sneak Peek Delivery',
  'Final Product Delivery'
];

export default function Services() {
  return (
    <div className="bg-white -mt-8">
      {/* Hero Section */}
      <section className="relative pt-4 pb-16 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Our Services
          </motion.h1>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Discover our comprehensive photography and videography packages for your special day.
          </p>
          
          <motion.div 
            className="max-w-4xl mx-auto rounded-lg overflow-hidden shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <img 
              src="https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/484163072_1096662742264704_6792318387629695355_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=oUlLQh_X9TEQ7kNvwE2Q6XZ&_nc_oc=AdnM_x0nh_jSm4D5A6up0RzxJMchKQj4XJhTxoEGpU8FNj8_2tx370yfrGG7OfwvjhRz0XqpUKDPH6EMlUGza5AD&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=lrvNN3syRlk_7iPeu7oS3A&oh=00_Afbcf41OGO2ioqGjDnNK5EpMaPPtS0eUmDJ4pfGTqBKxCA&oe=68C46B2C" 
              alt="Wedding photography"
              className="w-full h-auto object-cover"
              style={{ maxHeight: '500px' }}
            />
          </motion.div>
        </div>
      </section>

      {/* Photography Packages */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <FaCamera className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Photography Packages</h2>
            <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {photographyPackages.map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200"
              >
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  <ul className="space-y-3">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Videography Packages */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FaVideo className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Videography Packages</h2>
            <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {videographyPackages.map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-2xl font-bold mb-4">{pkg.name}</h3>
                <ul className="space-y-3">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <FaGift className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Add-ons</h2>
            <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Enhance your package with these additional services
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {addOns.map((addon, index) => (
              <motion.div
                key={addon}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">{addon}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Process */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <FaClipboardList className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Our Booking Process</h2>
            <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>
              {bookingProcess.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`mb-10 flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} items-center`}
                >
                  <div className="w-1/2 px-4">
                    <div className={`p-6 bg-white rounded-lg shadow-md ${index % 2 === 0 ? 'ml-auto' : 'mr-auto'}`}>
                      <h3 className="text-xl font-semibold mb-2">{step}</h3>
                      <p className="text-gray-600">Step {index + 1}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center z-10">
                    {index + 1}
                  </div>
                  <div className="w-1/2"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "How far in advance should I book?",
                answer: "We recommend booking as soon as you have your wedding date and venue secured. Popular dates book up quickly, especially during peak wedding season (May-October)."
              },
              {
                question: "Do you travel for weddings?",
                answer: "Yes! We love traveling for weddings. Travel fees may apply for locations outside our standard service area, which we can discuss during your consultation."
              },
              {
                question: "How long until we receive our photos?",
                answer: "You'll receive a sneak peek within 1-2 weeks after your wedding. The full gallery will be delivered within 6-8 weeks, depending on the season."
              },
              {
                question: "Can we request specific shots or a shot list?",
                answer: "Absolutely! We'll work with you to create a photography plan that includes all your must-have shots while still capturing the natural flow of your day."
              },
              {
                question: "What's your cancellation policy?",
                answer: "We require a non-refundable retainer to secure your date. In case of cancellation, the retainer is non-refundable but can be applied to a future session within one year."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="border-b border-gray-200 pb-6"
              >
                <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to capture your moments?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Contact us today to book your session or ask any questions about our services.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/contact" 
              className="bg-white  text-black px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              Get in Touch
            </Link>
            <Link 
              href="/albums" 
              className="bg-transparent hover:bg-white/10 text-white border border-white px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              View Our Work
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
