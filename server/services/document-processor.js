/**
 * Document Processor Service
 * Routes file processing to appropriate handler based on file type
 */

import { extractTextFromPDF } from './ocr.js';
import { getFileCategory } from './file-safety.js';
import { readFileSync } from 'fs';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import Tesseract from 'tesseract.js';

/**
 * Process document with appropriate handler based on file type
 * @param {string} filePath - Path to uploaded file
 * @param {Object} options - Processing options
 * @param {string} options.language - OCR language (default: 'eng')
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Array>} Array of page results with text and metadata
 */
export async function processDocument(filePath, options = {}) {
  const category = getFileCategory(filePath);

  console.log(`[Document Processor] Processing ${category}: ${filePath}`);

  switch (category) {
    case 'pdf':
      return await extractTextFromPDF(filePath, options);

    case 'image':
      return await processImageFile(filePath, options);

    case 'word':
      return await processWordDocument(filePath, options);

    case 'excel':
      return await processExcelDocument(filePath, options);

    case 'text':
      return await processTextFile(filePath, options);

    default:
      throw new Error(`Unsupported file type: ${category}`);
  }
}

/**
 * Process image file with Tesseract OCR
 * @param {string} imagePath - Path to image file
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} OCR results
 */
async function processImageFile(imagePath, options = {}) {
  const { language = 'eng', onProgress } = options;

  console.log('[Image Processor] Running OCR on image...');

  try {
    const worker = await Tesseract.createWorker(language, 1, {
      logger: onProgress ? (m) => {
        if (m.status === 'recognizing text') {
          onProgress({ progress: m.progress * 100 });
        }
      } : undefined
    });

    const { data } = await worker.recognize(imagePath);
    await worker.terminate();

    console.log(`[Image Processor] OCR complete. Confidence: ${data.confidence}%`);

    return [{
      pageNumber: 1,
      text: data.text,
      confidence: data.confidence / 100, // Convert to 0-1 range
      method: 'tesseract-ocr'
    }];
  } catch (error) {
    console.error('[Image Processor] OCR failed:', error);
    throw new Error(`Image OCR failed: ${error.message}`);
  }
}

/**
 * Process Word document with Mammoth
 * @param {string} docPath - Path to DOCX file
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Extracted text
 */
async function processWordDocument(docPath, options = {}) {
  console.log('[Word Processor] Extracting text from DOCX...');

  try {
    const result = await mammoth.extractRawText({ path: docPath });
    const text = result.value;

    if (result.messages.length > 0) {
      console.log('[Word Processor] Extraction warnings:', result.messages);
    }

    console.log(`[Word Processor] Extracted ${text.length} characters`);

    return [{
      pageNumber: 1,
      text: text,
      confidence: 0.99,
      method: 'native-extraction'
    }];
  } catch (error) {
    console.error('[Word Processor] Extraction failed:', error);
    throw new Error(`Word document processing failed: ${error.message}`);
  }
}

/**
 * Process Excel document with XLSX
 * @param {string} xlsPath - Path to XLSX file
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Extracted data from all sheets
 */
async function processExcelDocument(xlsPath, options = {}) {
  console.log('[Excel Processor] Reading workbook...');

  try {
    const workbook = XLSX.readFile(xlsPath);
    const sheets = [];

    workbook.SheetNames.forEach((sheetName, idx) => {
      const worksheet = workbook.Sheets[sheetName];

      // Convert to CSV for text-based indexing
      const csvText = XLSX.utils.sheet_to_csv(worksheet);

      // Also get JSON for structured data (optional)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      sheets.push({
        pageNumber: idx + 1,
        text: csvText,
        confidence: 0.99,
        method: 'native-extraction',
        sheetName: sheetName,
        metadata: {
          rowCount: jsonData.length,
          columnCount: jsonData[0]?.length || 0
        }
      });
    });

    console.log(`[Excel Processor] Extracted ${sheets.length} sheets`);
    return sheets;
  } catch (error) {
    console.error('[Excel Processor] Reading failed:', error);
    throw new Error(`Excel document processing failed: ${error.message}`);
  }
}

/**
 * Process plain text file
 * @param {string} txtPath - Path to text file
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Text content
 */
async function processTextFile(txtPath, options = {}) {
  console.log('[Text Processor] Reading text file...');

  try {
    const text = readFileSync(txtPath, 'utf-8');

    console.log(`[Text Processor] Read ${text.length} characters`);

    return [{
      pageNumber: 1,
      text: text,
      confidence: 1.0,
      method: 'native-extraction'
    }];
  } catch (error) {
    console.error('[Text Processor] Reading failed:', error);
    throw new Error(`Text file processing failed: ${error.message}`);
  }
}

export default {
  processDocument
};
