import { Lato, Cormorant_Garamond } from 'next/font/google';
import { JsonLd, websiteSchema } from '../../components/StructuredData';

// Configure Lato as the default sans font
const lato = Lato({ 
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lato'
});

// Configure Cormorant Garamond for display/headings
const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cormorant'
});

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${lato.variable} ${cormorant.variable} font-sans`}>
      <JsonLd data={websiteSchema} />
      {children}
    </div>
  );
}
