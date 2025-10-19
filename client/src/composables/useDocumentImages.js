/**
 * Document Images Composable
 * Handles fetching and managing extracted images from PDF documents
 */

import { ref } from 'vue'

export function useDocumentImages() {
  const images = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * Fetch images for a specific page of a document
   * @param {string} documentId - The document UUID
   * @param {number} pageNumber - The page number (1-indexed)
   * @returns {Promise<Array>} Array of image objects
   */
  async function fetchPageImages(documentId, pageNumber) {
    if (!documentId || !pageNumber) {
      console.warn('Missing documentId or pageNumber')
      images.value = []
      return []
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/documents/${documentId}/pages/${pageNumber}/images`)

      if (!response.ok) {
        if (response.status === 404) {
          // No images found for this page - not an error
          images.value = []
          return []
        }
        throw new Error(`Failed to fetch images: ${response.statusText}`)
      }

      const data = await response.json()
      images.value = data.images || []

      return images.value
    } catch (err) {
      console.error('Error fetching page images:', err)
      error.value = err.message
      images.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get the full image URL for a specific image
   * @param {string} documentId - The document UUID
   * @param {string} imageId - The image ID
   * @returns {string} Full URL to the image
   */
  function getImageUrl(documentId, imageId) {
    return `/api/documents/${documentId}/images/${imageId}`
  }

  /**
   * Clear current images
   */
  function clearImages() {
    images.value = []
    error.value = null
  }

  return {
    images,
    loading,
    error,
    fetchPageImages,
    getImageUrl,
    clearImages
  }
}
