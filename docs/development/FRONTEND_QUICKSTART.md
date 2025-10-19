# NaviDocs Frontend Quick Start

**Quick guide to run the polished Meilisearch-inspired frontend**

---

## Prerequisites

- Node.js 20+
- Backend running on port 8001
- Meilisearch running on port 7700
- Redis running on port 6379

---

## Start Frontend (Development)

```bash
cd /home/setup/navidocs/client
npm install
npm run dev
```

**Access:** http://localhost:8080

---

## Build for Production

```bash
cd /home/setup/navidocs/client
npm run build
```

**Output:** `dist/` directory

---

## Pages Available

### 1. Home Page
**URL:** `http://localhost:8080/`

**Features:**
- Search bar with glow effect
- Upload document button
- Three feature cards
- Link to Jobs dashboard

### 2. Search Results
**URL:** `http://localhost:8080/search?q=pump`

**Features:**
- Real-time search
- Highlighted matches
- Click results to view document

### 3. Document Viewer
**URL:** `http://localhost:8080/document/:id`

**Features:**
- PDF.js viewer
- Page navigation
- Dark theme

### 4. Jobs Dashboard
**URL:** `http://localhost:8080/jobs`

**Features:**
- Real-time job status
- Auto-refresh every 5s
- View completed documents
- Retry failed jobs

---

## Design System

### Colors

**Primary (Purple):**
- `primary-500`: #d946ef
- `primary-600`: #c026d3

**Secondary (Pink/Rose):**
- `secondary-500`: #f43f5e
- `secondary-600`: #e11d48

**Success (Green):**
- `success-500`: #10b981

**Dark (Slate):**
- `dark-50`: #f8fafc
- `dark-900`: #0f172a

### Typography

**Font:** Inter (Google Fonts)
**Weights:** 300, 400, 500, 600, 700, 800, 900

### Buttons

```html
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-outline">Outline Button</button>
```

### Cards

```html
<div class="card">Card content</div>
<div class="card-hover">Hoverable card</div>
```

### Search Input

```html
<input type="text" class="search-input" placeholder="Search...">
```

---

## Testing Checklist

### 1. Upload Flow
- [ ] Click "Upload Document" button
- [ ] Drag & drop a PDF or browse
- [ ] Fill in boat metadata
- [ ] Upload and watch progress
- [ ] See success message

### 2. Jobs Dashboard
- [ ] Navigate to `/jobs`
- [ ] See uploaded document processing
- [ ] Watch progress bar
- [ ] Click "View Document" when complete

### 3. Search
- [ ] Type in search bar on home page
- [ ] Press Enter
- [ ] See results with highlighted text
- [ ] Click a result

### 4. Document Viewer
- [ ] PDF renders properly
- [ ] Previous/Next buttons work
- [ ] Jump to page works
- [ ] Back button returns to home

---

## Troubleshooting

### Frontend won't start
```bash
# Kill any process on port 8080
lsof -ti:8080 | xargs kill -9

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### API requests fail
- Ensure backend is running on port 8001
- Check Vite proxy config in `vite.config.js`
- Verify `/api` routes are working:
  ```bash
  curl http://localhost:8001/api/health
  ```

### PDF.js not loading
- Check browser console for errors
- Verify PDF.js worker CDN is accessible
- Check PDF file exists at `/api/documents/:id/pdf`

### Search not working
- Verify Meilisearch is running on port 7700
- Check backend can connect to Meilisearch
- Verify documents are indexed

---

## Development Tips

### Hot Module Replacement (HMR)
Vite provides instant HMR - edit `.vue` files and see changes immediately.

### Vue DevTools
Install Vue DevTools browser extension for component inspection.

### Tailwind IntelliSense
Install Tailwind CSS IntelliSense VS Code extension for class autocomplete.

### Component Structure
```
src/
├── views/           # Page components
├── components/      # Reusable components
├── composables/     # Vue composables (useSearch, useJobPolling)
├── assets/          # CSS, images
└── router.js        # Route definitions
```

---

## Performance Notes

### Bundle Sizes (Gzipped)
- Main CSS: 5.37 KB
- Vendor JS: 37.64 KB
- PDF.js: 107.38 KB
- Total: ~150 KB

### Load Time Goals
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Search response: < 100ms

---

## Browser Support

**Tested:**
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

**Features requiring modern browser:**
- CSS backdrop-filter
- CSS gradients
- PDF.js web workers
- ES modules

---

## Screenshots

### Color Palette
```
Primary:   ███ #d946ef (Purple)
Secondary: ███ #f43f5e (Pink/Rose)
Success:   ███ #10b981 (Green)
Dark-900:  ███ #0f172a (Slate)
```

### Gradient Examples
```css
/* Button gradient */
background: linear-gradient(to right, #d946ef, #f43f5e);

/* Text gradient */
background: linear-gradient(to right, #c026d3, #e11d48);
background-clip: text;
color: transparent;
```

---

## Next Steps

1. **Test full workflow:**
   - Upload → Process → Search → View

2. **Add authentication:**
   - Implement JWT login/register
   - Protect routes

3. **Add PWA:**
   - Service worker
   - Offline support
   - Install prompt

4. **Production deployment:**
   - Build optimized bundle
   - Deploy to StackCP or VPS
   - Configure CDN

---

**Questions?** Check `/home/setup/navidocs/docs/README.md` for full documentation.
