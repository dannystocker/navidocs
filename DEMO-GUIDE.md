# NaviDocs Demo Guide

> **Version:** 1.0.0 (Single-Tenant Demo)
> **Date:** October 2025
> **Purpose:** Comprehensive guide for demonstrating NaviDocs features

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [System Overview](#system-overview)
3. [Demo Flow](#demo-flow)
4. [Key Features](#key-features)
5. [Troubleshooting](#troubleshooting)
6. [Technical Details](#technical-details)

---

## 🚀 Quick Start

### Prerequisites Check

Ensure all services are running:

```bash
# Backend (port 8001)
cd /home/setup/navidocs/server && npm start

# Frontend (port 8083)
cd /home/setup/navidocs/client && npm run dev

# Meilisearch (port 7700)
# Should be running as a service
```

### Access Points

- **Frontend:** http://localhost:8083 or http://172.29.75.55:8083
- **Backend API:** http://localhost:8001
- **Health Check:** http://localhost:8001/health

---

## 🎯 System Overview

NaviDocs is a document management system specifically designed for boat manuals with:
- **OCR Processing:** Extract text from PDF manuals automatically
- **Full-Text Search:** Find information across all manuals instantly
- **Image Detection:** Identify and extract diagrams for quick reference
- **Auto-Fill Metadata:** Automatically extract boat information from first page

### Current State

- **Documents:** 2 manuals loaded
  1. Sumianda Network Upgrade
  2. Liliane1 Prestige Manual EN
- **Tenant:** Single tenant (Liliane 1)
- **Search Index:** Fully populated with 8+ searchable entries

---

## 🎬 Demo Flow

### 1. Home Page Showcase (2 minutes)

**URL:** http://localhost:8083

**What to Show:**
- Modern dark theme with pink/purple gradient
- Clean, professional interface
- Document list showing 2 indexed manuals
- Status indicators (Processing/Ready/Failed)

**Talking Points:**
- "NaviDocs provides a centralized location for all boat manuals"
- "Built specifically for mariners who value their time on the water"
- "Dark theme reduces eye strain during late-night troubleshooting"

### 2. Search Functionality (3 minutes)

**What to Demo:**
```
Search Query: "network"
Expected Results: 8 results from Sumianda Network Upgrade
```

**What to Show:**
- Lightning-fast search results (<50ms)
- Highlighted search terms
- Page numbers for each result
- Diagram thumbnails for visual results
- "Diagram" badges on image search results

**Talking Points:**
- "Search across ALL your manuals at once"
- "Find specific procedures in milliseconds, not minutes"
- "Visual previews help identify the right section faster"

### 3. Document Viewing (3 minutes)

**What to Demo:**
1. Click on "Liliane1 Prestige Manual EN"
2. Show PDF rendering
3. Demonstrate text selection
4. Navigate between pages
5. Show page controls

**What to Show:**
- Smooth PDF rendering
- Selectable text for copy/paste
- Page navigation controls
- Loading states

**Talking Points:**
- "View manuals directly in the browser - no downloads needed"
- "Select and copy text for procedures or part numbers"
- "Works on any device - desktop, tablet, or phone"

### 4. Upload with Auto-Fill (5 minutes)

**What to Demo:**
1. Click "Upload Document" button
2. Select a test PDF (use test/data/05-versions-space.pdf)
3. Show metadata extraction in progress
4. Demonstrate auto-filled fields
5. Upload and watch OCR progress

**Test File:** `/home/setup/navidocs/test/data/05-versions-space.pdf`

**What to Show:**
- Drag-and-drop upload
- Automatic metadata extraction from first page
- OCR progress indication
- Toast notifications for success/error

**Talking Points:**
- "Just drop your manual and we extract the boat info automatically"
- "OCR runs in the background - get back to work immediately"
- "Toast notifications keep you informed without interrupting"

### 5. Mobile Responsive Design (2 minutes)

**What to Demo:**
1. Open developer tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Switch to mobile view (iPhone/Android)
4. Show responsive layout

**What to Show:**
- Mobile-optimized navigation
- Touch-friendly controls
- Responsive search results
- Readable text on small screens

**Talking Points:**
- "Access your manuals from the dock, engine room, or anywhere"
- "Responsive design works on any screen size"
- "Perfect for tablets mounted in the pilothouse"

---

## ✨ Key Features

### 🔍 **Lightning-Fast Search**
- Powered by Meilisearch
- Typo-tolerant
- Search across all documents simultaneously
- Results in <50ms

### 📄 **Smart OCR Processing**
- Automatic text extraction
- Background processing
- Progress tracking
- Error handling with retry

### 🎨 **Beautiful Dark Theme**
- Pink (#ff5cb2) to Purple (#9a58ce) gradients
- Glass morphism effects
- Reduced eye strain
- Modern, professional appearance

### 📱 **Fully Responsive**
- Desktop, tablet, and mobile optimized
- Touch-friendly controls
- Adaptive layouts
- Progressive Web App compatible

### 🤖 **Auto-Fill Metadata**
- Extract boat make/model/year from first page
- Fallback to filename parsing
- Reduces manual data entry
- Improves accuracy

### 🖼️ **Diagram Detection**
- Automatic image extraction from PDFs
- Thumbnail previews in search results
- Full-size image viewer
- "Diagram" badges for visual distinction

---

## 🛠️ Troubleshooting

### Frontend Not Loading

```bash
# Check if frontend is running
curl http://localhost:8083

# Restart frontend
cd /home/setup/navidocs/client
npm run dev
```

### Backend API Errors

```bash
# Check backend health
curl http://localhost:8001/health

# Restart backend
cd /home/setup/navidocs/server
npm start
```

### Search Not Working

```bash
# Check Meilisearch status
curl http://localhost:7700/health

# Restart Meilisearch (if needed)
sudo systemctl restart meilisearch
```

### Database Issues

```bash
# Check database
cd /home/setup/navidocs/server
node check-documents.js

# Should show 2 documents
```

---

## 🔧 Technical Details

### Technology Stack

**Frontend:**
- Vue 3 (Composition API)
- Vite (Build tool)
- TailwindCSS (Styling)
- PDF.js (PDF rendering)
- Vue Router (Routing)

**Backend:**
- Node.js + Express
- Better-sqlite3 (Database)
- Tesseract.js (OCR)
- Multer (File uploads)
- Meilisearch (Search engine)

**Infrastructure:**
- SQLite (Document metadata)
- Meilisearch (Full-text search)
- File system (PDF and image storage)

### Architecture

```
┌─────────────┐
│   Client    │  Vue 3 SPA (port 8083)
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTP/REST
       │
┌──────▼──────┐
│   Express   │  API Server (port 8001)
│   Backend   │
└──────┬──────┘
       │
       ├─────────┐
       │         │
   ┌───▼───┐ ┌──▼──────┐
   │SQLite │ │Meilisearch│
   │  DB   │ │  Search  │
   └───────┘ └───────────┘
```

### Data Flow

**Upload Flow:**
1. User uploads PDF → Frontend
2. Frontend sends to `/api/upload` → Backend
3. Backend saves file, creates DB record
4. OCR worker processes PDF in background
5. Text extracted and sent to Meilisearch
6. Images detected and saved
7. Status updates via polling

**Search Flow:**
1. User types query → Frontend
2. Frontend sends to `/api/search` → Backend
3. Backend queries Meilisearch
4. Results returned with highlighting
5. Frontend displays with thumbnails

### File Structure

```
navidocs/
├── client/               # Vue 3 frontend
│   ├── src/
│   │   ├── views/       # Page components
│   │   ├── components/  # Reusable components
│   │   └── composables/ # Vue composables
│   └── public/
├── server/              # Express backend
│   ├── routes/          # API endpoints
│   ├── workers/         # Background workers
│   ├── db/              # Database setup
│   ├── utils/           # Utilities
│   └── middleware/      # Express middleware
├── uploads/             # Uploaded PDFs and images
├── db/                  # SQLite database
└── tests/               # Test files
```

### Environment Variables

```bash
# Backend (.env)
PORT=8001
NODE_ENV=development
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=your-master-key
```

---

## 📊 Demo Metrics

**Performance Benchmarks:**
- Search latency: <50ms
- PDF render time: ~2s
- OCR processing: ~5-10s per page
- Upload handling: <1s

**Current Data:**
- Documents: 2
- Total pages: ~100+
- Search entries: 8+
- Storage used: ~7MB

---

## 🎯 Next Steps (Post-Demo)

### Immediate Improvements:
1. Add user authentication
2. Implement multi-tenant support
3. Add document sharing features
4. Create mobile app (React Native)

### Future Enhancements:
1. AI-powered search suggestions
2. Collaborative annotations
3. Version control for manuals
4. Integration with boat management systems
5. Offline mode with sync

---

## 📞 Support

For issues or questions:
- Check logs in browser console (F12)
- Check server logs: `tail -f /tmp/backend-*.log`
- Run health checks on all services
- Restart services if needed

---

**Built for mariners, by mariners.**
NaviDocs - Making boat documentation simple.
