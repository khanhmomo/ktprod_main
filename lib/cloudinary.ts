// Client-side upload function (now using local storage)
export const uploadImage = async (file: File, folder: string): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  try {
    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Upload failed');
    }

    const data = await response.json();
    return { url: data.url };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Server-side utilities (for API routes)
let cloudinary: any;

if (typeof window === 'undefined') {
  // Only import and configure Cloudinary on the server
  const cloudinaryModule = require('cloudinary');
  cloudinary = cloudinaryModule.v2;
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const uploadToCloudinary = async (file: File, folder: string): Promise<{ url: string; public_id: string }> => {
  if (typeof window !== 'undefined') {
    throw new Error('This function can only be used on the server side');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    const result = await new Promise<{ url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Data,
        {
          folder: `photography-studio/${folder}`,
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error: any, result: any) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error(error.message || 'Upload failed'));
            return;
          }
          
          if (!result) {
            reject(new Error('No result from Cloudinary'));
            return;
          }
          
          if (!result.secure_url || !result.public_id) {
            reject(new Error('Invalid response from Cloudinary'));
            return;
          }
          
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );
    });

    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    throw new Error('This function can only be used on the server side');
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

export const extractPublicId = (url: string): string | null => {
  const matches = url.match(/upload\/(?:v\d+\/)?([^/]+)/);
  return matches ? matches[1].split('.')[0] : null;
};
