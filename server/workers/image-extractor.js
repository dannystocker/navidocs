/**
 * Image Extractor - Extract images from PDF pages and save them
 *
 * Features:
 * - Extract images from specific PDF pages using pdftoppm
 * - Convert images to PNG format using sharp
 * - Save images to organized directory structure
 * - Return image metadata (path, position, dimensions)
 * - Handle errors gracefully
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Extract images from a specific PDF page
 *
 * @param {string} pdfPath - Path to the PDF file
 * @param {number} pageNumber - Page number (1-based)
 * @param {string} documentId - Document ID for organizing output
 * @returns {Promise<Array<Object>>} - Array of extracted image objects
 */
export async function extractImagesFromPage(pdfPath, pageNumber, documentId) {
  try {
    console.log(`[Image Extractor] Extracting images from page ${pageNumber} of ${pdfPath}`);

    // Create output directory for images
    const uploadsDir = join(__dirname, '../../uploads');
    const documentImagesDir = join(uploadsDir, documentId, 'images');

    // Ensure directory exists
    await fs.mkdir(documentImagesDir, { recursive: true });

    // Create temporary directory for conversion
    const tempDir = join(tmpdir(), 'navidocs-image-extract');
    await fs.mkdir(tempDir, { recursive: true });

    // Use pdftoppm to convert the PDF page to an image
    const tempOutputPrefix = join(tempDir, `page-${Date.now()}-${pageNumber}`);
    const tempImagePath = `${tempOutputPrefix}.png`;

    try {
      // Convert PDF page to PNG using pdftoppm
      execSync(
        `pdftoppm -f ${pageNumber} -l ${pageNumber} -png -singlefile -r 300 "${pdfPath}" "${tempOutputPrefix}"`,
        { stdio: 'pipe' }
      );

      console.log(`[Image Extractor] Converted page ${pageNumber} to image using pdftoppm`);
    } catch (convertError) {
      console.warn(`[Image Extractor] pdftoppm failed, trying ImageMagick:`, convertError.message);

      // Fallback to ImageMagick
      try {
        execSync(
          `convert -density 300 "${pdfPath}[${pageNumber - 1}]" -quality 90 "${tempImagePath}"`,
          { stdio: 'pipe' }
        );

        console.log(`[Image Extractor] Converted page ${pageNumber} to image using ImageMagick`);
      } catch (imageMagickError) {
        console.error(`[Image Extractor] Both pdftoppm and ImageMagick failed`);
        return [];
      }
    }

    // Check if the image was created
    if (!existsSync(tempImagePath)) {
      console.log(`[Image Extractor] No image generated for page ${pageNumber}`);
      return [];
    }

    const extractedImages = [];

    try {
      // Process with sharp to get metadata and optimize
      const image = sharp(tempImagePath);
      const metadata = await image.metadata();

      // Generate unique image ID
      const imageId = `img_${documentId}_p${pageNumber}_0`;

      // Save as PNG in the document's images directory
      const imagePath = join(documentImagesDir, `page-${pageNumber}-img-0.png`);

      // Optimize and save the image
      await image
        .png({ compressionLevel: 6 })
        .toFile(imagePath);

      console.log(`[Image Extractor] Saved image: ${imagePath} (${metadata.width}x${metadata.height})`);

      // Build image object
      const imageObj = {
        id: imageId,
        path: imagePath,
        relativePath: `/uploads/${documentId}/images/page-${pageNumber}-img-0.png`,
        position: {
          x: 0,
          y: 0,
          width: metadata.width,
          height: metadata.height
        },
        width: metadata.width,
        height: metadata.height,
        format: 'png',
        pageNumber: pageNumber,
        imageIndex: 0
      };

      extractedImages.push(imageObj);

      // Clean up temporary file
      try {
        unlinkSync(tempImagePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    } catch (imgError) {
      console.error(`[Image Extractor] Error processing image on page ${pageNumber}:`, imgError.message);
    }

    console.log(`[Image Extractor] Extracted ${extractedImages.length} image(s) from page ${pageNumber}`);

    return extractedImages;
  } catch (error) {
    console.error(`[Image Extractor] Error extracting images from page ${pageNumber}:`, error);

    // Return empty array instead of throwing to allow OCR to continue
    return [];
  }
}

/**
 * Extract images from all pages of a PDF
 *
 * @param {string} pdfPath - Path to the PDF file
 * @param {string} documentId - Document ID for organizing output
 * @param {number} totalPages - Total number of pages in the PDF
 * @returns {Promise<Array<Object>>} - Array of all extracted image objects
 */
export async function extractAllImages(pdfPath, documentId, totalPages) {
  const allImages = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pageImages = await extractImagesFromPage(pdfPath, pageNum, documentId);
    allImages.push(...pageImages);
  }

  console.log(`[Image Extractor] Extracted total of ${allImages.length} images from ${totalPages} pages`);

  return allImages;
}

/**
 * Clean up extracted images for a document
 *
 * @param {string} documentId - Document ID
 * @returns {Promise<void>}
 */
export async function cleanupImages(documentId) {
  try {
    const uploadsDir = join(__dirname, '../../uploads');
    const documentImagesDir = join(uploadsDir, documentId, 'images');

    await fs.rm(documentImagesDir, { recursive: true, force: true });

    console.log(`[Image Extractor] Cleaned up images for document ${documentId}`);
  } catch (error) {
    console.error(`[Image Extractor] Error cleaning up images:`, error.message);
  }
}
