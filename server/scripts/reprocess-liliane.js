/**
 * Manually queue Liliane1 document for OCR reprocessing
 */
import { addOcrJob } from '../services/queue.js';
import { v4 as uuidv4 } from 'uuid';

const documentId = 'efb25a15-7d84-4bc3-b070-6bd7dec8d59a';
const jobId = uuidv4();

console.log(`Queueing OCR job for Liliane1 Prestige Manual...`);
console.log(`Document ID: ${documentId}`);
console.log(`Job ID: ${jobId}`);

try {
  await addOcrJob(documentId, jobId, {
    filePath: `/home/setup/navidocs/uploads/${documentId}.pdf`,
    organizationId: 'test-org-123',
    userId: 'test-user-id',
    priority: 10 // High priority
  });

  console.log('✅ Job queued successfully!');
  console.log('Monitor progress with: tail -f /tmp/navidocs-ocr-worker.log');
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to queue job:', error);
  process.exit(1);
}
