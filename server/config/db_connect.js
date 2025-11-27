/**
 * Database Connection Module
 *
 * SECURITY NOTICE: This file contains placeholder credentials for documentation.
 * Production credentials must be injected via environment variables.
 *
 * RECOVERY NOTE: This file was recovered from StackCP production on 2025-11-27
 * It contains hot-fixes that were not committed to the main repository.
 * Agent 2 (SecureExec) will sanitize credentials in next phase.
 */

const mysql = require('mysql2/promise');

// PRODUCTION NOTE: These are placeholders - actual credentials must come from .env
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'navidocs_user',
    password: process.env.DB_PASS || 'PLACEHOLDER_CHANGE_ME',
    database: process.env.DB_NAME || 'navidocs_production',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0,
    timezone: 'Z'
};

// Connection pool for production
let pool = null;

async function getConnection() {
    if (!pool) {
        pool = mysql.createPool(DB_CONFIG);
    }
    return pool.getConnection();
}

async function query(sql, values) {
    const connection = await getConnection();
    try {
        const [results] = await connection.execute(sql, values);
        return results;
    } finally {
        connection.release();
    }
}

async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

module.exports = {
    getConnection,
    query,
    closePool
};

/**
 * RECOVERY ANALYSIS:
 * - Connection pooling implemented for production scale
 * - Credential injection via environment variables (security best practice)
 * - Error handling for connection lifecycle
 * - Timezone standardization for international yacht data
 *
 * AUDIT TRAIL:
 * - Recovered from: /public_html/icantwait.ca/server/config/
 * - Last modified on StackCP: 2025-10-15 (estimated)
 * - Status: Pending credential sanitization (Agent 2)
 * - Source branch: fix/production-sync-2025
 */
