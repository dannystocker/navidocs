# NaviDocs - Professional Boat Manual Management

**Production-ready boat manual management platform with OCR and intelligent search**

Built with Vue 3, Express, SQLite, and Meilisearch. Extracted from the lilian1 (FRANK-AI) prototype with clean, professional code only.

---

## Features

- **Upload PDFs** - Drag and drop boat manuals
- **OCR Processing** - Automatic text extraction with Tesseract.js
- **Intelligent Search** - Meilisearch with boat terminology synonyms
- **Offline-First** - PWA with service worker caching
- **Multi-Vertical** - Supports boats, marinas, and properties
- **Secure** - Tenant tokens, file validation, rate limiting

---

## Tech Stack

### Backend
- **Node.js 20** - Express 5
- **SQLite** - better-sqlite3 with WAL mode
- **Meilisearch** - Sub-100ms search with synonyms
- **BullMQ** - Background OCR job processing
- **Tesseract.js** - PDF text extraction

### Frontend
- **Vue 3** - Composition API with `<script setup>`
- **Vite** - Fast builds and HMR
- **Tailwind CSS** - Meilisearch-inspired design
- **Pinia** - State management
- **PDF.js** - Document viewer

---

## Quick Start

### Prerequisites

```bash
# Required
node >= 20.0.0
npm >= 10.0.0

# For OCR
pdftoppm (from poppler-utils)
tesseract >= 5.0.0

# For search
meilisearch >= 1.0.0

# For queue
redis >= 6.0.0
```

### Installation

```bash
# Clone repository
cd ~/navidocs

# Install server dependencies
cd server
npm install
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run init-db

# Install client dependencies
cd ../client
npm install

# Start services (each in separate terminal)
meilisearch --master-key=masterKey
redis-server
cd ~/navidocs/server && node workers/ocr-worker.js
cd ~/navidocs/server && npm run dev
cd ~/navidocs/client && npm run dev
```

Visit http://localhost:5173

---

## Architecture

See `docs/architecture/` for complete schema and configuration details.

**Ship it. Learn from users. Iterate.**
