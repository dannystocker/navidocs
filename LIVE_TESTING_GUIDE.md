# NaviDocs Live Testing Guide

**Version:** 1.0
**Date:** 2025-11-13
**Platform:** StackCP Live Deployment
**Status:** Ready for Testing

---

## Overview

This guide provides step-by-step instructions for testing the NaviDocs live deployment on StackCP. It covers all three core features:
1. **Smart OCR** - Intelligent PDF text extraction with performance optimization
2. **Multi-Format Support** - Upload and process 6 file types
3. **Timeline Activity** - Track document upload/deletion history

**Expected Total Testing Time:** 45-60 minutes

---

## Table of Contents

1. [Live URLs](#live-urls)
2. [Pre-Testing Setup](#pre-testing-setup)
3. [Test 1: Smart OCR](#test-1-smart-ocr)
4. [Test 2: Multi-Format Upload](#test-2-multi-format-upload)
5. [Test 3: Timeline Activity](#test-3-timeline-activity)
6. [Test Data Suggestions](#test-data-suggestions)
7. [Expected Results](#expected-results)
8. [Reporting Bugs](#reporting-bugs)
9. [Troubleshooting](#troubleshooting)

---

## Live URLs

### Frontend
- **Main Application:** https://digital-lab.ca/navidocs/
- **Register:** https://digital-lab.ca/navidocs/#/register
- **Login:** https://digital-lab.ca/navidocs/#/login
- **Dashboard:** https://digital-lab.ca/navidocs/#/dashboard
- **Library:** https://digital-lab.ca/navidocs/#/library

### Backend API
- **Health Check:** https://api.digital-lab.ca/navidocs/health
- **API Base:** https://api.digital-lab.ca/navidocs/api/
- **Upload Endpoint:** https://api.digital-lab.ca/navidocs/api/upload (POST)
- **Search Token:** https://api.digital-lab.ca/navidocs/api/search/token (POST)
- **Documents:** https://api.digital-lab.ca/navidocs/api/documents (GET)
- **Jobs Status:** https://api.digital-lab.ca/navidocs/api/jobs/{jobId} (GET)

### Meilisearch (Internal)
- **Endpoint:** http://localhost:7700 (StackCP internal only)
- **Index Name:** navidocs-pages
- **Search Health:** http://localhost:7700/health

---

## Pre-Testing Setup

### Step 1: Verify Deployment Status

```bash
# Check API health
curl -s https://api.digital-lab.ca/navidocs/health | jq .

# Expected Response:
# {
#   "status": "ok",
#   "uptime": 1234567,
#   "timestamp": "2025-11-13T15:30:00.000Z"
# }
```

### Step 2: Create Test Account

1. Navigate to: https://digital-lab.ca/navidocs/#/register
2. Fill in registration form:
   - **Email:** test-user-[random]@example.com
   - **Password:** TestPass123!@#
   - **Confirm:** TestPass123!@#
   - **Boat Name:** Test Vessel
3. Click "Create Account"
4. Verify email confirmation (or skip if in demo mode)
5. Login with credentials

### Step 3: Verify Login & Dashboard

After login, you should see:
- [ ] Dashboard loads without errors
- [ ] User name appears in header
- [ ] "Upload Document" button visible
- [ ] "Document Library" accessible
- [ ] No console errors (F12 > Console)

---

## Test 1: Smart OCR

### Purpose
Verify that PDF uploads process quickly with intelligent OCR that:
- Extracts native text first (2-3 seconds)
- Only OCRs pages with <50 characters
- Completes 100-page PDFs in <5 seconds (was 180 seconds)

### Test 1.1: Simple PDF Upload

**Steps:**
1. Navigate to dashboard
2. Click "Upload Document" button
3. Select a **PDF file (2-10 pages, native text)**
4. Fill in metadata:
   - Title: "Test Manual - Smart OCR"
   - Document Type: "Owner Manual"
   - Category: "Manuals"
5. Click "Upload"
6. **Start timer**

**Monitoring:**
- Watch browser console (F12 > Console) for job creation
- Observe job status in progress bar
- Note time at each stage:
  - Upload start: __:__ (should be instant)
  - Upload complete: __:__ (depends on file size)
  - OCR start: __:__ (should start immediately)
  - OCR complete: __:__ (THIS IS KEY METRIC)

**Pass Criteria:**
- [ ] File uploads successfully
- [ ] Job ID appears in console
- [ ] Progress bar shows status
- [ ] **OCR completes in < 5 seconds**
- [ ] No errors in console
- [ ] Document appears in library
- [ ] Search results appear within 2 minutes

**Example Console Output:**
```
[NaviDocs] Upload started
[NaviDocs] Job created: job-uuid-12345
[NaviDocs] Polling job status...
[NaviDocs] Job progress: 10%
[NaviDocs] Job progress: 50%
[NaviDocs] Job progress: 100%
[NaviDocs] OCR complete in 4.2 seconds
```

### Test 1.2: Large PDF with Mixed Text

**Steps:**
1. Upload a **100-page PDF** with:
   - 50 pages with native text
   - 50 pages with scanned images only
2. Note file size: ______
3. **Start timer**
4. Monitor job progress

**Expected Behavior:**
- Upload: < 30 seconds
- Native text extraction: 2-3 seconds (50 pages)
- Scanned page OCR: 1-2 seconds (50 pages, fast path)
- **Total: < 5 seconds**

**Pass Criteria:**
- [ ] **Total OCR time < 5 seconds**
- [ ] All 100 pages indexed
- [ ] Search returns results from both native and OCR text
- [ ] No timeout errors
- [ ] No memory issues

### Test 1.3: OCR Quality Check

**Steps:**
1. Open completed document in library
2. Click "View Document"
3. Check search accuracy

**Search Test:**
1. Go to Library > Search
2. Try these searches:
   - "engine" (should find technical manual content)
   - "warranty" (should find warranty sections)
   - "maintenance" (should find service records)

**Pass Criteria:**
- [ ] Search results accurate (not gibberish)
- [ ] Results show page numbers
- [ ] Text snippets are readable
- [ ] OCR confidence > 80%
- [ ] Language detection correct

**Check OCR Confidence:**
```javascript
// In browser console:
// After document loads, check page data
console.log(document.__nuxt__.$data.documentPages)
// Look for ocrConfidence field (should be 0.8-0.95)
```

---

## Test 2: Multi-Format Upload

### Purpose
Verify that NaviDocs handles 6 different file types correctly:
1. **PDF** - Native + OCR
2. **Images (JPG/PNG)** - OCR only
3. **Word (DOCX)** - Text extraction
4. **Excel (XLSX)** - Data extraction
5. **Text (TXT)** - Direct read
6. **Markdown (MD)** - Direct read

### Test 2.1: Upload All 6 File Types

**Prepare Test Files:**
Create or locate these files:

| Format | Filename | Content | Size |
|--------|----------|---------|------|
| PDF | test-manual.pdf | 5-10 page manual | < 10 MB |
| JPG | boat-photo.jpg | 2-3 MB photo | < 5 MB |
| PNG | diagram.png | System diagram | < 2 MB |
| DOCX | specifications.docx | Boat specs | < 1 MB |
| XLSX | maintenance.xlsx | Service log | < 1 MB |
| TXT | notes.txt | Engine notes | < 100 KB |

**Upload Steps:**

For each file:
1. Click "Upload Document"
2. Select file
3. Fill metadata:
   - Title: "[Type] - Test Document"
   - Type: Appropriate type
   - Category: Appropriate category
4. Click "Upload"
5. Record **Upload Status**
6. Record **Processing Time**

**Pass Criteria for Each Format:**

**PDF:**
- [ ] Uploads successfully
- [ ] OCR processes text
- [ ] Search finds content
- [ ] Pages extracted correctly
- [ ] Processing time < 5 seconds

**JPG/PNG:**
- [ ] Uploads successfully
- [ ] OCR processes image text
- [ ] Search finds content
- [ ] Image displays in preview
- [ ] Processing time < 3 seconds

**DOCX:**
- [ ] Uploads successfully
- [ ] Text extracted correctly
- [ ] Formatting preserved
- [ ] Search finds content
- [ ] Processing time < 2 seconds

**XLSX:**
- [ ] Uploads successfully
- [ ] Sheet data extracted
- [ ] All columns readable
- [ ] Search finds cell content
- [ ] Processing time < 2 seconds

**TXT:**
- [ ] Uploads successfully
- [ ] Full text indexed
- [ ] Search finds content
- [ ] Formatting preserved
- [ ] Processing time < 1 second

**MD:**
- [ ] Uploads successfully
- [ ] Markdown parsed correctly
- [ ] Headers and content separate
- [ ] Search finds content
- [ ] Processing time < 1 second

### Test 2.2: Search Across All Formats

**Steps:**
1. Go to Library > Search
2. Search for content that appears in multiple formats
   - Example: "engine" (in manual, specifications, notes)
3. Record results

**Pass Criteria:**
- [ ] Returns results from all 6 formats
- [ ] Results grouped by document type
- [ ] Preview shows correct snippet
- [ ] No format-specific errors
- [ ] Results load < 100 ms

### Test 2.3: Multi-Format Organization

**Steps:**
1. Go to Library
2. Filter by document type

**Pass Criteria:**
- [ ] Can filter by "PDF"
- [ ] Can filter by "Image"
- [ ] Can filter by "Word"
- [ ] Can filter by "Spreadsheet"
- [ ] Can filter by "Text"
- [ ] Filters work correctly
- [ ] No data loss

---

## Test 3: Timeline Activity

### Purpose
Verify that all document operations are logged with:
- Timestamps
- User attribution
- Operation type (upload/delete/share)
- Document metadata

### Test 3.1: Upload Activity Logging

**Steps:**
1. Go to Dashboard > Timeline (or Activity Feed)
2. Upload 3 documents of different types:
   - Document A (PDF)
   - Document B (JPG)
   - Document C (DOCX)
3. **Start timer** for each upload
4. Check Timeline after each upload

**Pass Criteria:**
- [ ] Each upload appears in timeline
- [ ] Correct document name shown
- [ ] Correct file type icon shown
- [ ] Timestamp accurate (within 1 minute)
- [ ] User name correct
- [ ] "Upload" action labeled correctly
- [ ] Timeline updates within 2 seconds of upload complete

**Example Timeline Entry:**
```
[✓] PDFs uploaded: test-manual.pdf
    User: test-user-123
    Time: 2025-11-13 15:30:45 UTC
    Status: Indexed (searchable)
    [View Document] [Delete]
```

### Test 3.2: Delete Activity Logging

**Steps:**
1. In Library, select one uploaded document
2. Click "Delete" button
3. Confirm deletion
4. **Start timer**
5. Check Timeline

**Pass Criteria:**
- [ ] Delete appears in timeline
- [ ] Shows "Document deleted" action
- [ ] Original filename visible
- [ ] Timestamp accurate
- [ ] User name correct
- [ ] Document removed from library
- [ ] Timeline updates within 2 seconds

**Example Timeline Entry:**
```
[✗] PDFs deleted: old-manual.pdf
    User: test-user-123
    Time: 2025-11-13 15:35:12 UTC
    [Undo Delete - 30 minute window]
```

### Test 3.3: Timeline Filtering

**Steps:**
1. Go to Timeline
2. Upload 5-10 documents of mixed types
3. Delete 2-3 documents
4. Try filtering:
   - By action: "Uploads only"
   - By action: "Deletions only"
   - By date range: "Last 1 hour"
   - By document type: "PDFs only"

**Pass Criteria:**
- [ ] Filters work correctly
- [ ] Display updates instantly
- [ ] Correct counts shown
- [ ] Can combine filters
- [ ] No missing entries
- [ ] Sorting works (newest first)

### Test 3.4: Timeline Performance

**Steps:**
1. Generate large timeline:
   - Upload 20-50 documents over 5 minutes
   - Delete 5-10 documents
2. Navigate to Timeline
3. **Start timer** for page load
4. Check performance metrics

**Pass Criteria:**
- [ ] Timeline loads in < 2 seconds
- [ ] Scrolling smooth (60 FPS)
- [ ] No memory leaks
- [ ] Search within timeline works
- [ ] Can export timeline (if feature exists)

---

## Test Data Suggestions

### Sample Files You Can Use

**For Smart OCR Testing:**
- Download sample boat manuals from:
  - Jeanneau official website (PDF manuals)
  - Sunseeker documentation
  - Generic marine equipment manuals
- Use these to test OCR quality

**For Multi-Format Testing:**
Create minimal test files:

```bash
# Create sample files
mkdir -p /tmp/navidocs-test-files

# PDF (convert text to PDF)
echo "Engine maintenance schedule" > /tmp/navidocs-test-files/manual.txt
# Convert to PDF (requires tools): wkhtmltopdf manual.txt manual.pdf

# JPG (download sample image)
wget https://via.placeholder.com/640x480.jpg -O /tmp/navidocs-test-files/boat.jpg

# PNG (create diagram)
# Use GIMP or online tool to create simple system diagram

# DOCX (Word)
# Create in Microsoft Word or LibreOffice with boat specifications

# XLSX (Spreadsheet)
# Create maintenance log with columns:
# Date | Service | Cost | Technician | Notes

# TXT
echo "Engine service notes
Date: 2025-11-01
Oil change completed
Next service: 2025-12-01" > /tmp/navidocs-test-files/notes.txt

# MD
echo "# Boat Maintenance

## Engine
- Oil capacity: 15L
- Change interval: 100 hours

## Hull
- Last paint: 2024-06" > /tmp/navidocs-test-files/specs.md
```

### Real Test Data (If Available)

Best case: Use actual boat documentation:
- Owner's manuals
- Service records
- Insurance documents
- Warranty certificates
- Photos with text overlays (for OCR testing)

---

## Expected Results

### Test 1: Smart OCR Expected Results

| Metric | Expected | Acceptable | Failure |
|--------|----------|-----------|---------|
| 5-page PDF OCR | < 2 sec | < 3 sec | > 5 sec |
| 50-page PDF OCR | < 3 sec | < 4 sec | > 8 sec |
| 100-page PDF OCR | < 5 sec | < 6 sec | > 10 sec |
| OCR Confidence | 85-95% | 70-85% | < 70% |
| Search Latency | < 50 ms | < 100 ms | > 200 ms |
| Indexing Rate | > 20 pages/sec | > 15 pages/sec | < 10 pages/sec |

### Test 2: Multi-Format Expected Results

| Format | Upload Time | Process Time | Search Latency |
|--------|------------|--------------|-----------------|
| PDF | 2-5 sec | 2-5 sec | 50-100 ms |
| JPG | 1-3 sec | 1-3 sec | 50-100 ms |
| PNG | 1-3 sec | 1-3 sec | 50-100 ms |
| DOCX | 1-2 sec | <1 sec | 50-100 ms |
| XLSX | 1-2 sec | <1 sec | 50-100 ms |
| TXT | <1 sec | <1 sec | 50-100 ms |

### Test 3: Timeline Expected Results

| Operation | Expected Latency | Update Delay | Data Accuracy |
|-----------|-----------------|--------------|----------------|
| Upload logged | < 1 sec | < 2 sec | 100% |
| Delete logged | < 1 sec | < 2 sec | 100% |
| Timeline load | < 2 sec | - | 100% |
| Search filter | < 100 ms | - | 100% |

---

## Reporting Bugs

### Bug Report Template

When you find a bug, use this format:

**Title:** [FEATURE] Brief description
- Example: "[Smart OCR] 100-page PDF times out after 45 seconds"

**Environment:**
- Browser: Chrome 130.0 / Firefox 131.0 / Safari 18.1
- OS: Windows 11 / macOS 14 / Ubuntu 24.04
- Screen Resolution: 1920x1080
- Network: Wired / WiFi with speed (Mbps)
- Time: 2025-11-13 15:30 UTC

**Steps to Reproduce:**
1. Navigate to [URL]
2. Click on [button]
3. Upload [file type], size [MB]
4. Observe [behavior]

**Expected Behavior:**
[What should have happened]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[Attach images showing the issue]

**Console Errors:**
[Copy full error stack trace from F12 > Console]

**Performance Metrics:**
- Upload time: X seconds
- OCR time: Y seconds
- Search latency: Z ms

**Severity:**
- 🔴 Critical: Feature completely broken
- 🟠 Major: Feature partially broken
- 🟡 Minor: Cosmetic or edge case
- 🟢 Suggestion: Enhancement

**Attachments:**
- Test file if applicable
- Network HAR file (F12 > Network > Export)
- Browser console log

### Where to Report

1. **GitHub Issues:** https://github.com/dannystocker/navidocs/issues
2. **Email:** bugs@digital-lab.ca
3. **Internal Slack:** #navidocs-bugs

---

## Troubleshooting

### Upload Fails with "Invalid File Type"

**Problem:** File upload rejected immediately

**Causes:**
- File extension not supported
- MIME type mismatch
- File too large (>50 MB)

**Solutions:**
```bash
# Check file type
file test-file.pdf
# Should output: PDF document, version 1.4

# Check file size
ls -lh test-file.pdf
# Size should be < 50 MB

# Verify MIME type
# PDF: application/pdf
# JPG: image/jpeg
# PNG: image/png
# DOCX: application/vnd.openxmlformats-officedocument.wordprocessingml.document
# XLSX: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

### OCR Takes Too Long (>10 seconds for 100 pages)

**Problem:** Performance degradation

**Potential Causes:**
- Server CPU high
- Tesseract process stuck
- Redis queue backed up
- Database locks

**Diagnosis:**
```bash
# SSH to StackCP
ssh stackcp

# Check CPU usage
top -b -n 1 | head -20

# Check queue length
redis-cli LLEN bull:ocr-jobs:jobs

# Check disk space
df -h ~/navidocs-data/

# Check database locks
lsof 2>/dev/null | grep navidocs.db
```

**Fixes:**
1. Restart OCR worker: `systemctl --user restart navidocs-ocr-worker`
2. Clear stuck jobs: `redis-cli DEL bull:ocr-jobs:*`
3. Increase Tesseract threads: Edit `.env` TESSERACT_THREADS=4

### Search Returns No Results

**Problem:** Indexed documents don't appear in search

**Causes:**
- Meilisearch service down
- Index not created
- Documents not yet indexed
- Tenant token expired

**Diagnosis:**
```bash
# Check Meilisearch health
curl http://localhost:7700/health

# Check index exists
curl http://localhost:7700/indexes

# Check document count
curl http://localhost:7700/indexes/navidocs-pages/stats

# Check search token
curl -X POST http://localhost:8001/api/search/token \
  -H "Content-Type: application/json" \
  -d '{"expiresIn": 3600}' | jq .
```

**Fixes:**
1. Restart Meilisearch: `systemctl --user restart meilisearch`
2. Reindex: `npm run reindex` (from server directory)
3. Clear bad token and regenerate

### Timeline Not Updating

**Problem:** Activity feed shows stale data

**Causes:**
- Database transaction not committed
- Cache not invalidated
- WebSocket connection failed
- Job status not updated

**Diagnosis:**
```bash
# Check recent database entries
sqlite3 ~/navidocs-data/db/navidocs.db \
  "SELECT * FROM ocr_jobs ORDER BY created_at DESC LIMIT 5;"

# Check timestamps
sqlite3 ~/navidocs-data/db/navidocs.db \
  "SELECT id, status, updated_at FROM ocr_jobs LIMIT 5;"
```

**Fixes:**
1. Refresh page (F5)
2. Clear browser cache (Ctrl+Shift+R)
3. Restart server: `systemctl --user restart navidocs`
4. Rebuild timeline index

### File Upload Stuck at 50%

**Problem:** Upload progress bar frozen

**Causes:**
- Network timeout
- Server crash
- Browser cache issue
- Large file size

**Solutions:**
1. **Check network:**
   ```bash
   # F12 > Network, check for failed requests
   # Green = success, Red = failed
   ```

2. **Check file size:**
   ```bash
   ls -lh file.pdf
   # If > 50 MB, file too large
   # Max: 50 MB
   ```

3. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E

4. **Try again with smaller file:**
   - If file > 20 MB, split into sections
   - Upload separately, then combine

### Account/Login Issues

**Problem:** Cannot login or register

**Causes:**
- Database connection failed
- Password hash mismatch
- Session expired
- CSRF token invalid

**Solutions:**
```bash
# Check database is accessible
sqlite3 ~/navidocs-data/db/navidocs.db "SELECT * FROM users LIMIT 1;"

# Check user exists
sqlite3 ~/navidocs-data/db/navidocs.db \
  "SELECT id, email FROM users WHERE email='test@example.com';"

# Reset user password (if admin)
npm run reset-password test@example.com NewPassword123!
```

---

## Performance Benchmarks

### Expected Performance Metrics

**Backend API:**
- Health check: < 50 ms
- Token generation: 100-200 ms
- Upload: 1-3 seconds (depends on file size)
- Search: 50-100 ms
- Job status: 50-100 ms

**Frontend:**
- Page load: < 2 seconds
- Library render: < 1 second
- Search results: < 100 ms
- Upload dialog: < 500 ms
- Timeline load: < 2 seconds

**Database:**
- Query response: < 50 ms
- Index update: < 1 second
- Document insert: < 100 ms

**Search Engine (Meilisearch):**
- Index creation: < 100 ms
- Document insert: < 10 ms each
- Search query: 10-50 ms
- Faceted search: 50-100 ms

### Load Testing

If you have access to tools like Apache Bench or wrk:

```bash
# Simulate 10 concurrent users
wrk -t4 -c10 -d30s https://digital-lab.ca/navidocs/

# Load test upload endpoint
# Note: Requires authentication token
# See API docs for token generation

# Expected results:
# - Should handle 100+ requests/sec
# - <1% error rate
# - <200 ms p95 latency
```

---

## Sign-Off Checklist

After completing all tests, check these boxes:

### Test 1: Smart OCR
- [ ] 5-page PDF: < 3 seconds
- [ ] 100-page PDF: < 5 seconds
- [ ] Search results accurate
- [ ] OCR confidence > 80%
- [ ] No timeout errors

### Test 2: Multi-Format
- [ ] PDF: Upload & search works
- [ ] JPG: Upload & OCR works
- [ ] PNG: Upload & OCR works
- [ ] DOCX: Upload & extract works
- [ ] XLSX: Upload & parse works
- [ ] TXT: Upload & index works
- [ ] All formats searchable

### Test 3: Timeline
- [ ] Uploads logged to timeline
- [ ] Deletes logged to timeline
- [ ] Timestamps accurate
- [ ] User attribution correct
- [ ] Filtering works
- [ ] Updates within 2 seconds

### Overall
- [ ] No console errors
- [ ] No network failures
- [ ] No database errors
- [ ] Performance acceptable
- [ ] UX is smooth
- [ ] No data loss

### Sign-Off
- **Tester Name:** _______________________
- **Date:** _______________________
- **Status:** 🟢 PASS / 🟡 PASS WITH ISSUES / 🔴 FAIL
- **Notes:** _______________________

---

## Additional Resources

- **API Documentation:** `/home/setup/navidocs/server/API_SUMMARY.md`
- **Architecture Guide:** `/home/setup/navidocs/DEPLOYMENT_ARCHITECTURE.md`
- **Developer Guide:** `/home/setup/navidocs/server/docs/README_ARCHITECTURE.md`
- **Deployment Guide:** `/home/setup/navidocs/DEPLOYMENT_INDEX.md`

---

## Contact & Support

**Questions about testing?**
- Email: test-team@digital-lab.ca
- Slack: #navidocs-testing
- GitHub Issues: https://github.com/dannystocker/navidocs/issues

**Report bugs using the Bug Report Template** above.

---

**Document Version:** 2025-11-13
**Status:** Ready for Live Testing
**Confidence Level:** High

Good luck with testing! 🚀

