// src/Cloudinary/cloudinaryUploadManuais.ts
export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  uploadPreset: string;
}

export const CLOUDINARY_MANUAIS_CONFIG: CloudinaryConfig = {
  cloudName: 'diomtgcvb',
  apiKey: '857689276165648',
  uploadPreset: 'UploadProdutos' // Using same preset, works for raw files too
};

export const uploadPdfToCloudinary = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_MANUAIS_CONFIG.uploadPreset);
    formData.append('cloud_name', CLOUDINARY_MANUAIS_CONFIG.cloudName);

    // Use auto/upload for better compatibility and public access
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_MANUAIS_CONFIG.cloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Cloudinary upload error:', data);
      throw new Error(data.error?.message || 'Failed to upload PDF');
    }
    
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading PDF to Cloudinary:', error);
    throw error;
  }
};
