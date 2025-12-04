import mongoose from 'mongoose';

// Hero Content Schema
const heroContentSchema = new mongoose.Schema({
  headline: {
    type: String,
    default: 'Let us tell your story in a different way'
  },
  primaryButton: {
    text: { type: String, default: 'Book now' },
    href: { type: String, default: '#contact' },
    style: { type: String, default: 'primary' }
  },
  secondaryButton: {
    text: { type: String, default: 'View Our Work' },
    href: { type: String, default: '/gallery' },
    style: { type: String, default: 'secondary' }
  },
  slideshowInterval: {
    type: Number,
    default: 2000 // milliseconds
  },
  showNavigation: {
    type: Boolean,
    default: true
  },
  showIndicators: {
    type: Boolean,
    default: true
  }
});

// About Content Schema
const aboutContentSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Our Story'
  },
  paragraphs: [{
    text: { type: String, required: true },
    isItalic: { type: Boolean, default: false },
    isBold: { type: Boolean, default: false }
  }],
  imageUrl: {
    type: String,
    default: 'https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/547372679_1235470425050601_4278193282923074331_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=127cfc&_nc_ohc=UV15EZcV1EcQ7kNvwFRuzhx&_nc_oc=AdnnxASGoT_ztI8U4tJTb7LsPCz7UaCmnCfjoQUJL9kjAv4Q_UQirn92UwIXSrGlGnE&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=MEbMqNNc8HfLitcYBYqhwg&oh=00_Afa2erBphQve0m4OZkPnIzYjYpguTxyY4sCBdzUnLXd11w&oe=68D11A55'
  },
  imageAlt: {
    type: String,
    default: 'Our Story'
  },
  stats: [{
    value: { type: String, required: true },
    label: { type: String, required: true }
  }],
  ctaButton: {
    text: { type: String, default: 'Learn More About Us' },
    href: { type: String, default: '/introduction' }
  }
});

// Service Item Schema
const serviceItemSchema = new mongoose.Schema({
  icon: { type: String, required: true }, // Icon name or class
  title: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, default: 0 }
});

// Services Content Schema
const servicesContentSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Our Services'
  },
  description: {
    type: String,
    default: 'We offer a wide range of professional photography services to meet all your needs. Each session is tailored to capture your unique story.'
  },
  services: [serviceItemSchema]
});

// Contact Info Schema
const contactInfoSchema = new mongoose.Schema({
  location: {
    line1: { type: String, default: '9710 South Kirkwood, Suite 500' },
    line2: { type: String, default: 'Houston, Texas 77099' }
  },
  phone: {
    type: String,
    default: '(832) 992-7879'
  },
  email: {
    type: String,
    default: 'thewildstudio.nt@gmail.com'
  },
  hours: [{
    day: { type: String, required: true },
    time: { type: String, required: true }
  }],
  socialLinks: [{
    platform: { type: String, required: true }, // facebook, instagram, etc.
    url: { type: String, required: true },
    icon: { type: String, required: true }
  }]
});

// Contact Form Schema
const contactFormSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Get In Touch'
  },
  description: {
    type: String,
    default: 'Have a project in mind? Let\'s talk about how we can help you capture your vision.'
  },
  fields: [{
    name: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'email', 'textarea'], required: true },
    required: { type: Boolean, default: false },
    placeholder: { type: String },
    order: { type: Number, default: 0 }
  }],
  submitButtonText: {
    type: String,
    default: 'Send Message'
  }
});

// Main Homepage Content Schema
const homepageContentSchema = new mongoose.Schema({
  hero: heroContentSchema,
  about: aboutContentSchema,
  services: servicesContentSchema,
  contactForm: contactFormSchema,
  contactInfo: contactInfoSchema,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: 'system'
  }
});

// Create and export the model
export default mongoose.models.HomepageContent || mongoose.model('HomepageContent', homepageContentSchema);
