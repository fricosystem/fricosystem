// Function to upload image to Cloudinary
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  try {
    // Create a FormData to upload the image
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset); 
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
    formData.append('api_key', CLOUDINARY_CONFIG.apiKey);

    // Upload image to Cloudinary via their upload API
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Cloudinary upload error:', data);
      throw new Error(data.error?.message || 'Failed to upload image');
    }
    
    return data.secure_url; // Return the secure URL of the uploaded image
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

// Extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    // Extract the public ID from a Cloudinary URL
    // Format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/public-id.ext
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.split('.')[0]; // Remove file extension
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return '';
  }
};

// Simple function to create a Cloudinary URL with transformations
export const getOptimizedImageUrl = (imageUrl: string, width: number = 500, height: number = 500): string => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }
  
  try {
    // Format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/public-id.ext
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length !== 2) return imageUrl;
    
    // Insert transformations
    return `${urlParts[0]}/upload/c_fill,g_auto,w_${width},h_${height}/${urlParts[1]}`;
  } catch (error) {
    console.error('Error creating optimized image URL:', error);
    return imageUrl;
  }
};

// Cloudinary configuration constants
export const CLOUDINARY_CONFIG = {
  cloudName: 'diomtgcvb',
  apiKey: '857689276165648',
  apiSecret: '6K9RzRA4F29uGodb7PhspqsOZHY', 
  uploadPreset: 'UploadPerfil' // Updated to FRStockManager upload preset
};
