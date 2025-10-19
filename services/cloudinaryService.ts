// Cloudinary client-side upload service
// Uses unsigned upload preset for direct browser uploads

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  created_at: string;
}

interface UploadOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  tags?: string[];
  transformation?: any;
}

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private uploadUrl: string;

  constructor() {
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
    this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`;
  }

  // Check if Cloudinary is configured
  isConfigured(): boolean {
    return Boolean(this.cloudName && this.uploadPreset);
  }

  // Upload file to Cloudinary
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResponse> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    if (options.folder) {
      formData.append('folder', options.folder);
    }

    if (options.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    if (options.resourceType) {
      formData.append('resource_type', options.resourceType);
    }

    try {
      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Upload failed');
      }

      const data: CloudinaryUploadResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResponse[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  // Upload with progress tracking
  async uploadWithProgress(
    file: File,
    onProgress: (progress: number) => void,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResponse> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary is not configured');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    if (options.folder) {
      formData.append('folder', options.folder);
    }

    if (options.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error?.message || 'Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', this.uploadUrl);
      xhr.send(formData);
    });
  }

  // Get optimized image URL with transformations
  getOptimizedImageUrl(
    publicId: string,
    transformations: {
      width?: number;
      height?: number;
      crop?: 'fill' | 'fit' | 'scale' | 'crop';
      quality?: number | 'auto';
      format?: 'jpg' | 'png' | 'webp' | 'auto';
      gravity?: 'face' | 'center' | 'auto';
    } = {}
  ): string {
    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto',
      gravity = 'auto'
    } = transformations;

    let transformation = '';
    
    if (width) transformation += `w_${width},`;
    if (height) transformation += `h_${height},`;
    transformation += `c_${crop},`;
    transformation += `q_${quality},`;
    transformation += `f_${format},`;
    transformation += `g_${gravity}`;

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformation}/${publicId}`;
  }

  // Get video thumbnail
  getVideoThumbnail(publicId: string, options: { width?: number; height?: number } = {}): string {
    const { width = 300, height = 200 } = options;
    return `https://res.cloudinary.com/${this.cloudName}/video/upload/w_${width},h_${height},c_fill/${publicId}.jpg`;
  }

  // Delete file (requires backend endpoint as this needs authentication)
  async deleteFile(publicId: string): Promise<void> {
    // This should be called through your backend API
    // Frontend cannot directly delete files from Cloudinary for security reasons
    console.warn('Delete operation should be handled by backend');
    throw new Error('Delete operation must be performed through backend API');
  }
}

export default new CloudinaryService();
