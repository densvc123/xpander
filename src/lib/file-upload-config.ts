// File upload configuration
export const FILE_UPLOAD_CONFIG = {
  // Maximum file size per file in bytes (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  // Maximum file size for display
  MAX_FILE_SIZE_MB: 10,

  // Maximum number of files per upload
  MAX_FILES: 5,

  // Maximum total size for all files (50MB)
  MAX_TOTAL_SIZE: 50 * 1024 * 1024,

  // Maximum total size for display
  MAX_TOTAL_SIZE_MB: 50,

  // Allowed file extensions
  ALLOWED_EXTENSIONS: ['txt', 'md', 'pdf', 'xlsx', 'docx'],

  // File types that need backend parsing
  PARSEABLE_EXTENSIONS: ['pdf', 'xlsx', 'docx'],

  // File types that can be read directly
  DIRECT_READ_EXTENSIONS: ['txt', 'md'],

  // Accept attribute for file input
  get ACCEPT_ATTRIBUTE() {
    return this.ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')
  },

  // Human-readable format list
  get FORMATS_LIST() {
    return this.ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(', ')
  }
} as const

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  } else {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }
}

// Helper function to validate file
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum file size is ${FILE_UPLOAD_CONFIG.MAX_FILE_SIZE_MB}MB. Your file is ${formatFileSize(file.size)}.`
    }
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file type. Please use: ${FILE_UPLOAD_CONFIG.FORMATS_LIST}`
    }
  }

  return { valid: true }
}
