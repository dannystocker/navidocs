NaviDocs UI Changelog

Date: 2025-10-19

Scope: UI polish only (no backend changes)

Summary
- Added Meilisearch-inspired polish via Tailwind utility layers and small markup tweaks.
- Kept changes strictly in the client UI; no server or configuration behavior changed.

Changes
- client/src/assets/main.css
  - Added base accessibility and utility styles:
    - Visible focus ring (:focus-visible) aligned to primary color
    - kbd styling for keyboard hints
  - Added component utilities:
    - badge, badge-primary, badge-success
    - glass (light translucent panel with blur)
    - section, section-title (consistent vertical rhythm)
    - accent-border (soft gradient glow border)
    - bg-grid (subtle grid background)
    - skeleton + shimmer keyframes (loading placeholders)
- client/index.html
  - Theme color set to primary brand color (#c026d3)
  - Basic Open Graph meta tags for better link previews

Rationale
- Aligns typography, spacing, gradients, and micro-interactions with a Meilisearch-style aesthetic without copying proprietary assets.
- Improves perceived performance (skeletons) and accessibility (focus ring).

Non-Goals
- No backend API, auth, or data changes.
- No vendor CSS or fonts added beyond Google Fonts already in use.

Testing
- Dev: cd client && npm run dev, then browse http://localhost:8080
- Check focus states via keyboard (Tab/Shift+Tab).
- Verify badges, gradient borders, and grid background on components that use the new classes.

Security/Privacy
- No secrets added. The file docs/handover/PATHS_AND_CREDENTIALS.md remains untracked and must not be committed.

Follow-ups (optional)
- Extract shared headers into a reusable Nav component across views for tighter consistency.
- Consider Tailwind Typography for rich text rendering of document content.

