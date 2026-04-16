/**
 * Universal Cloudinary Utility for Property Express
 * Centralizes all media uploads to Cloudinary to bypass Firebase Storage CORS and overhead.
 */

/**
 * Upload any File, Blob, or Base64 string to Cloudinary.
 * @param {File|Blob|String} fileOrBase64 - The content to upload.
 * @param {String} resourceType - 'image', 'video', or 'raw' (for PDFs/docs).
 * @returns {Promise<string>} - The secure URL of the uploaded resource.
 */
export const uploadToCloudinary = async (fileOrBase64, resourceType = 'image') => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dm9tmagpg';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'property_express';

  const formData = new FormData();
  formData.append('file', fileOrBase64);
  formData.append('upload_preset', uploadPreset);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    
    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error('Cloudinary error response:', data);
      throw new Error(data.error?.message || 'Cloudinary upload failed');
    }
  } catch (err) {
    console.error(`Cloudinary ${resourceType} upload failed:`, err);
    throw err;
  }
};

/**
 * Specifically upload multiple property images.
 */
export const uploadPropertyImages = async (files) => {
  const urls = [];
  for (const file of files) {
    const url = await uploadToCloudinary(file, 'image');
    urls.push(url);
  }
  return urls;
};
