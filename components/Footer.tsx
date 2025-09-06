import Link from 'next/link';
import { FaFacebook, FaEnvelope } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">KTProd</h3>
            <p className="text-gray-400 mb-4">
              Capturing life&apos;s most precious moments with creativity and passion. 
              Professional photography services for all occasions.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/thewildpresents" target="_blank" rel="noopener noreferrer" 
                 className="text-gray-400 hover:text-white transition-colors">
                <FaFacebook size={24} />
              </a>
              <a href="mailto:thewildstudio.nt@gmail.com" 
                 className="text-gray-400 hover:text-white transition-colors">
                <FaEnvelope size={24} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/gallery" className="text-gray-400 hover:text-white transition-colors">Gallery</Link></li>
              <li><Link href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#services" className="text-gray-400 hover:text-white transition-colors">Services</Link></li>
              <li><Link href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <address className="not-italic text-gray-400 space-y-2">
              <p>9710 South Kirkwood, Suite 500</p>
              <p>Houston, Texas 77099</p>
              <p>Phone: (832) 992-7879</p>
              <p>Email: thewildstudio.nt@gmail.com</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p className="text-sm text-gray-400">&copy; {currentYear} KTProd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
