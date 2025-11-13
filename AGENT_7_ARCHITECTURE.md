# Agent 7 - Thumbnail Generation Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     THUMBNAIL GENERATION SYSTEM                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Template   │────────▶│  getThumbnail │────────▶│    Cache     │
│  (Vue View)  │         │   (pageNum)   │         │  Check First │
└──────────────┘         └──────────────┘         └──────┬───────┘
                                                          │
                                                          │
                              ┌───────────────────────────┼───────────┐
                              │                           │           │
                              ▼                           ▼           ▼
                        ┌──────────┐              ┌──────────┐  ┌─────────┐
                        │  Cached  │              │ Loading? │  │Generate │
                        │  Return  │              │   Wait   │  │  New    │
                        └──────────┘              └──────────┘  └────┬────┘
                                                                      │
                                                                      ▼
                                                            ┌─────────────────┐
                                                            │   PDF.js API    │
                                                            │  getPage(num)   │
                                                            └────────┬────────┘
                                                                     │
                                                                     ▼
                                                            ┌─────────────────┐
                                                            │ getViewport()   │
                                                            │   scale: 0.2    │
                                                            └────────┬────────┘
                                                                     │
                                                                     ▼
                                                            ┌─────────────────┐
                                                            │ Create Canvas   │
                                                            │  80x100px (≈)   │
                                                            └────────┬────────┘
                                                                     │
                                                                     ▼
                                                            ┌─────────────────┐
                                                            │ page.render()   │
                                                            │  to Canvas      │
                                                            └────────┬────────┘
                                                                     │
                                                                     ▼
                                                            ┌─────────────────┐
                                                            │ toDataURL()     │
                                                            │  PNG @ 0.8 qual │
                                                            └────────┬────────┘
                                                                     │
                                                                     ▼
                                                            ┌─────────────────┐
                                                            │  Store in Cache │
                                                            │  Return Data URL│
                                                            └─────────────────┘
```

## Component Interaction Flow

```
USER SEARCHES
     │
     ▼
┌────────────────────────────────────────────────────┐
│  performSearch() → highlightSearchTerms()          │
│  Creates hitList with page numbers and snippets    │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│  Template renders search results                   │
│  For each hit in hitList:                          │
│    - Show thumbnail (getThumbnail(hit.page))       │
│    - Show snippet                                  │
│    - Show page number                              │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│  getThumbnail(pageNum)                             │
│    ├─▶ Check thumbnailCache Map                    │
│    ├─▶ Check thumbnailLoading Set                  │
│    └─▶ Call generateThumbnail(pageNum)             │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│  generateThumbnail(pageNum)                        │
│    1. Mark as loading                              │
│    2. Get page from PDF                            │
│    3. Create viewport at 0.2 scale                 │
│    4. Render to off-screen canvas                  │
│    5. Convert to PNG data URL                      │
│    6. Cache result                                 │
│    7. Unmark loading                               │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│  Template receives data URL                        │
│  <img :src="dataURL" />                            │
└────────────────────────────────────────────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────┐
│                 STATE VARIABLES                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  thumbnailCache (Map)                                │
│  ├─ Key: Page Number (integer)                      │
│  └─ Value: Data URL (string)                        │
│                                                      │
│  Example:                                            │
│  Map {                                               │
│    1 => "data:image/png;base64,iVBORw0KG...",       │
│    3 => "data:image/png;base64,iVBORw0KG...",       │
│    5 => "data:image/png;base64,iVBORw0KG..."        │
│  }                                                   │
│                                                      │
│  thumbnailLoading (Set)                              │
│  └─ Contains page numbers currently generating      │
│                                                      │
│  Example:                                            │
│  Set { 2, 4, 7 }                                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Cache Lifecycle

```
Document Load
     │
     ▼
┌─────────────────┐
│ Cache: Empty    │
│ Loading: Empty  │
└────────┬────────┘
         │
         ▼
Search Performed
     │
     ▼
┌─────────────────────────────────────┐
│ User sees results with thumbnails   │
└────────┬────────────────────────────┘
         │
         ▼
First thumbnail request (page 5)
     │
     ▼
┌─────────────────┐
│ Cache: Empty    │──▶ Generate thumbnail
│ Loading: {5}    │
└────────┬────────┘
         │
         ▼ (thumbnail rendered)
┌─────────────────┐
│ Cache: {5}      │
│ Loading: Empty  │
└────────┬────────┘
         │
         ▼
Second request for same page (page 5)
     │
     ▼
┌─────────────────┐
│ Cache: {5} ✓    │──▶ Return immediately
│ Loading: Empty  │     (no regeneration)
└────────┬────────┘
         │
         ▼
Document change
     │
     ▼
clearThumbnailCache()
     │
     ▼
┌─────────────────┐
│ Cache: Empty    │
│ Loading: Empty  │
└─────────────────┘
```

## Performance Characteristics

