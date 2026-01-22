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
    if (content) {
      const sectionData = content[section as keyof HomepageContent];
      // Deep copy to ensure arrays are properly copied
      const editDataCopy = JSON.parse(JSON.stringify(sectionData));
      setEditData(editDataCopy);
    } else {
      setEditData(null);
    }
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
    
    console.log('updateEditData called with path:', path, 'value:', value);
    
    const keys = path.split('.');
    const newData = { ...editData };
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      // Handle array indices
      if (!isNaN(Number(key))) {
        if (!Array.isArray(current)) {
          console.error('Expected array at path:', path.substring(0, path.indexOf(key)));
          return;
        }
        current = current[Number(key)];
      } else {
        // Handle object properties
        if (key === 'stats') {
          // Ensure stats is always an array
          if (!Array.isArray(current[key])) {
            current[key] = [];
          }
          current[key] = [...current[key]]; // Create new array reference
        } else {
          current[key] = { ...current[key] };
        }
        current = current[key];
      }
    }
    
    const finalKey = keys[keys.length - 1];
    if (!isNaN(Number(finalKey))) {
      // Setting array index
      if (Array.isArray(current)) {
        current[Number(finalKey)] = value;
      }
    } else {
      // Setting object property
      current[finalKey] = value;
    }
    
    console.log('Updated editData:', newData);
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
        {renderSectionEditor(activeSection, editingSection === activeSection, editingSection === activeSection ? editData : content?.[activeSection as keyof HomepageContent], updateEditData)}
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
  const [showcaseItems, setShowcaseItems] = useState<any[]>([]);
  const [showcaseLoading, setShowcaseLoading] = useState(true);

  useEffect(() => {
    fetchShowcaseItems();
  }, []);

  const fetchShowcaseItems = async () => {
    try {
      const response = await fetch('/api/showcase');
      if (response.ok) {
        const items = await response.json();
        setShowcaseItems(items.sort((a: any, b: any) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error fetching showcase items:', error);
    } finally {
      setShowcaseLoading(false);
    }
  };

  const addShowcaseItem = async () => {
    const imageUrl = prompt('Enter Google Drive image URL:');
    if (!imageUrl) return;

    try {
      // Validate it's a Google Drive URL
      if (!imageUrl.includes('drive.google.com') && !imageUrl.includes('googleusercontent.com')) {
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
        const match = imageUrl.match(pattern);
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

      const response = await fetch('/api/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: proxyUrl,
          order: showcaseItems.length
        }),
      });

      if (response.ok) {
        await fetchShowcaseItems();
      } else {
        alert('Failed to add showcase item');
      }
    } catch (error) {
      console.error('Error adding showcase item:', error);
      alert('Failed to add showcase item');
    }
  };

  const deleteShowcaseItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this showcase item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/showcase/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchShowcaseItems();
      } else {
        alert('Failed to delete showcase item');
      }
    } catch (error) {
      console.error('Error deleting showcase item:', error);
      alert('Failed to delete showcase item');
    }
  };

  const moveShowcaseItem = async (item: any, direction: 'up' | 'down') => {
    const currentIndex = showcaseItems.findIndex((i: any) => i._id === item._id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= showcaseItems.length) {
      return;
    }

    const otherItem = showcaseItems[newIndex];

    try {
      await Promise.all([
        fetch(`/api/showcase/${item._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...item, order: newIndex }),
        }),
        fetch(`/api/showcase/${otherItem._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...otherItem, order: currentIndex }),
        }),
      ]);

      await fetchShowcaseItems();
    } catch (error) {
      console.error('Error reordering items:', error);
      alert('Failed to reorder items');
    }
  };

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Showcase Images</label>
          <div className="space-y-2">
            {showcaseLoading ? (
              <p className="text-gray-500">Loading showcase items...</p>
            ) : showcaseItems.length > 0 ? (
              showcaseItems.map((item: any, index: number) => (
                <div key={item._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    <img src={item.imageUrl} alt={`Showcase ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm text-gray-700">Image #{index + 1}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No showcase images added</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slideshow Interval</label>
          <p className="text-gray-900">{(data?.slideshowInterval || 2000) / 1000} seconds</p>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Slideshow Interval (seconds)</label>
          <select
            value={(data.slideshowInterval || 2000) / 1000}
            onChange={(e) => updateEditData('slideshowInterval', parseInt(e.target.value) * 1000)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1">1 second</option>
            <option value="2">2 seconds</option>
            <option value="3">3 seconds</option>
            <option value="4">4 seconds</option>
            <option value="5">5 seconds</option>
            <option value="6">6 seconds</option>
            <option value="8">8 seconds</option>
            <option value="10">10 seconds</option>
            <option value="15">15 seconds</option>
            <option value="20">20 seconds</option>
            <option value="30">30 seconds</option>
          </select>
        </div>
      </div>
      
      {/* Showcase Images Management */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">Showcase Images</label>
          <button
            onClick={addShowcaseItem}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Add Image
          </button>
        </div>
        
        {showcaseLoading ? (
          <p className="text-gray-500">Loading showcase items...</p>
        ) : showcaseItems.length > 0 ? (
          <div className="space-y-2">
            {showcaseItems.map((item: any, index: number) => (
              <div key={item._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-20 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  <img src={item.imageUrl} alt={`Showcase ${index + 1}`} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Image #{index + 1}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveShowcaseItem(item, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveShowcaseItem(item, 'down')}
                        disabled={index === showcaseItems.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => deleteShowcaseItem(item._id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-2">No showcase images added</p>
            <button
              onClick={addShowcaseItem}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add First Image
            </button>
          </div>
        )}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Story Image</label>
          {data?.imageUrl ? (
            <div className="space-y-2">
              <img 
                src={data.imageUrl} 
                alt={data.imageAlt || 'Our Story'} 
                className="w-full h-48 object-cover rounded-lg"
              />
              <p className="text-sm text-gray-600">Current image: {data.imageAlt || 'Our Story'}</p>
            </div>
          ) : (
            <p className="text-gray-500">No image set</p>
          )}
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
      
      {/* Story Image Management */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Story Image</label>
        <div className="space-y-4">
          {data?.imageUrl && (
            <div className="relative">
              <img 
                src={data.imageUrl} 
                alt={data.imageAlt || 'Our Story'} 
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Google Drive Image URL</label>
            <input
              type="url"
              placeholder="https://drive.google.com/file/d/..."
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
                  updateEditData('imageUrl', proxyUrl);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Paste Google Drive file URL and click outside the field to convert
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Image Alt Text</label>
            <input
              type="text"
              value={data.imageAlt || ''}
              onChange={(e) => updateEditData('imageAlt', e.target.value)}
              placeholder="Our Story"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Stats Management */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stats</label>
        <div className="space-y-4">
          {console.log('AboutEditor data.stats:', data?.stats)}
          {Array.isArray(data?.stats) && data.stats.map((stat: any, index: number) => (
            <div key={index} className="grid grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Value</label>
                <input
                  type="text"
                  value={stat.value || ''}
                  onChange={(e) => {
                    console.log('Updating stats value:', index, e.target.value);
                    updateEditData(`stats.${index}.value`, e.target.value);
                  }}
                  placeholder="500+"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Label</label>
                <input
                  type="text"
                  value={stat.label || ''}
                  onChange={(e) => {
                    console.log('Updating stats label:', index, e.target.value);
                    updateEditData(`stats.${index}.label`, e.target.value);
                  }}
                  placeholder="Happy Clients"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )) || (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">No stats set</p>
              <button
                onClick={() => updateEditData('stats', [
                  { value: '', label: '' },
                  { value: '', label: '' },
                  { value: '', label: '' }
                ])}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Stats
              </button>
            </div>
          )}
          
          {Array.isArray(data?.stats) && data.stats.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const currentStats = Array.isArray(data.stats) ? data.stats : [];
                  updateEditData('stats', [...currentStats, { value: '', label: '' }]);
                }}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Add Stat
              </button>
              {Array.isArray(data?.stats) && data.stats.length > 1 && (
                <button
                  onClick={() => {
                    const currentStats = Array.isArray(data.stats) ? data.stats : [];
                    updateEditData('stats', currentStats.slice(0, -1));
                  }}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Remove Last
                </button>
              )}
            </div>
          )}
        </div>
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
