# NaviDocs Services Status

**Date:** $(date)

## Running Services

| Service | Status | Port | PID | Log File |
|---------|--------|------|-----|----------|
| Meilisearch | ✅ Running | 7700 | 43579 | logs/meilisearch.log |
| Redis | ✅ Running | 6379 | - | - |
| Backend API | ✅ Running | 3001 | 44010 | logs/server.log |
| OCR Worker | ✅ Running | - | 44285 | logs/worker.log |
| Frontend | ✅ Running | 5174 | 44566 | logs/client.log |

## Health Checks

{"status":"available"}
Backend API:
{"status":"ok","timestamp":1760841742430,"uptime":423.056713294}
Frontend: http://localhost:5174/
