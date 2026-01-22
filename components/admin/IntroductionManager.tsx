'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEdit, FiSave, FiX, FiPlus, FiTrash2, FiImage } from 'react-icons/fi';

interface IntroductionContent {
  mainDescription: string;
  philosophy: {
    text: string;
    image: {
      url: string;
      alt: string;
    };
  };
  approach: {
    text: string;
    image: {
      url: string;
      alt: string;
    };
  };
  cta: {
    headline: string;
    description: string;
    buttonText: string;
    buttonLink: string;
  };
}

export default function IntroductionManager() {
  const [content, setContent] = useState<IntroductionContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('mainDescription');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/introduction');
      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error('Error fetching introduction content:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (section: string) => {
    setEditingSection(section);
    if (content) {
      const sectionData = content[section as keyof IntroductionContent];
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
      const response = await fetch('/api/introduction', {
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
      const key = keys[i];
      if (key === 'image') {
        if (!current.image) {
          current.image = { url: '', alt: '' };
        }
        current.image = { ...current.image, ...value };
        current = current.image;
      } else {
        if (!current[key]) {
          current[key] = {};
        }
        current[key] = { ...current[key] };
        current = current[key];
      }
    }
    
    const finalKey = keys[keys.length - 1];
    if (current && typeof current === 'object') {
      current[finalKey] = value;
    }
    
    setEditData(newData);
  };

  const handleGoogleDriveUrl = (url: string, callback: (url: string) => void) => {
    if (url.trim()) {
      if (!url.includes('drive.google.com') && !url.includes('googleusercontent.com')) {
        alert('Please enter a valid Google Drive URL');
        return;
      }
      
      let fileId = '';
      const patterns = [
        /\/file\/d\/([\w-]+)/,
        /[?&]id=([\w-]+)/,
        /^([\w-]{25,})$/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          fileId = match[1];
          break;
        }
      }
      
      if (!fileId) {
        alert('Could not extract file ID from URL. Please check the URL format.');
        return;
      }
      
      const proxyUrl = `/api/drive/image?id=${encodeURIComponent(fileId)}`;
      callback(proxyUrl);
    }
  };

  const sections = [
    { id: 'mainDescription', name: 'Main Description', icon: FiEdit },
    { id: 'philosophy', name: 'Philosophy', icon: FiImage },
    { id: 'approach', name: 'Approach', icon: FiImage },
    { id: 'cta', name: 'CTA Section', icon: FiEdit },
  ];

  if (!content) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load introduction content</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Introduction Page Manager</h1>
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

        {/* Section preview or editor */}
        {renderSectionEditor(
          activeSection,
          editingSection === activeSection ? editData : content?.[activeSection as keyof IntroductionContent],
          updateEditData,
          handleGoogleDriveUrl,
          editingSection === activeSection
        )}
      </motion.div>
    </div>
  );
}

function renderSectionEditor(
  section: string,
  data: any,
  updateEditData: (path: string, value: any) => void,
  handleGoogleDriveUrl: (url: string, callback: (url: string) => void) => void,
  isEditing: boolean = true
) {
  switch (section) {
    case 'mainDescription':
      return isEditing ? 
        <MainDescriptionEditor data={data} updateEditData={updateEditData} /> :
        <MainDescriptionPreview data={data} />;
    case 'philosophy':
      return isEditing ? 
        <PhilosophyEditor data={data} updateEditData={updateEditData} handleGoogleDriveUrl={handleGoogleDriveUrl} /> :
        <PhilosophyPreview data={data} />;
    case 'approach':
      return isEditing ? 
        <ApproachEditor data={data} updateEditData={updateEditData} handleGoogleDriveUrl={handleGoogleDriveUrl} /> :
        <ApproachPreview data={data} />;
    case 'cta':
      return isEditing ? 
        <CTAEditor data={data} updateEditData={updateEditData} /> :
        <CTAPreview data={data} />;
    default:
      return <div>Section not found</div>;
  }
}

