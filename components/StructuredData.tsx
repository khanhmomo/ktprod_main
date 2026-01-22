import { type Metadata } from 'next';

interface StructuredDataProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'The Wild Studio',
  image: 'https://thewildstudio.org/images/og-image.jpg',
  '@id': 'https://thewildstudio.org',
  url: 'https://thewildstudio.org',
  telephone: '+1-832-XXX-XXXX', // Update with your actual phone number
  priceRange: '$$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Main St', // Update with your actual address
    addressLocality: 'Houston',
    addressRegion: 'TX',
    postalCode: '77000',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 29.7604, // Update with your actual coordinates
    longitude: -95.3698,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ],
    opens: '09:00',
    closes: '18:00',
  },
  sameAs: [
    'https://www.instagram.com/thewildstudio',
    'https://www.facebook.com/thewildstudio',
    // Add other social media profiles
  ],
  description: 'Professional photography studio in Houston specializing in portraits, events, and commercial photography.',
};

export const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://thewildstudio.org',
    },
    // Add more breadcrumb items as needed
  ],
};

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL('https://thewildstudio.org'),
    alternates: {
      canonical: '/',
    },
  };
}
