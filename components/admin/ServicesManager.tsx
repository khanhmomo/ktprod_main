'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCamera, FaVideo, FaGift, FaClipboardList } from 'react-icons/fa';
import { FiEdit, FiSave, FiX, FiPlus, FiTrash2, FiImage } from 'react-icons/fi';

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

const defaultData: ServiceData = {
  heroTitle: 'Our Services',
  heroDescription: 'Discover our comprehensive photography and videography packages for your special day.',
  heroImageUrl: 'https://scontent-hou1-1.xx.fbcdn.net/v/t39.30808-6/494737167_1135629205034724_2926229135502320159_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=127cfc&_nc_ohc=xwzJ14FSvgcQ7kNvwEVZ_5D&_nc_oc=AdlKZx7BJDGTprTKOTnzqgyPOZkstrZCntBz81a59wFqom9mU6uERFNWZPxKmpG3258&_nc_zt=23&_nc_ht=scontent-hou1-1.xx&_nc_gid=WjsNLW6uui5Bl07TLiW5pA&oh=00_Afbg4ZM_OBUpWB-F_3iRorQnXXB5hj1z3-blyIvOGgx00Q&oe=68D12EA6',
  heroImageAlt: 'Wedding photography',
  photographyPackages: [
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
  ],
  videographyPackages: [
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
  ],
  addOns: [
    'Instant photos',
    '24x36 canvas',
    'Fine Art photo book 11x14 30 pages',
    'Fine Art photo book 11x14 50 pages'
  ],
  bookingProcess: [
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
  ],
  faqs: [
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
  ]
};

const sections = [
  { id: 'hero', name: 'Hero Section', icon: <FiImage className="w-4 h-4" /> },
  { id: 'photography', name: 'Photography Packages', icon: <FaCamera className="w-4 h-4" /> },
  { id: 'videography', name: 'Videography Packages', icon: <FaVideo className="w-4 h-4" /> },
  { id: 'addons', name: 'Add-ons', icon: <FaGift className="w-4 h-4" /> },
  { id: 'booking', name: 'Booking Process', icon: <FaClipboardList className="w-4 h-4" /> },
  { id: 'faq', name: 'FAQ', icon: <FaClipboardList className="w-4 h-4" /> },
];

