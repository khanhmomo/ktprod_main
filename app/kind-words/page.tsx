'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function KindWords() {
  const testimonials = [
    {
      id: 1,
      image: '/testimonials/page-20.jpg',
      alt: 'Customer testimonial 1'
    },
    {
      id: 2,
      image: '/testimonials/page-21a.jpg',
      alt: 'Customer testimonial 2'
    },
    {
      id: 3,
      image: '/testimonials/testimonial-fb.jpg',
      alt: 'Facebook customer testimonial'
    }
  ];

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
            Kind Words
          </motion.h1>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Hear what our amazing couples have to say about their experience with us.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-12">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="w-full">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.alt}
                    width={1200}
                    height={1600}
                    className="w-full h-auto object-contain"
                    priority
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to create your story?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Let's capture your special moments together. Contact us to book your session today.
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-black font-bold py-3 px-8 rounded-md hover:bg-gray-200 transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
}
