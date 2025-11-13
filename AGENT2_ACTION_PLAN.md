# Agent 2 - 4-Hour Countdown Action Plan

**Mission:** Get NaviDocs demo-ready for Riviera Plaisance presentation
**Deadline:** ~4 hours from now
**Agent:** Agent 2 - Current Functionality Tester

---

## 🎯 THE GOAL
Demonstrate **working search functionality** with real document data to show sticky engagement potential.

---

## ⚡ CRITICAL BLOCKER: Meilisearch Down

**Status:** Service running on StackCP only, not localhost
**Impact:** Search feature broken (demo killer)
**Fix Time:** 5 minutes

### IMMEDIATE ACTION (START NOW)

```bash
# Option 1: Start Meilisearch locally (RECOMMENDED)
cd /tmp
meilisearch --http-addr 127.0.0.1:7700 \
  --master-key "5T66jrwQ8F8cOk4dUlFY0Vp59fMnCsIfi4O6JZl9wzU=" &

# Verify it started
sleep 2
curl http://localhost:7700/health
# Should return: {"status":"available"}
```

**Expected Output:**
```json
{"status":"available"}
```

**Time:** 5 minutes (including startup delay)

---

## 📋 TIMELINE: What to Do When

### PHASE 1: Setup (Next 10 min)
**Goal:** Get Meilisearch running + verify server connectivity

```
T+0:00  → Start Meilisearch (above command)
T+0:02  → Verify health endpoint
T+0:05  → CONFIRM: curl http://localhost:7700/health returns {"status":"available"}
T+0:10  → Meilisearch ready for indexing
```

**Checklist:**
- [ ] Meilisearch started
- [ ] Health endpoint responds
- [ ] API server still running on :8001

---

### PHASE 2: Test Data Creation (Next 20 min)
**Goal:** Create realistic test documents so demo has something to search

**Problem:** No test data exists currently
- No sample PDFs
- No sample images
- No test entities in database

**Action 1: Create Test Directory**
```bash
mkdir -p /home/setup/navidocs/test-data/documents
mkdir -p /home/setup/navidocs/test-data/receipts
```

**Action 2: Create Sample Test Files**

**Option A: Quick Workaround (5 min)**
- Use any PDF you can find locally
- Or create a simple text document and convert to PDF
- Focus on having SOME data to search

**Option B: Proper Sample Documents (15 min)**
- Download real boat manual samples from YachtWorld
- Create "Prestige 40 User Manual" (PDF)
- Create "Engine Maintenance Log" (text → PDF)
- Create 2-3 maintenance receipt images (JPG/PNG)

**Sample Files Needed for Demo:**
1. `prestige-40-owners-manual.pdf` - Main document
2. `engine-maintenance-log.pdf` - Searchable document
3. `receipt-engine-service-2025.jpg` - OCR test image

**Time:** 15-20 minutes total

---

### PHASE 3: Index Test Data (Next 15 min)
**Goal:** Populate Meilisearch index so search has real results

**Step 1: Create Test Entities in Database**
```javascript
// Add to /home/setup/navidocs/test-data/seed-entities.js

const db = require('better-sqlite3')('./server/db/navidocs.db');

const orgId = 'org-demo-001';
const boatId = 'boat-prestige-40';

// Create organization
db.prepare(`
  INSERT INTO organizations (id, name, type, created_at)
  VALUES (?, ?, ?, datetime('now'))
`).run(orgId, 'Riviera Plaisance Demo', 'boat-dealer', Date.now() / 1000);

// Create boat entity
db.prepare(`
  INSERT INTO entities (id, organization_id, name, entity_type, make, model, year)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(boatId, orgId, 'Demo Prestige 40', 'boat', 'Jeanneau', 'Prestige 40', 2023);

console.log('Test entities created');
```

**Step 2: Upload Documents**
Use the `/api/upload` endpoint:
```bash
curl -X POST http://localhost:8001/api/upload \
  -F "document=@/home/setup/navidocs/test-data/documents/prestige-40-owners-manual.pdf" \
  -F "documentType=manual" \
  -F "entityId=boat-prestige-40"
```

**Step 3: Trigger Indexing**
Documents automatically index through BullMQ queue:
- Redis triggers processing
- OCR extracts text
- Meilisearch indexes pages

**Expected Result:**
- Documents appear in search results
- Search for "engine" returns relevant pages
- OCR confidence visible in results

**Time:** 10-15 minutes

---

### PHASE 4: Verify Search Works (Next 10 min)
**Goal:** Confirm end-to-end search pipeline functional

**Test 1: Health Checks**
```bash
# API health
curl http://localhost:8001/health

# Meilisearch health
curl http://localhost:7700/health