function MainDescriptionEditor({ data, updateEditData }: { data: any; updateEditData: (path: string, value: any) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Main Description</label>
      <textarea
        value={data || ''}
        onChange={(e) => updateEditData('', e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Founded with a passion for storytelling through imagery..."
      />
    </div>
  );
}

function PhilosophyEditor({ 
  data, 
  updateEditData, 
  handleGoogleDriveUrl 
}: { 
  data: any; 
  updateEditData: (path: string, value: any) => void;
  handleGoogleDriveUrl: (url: string, callback: (url: string) => void) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Philosophy Text</label>
        <textarea
          value={data?.text || ''}
          onChange={(e) => updateEditData('text', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="We believe that every photograph should tell a story..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Philosophy Image</label>
        {data?.image?.url && (
          <div className="mb-4">
            <img 
              src={data.image.url} 
              alt={data.image.alt || 'Philosophy'} 
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Google Drive Image URL</label>
          <input
            type="url"
            placeholder="https://drive.google.com/file/d/..."
            onBlur={(e) => handleGoogleDriveUrl(e.target.value, (url) => updateEditData('image.url', url))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Image Alt Text</label>
          <input
            type="text"
            value={data?.image?.alt || ''}
            onChange={(e) => updateEditData('image.alt', e.target.value)}
            placeholder="Philosophy"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

function ApproachEditor({ 
  data, 
  updateEditData, 
  handleGoogleDriveUrl 
}: { 
  data: any; 
  updateEditData: (path: string, value: any) => void;
  handleGoogleDriveUrl: (url: string, callback: (url: string) => void) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Approach Text</label>
        <textarea
          value={data?.text || ''}
          onChange={(e) => updateEditData('text', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="No two weddings are ever the same..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Approach Image</label>
        {data?.image?.url && (
          <div className="mb-4">
            <img 
              src={data.image.url} 
              alt={data.image.alt || 'Our Approach'} 
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Google Drive Image URL</label>
          <input
            type="url"
            placeholder="https://drive.google.com/file/d/..."
            onBlur={(e) => handleGoogleDriveUrl(e.target.value, (url) => updateEditData('image.url', url))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Image Alt Text</label>
          <input
            type="text"
            value={data?.image?.alt || ''}
            onChange={(e) => updateEditData('image.alt', e.target.value)}
            placeholder="Our Approach"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

function CTAEditor({ data, updateEditData }: { data: any; updateEditData: (path: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CTA Headline</label>
        <input
          type="text"
          value={data?.headline || ''}
          onChange={(e) => updateEditData('headline', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ready to Create Something Amazing?"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CTA Description</label>
        <textarea
          value={data?.description || ''}
          onChange={(e) => updateEditData('description', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Let's work together to capture your special moments..."
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
          <input
            type="text"
            value={data?.buttonText || ''}
            onChange={(e) => updateEditData('buttonText', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Get in Touch"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
          <input
            type="text"
            value={data?.buttonLink || ''}
            onChange={(e) => updateEditData('buttonLink', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="/contact"
          />
        </div>
      </div>
    </div>
  );
}

// Preview components for display mode
function MainDescriptionPreview({ data }: { data: any }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Main Description</h3>
      <p className="text-gray-700">{data || 'No description set'}</p>
    </div>
  );
}

function PhilosophyPreview({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Philosophy</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{data?.text || 'No philosophy text set'}</p>
      </div>
      {data?.image?.url && (
        <div>
          <img 
            src={data.image.url} 
            alt={data.image.alt || 'Philosophy'} 
            className="w-full h-48 object-cover rounded-lg"
          />
          <p className="text-sm text-gray-600 mt-1">Alt: {data.image.alt || 'Philosophy'}</p>
        </div>
      )}
    </div>
  );
}

function ApproachPreview({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Approach</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{data?.text || 'No approach text set'}</p>
      </div>
      {data?.image?.url && (
        <div>
          <img 
            src={data.image.url} 
            alt={data.image.alt || 'Our Approach'} 
            className="w-full h-48 object-cover rounded-lg"
          />
          <p className="text-sm text-gray-600 mt-1">Alt: {data.image.alt || 'Our Approach'}</p>
        </div>
      )}
    </div>
  );
}

function CTAPreview({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">CTA Section</h3>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{data?.headline || 'No headline set'}</h2>
        <p className="text-gray-700 mb-4">{data?.description || 'No description set'}</p>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-gray-600">Button Text:</p>
            <p className="font-medium">{data?.buttonText || 'No text set'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Button Link:</p>
            <p className="font-medium">{data?.buttonLink || 'No link set'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
