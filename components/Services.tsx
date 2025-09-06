'use client';

import { motion } from 'framer-motion';
import { FaCamera, FaVideo, FaMagic, FaUsers } from 'react-icons/fa';

const services = [
  {
    icon: <FaCamera className="w-8 h-8 text-black" />,
    title: 'Portrait Photography',
    description: 'Professional portrait sessions that capture your personality and style in stunning detail.',
  },
  {
    icon: <FaUsers className="w-8 h-8 text-black" />,
    title: 'Event Coverage',
    description: 'Comprehensive photography services for weddings, parties, and corporate events.',
  },
  {
    icon: <FaVideo className="w-8 h-8 text-black" />,
    title: 'Videography',
    description: 'Cinematic video production to bring your special moments to life.',
  },
  {
    icon: <FaMagic className="w-8 h-8 text-black" />,
    title: 'Photo Editing',
    description: 'Professional retouching and editing services to make your photos look their absolute best.',
  },
];

export default function Services() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We offer a wide range of professional photography services to meet all your needs. 
            Each session is tailored to capture your unique story.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">{service.title}</h3>
              <p className="text-gray-600 text-center">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
