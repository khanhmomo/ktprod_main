'use client';

import { motion } from 'framer-motion';
import { FaCamera, FaVideo, FaMagic, FaUsers } from 'react-icons/fa';
import { useEffect, useState } from 'react';

interface ServiceItem {
  icon: string;
  title: string;
  description: string;
  order: number;
}

interface ServicesContent {
  title: string;
  description: string;
  services: ServiceItem[];
}

const iconMap: { [key: string]: React.ComponentType<any> } = {
  FaCamera,
  FaUsers,
  FaVideo,
  FaMagic,
};

export default function Services() {
  const [servicesContent, setServicesContent] = useState<ServicesContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/homepage');
        if (response.ok) {
          const data = await response.json();
          setServicesContent(data.services);
        }
      } catch (error) {
        console.error('Error fetching services content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (isLoading) {
    return (
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4 mx-auto max-w-md"></div>
            <div className="h-4 bg-gray-300 rounded mb-8 mx-auto max-w-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-48 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const title = servicesContent?.title || 'Our Services';
  const description = servicesContent?.description || 'We offer a wide range of professional photography services to meet all your needs. Each session is tailored to capture your unique story.';
  const services = servicesContent?.services || [];

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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services
            .sort((a, b) => a.order - b.order)
            .map((service, index) => {
              const IconComponent = iconMap[service.icon] || FaCamera;
              return (
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
                    <IconComponent className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-center">{service.title}</h3>
                  <p className="text-gray-600 text-center">{service.description}</p>
                </motion.div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
