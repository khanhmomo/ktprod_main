'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon, FolderOpenIcon, CheckIcon } from '@heroicons/react/24/outline';

interface DriveImage {
  id: string;
  url: string;
  name: string;
  mimeType?: string;
  originalUrl: string;
  thumbnailUrl?: string;
}

interface GoogleDriveImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (images: Array<{ url: string; originalUrl: string; name: string; thumbnailUrl?: string }>) => void;
}

export default function GoogleDriveImport({ isOpen, onClose, onImport }: GoogleDriveImportProps) {
  const [folderUrl, setFolderUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [folderInfo, setFolderInfo] = useState<{ name: string; imageCount: number } | null>(null);
  const [images, setImages] = useState<DriveImage[]>([]);

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setFolderUrl('');
      setError('');
      setFolderInfo(null);
      setImages([]);
      setSelectedImages(new Set());
    }
  }, [isOpen]);

  const extractFolderId = (url: string): string | null => {
    const patterns = [
      /[&?]id=([\w-]+)/, // ?id= or &id=
      /\/folders\/([\w-]+)/, // /folders/
      /^([\w-]{25,})$/ // Just the ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleLoadFolder = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!folderUrl.trim()) {
      setError('Please enter a Google Drive folder URL');
      return;
    }

    const folderId = extractFolderId(folderUrl);
    if (!folderId) {
      setError('Please enter a valid Google Drive folder URL or ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/drive/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderUrl, folderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load folder');
      }

      setFolderInfo({
        name: data.folder.name,
        imageCount: data.images.length,
      });

      setImages(data.images);
      setSelectedImages(new Set(data.images.map((img: any) => img.id)));
      setError('');
    } catch (err) {
      console.error('Error loading folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to load folder. Please check the URL and try again.');
      setFolderInfo(null);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    const selectedImageData = images.filter(img => selectedImages.has(img.id));
    onImport(selectedImageData);
    onClose();
  };

  const toggleImageSelection = (id: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedImages(newSelection);
  };

  const handleBack = () => {
    setFolderInfo(null);
    setImages([]);
    setSelectedImages(new Set());
    setFolderUrl('');
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const imageId = img.dataset.id;
    if (!imageId) return;

    const originalImage = images.find(i => i.id === imageId);
    if (!originalImage) return;

    if (img.src !== originalImage.url) {
      img.src = originalImage.url;
    } else if (img.src !== originalImage.originalUrl) {
      img.src = originalImage.originalUrl;
    } else {
      img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzljYTVmZiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMiAxNnYyYTIgMiAwIDAgMS0yIDJINGEyIDIgMCAwIDEtMi0ydi03Ii8+PHBhdGggZD0iTTIyIDd2M2EyIDIgMCAwIDEtMiAyaC0xNGEyIDIgMCAwIDEtMi0ydi0zYTQgNCAwIDAgMSA0LTRoMWEyIDIgMCAwIDAgMi0yaDZhMiAyIDAgMCAwIDIgMmgxYTQgNCAwIDAgMSA0IDR6Ii8+PGNpcmNsZSBjeD0ixZQiIGN5PSI5IiByPSIyIi8+PC9zdmc+';
    }
  };

  return (
    <Transition.Root show={isOpen} as="div">
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Import from Google Drive
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-4">
                  <label htmlFor="folder-url" className="block text-sm font-medium text-gray-700">
                    Google Drive Folder URL
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="relative flex-grow focus-within:z-10">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FolderOpenIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="folder-url"
                        id="folder-url"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-l-md border-gray-300 pl-10 sm:text-sm"
                        placeholder="https://drive.google.com/drive/folders/FOLDER_ID"
                        value={folderUrl}
                        onChange={(e) => setFolderUrl(e.target.value)}
                        disabled={isLoading}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadFolder(e as any)}
                      />
                    </div>
                    <button
                      type="button"
                      className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                      onClick={handleLoadFolder}
                      disabled={isLoading || !folderUrl.trim()}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </>
                      ) : 'Load Folder'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start">
                    <XMarkIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {folderInfo && (
                  <div className="mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{folderInfo.name}</h4>
                        <p className="text-sm text-gray-500">{images.length} {images.length === 1 ? 'image' : 'images'} found</p>
                      </div>
                      <div className="flex flex-shrink-0 gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={() => {
                            const allSelected = selectedImages.size === images.length;
                            setSelectedImages(allSelected ? new Set() : new Set(images.map(img => img.id)));
                          }}
                        >
                          {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={selectedImages.size === 0}
                          onClick={handleImport}
                        >
                          Import {selectedImages.size > 0 && `(${selectedImages.size})`}
                        </button>
                      </div>
                    </div>

                    {images.length > 0 ? (
                      <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {images.map((image) => (
                          <div
                            key={image.id}
                            className={`relative group rounded-lg overflow-hidden border-2 ${
                              selectedImages.has(image.id) 
                                ? 'border-indigo-500 ring-2 ring-indigo-200' 
                                : 'border-gray-200 hover:border-gray-300'
                            } bg-gray-50 aspect-square flex flex-col`}
                            onClick={() => toggleImageSelection(image.id)}
                          >
                            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                              <img
                                src={image.thumbnailUrl || image.url}
                                alt={image.name}
                                data-id={image.id}
                                className={`w-full h-full object-cover transition-opacity ${
                                  selectedImages.has(image.id) ? 'opacity-70' : 'group-hover:opacity-80'
                                }`}
                                onError={handleImageError}
                                loading="lazy"
                              />
                              {selectedImages.has(image.id) && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <div className="bg-indigo-600 rounded-full p-1.5">
                                    <CheckIcon className="h-4 w-4 text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="p-2 bg-white border-t border-gray-200">
                              <p className="text-xs text-gray-700 truncate">{image.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">
                                {image.mimeType?.replace('image/', '').toUpperCase() || 'IMAGE'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-8 text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
                        <p className="mt-1 text-sm text-gray-500">This folder doesn't contain any supported image files.</p>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={handleBack}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedImages.size === 0}
                        onClick={handleImport}
                      >
                        Import {selectedImages.size > 0 && `(${selectedImages.size})`}
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