# Check Meilisearch index
curl http://localhost:7700/indexes
```

**Test 2: Search Query**
```bash
curl "http://localhost:8001/api/search?q=engine&limit=5"
```

**Expected Response:**
```json
{
  "results": [
    {
      "id": "page_doc-001_p1",
      "title": "Engine Maintenance - Prestige 40",
      "text": "Engine model: Volvo Penta D6...",
      "pageNumber": 1,
      "ocrConfidence": 0.95
    }
  ],
  "totalResults": 3,
  "processingTime": "42ms"
}
```

**Test 3: Filter by Entity**
```bash
curl "http://localhost:8001/api/search?q=propeller&entityId=boat-prestige-40"
```

**Time:** 5-10 minutes

---

### PHASE 5: Create Demo Script (Next 15 min)
**Goal:** Have a polished demo sequence ready

**Script: demo-search-walkthrough.sh**
```bash
#!/bin/bash

echo "=== NaviDocs Search Demo ==="
echo ""
echo "1. Searching for 'engine maintenance'..."
curl -s "http://localhost:8001/api/search?q=engine+maintenance&limit=3" | jq .

echo ""
echo "2. Searching for 'propeller' in Prestige 40..."
curl -s "http://localhost:8001/api/search?q=propeller&entityId=boat-prestige-40" | jq .

echo ""
echo "3. Document statistics..."
curl -s "http://localhost:8001/api/stats" | jq .

echo ""
echo "=== Demo Complete ==="
```

**Create file:**
```bash
cat > /home/setup/navidocs/demo-search-walkthrough.sh << 'EOF'
# ... content above ...
EOF
chmod +x /home/setup/navidocs/demo-search-walkthrough.sh
```

**Time:** 10 minutes

---

## 📊 TIMELINE SUMMARY

```
T+0:00  → Start Meilisearch (5 min)
T+0:05  → Create test data (20 min)
T+0:25  → Index documents (15 min)
T+0:40  → Verify search (10 min)
T+0:50  → Create demo script (15 min)
T+1:05  → DEMO READY ✅

Remaining buffer: ~2 hours 55 minutes
```

---

## 🚨 CONTINGENCY PLAN

**If Meilisearch still fails:**
1. Show API architecture without live search
2. Demo database schema and document structure
3. Show OCR pipeline code
4. Explain search integration (diagram)
5. Promise to deploy next week

**If test data creation takes too long:**
1. Use pre-existing data from database
2. Skip OCR testing (too time-consuming)
3. Focus on search feature only

**If upload endpoint fails:**
1. Directly insert test documents into database
2. Skip upload demo, focus on search/retrieval
3. Explain the full pipeline conceptually

---

## 📝 Success Criteria for Demo

✅ **MUST HAVE:**
1. Meilisearch running and responding to health check
2. At least 3 searchable documents in index
3. Search query returns relevant results (e.g., "engine" finds engine pages)
4. OCR confidence scores visible in results

✅ **NICE TO HAVE:**
1. Document upload working end-to-end
2. Filter by entity working (entity-specific search)
3. Multiple document types (manual, receipt, spec)
4. Clean terminal output (no error logs)

❌ **CAN SKIP:**
1. Full OCR processing (takes 5+ min per document)
2. Advanced search syntax (filters, facets)
3. Multi-user authentication demo
4. StackCP remote deployment verification

---

## 🔧 Troubleshooting Quick Reference

### Problem: Meilisearch won't start
```bash
# Check if port 7700 in use
lsof -i :7700

# Kill old process
pkill meilisearch

# Start fresh
meilisearch --http-addr 127.0.0.1:7700
```

### Problem: Search returns no results
```bash
# Check if index exists
curl http://localhost:7700/indexes

# Check if documents indexed
curl http://localhost:7700/indexes/navidocs-pages/stats

# Manually reindex
node /home/setup/navidocs/server/scripts/reindex-all.js
```

### Problem: API not responding
```bash
# Restart server
pkill -f "node.*navidocs.*index.js"
cd /home/setup/navidocs/server && npm start

# Check port
lsof -i :8001
```

---

## 📞 Quick Reference Commands

**Verify Meilisearch:**
```bash
curl http://localhost:7700/health
```

**Test Search API:**
```bash
curl "http://localhost:8001/api/search?q=test"
```

**Check Database:**
```bash
sqlite3 /home/setup/navidocs/server/db/navidocs.db "SELECT COUNT(*) FROM documents;"
```

**View Recent Errors:**
```bash
tail -50 /tmp/navidocs-server.log
```

---

## ✅ Final Checklist (Before Demo)

- [ ] Meilisearch running (`curl http://localhost:7700/health`)
- [ ] API server running (`curl http://localhost:8001/health`)
- [ ] Test documents indexed (at least 3)
- [ ] Search query works (`curl "http://localhost:8001/api/search?q=engine"`)
- [ ] Demo script ready and tested
- [ ] Terminal clean (no error logs visible)
- [ ] Time check: Showtime in ~X hours

---

**Agent 2 Report Generated:** 2025-11-13
**Time Budget:** ~1 hour to prepare + ~3 hours buffer before showtime
**Next Agent:** Agent 3 (UX/Sales Pitch) - Read this report to understand what's working/not working