export default function ServicesManager() {
  const [data, setData] = useState<ServiceData>(defaultData);
  const [activeSection, setActiveSection] = useState('hero');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showcaseLoading, setShowcaseLoading] = useState(false);

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
    }
  };

  const updateEditData = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startEditing = (sectionId: string) => {
    setEditingSection(sectionId);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    fetchServicesData(); // Reset to original data
  };

  const saveSection = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setEditingSection(null);
      } else {
        console.error('Failed to save services data');
      }
    } catch (error) {
      console.error('Error saving services data:', error);
    } finally {
      setSaving(false);
    }
  };

  const addPhotographyPackage = () => {
    setData(prev => ({
      ...prev,
      photographyPackages: [...prev.photographyPackages, { name: '', features: [''] }]
    }));
  };

  const removePhotographyPackage = (index: number) => {
    setData(prev => ({
      ...prev,
      photographyPackages: prev.photographyPackages.filter((_, i) => i !== index)
    }));
  };

  const updatePhotographyPackage = (index: number, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      photographyPackages: prev.photographyPackages.map((pkg, i) => 
        i === index ? { ...pkg, [field]: value } : pkg
      )
    }));
  };

  const addVideographyPackage = () => {
    setData(prev => ({
      ...prev,
      videographyPackages: [...prev.videographyPackages, { name: '', features: [''] }]
    }));
  };

  const removeVideographyPackage = (index: number) => {
    setData(prev => ({
      ...prev,
      videographyPackages: prev.videographyPackages.filter((_, i) => i !== index)
    }));
  };

  const updateVideographyPackage = (index: number, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      videographyPackages: prev.videographyPackages.map((pkg, i) => 
        i === index ? { ...pkg, [field]: value } : pkg
      )
    }));
  };

  const addFAQ = () => {
    setData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }]
    }));
  };

  const removeFAQ = (index: number) => {
    setData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  const updateFAQ = (index: number, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => 
        i === index ? { ...faq, [field]: value } : faq
      )
    }));
  };

  if (showcaseLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Services Page</h1>
          <p className="text-gray-600 mt-2">Manage your services page content</p>
        </div>

        {/* Section Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg shadow-sm p-1 mb-8">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeSection === section.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {section.icon}
              {section.name}
            </button>
          ))}
        </div>

        {/* Content Editor */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {sections.find(s => s.id === activeSection)?.name}
            </h2>
            {editingSection === activeSection ? (
              <div className="flex gap-2">
                <button
                  onClick={saveSection}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <FiSave className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEditing(activeSection)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiEdit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {/* Hero Section */}
          {activeSection === 'hero' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                <input
                  type="text"
                  value={data.heroTitle}
                  onChange={(e) => updateEditData('heroTitle', e.target.value)}
                  disabled={editingSection !== 'hero'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Description</label>
                <textarea
                  value={data.heroDescription}
                  onChange={(e) => updateEditData('heroDescription', e.target.value)}
                  disabled={editingSection !== 'hero'}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Hero Image URL</label>
                <input
                  type="url"
                  value={data.heroImageUrl}
                  onChange={(e) => updateEditData('heroImageUrl', e.target.value)}
                  disabled={editingSection !== 'hero'}
                  onBlur={(e) => {
                    const url = e.target.value;
                    if (url.trim()) {
                      // Validate it's a Google Drive URL
                      if (!url.includes('drive.google.com') && !url.includes('googleusercontent.com')) {
                        alert('Please enter a valid Google Drive URL');
                        return;
                      }
                      
                      // Extract file ID from various Google Drive URL formats
                      let fileId = '';
                      const patterns = [
                        /\/file\/d\/([\w-]+)/, // /file/d/FILE_ID/
                        /[?&]id=([\w-]+)/, // ?id=FILE_ID or &id=FILE_ID
                        /^([\w-]{25,})$/ // Just the ID (25+ characters)
                      ];
                      
                      for (const pattern of patterns) {
                        const match = url.match(pattern);
                        if (match && match[1]) {
                          fileId = match[1];
                          break;
                        }
                      }
                      
                      if (!fileId) {
                        alert('Could not extract file ID from the URL. Please check the URL format.');
                        return;
                      }
                      
                      // Create the proxy URL
                      const proxyUrl = `/api/drive/image?id=${encodeURIComponent(fileId)}`;
                      updateEditData('heroImageUrl', proxyUrl);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Paste Google Drive file URL and click outside the field to convert
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image Alt Text</label>
                <input
                  type="text"
                  value={data.heroImageAlt}
                  onChange={(e) => updateEditData('heroImageAlt', e.target.value)}
                  disabled={editingSection !== 'hero'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
              
              {data.heroImageUrl && (
                <div className="mt-4">
                  <img 
                    src={data.heroImageUrl} 
                    alt={data.heroImageAlt || 'Hero image'} 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Photography Packages */}
          {activeSection === 'photography' && (
            <div className="space-y-6">
              {data.photographyPackages.map((pkg, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => updatePhotographyPackage(index, 'name', e.target.value)}
                      disabled={editingSection !== 'photography'}
                      placeholder="Package name"
                      className="text-lg font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                    <button
                      onClick={() => removePhotographyPackage(index)}
                      disabled={editingSection !== 'photography'}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {pkg.features.map((feature, featureIndex) => (
                      <input
                        key={featureIndex}
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...pkg.features];
                          newFeatures[featureIndex] = e.target.value;
                          updatePhotographyPackage(index, 'features', newFeatures);
                        }}
                        disabled={editingSection !== 'photography'}
                        placeholder="Feature"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    ))}
                    <button
                      onClick={() => {
                        const newFeatures = [...pkg.features, ''];
                        updatePhotographyPackage(index, 'features', newFeatures);
                      }}
                      disabled={editingSection !== 'photography'}
                      className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 disabled:opacity-50"
                    >
                      + Add Feature
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addPhotographyPackage}
                disabled={editingSection !== 'photography'}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                + Add Photography Package
              </button>
            </div>
          )}

          {/* Videography Packages */}
          {activeSection === 'videography' && (
            <div className="space-y-6">
              {data.videographyPackages.map((pkg, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => updateVideographyPackage(index, 'name', e.target.value)}
                      disabled={editingSection !== 'videography'}
                      placeholder="Package name"
                      className="text-lg font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    />
                    <button
                      onClick={() => removeVideographyPackage(index)}
                      disabled={editingSection !== 'videography'}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {pkg.features.map((feature, featureIndex) => (
                      <input
                        key={featureIndex}
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...pkg.features];
                          newFeatures[featureIndex] = e.target.value;
                          updateVideographyPackage(index, 'features', newFeatures);
                        }}
                        disabled={editingSection !== 'videography'}
                        placeholder="Feature"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    ))}
                    <button
                      onClick={() => {
                        const newFeatures = [...pkg.features, ''];
                        updateVideographyPackage(index, 'features', newFeatures);
                      }}
                      disabled={editingSection !== 'videography'}
                      className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 disabled:opacity-50"
                    >
                      + Add Feature
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addVideographyPackage}
                disabled={editingSection !== 'videography'}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                + Add Videography Package
              </button>
            </div>
          )}

          {/* Add-ons */}
          {activeSection === 'addons' && (
            <div className="space-y-4">
              {data.addOns.map((addon, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={addon}
                    onChange={(e) => {
                      const newAddOns = [...data.addOns];
                      newAddOns[index] = e.target.value;
                      updateEditData('addOns', newAddOns);
                    }}
                    disabled={editingSection !== 'addons'}
                    placeholder="Add-on service"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                  <button
                    onClick={() => {
                      const newAddOns = data.addOns.filter((_, i) => i !== index);
                      updateEditData('addOns', newAddOns);
                    }}
                    disabled={editingSection !== 'addons'}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => updateEditData('addOns', [...data.addOns, ''])}
                disabled={editingSection !== 'addons'}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                + Add Add-on
              </button>
            </div>
          )}

          {/* Booking Process */}
          {activeSection === 'booking' && (
            <div className="space-y-4">
              {data.bookingProcess.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => {
                      const newProcess = [...data.bookingProcess];
                      newProcess[index] = e.target.value;
                      updateEditData('bookingProcess', newProcess);
                    }}
                    disabled={editingSection !== 'booking'}
                    placeholder="Booking step"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                  <button
                    onClick={() => {
                      const newProcess = data.bookingProcess.filter((_, i) => i !== index);
                      updateEditData('bookingProcess', newProcess);
                    }}
                    disabled={editingSection !== 'booking'}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => updateEditData('bookingProcess', [...data.bookingProcess, ''])}
                disabled={editingSection !== 'booking'}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                + Add Step
              </button>
            </div>
          )}

          {/* FAQ */}
          {activeSection === 'faq' && (
            <div className="space-y-6">
              {data.faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">FAQ {index + 1}</span>
                    <button
                      onClick={() => removeFAQ(index)}
                      disabled={editingSection !== 'faq'}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                        disabled={editingSection !== 'faq'}
                        placeholder="Question"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                        disabled={editingSection !== 'faq'}
                        rows={3}
                        placeholder="Answer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addFAQ}
                disabled={editingSection !== 'faq'}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                + Add FAQ
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
