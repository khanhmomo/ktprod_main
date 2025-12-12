'use client';

import { motion } from 'framer-motion';
import { FaCamera, FaVideo, FaGift, FaClipboardList } from 'react-icons/fa';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface ServiceData {
  heroTitle: string;
  heroDescription: string;
  heroImageUrl: string;
  heroImageAlt: string;
  photographyPackages: Array<{
    name: string;
    features: string[];
  }>;
  videographyPackages: Array<{
    name: string;
    features: string[];
  }>;
  addOns: string[];
  bookingProcess: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export default function Services() {
  const [data, setData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServicesData();
  }, []);

  const fetchServicesData = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const servicesData = await response.json();
        setData(servicesData);
      }
    } catch (error) {
      console.error('Error fetching services data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to load services</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

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
            {data.heroTitle}
          </motion.h1>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            {data.heroDescription}
          </p>
          
          <motion.div 
            className="max-w-4xl mx-auto rounded-lg overflow-hidden shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <img 
              src={data.heroImageUrl} 
              alt={data.heroImageAlt || 'Wedding photography'} 
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
            {data.photographyPackages.map((pkg, index) => (
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
            {data.videographyPackages.map((pkg, index) => (
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
            {data.addOns.map((addon, index) => (
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
              {data.bookingProcess.map((step, index) => (
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
            {data.faqs.map((faq, index) => (
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
              href="/gallery" 
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