```
┌────────────────────────────────────────────────────┐
│              PERFORMANCE METRICS                    │
├────────────────────────────────────────────────────┤
│                                                     │
│  Thumbnail Size (typical):                          │
│  ├─ Dimensions: 80x100px (approx)                  │
│  ├─ File size: 5-10 KB per thumbnail               │
│  └─ Format: PNG (0.8 quality)                      │
│                                                     │
│  Generation Time:                                   │
│  ├─ First generation: 50-150ms                     │
│  └─ Cached retrieval: <1ms                         │
│                                                     │
│  Memory Usage:                                      │
│  ├─ Per thumbnail: ~10 KB                          │
│  ├─ 50 pages cached: ~500 KB                       │
│  └─ 200 pages cached: ~2 MB                        │
│                                                     │
│  Concurrent Generation:                             │
│  ├─ Multiple pages can generate simultaneously     │
│  ├─ No race conditions (loading Set prevents)      │
│  └─ Duplicates wait for first to complete          │
│                                                     │
└────────────────────────────────────────────────────┘
```

## Error Handling

```
generateThumbnail(pageNum)
     │
     ├──▶ pdfDoc null?          ──▶ Return ''
     │
     ├──▶ getPage() fails?      ──▶ Catch, log, return ''
     │
     ├──▶ Canvas context fail?  ──▶ Throw error, return ''
     │
     └──▶ render() fails?       ──▶ Catch, log, return ''
               │
               ▼
         ┌────────────────┐
         │ Finally block  │
         │ - Unmark loading│
         └────────────────┘
```

## Integration Points

```
┌────────────────────────────────────────────────────┐
│            DocumentView.vue Structure               │
├────────────────────────────────────────────────────┤
│                                                     │
│  <template>                                         │
│    └─ Search Results                                │
│         └─ Thumbnail Images ──▶ getThumbnail()     │
│                                                     │
│  <script setup>                                     │
│    ├─ State Variables                              │
│    │    ├─ thumbnailCache                          │
│    │    └─ thumbnailLoading                        │
│    │                                                │
│    ├─ Functions                                     │
│    │    ├─ generateThumbnail()                     │
│    │    ├─ getThumbnail()                          │
│    │    ├─ isThumbnailLoading()                    │
│    │    └─ clearThumbnailCache()                   │
│    │                                                │
│    └─ Lifecycle                                     │
│         └─ resetDocumentState()                    │
│              └─ clearThumbnailCache()              │
│                                                     │
└────────────────────────────────────────────────────┘
```

## Data Flow Example

```
User searches for "engine"
     │
     ▼
Results found on pages: 3, 7, 15, 22
     │
     ▼
┌────────────────────────────────────────────────────┐
│  hitList = [                                        │
│    { page: 3, snippet: "...engine maintenance..." },│
│    { page: 7, snippet: "...engine oil..." },       │
│    { page: 15, snippet: "...engine specs..." },    │
│    { page: 22, snippet: "...engine diagram..." }   │
│  ]                                                  │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
Template renders 4 results
     │
     ├──▶ getThumbnail(3)  ──▶ Generate ──▶ Cache ──▶ Display
     │
     ├──▶ getThumbnail(7)  ──▶ Generate ──▶ Cache ──▶ Display
     │
     ├──▶ getThumbnail(15) ──▶ Generate ──▶ Cache ──▶ Display
     │
     └──▶ getThumbnail(22) ──▶ Generate ──▶ Cache ──▶ Display
                 │
                 ▼
User clicks result #2 (page 7)
     │
     ▼
Navigates to page 7 (full render)
     │
     ▼
User searches again for same term
     │
     ▼
Same results, same pages
     │
     ▼
┌────────────────────────────────────────────────────┐
│  getThumbnail(3)  ──▶ Cache Hit ──▶ Instant Display│
│  getThumbnail(7)  ──▶ Cache Hit ──▶ Instant Display│
│  getThumbnail(15) ──▶ Cache Hit ──▶ Instant Display│
│  getThumbnail(22) ──▶ Cache Hit ──▶ Instant Display│
└────────────────────────────────────────────────────┘
```

## Key Design Decisions

1. **Map for Cache**
   - Fast O(1) lookup
   - Easy to check existence
   - Simple to clear

2. **Set for Loading State**
   - Prevents duplicate requests
   - O(1) add/delete/has operations
   - Reactive for UI updates

3. **Data URL Storage**
   - Self-contained (no separate file requests)
   - Works with Vue reactivity
   - Easy to use in <img> tags

4. **Scale Factor 0.2**
   - Produces ~80x100px thumbnails
   - Small enough for performance
   - Large enough to be recognizable

5. **PNG Format @ 0.8 Quality**
   - Good clarity for text/diagrams
   - Reasonable file size
   - Better than JPEG for sharp text

6. **Lazy Generation**
   - Only generate when needed
   - Don't preload all pages
   - Better initial load time

## Testing Scenarios

```
1. First Search
   └─ All thumbnails generate fresh
   └─ Loading spinners shown during generation
   └─ Thumbnails appear when ready

2. Repeat Search
   └─ All thumbnails from cache
   └─ Instant display (no spinners)

3. Different Search
   └─ New pages generate fresh
   └─ Previously seen pages from cache

4. Document Switch
   └─ Cache cleared
   └─ Fresh thumbnails for new document

5. Concurrent Requests
   └─ Same page requested multiple times
   └─ Only one generation occurs
   └─ Other requests wait for first

6. Error Handling
   └─ Page generation fails
   └─ Empty string returned
   └─ No crash, graceful fallback
```
