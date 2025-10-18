/**
 * Queue Service for OCR Job Management
 * Uses BullMQ with Redis for background job processing
 */

import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

// Create Redis connection
const connection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null
});

// Create OCR queue
let ocrQueue = null;

/**
 * Get OCR queue instance (singleton)
 * @returns {Queue} BullMQ queue instance
 */
export function getOcrQueue() {
  if (!ocrQueue) {
    ocrQueue = new Queue('ocr-processing', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 1000
        },
        removeOnFail: {
          age: 604800 // Keep failed jobs for 7 days
        }
      }
    });

    console.log('OCR queue initialized');
  }

  return ocrQueue;
}

/**
 * Add OCR job to queue
 * @param {string} documentId - Document UUID
 * @param {string} jobId - Job UUID
 * @param {Object} data - Job data
 * @returns {Promise<Object>} Job instance
 */
export async function addOcrJob(documentId, jobId, data) {
  const queue = getOcrQueue();

  return await queue.add(
    'process-document',
    {
      documentId,
      jobId,
      ...data
    },
    {
      jobId, // Use jobId as the BullMQ job ID for tracking
      priority: data.priority || 1
    }
  );
}

/**
 * Get job status from BullMQ
 * @param {string} jobId - Job UUID
 * @returns {Promise<Object|null>} Job status or null if not found
 */
export async function getJobStatus(jobId) {
  const queue = getOcrQueue();

  try {
    const job = await queue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress || 0;

    return {
      id: job.id,
      state, // waiting, active, completed, failed, delayed
      progress,
      data: job.data,
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn
    };
  } catch (error) {
    console.error('Error getting job status:', error);
    return null;
  }
}

/**
 * Close queue connections
 */
export async function closeQueue() {
  if (ocrQueue) {
    await ocrQueue.close();
  }
  await connection.quit();
}

export default {
  getOcrQueue,
  addOcrJob,
  getJobStatus,
  closeQueue
};
