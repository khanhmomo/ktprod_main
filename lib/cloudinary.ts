import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadToCloudinary = async (file: File, folder: string): Promise<{ url: string; public_id: string }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert buffer to base64
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
        (error, result) => {
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

    return result as { url: string; public_id: string };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

export const extractPublicId = (url: string): string | null => {
  // Extract public_id from Cloudinary URL
  const matches = url.match(/upload\/.*\/([^/]+)\.[^/.]+$/);
  return matches ? matches[1] : null;
};
