/**
 * Global Error Handler Utility
 * Centralized error handling for API and network errors
 */

/**
 * Handle API errors and convert them to user-friendly messages
 * @param {Error} error - The error object from axios or fetch
 * @param {string} fallbackMessage - Default message if error details unavailable
 * @returns {string} User-friendly error message
 */
export function handleAPIError(error, fallbackMessage = 'Something went wrong') {
  if (error.response) {
    // Server responded with error status (4xx, 5xx)
    const message = error.response.data?.error ||
                    error.response.data?.message ||
                    error.response.statusText;

    console.error(`API Error ${error.response.status}:`, message);

    // Add context for common HTTP errors
    if (error.response.status === 401) {
      return 'Authentication required. Please log in.';
    } else if (error.response.status === 403) {
      return 'Access denied. You don\'t have permission for this action.';
    } else if (error.response.status === 404) {
      return 'Resource not found.';
    } else if (error.response.status === 413) {
      return 'File too large. Maximum size is 50MB.';
    } else if (error.response.status === 429) {
      return 'Too many requests. Please try again later.';
    } else if (error.response.status >= 500) {
      return 'Server error. Please try again later.';
    }

    return message;
  } else if (error.request) {
    // Request made but no response received
    console.error('Network error:', error.message);
    return 'Network error - please check your connection';
  } else {
    // Something else happened
    console.error('Error:', error.message);
    return fallbackMessage;
  }
}

/**
 * Handle file upload errors with specific messages
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message for file uploads
 */
export function handleFileUploadError(error) {
  const message = handleAPIError(error, 'Failed to upload file');

  // Add file-specific context
  if (message.includes('MIME type')) {
    return 'File type not supported. Please upload PDF, Images, Word, Excel, or Text files.';
  } else if (message.includes('size')) {
    return 'File too large. Maximum size is 50MB.';
  }

  return message;
}

/**
 * Handle OCR processing errors
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message for OCR
 */
export function handleOCRError(error) {
  return handleAPIError(error, 'Failed to process document text');
}

/**
 * Log error to console with structured format
 * @param {string} context - Where the error occurred (e.g., "Upload Modal")
 * @param {Error} error - The error object
 * @param {Object} metadata - Additional context data
 */
export function logError(context, error, metadata = {}) {
  console.error(`[${context}] Error:`, {
    message: error.message,
    stack: error.stack,
    metadata
  });
}
