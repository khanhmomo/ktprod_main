'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEdit, FiSave, FiX, FiHome, FiImage, FiBriefcase, FiMail, FiSettings } from 'react-icons/fi';

interface HomepageContent {
  hero: {
    headline: string;
    primaryButton: { text: string; href: string; style: string };
    secondaryButton: { text: string; href: string; style: string };
    slideshowInterval: number;
    showNavigation: boolean;
    showIndicators: boolean;
  };
  about: {
    title: string;
    paragraphs: Array<{ text: string; isItalic: boolean; isBold: boolean }>;
    imageUrl: string;
    imageAlt: string;
    stats: Array<{ value: string; label: string }>;
    ctaButton: { text: string; href: string };
  };
  services: {
    title: string;
    description: string;
    services: Array<{ icon: string; title: string; description: string; order: number }>;
  };
  contactForm: {
    title: string;
    description: string;
    fields: Array<{ name: string; label: string; type: string; required: boolean; placeholder: string; order: number }>;
    submitButtonText: string;
  };
  contactInfo: {
    location: { line1: string; line2: string };
    phone: string;
    email: string;
    hours: Array<{ day: string; time: string }>;
    socialLinks: Array<{ platform: string; url: string; icon: string }>;
  };
}

export default function HomepageManager() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/homepage');
      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error('Error fetching homepage content:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (section: string) => {
    setEditingSection(section);
    setEditData(content ? { ...content[section as keyof HomepageContent] } : null);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditData(null);
  };

  const saveSection = async () => {
    if (!editingSection || !editData) return;

    setSaving(true);
    try {
      const response = await fetch('/api/homepage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: editingSection,
          data: editData,
          updatedBy: 'admin'
        }),
      });

      if (response.ok) {
        const updatedContent = await response.json();
        setContent(updatedContent);
        setEditingSection(null);
        setEditData(null);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateEditData = (path: string, value: any) => {
    if (!editData) return;
    
    const keys = path.split('.');
    const newData = { ...editData };
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setEditData(newData);
  };

  const sections = [
    { id: 'hero', name: 'Hero Section', icon: FiHome },
    { id: 'about', name: 'About Section', icon: FiImage },
    { id: 'services', name: 'Services Section', icon: FiBriefcase },
    { id: 'contactForm', name: 'Contact Form', icon: FiMail },
    { id: 'contactInfo', name: 'Contact Info', icon: FiSettings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load homepage content</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Homepage Content Manager</h1>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeSection === section.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {section.name}
            </button>
          );
        })}
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

        {/* Section-specific editor */}
        {renderSectionEditor(activeSection, editingSection === activeSection, editData, updateEditData)}
      </motion.div>
    </div>
  );
}

function renderSectionEditor(section: string, isEditing: boolean, editData: any, updateEditData: (path: string, value: any) => void) {
  switch (section) {
    case 'hero':
      return <HeroEditor isEditing={isEditing} data={editData} updateEditData={updateEditData} />;
    case 'about':
      return <AboutEditor isEditing={isEditing} data={editData} updateEditData={updateEditData} />;
    case 'services':
      return <ServicesEditor isEditing={isEditing} data={editData} updateEditData={updateEditData} />;
    case 'contactForm':
      return <ContactFormEditor isEditing={isEditing} data={editData} updateEditData={updateEditData} />;
    case 'contactInfo':
      return <ContactInfoEditor isEditing={isEditing} data={editData} updateEditData={updateEditData} />;
    default:
      return <div>Section not found</div>;
  }
}

