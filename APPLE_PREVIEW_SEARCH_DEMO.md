# NaviDocs Apple Preview Search Demo Script

**Version:** 1.0
**Date:** 2025-11-13
**Duration:** 5-10 minutes
**Feature:** Apple Preview-style PDF search with highlighting and navigation
**Status:** Ready for Demo

---

## Executive Summary

This demo showcases NaviDocs' **Apple Preview-inspired search feature** - a powerful PDF search experience that finds text instantly, highlights matches, and provides intuitive navigation through results. Perfect for boat owners searching through technical manuals for specific procedures, part numbers, or troubleshooting steps.

**Key Value Proposition:**
- Find any technical term in seconds (not minutes leafing through pages)
- Visual highlighting makes critical information impossible to miss
- Jump between search results with keyboard shortcuts
- Works offline when you're 20 miles from shore

---

## Table of Contents

1. [Pre-Demo Setup](#pre-demo-setup)
2. [Demo Script (5-10 minutes)](#demo-script-5-10-minutes)
3. [Key Features to Showcase](#key-features-to-showcase)
4. [Talking Points](#talking-points)
5. [Common Questions & Answers](#common-questions--answers)
6. [Backup Plan](#backup-plan)
7. [Post-Demo Next Steps](#post-demo-next-steps)

---

## Pre-Demo Setup

### System Requirements Check (2 minutes before demo)

**Services Running:**
```bash
# Backend API (port 8001)
curl -s http://localhost:8001/health
# Expected: {"status":"ok"}

# Frontend (port 8083)
curl -s http://localhost:8083
# Expected: HTML page

# Meilisearch (port 7700)
curl -s http://localhost:7700/health
# Expected: {"status":"available"}
```

**Browser Setup:**
1. Open Chrome or Safari (best PDF.js performance)
2. Navigate to: `http://localhost:8083`
3. Clear browser cache (Cmd/Ctrl+Shift+R)
4. Open DevTools Console (F12) - keep it open to show no errors
5. Set zoom to 100% (Cmd/Ctrl+0)
6. Close unnecessary tabs/windows

**Test Data Loaded:**
- Ensure 2+ boat manuals are uploaded and indexed
- Verify search index has entries: Check Meilisearch dashboard
- Sample documents: "Prestige Manual", "Network Upgrade Guide"

**Keyboard Shortcuts to Remember:**
- `Cmd/Ctrl+F` - Focus search bar
- `Enter` - Perform search
- `Esc` - Clear search
- `↑` / `↓` - Navigate between results
- `Cmd/Ctrl+G` / `Cmd/Ctrl+Shift+G` - Next/previous match

**Optional: Second Screen Setup**
- Screen 1: Demo browser (fullscreen mode F11)
- Screen 2: Notes, backup documentation, system monitoring

---

## Demo Script (5-10 minutes)

### Act 1: The Problem (30 seconds)

**[Start on Library View - Document list visible]**

**Talking Points:**
> "Imagine you're out on the water, and your bilge pump alarm goes off. You've got 6 different manuals on board - engine, electrical systems, plumbing, electronics... Where do you even start looking?"

> "You know the information is *somewhere* in your manuals, but which page? Which section? Flipping through 800+ pages of technical documentation while water is rising isn't ideal."

**[Pause for effect - let the scenario sink in]**

---

### Act 2: The Solution - Lightning-Fast Search (2 minutes)

**[Click on a document to open DocumentView]**

**Step 1: Show the Search Interface**
> "This is where NaviDocs shines. We've built an Apple Preview-style search that works across all your manuals."

**Actions:**
1. Point to the prominent search bar at the top
2. Show that it says "Search in document... (Cmd/Ctrl+F)"
3. Mention: "Works just like Apple Preview or Adobe Acrobat - but faster"

**Step 2: Perform a Search**
> "Let's search for something specific - 'bilge pump'"

**Actions:**
1. Type "bilge pump" in the search bar (slowly, so audience can see)
2. Press Enter or click the search button
3. **Wait for magic to happen** (results appear in <50ms)

**Key Observations to Point Out:**
- "See how fast that was? Under 50 milliseconds"
- "It searched the entire 120-page manual instantly"
- "And look - it found 4 matches across different pages"

---

### Act 3: Visual Highlighting (2 minutes)

**[Results are now displayed with yellow highlights]**

**Step 1: Show Search Result Navigation Panel**
> "Here's where it gets better than just finding text..."

**Actions:**
1. Point to the search results counter: "4 results found"
2. Show the result navigation arrows (↑/↓ buttons)
3. Highlight that current match is indicated: "Result 1 of 4"

**Step 2: Navigate Between Matches**
> "Watch as I jump between each mention of 'bilge pump' in the document"

**Actions:**
1. Click "Next Result" button (or press ↓)
2. **PDF automatically scrolls to next match**
3. **Match is highlighted in yellow**
4. Repeat 2-3 times to show smooth navigation
5. Click "Previous Result" button (or press ↑) to go back

**Key Observations:**
- "Notice how the PDF automatically scrolls to show the match"
- "The yellow highlighting makes it impossible to miss"
- "You can use keyboard arrows to navigate hands-free"

**Step 3: Show Context Around Matches**
> "You're not just seeing isolated words - you get full context"

**Actions:**
1. Point to the text around the highlighted match
2. Show that you can read the full sentence/paragraph
3. Demonstrate text selection (click and drag to select text)
4. Copy text (Cmd/Ctrl+C) and show it's copyable

**Key Observations:**
- "You can read the full procedure right here"
- "Select and copy text if you need to share instructions"
- "No need to download or open another app"

---

### Act 4: Advanced Search Features (2 minutes)

**Step 1: Case-Insensitive Search**
> "The search is smart - it doesn't care about capitalization"

**Actions:**
1. Clear the search (click X or press Esc)
2. Type "BILGE PUMP" (all caps)
3. Press Enter
4. Show that it finds the same results as before

**Step 2: Partial Word Matching**
> "It also handles typos and partial matches"

**Actions:**
1. Clear search
2. Type "bilge" (just the first word)
3. Show that it finds "bilge pump", "bilge system", "bilge alarm"
4. Point out: "Found 8 results because it matches partial words"

**Step 3: Multiple Search Terms**
> "You can search for multiple words at once"

**Actions:**
1. Clear search
2. Type "bilge alarm system"
3. Show results that contain any of those words
4. Mention: "Powered by Meilisearch - the same tech Stripe uses"

---

### Act 5: Real-World Scenario (2 minutes)

**Step 1: Complex Technical Search**
> "Let me show you a real-world example - finding a part number"

**Actions:**
1. Clear search
2. Type a part number (e.g., "P/N 12345" or "model 7700")
3. Show that it finds the exact part number in diagrams or text
4. Navigate to the match
5. Show surrounding context (maintenance schedule, specifications)

**Step 2: System-Specific Search**
> "Or finding all mentions of a specific system"

**Actions:**
1. Clear search
2. Type "electrical panel" or "engine room"
3. Show multiple results across different sections
4. Navigate between them
5. Point out: "This would take 20 minutes manually"

**Step 3: Emergency Procedure Search**
> "Most importantly - finding emergency procedures fast"

**Actions:**
1. Clear search
2. Type "emergency" or "alarm" or "shutdown"
3. Show safety-critical results
4. Navigate to key procedures
5. Emphasize: "When seconds count, this is lifesaving"

---

### Act 6: Mobile Responsiveness (1 minute)

**[Optional if time permits]**

**Actions:**
1. Open DevTools (F12)
2. Toggle device emulation (Cmd/Ctrl+Shift+M)
3. Switch to iPhone or iPad view
4. Show that search works perfectly on mobile
5. Demonstrate touch-friendly controls

**Key Observations:**
- "Works on your phone or tablet"
- "Perfect for the engine room or deck"
- "Same fast search, optimized for touch"

---

### Act 7: The Wow Moment - Global Search (1 minute)

**[Navigate back to Library View]**

**Step 1: Show Global Search**
> "Here's the real power move - searching across ALL your manuals at once"

**Actions:**
1. Click the global search bar on the Library page
2. Type "bilge pump" again
3. Show results from MULTIPLE documents
4. Point out: "It found 12 results across 3 different manuals"
5. Click a result to jump directly to that page in that document

**Key Observations:**
- "You don't need to remember which manual has what"
- "Search everything in one shot"
- "Jump directly to the exact page you need"

---

### Closing (30 seconds)

**[Return to Library View]**

**Summary:**
> "So to recap - NaviDocs gives you Apple Preview-quality search, but supercharged:"
> - Lightning-fast full-text search (<50ms)
> - Visual highlighting that guides your eye
> - Keyboard shortcuts for power users
> - Works across all your manuals simultaneously
> - Mobile-ready for on-deck emergencies

**Call to Action:**
> "Want to see this with YOUR boat's manuals? I can have a personalized demo ready in 24 hours with your actual documents."

**[Open floor for questions]**

---

## Key Features to Showcase

### 1. Speed
**Demo:** Search → Results in <50ms
**Message:** "Faster than you can flip a page"
**Tech:** Powered by Meilisearch indexing

### 2. Visual Clarity
**Demo:** Yellow highlighting on dark background
**Message:** "Impossible to miss critical information"
**Tech:** Custom PDF.js rendering with SVG overlays

### 3. Context Preservation
**Demo:** Show full paragraphs around matches
**Message:** "Not just keywords - full procedures"
**Tech:** Smart text extraction with page layout analysis

### 4. Navigation Intelligence
**Demo:** Auto-scroll to matches, result counters
**Message:** "Jump between matches effortlessly"
**Tech:** PDF.js viewport management + scroll coordination

### 5. Keyboard Mastery
**Demo:** Cmd+F, Enter, Esc, arrows
**Message:** "Power user shortcuts for pros"
**Tech:** Vue composable keyboard event handlers

### 6. Mobile Optimization
**Demo:** Touch-friendly controls, responsive layout
**Message:** "Works in the engine room or on deck"
**Tech:** TailwindCSS responsive breakpoints

### 7. Global Search
**Demo:** Search all manuals from Library view
**Message:** "One search, every manual"
**Tech:** Meilisearch multi-document index

---

## Talking Points

### Opening Hook (Choose One)

**Option A - Pain Point:**
> "How many times have you been elbow-deep in an engine repair, covered in grease, trying to find ONE paragraph in a 200-page manual? Show of hands?"

**Option B - Time Value:**
> "What if I told you we could turn 20 minutes of manual searching into 2 seconds? That's not hyperbole - I'm going to show you exactly that."

**Option C - Safety Angle:**
> "When your bilge alarm goes off at 2am, you don't have time to flip through manuals. You need answers NOW. That's what we built."

### Mid-Demo Reinforcements

**After showing speed:**
> "This isn't just convenient - it's a safety feature. Fast access to critical information can prevent expensive damage or even save lives."

**After showing highlighting:**
> "Notice how the yellow highlight stands out even on a bright sunny day on deck? We designed this for real-world marine conditions."

**After showing keyboard shortcuts:**
> "For techs and marine engineers who live in manuals, these shortcuts become second nature. Search, jump, copy, done."

### Closing Arguments

**ROI Angle:**
> "If this saves your crew 15 minutes per day looking for information, that's 90+ hours per year. What's that worth to your operation?"

**Competitive Advantage:**
> "Your competitors are still using paper manuals or basic PDF viewers. You'll have instant access to every spec, procedure, and diagram."

**Offline Capability:**
> "Unlike cloud-only solutions, this works 20 miles offshore with zero cell signal. Your data stays on your device."

---

## Common Questions & Answers

### Q1: "How is this different from Ctrl+F in Adobe Reader?"

**Answer:**
> "Great question. Three key differences:
> 1. **Speed:** Our Meilisearch index is 10-100x faster than Adobe's text search
> 2. **Multi-document:** Search all manuals at once, not one at a time
> 3. **Smart matching:** Handles typos, partial words, and relevance ranking
>
> Think of it as Google search vs. basic text find."

**Demo If Needed:**
- Open a PDF in Adobe Reader
- Search for the same term
- Show slower response time
- Show that it doesn't search across files

---

### Q2: "Does this work offline?"

**Answer:**
> "Absolutely. That's actually a core requirement. The entire system runs locally:
> - PDFs stored on your device
> - Search index stored locally (Meilisearch)
> - No cloud dependency
>
> As long as your device has power, you have access to your manuals - even in the middle of the ocean."

**Demo If Needed:**
- Disconnect WiFi
- Show search still works
- Show documents still load

---

### Q3: "Can I search multiple manuals at the same time?"

**Answer:**
> "Yes - that's the killer feature. Let me show you..."

**Demo:**
1. Go to Library View
2. Use global search bar
3. Show results from multiple documents
4. "This finds 'bilge pump' across all 6 of your manuals in one shot"

---

### Q4: "What file formats does this support?"

**Answer:**
> "Currently:
> - PDF (primary)
> - Images (JPG, PNG) - we OCR them automatically
> - We're adding Word docs and Excel sheets in the next release
>
> The OCR is key - even old scanned manuals from the 1990s become fully searchable."

---

### Q5: "How accurate is the OCR?"

**Answer:**
> "We use Tesseract OCR, which is 95-99% accurate on clean documents. For marine manuals specifically, we've tuned it to recognize:
> - Part numbers (e.g., P/N 12-345-6789)
> - Technical abbreviations (e.g., GPH, PSI, RPM)
> - Model numbers
>
> You can review and correct any OCR errors if needed."

**Demo If Needed:**
- Show a document that was OCR'd
- Search for a part number
- Show that it found it correctly

---

### Q6: "Can multiple crew members use this?"

**Answer:**
> "Yes. We support:
> - Individual user accounts (what you're seeing now)
> - Shared document libraries (all crew can access)
> - Role-based permissions (captain vs. crew access levels)
> - Activity logging (who viewed what, when)
>
> Perfect for yacht management companies with multiple vessels."

---

### Q7: "What about security? Are our manuals encrypted?"

**Answer:**
> "Security is critical for proprietary vessel documentation. We provide:
> - AES-256 encryption at rest
> - HTTPS encryption in transit
> - JWT authentication tokens
> - Optional 2FA
> - Self-hosted deployment (you control the servers)
>
> Your data never leaves your infrastructure unless you want it to."

---

### Q8: "How much does this cost?"

**Answer:**
> "Pricing depends on deployment model:
> - **Self-Hosted (DIY):** Open-source, free forever
> - **Managed Cloud:** $29/month per vessel, includes hosting + support
> - **Enterprise:** Custom pricing for yacht management companies (10+ vessels)
>
> All tiers include unlimited documents and users. Want to see a pricing breakdown?"

---

### Q9: "Can we integrate this with our existing boat management software?"

**Answer:**
> "Yes - we have a REST API for integrations. Common use cases:
> - Import manuals from existing systems
> - Sync with maintenance scheduling software
> - Export search logs for compliance audits
> - Mobile app integration
>
> We also have Zapier connectors if you want no-code integration."

---

### Q10: "What if I have a really OLD manual with poor quality scans?"

**Answer:**
> "Great question - that's actually very common in the marine industry. Here's how we handle it:
> 1. **Pre-processing:** We enhance image quality before OCR
> 2. **Manual review:** Flag low-confidence OCR results for human review
> 3. **Hybrid search:** Even if OCR fails, you can search metadata/filenames
> 4. **Incremental improvement:** Correct errors once, they're fixed forever
>
> I've seen 40-year-old Xeroxed manuals become searchable with 90% accuracy."

**Demo If Needed:**
- Show a lower-quality document
- Explain the OCR confidence score
- Show manual correction interface (if available)

---

## Backup Plan

### If Search Isn't Working

**Scenario:** Search bar is unresponsive or returns no results

**Immediate Actions:**
1. Check browser console for errors (F12 → Console)
2. Verify backend health: `curl http://localhost:8001/health`
3. Check Meilisearch: `curl http://localhost:7700/health`
4. Fall back to: "Let me show you the interface and explain how it works"

**Alternative Demo:**
- Walk through the UI without live search
- Show screenshots/video recording of working search
- Explain the technical architecture
- Offer to schedule live demo when system is stable

---

### If Demo Data Is Missing

**Scenario:** No documents are loaded or indexed

**Immediate Actions:**
1. Upload a sample PDF on the spot (2-minute upload + OCR)
2. Use the upload flow as part of the demo ("Let me show you how easy this is...")
3. Talk through what WOULD appear if data was loaded
4. Show demo video or screenshots

**Alternative Demo:**
- Focus on upload/OCR features instead
- Demo the Library view organization
- Show the Document metadata management
- Schedule follow-up with full data loaded

---

### If Meilisearch Is Down

**Scenario:** Search service is unavailable

**Immediate Actions:**
1. Restart Meilisearch: `sudo systemctl restart meilisearch`
2. Wait 30 seconds for index to load
3. While waiting, demo non-search features:
   - Document viewing
   - Upload flow
   - Library organization
   - Metadata editing

**Alternative Demo:**
- Show the Architecture diagram (how search works)
- Explain Meilisearch benefits vs. competitors
- Demo video of working search
- Schedule technical deep-dive with engineering team

---

### If Browser/PDF Rendering Fails

**Scenario:** PDF doesn't load or displays incorrectly

**Immediate Actions:**
1. Try a different browser (Chrome → Firefox → Safari)
2. Clear cache and reload (Cmd/Ctrl+Shift+R)
3. Check PDF file isn't corrupted
4. Fall back to: Show PDF thumbnail + text extraction results

**Alternative Demo:**
- Focus on search results page (doesn't require PDF rendering)
- Show Library grid view
- Demo upload + OCR features
- Use mobile view (sometimes renders better)

---

### If Network Issues Occur

**Scenario:** Connection drops or API unreachable

**Immediate Actions:**
1. Switch to localhost instead of IP address
2. Check WiFi connection
3. Restart backend: `cd /home/setup/navidocs/server && npm start`
4. Use offline mode demonstration

**Alternative Demo:**
- Emphasize that offline mode is a FEATURE
- "This is exactly why we built local-first architecture"
- Show that UI still works even if backend is down
- Demo cached data access

---

### Nuclear Option: Pre-Recorded Demo

**When:** Everything is broken beyond quick repair

**Assets to Have Ready:**
1. **Screen recording (MP4):** 3-minute search demo with narration
2. **PDF slides:** Screenshots with annotations
3. **Architecture diagram:** Visual explanation of how it works
4. **GitHub README:** Show the open-source code

**Script:**
> "I apologize for the technical issues - let me show you a recording of the system working normally. This is from yesterday's testing session..."

**Then:**
- Walk through the video frame-by-frame
- Pause to answer questions
- Offer on-site demo at their location
- Provide trial access to cloud-hosted version

---

## Post-Demo Next Steps

### Immediate Follow-Up (Same Meeting)

**If Positive Response:**
1. **Collect Requirements:**
   - "How many vessels do you manage?"
   - "How many manuals per vessel (estimate)?"
   - "What's your current manual management process?"
   - "Who needs access (crew size)?"

2. **Schedule Technical Discovery Call:**
   - "I'd like to bring our CTO to discuss integration with your existing systems"
   - "We'll do a 30-minute technical deep-dive next week"
   - Calendar invite sent before leaving

3. **Offer Pilot Program:**
   - "We can set up a 30-day trial with one of your vessels"
   - "Upload YOUR manuals, test with YOUR crew"
   - "No credit card required, no commitment"

4. **Send Proposal:**
   - "I'll email you a pricing breakdown today"
   - "Includes ROI calculator based on your crew size"
   - "Three deployment options to choose from"

---

### If Neutral/Hesitant Response

**Objection Handling:**

**"We need to check with our team"**
- Response: "Absolutely. Can I send you a summary document to share internally? Who else should I loop in?"
- Action: Send one-pager PDF with key screenshots

**"We're happy with our current process"**
- Response: "I understand. Out of curiosity, how long does it typically take to find a specific procedure in your current system?"
- Action: Highlight time savings with specific examples

**"This seems complicated to set up"**
- Response: "Fair concern. We have a white-glove setup service - we'll upload your first 10 manuals for free. Takes us 2 hours, zero effort on your part."
- Action: Offer free setup session

**"What if it doesn't work for us?"**
- Response: "That's why we offer a 30-day money-back guarantee. If you're not seeing value, full refund, no questions asked."
- Action: Send terms in writing

---

### If Negative Response

**Learn and Improve:**
1. "What features would make this a must-have for you?"
2. "What's your biggest concern about adopting this?"
3. "Are there other tools you're evaluating?"
4. "Can I follow up in 6 months to see if your needs have changed?"

**Thank Them:**
- "I appreciate your time and feedback"
- "This helps us improve the product"
- "Here's my card if you change your mind"

**Stay Connected:**
- Add to mailing list (with permission)
- Send quarterly product update emails
- Invite to webinar or case study presentation

---

### 24-Hour Follow-Up Email Template

**Subject:** NaviDocs Demo Follow-Up - Next Steps

**Body:**
```
Hi [Name],

Thanks again for taking the time to see NaviDocs' search features today. As promised, here's a summary:

📊 WHAT WE COVERED:
- Apple Preview-style search (<50ms response)
- Visual highlighting with keyboard navigation
- Multi-document global search
- Offline-capable architecture

🎯 NEXT STEPS:
1. [ACTION ITEM 1 - e.g., "Technical discovery call scheduled for Tuesday 10am"]
2. [ACTION ITEM 2 - e.g., "Pricing proposal attached"]
3. [ACTION ITEM 3 - e.g., "30-day pilot program setup"]

📎 ATTACHMENTS:
- NaviDocs_OnePageSummary.pdf
- Pricing_Breakdown.xlsx
- Case_Study_RivieraYachts.pdf
- Setup_Guide.pdf

❓ QUESTIONS:
Feel free to reply with any questions or call me directly at [PHONE].

Looking forward to working together!

Best regards,
[Your Name]
[Title]
[Company]
[Phone]
[Email]
```

---

### Success Metrics to Track

**After Demo:**
- [ ] Positive response? (Yes/No/Neutral)
- [ ] Follow-up scheduled? (Date/Time)
- [ ] Pilot program interest? (Yes/No)
- [ ] Key objections noted?
- [ ] Decision-maker identified?

**After Pilot (30 days):**
- [ ] Crew adoption rate (% of users logging in)
- [ ] Search queries per day
- [ ] Documents uploaded
- [ ] Time savings reported
- [ ] Conversion to paid plan?

**Quarterly:**
- [ ] Demos given: _____
- [ ] Pilots launched: _____
- [ ] Conversions: _____
- [ ] Conversion rate: _____%
- [ ] Average deal size: $_____

---

## Demo Optimization Tips

### Before You Demo (Checklist)

**Technical:**
- [ ] Run `npm run build` on frontend (production mode)
- [ ] Clear browser cache completely
- [ ] Restart all services (backend, frontend, Meilisearch)
- [ ] Test search with 3 different queries
- [ ] Verify no console errors
- [ ] Check system resource usage (CPU/RAM)
- [ ] Have backup laptop ready

**Presentation:**
- [ ] Rehearse demo script 3 times (time yourself)
- [ ] Prepare answers to top 10 questions
- [ ] Have business cards ready
- [ ] Print leave-behind one-pagers
- [ ] Charge laptop fully (+ bring charger)
- [ ] Test projector/screen sharing beforehand
- [ ] Mute notifications (Slack, email, etc.)

**Logistics:**
- [ ] Arrive 15 minutes early
- [ ] Bring HDMI/USB-C adapters
- [ ] Have mobile hotspot as WiFi backup
- [ ] Water bottle (talking is thirsty work)
- [ ] Notepad + pen for notes

---

### During Demo (Best Practices)

**Do:**
- ✅ Speak slowly and clearly
- ✅ Pause for questions every 2 minutes
- ✅ Make eye contact (not just staring at screen)
- ✅ Use real-world scenarios
- ✅ Show features in context
- ✅ Highlight benefits, not just features
- ✅ Take notes on their specific needs
- ✅ Adapt to their interest level

**Don't:**
- ❌ Rush through features
- ❌ Use too much technical jargon
- ❌ Apologize for minor UI glitches
- ❌ Criticize competitors directly
- ❌ Promise features that don't exist yet
- ❌ Go over allotted time
- ❌ Forget to ask for the sale

---

### After Demo (Debrief)

**Within 10 Minutes:**
1. Send thank-you email (template above)
2. Add to CRM with demo notes
3. Schedule any follow-up calls
4. Send requested materials

**Within 24 Hours:**
1. Review demo recording (if recorded)
2. Note what went well / what to improve
3. Update demo script based on feedback
4. Share learnings with team

**Within 1 Week:**
1. Check if they opened follow-up email
2. Send gentle reminder if no response
3. Connect on LinkedIn
4. Add to nurture campaign

---

## Technical Architecture (For Technical Questions)

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser (Vue 3)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ DocumentView │  │ SearchView   │  │ LibraryView  │     │
│  │ (PDF viewer) │  │ (Results)    │  │ (Multi-doc)  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                      │
│                   │   API Client    │                      │
│                   │  (axios/fetch)  │                      │
│                   └────────┬────────┘                      │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ HTTPS/REST
                             │
┌────────────────────────────▼────────────────────────────────┐
│                   Express Backend (Node.js)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Upload API   │  │ Search API   │  │ Document API │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                      │
│                   │  OCR Worker     │                      │
│                   │ (Tesseract.js)  │                      │
│                   └────────┬────────┘                      │
└────────────────────────────┼────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼─────┐    ┌────────▼────────┐    ┌────▼─────┐
    │  SQLite  │    │  Meilisearch    │    │   File   │
    │ (Metadata│    │ (Full-text idx) │    │  System  │
    └──────────┘    └─────────────────┘    └──────────┘
```

### Search Flow (Technical)

**Step 1: Document Upload**
```javascript
1. User uploads PDF → POST /api/upload
2. Backend saves file → /uploads/documents/
3. Backend creates DB record → SQLite (status: 'processing')
4. OCR worker extracts text → Tesseract.js
5. Text sent to Meilisearch → POST /indexes/navidocs-pages/documents
6. Status updated → SQLite (status: 'ready')
```

**Step 2: In-Document Search**
```javascript
1. User types query → DocumentView.vue
2. Debounced input (300ms) → performSearch()
3. API call → GET /api/search?q=bilge%20pump&documentId=abc123
4. Backend queries Meilisearch → search('bilge pump')
5. Results returned (JSON) → [{pageNum: 5, text: "...", highlight: "..."}]
6. Frontend renders highlights → PDF.js + SVG overlay
```

**Step 3: Global Search**
```javascript
1. User searches from Library → SearchView.vue
2. API call → GET /api/search?q=bilge%20pump (no documentId)
3. Meilisearch searches ALL documents
4. Results grouped by document
5. User clicks result → Router navigates to DocumentView
6. DocumentView auto-scrolls to matching page
```

### Performance Optimizations

**Search Speed (<50ms):**
- Meilisearch pre-indexing (happens during OCR)
- Debounced input (prevents excessive queries)
- Result caching (browser-side)
- Lazy loading (only load visible results)

**PDF Rendering:**
- PDF.js Web Worker (off-main-thread)
- Canvas-based rendering (GPU-accelerated)
- Viewport-only rendering (don't render hidden pages)
- Image caching (disk + memory)

**Highlighting:**
- SVG overlay (no DOM manipulation)
- RequestAnimationFrame (smooth scrolling)
- Intersection Observer (visible highlights only)

---

## Glossary (For Non-Technical Audience)

**OCR (Optical Character Recognition):**
> Technology that converts images of text into actual searchable text. Like having a robot read your scanned documents and type them into a computer.

**Meilisearch:**
> The search engine powering NaviDocs. Think of it as "Google for your documents" - but it runs on your device, not in the cloud.

**Full-Text Search:**
> Searching the actual words inside your documents, not just the filenames. Like using Cmd+F but across hundreds of files at once.

**Highlighting:**
> The yellow background that appears behind your search matches, making them easy to spot.

**Indexing:**
> The process of organizing your documents so they can be searched quickly. Like building a library card catalog.

**Viewport:**
> The visible portion of the PDF on your screen. We optimize by only loading what you can see.

**API (Application Programming Interface):**
> How the frontend (what you see) talks to the backend (where data is stored). Like a waiter taking your order to the kitchen.

**Local-First:**
> Your data stays on your device - not uploaded to someone else's servers. Works offline, faster, more private.

---

## Resources

### Internal Documentation
- `/home/setup/navidocs/DEMO-GUIDE.md` - General demo guide
- `/home/setup/navidocs/LIVE_TESTING_GUIDE.md` - Live deployment testing
- `/home/setup/navidocs/client/src/views/DocumentView.vue` - Search UI component

### External References
- Apple Preview: https://support.apple.com/guide/preview/search-for-text-prvw11580/mac
- Meilisearch Docs: https://docs.meilisearch.com/
- PDF.js Documentation: https://mozilla.github.io/pdf.js/

### Support Contacts
- Technical Issues: [CTO Email]
- Sales Questions: [Sales Email]
- Demo Scheduling: [Calendar Link]

---

## Version History

**v1.0 (2025-11-13):**
- Initial demo script created
- Covers Apple Preview-style search features
- 5-10 minute demo flow
- Common Q&A included
- Backup plans documented

**Upcoming Improvements:**
- Add video walkthrough
- Create slide deck version
- Build demo dataset with sample manuals
- Record FAQ video responses

---

**Good luck with your demo! 🚢**

*Questions? Feedback? Contact: [Your Name] | [Email] | [Phone]*
