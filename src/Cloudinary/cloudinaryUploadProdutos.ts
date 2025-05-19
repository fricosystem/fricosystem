// src/lib/cloudinary.ts
export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
}

export const CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: 'diomtgcvb',
  apiKey: '857689276165648',
  apiSecret: '6K9RzRA4F29uGodb7PhspqsOZHY', 
  uploadPreset: 'UploadProdutos'
};

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
    formData.append('api_key', CLOUDINARY_CONFIG.apiKey);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Cloudinary upload error:', data);
      throw new Error(data.error?.message || 'Failed to upload image');
    }
    
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

export const getPublicIdFromUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return '';

    return parts.slice(uploadIndex + 2).join('/').split('.')[0];
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return '';
  }
};

export const getOptimizedImageUrl = (
  imageUrl: string,
  width: number = 500,
  height: number = 500,
  quality: number = 80
): string => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }
  
  try {
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length !== 2) return imageUrl;
    
    const transformations = [
      `c_fill`,
      `w_${width}`,
      `h_${height}`,
      `q_${quality}`,
      `f_auto`
    ].join(',');

    return `${urlParts[0]}/upload/${transformations}/${urlParts[1]}`;
  } catch (error) {
    console.error('Error creating optimized image URL:', error);
    return imageUrl;
  }
};