function HeroEditor({ isEditing, data, updateEditData }: { isEditing: boolean; data: any; updateEditData: (path: string, value: any) => void }) {
  if (!isEditing || !data) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
          <p className="text-gray-900">{data?.headline || 'No headline set'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button</label>
            <p className="text-gray-900">{data?.primaryButton?.text || 'No text set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button</label>
            <p className="text-gray-900">{data?.secondaryButton?.text || 'No text set'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
        <input
          type="text"
          value={data.headline || ''}
          onChange={(e) => updateEditData('headline', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button Text</label>
          <input
            type="text"
            value={data.primaryButton?.text || ''}
            onChange={(e) => updateEditData('primaryButton.text', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button Text</label>
          <input
            type="text"
            value={data.secondaryButton?.text || ''}
            onChange={(e) => updateEditData('secondaryButton.text', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button Link</label>
          <input
            type="text"
            value={data.primaryButton?.href || ''}
            onChange={(e) => updateEditData('primaryButton.href', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button Link</label>
          <input
            type="text"
            value={data.secondaryButton?.href || ''}
            onChange={(e) => updateEditData('secondaryButton.href', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slideshow Interval (ms)</label>
          <input
            type="number"
            value={data.slideshowInterval || 2000}
            onChange={(e) => updateEditData('slideshowInterval', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showNavigation"
            checked={data.showNavigation || false}
            onChange={(e) => updateEditData('showNavigation', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="showNavigation" className="text-sm text-gray-700">Show Navigation</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showIndicators"
            checked={data.showIndicators || false}
            onChange={(e) => updateEditData('showIndicators', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="showIndicators" className="text-sm text-gray-700">Show Indicators</label>
        </div>
      </div>
    </div>
  );
}

function AboutEditor({ isEditing, data, updateEditData }: { isEditing: boolean; data: any; updateEditData: (path: string, value: any) => void }) {
  if (!isEditing || !data) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <p className="text-gray-900">{data?.title || 'No title set'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Paragraphs</label>
          <div className="space-y-2">
            {data?.paragraphs?.map((para: any, index: number) => (
              <p key={index} className={`text-gray-900 ${para.isItalic ? 'italic' : ''} ${para.isBold ? 'font-bold' : ''}`}>
                {para.text}
              </p>
            )) || <p className="text-gray-500">No paragraphs set</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stats</label>
          <div className="grid grid-cols-3 gap-4">
            {data?.stats?.map((stat: any, index: number) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            )) || <p className="text-gray-500">No stats set</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => updateEditData('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Paragraphs</label>
        {data.paragraphs?.map((para: any, index: number) => (
          <div key={index} className="space-y-2 mb-4">
            <textarea
              value={para.text || ''}
              onChange={(e) => updateEditData(`paragraphs.${index}.text`, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={para.isItalic || false}
                  onChange={(e) => updateEditData(`paragraphs.${index}.isItalic`, e.target.checked)}
                  className="mr-2"
                />
                Italic
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={para.isBold || false}
                  onChange={(e) => updateEditData(`paragraphs.${index}.isBold`, e.target.checked)}
                  className="mr-2"
                />
                Bold
              </label>
            </div>
          </div>
        ))}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
        <input
          type="text"
          value={data.ctaButton?.text || ''}
          onChange={(e) => updateEditData('ctaButton.text', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Link</label>
        <input
          type="text"
          value={data.ctaButton?.href || ''}
          onChange={(e) => updateEditData('ctaButton.href', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}

function ServicesEditor({ isEditing, data, updateEditData }: { isEditing: boolean; data: any; updateEditData: (path: string, value: any) => void }) {
  if (!isEditing || !data) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <p className="text-gray-900">{data?.title || 'No title set'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <p className="text-gray-900">{data?.description || 'No description set'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
          <div className="grid grid-cols-2 gap-4">
            {data?.services?.map((service: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold">{service.title}</h4>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
            )) || <p className="text-gray-500">No services set</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => updateEditData('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => updateEditData('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
        {data.services?.map((service: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={service.title || ''}
                  onChange={(e) => updateEditData(`services.${index}.title`, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input
                  type="text"
                  value={service.icon || ''}
                  onChange={(e) => updateEditData(`services.${index}.icon`, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={service.description || ''}
                onChange={(e) => updateEditData(`services.${index}.description`, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactFormEditor({ isEditing, data, updateEditData }: { isEditing: boolean; data: any; updateEditData: (path: string, value: any) => void }) {
  if (!isEditing || !data) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <p className="text-gray-900">{data?.title || 'No title set'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <p className="text-gray-900">{data?.description || 'No description set'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Submit Button Text</label>
          <p className="text-gray-900">{data?.submitButtonText || 'No text set'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => updateEditData('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => updateEditData('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Submit Button Text</label>
        <input
          type="text"
          value={data.submitButtonText || ''}
          onChange={(e) => updateEditData('submitButtonText', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}

function ContactInfoEditor({ isEditing, data, updateEditData }: { isEditing: boolean; data: any; updateEditData: (path: string, value: any) => void }) {
  if (!isEditing || !data) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <p className="text-gray-900">{data?.location?.line1}, {data?.location?.line2}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <p className="text-gray-900">{data?.phone || 'No phone set'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <p className="text-gray-900">{data?.email || 'No email set'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location Line 1</label>
        <input
          type="text"
          value={data.location?.line1 || ''}
          onChange={(e) => updateEditData('location.line1', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location Line 2</label>
        <input
          type="text"
          value={data.location?.line2 || ''}
          onChange={(e) => updateEditData('location.line2', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          type="text"
          value={data.phone || ''}
          onChange={(e) => updateEditData('phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={data.email || ''}
          onChange={(e) => updateEditData('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}
