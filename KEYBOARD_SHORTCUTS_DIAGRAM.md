# Keyboard Shortcuts Flow Diagram

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Document View Loaded                         │
│              Global keydown listener registered                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    User Presses Key                             │
│              handleKeyboardShortcuts(event)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌─────────────────┐           ┌─────────────────┐
    │ Cmd/Ctrl + F?   │           │  Other Key?     │
    └─────────────────┘           └─────────────────┘
              │                               │
              │ Yes                           │
              ▼                               ▼
    ┌─────────────────┐           ┌─────────────────┐
    │ Focus & Select  │           │   Escape?       │
    │ Search Input    │           └─────────────────┘
    │ Prevent Default │                     │
    └─────────────────┘                     │ Yes
                                            ▼
                              ┌─────────────────────────┐
                              │ Clear Search            │
                              │ Blur Input              │
                              │ Close Jump List         │
                              │ Prevent Default         │
                              └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  Navigation Shortcuts                           │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
    ┌─────────────────────────────┐
    │ Enter (not in input)?       │
    │     OR                      │
    │ Cmd/Ctrl + G?               │
    └─────────────────────────────┘
              │ Yes
              ▼
    ┌─────────────────────────────┐
    │ totalHits > 0?              │
    └─────────────────────────────┘
              │ Yes
              ▼
    ┌─────────────────────────────┐
    │ nextHit()                   │
    │ • Increment index           │
    │ • Scroll to result          │
    │ • Highlight active          │
    │ Prevent Default             │
    └─────────────────────────────┘

              │
              ▼
    ┌─────────────────────────────┐
    │ Shift + Enter?              │
    │     OR                      │
    │ Cmd/Ctrl + Shift + G?       │
    └─────────────────────────────┘
              │ Yes
              ▼
    ┌─────────────────────────────┐
    │ totalHits > 0?              │
    └─────────────────────────────┘
              │ Yes
              ▼
    ┌─────────────────────────────┐
    │ prevHit()                   │
    │ • Decrement index           │
    │ • Scroll to result          │
    │ • Highlight active          │
    │ Prevent Default             │
    └─────────────────────────────┘

              │
              ▼
    ┌─────────────────────────────┐
    │ Cmd/Ctrl + Alt + F?         │
    └─────────────────────────────┘
              │ Yes
              ▼
    ┌─────────────────────────────┐
    │ hitList.length > 0?         │
    └─────────────────────────────┘
              │ Yes
              ▼
    ┌─────────────────────────────┐
    │ Toggle Jump List            │
    │ jumpListOpen = !jumpListOpen│
    │ Prevent Default             │
    └─────────────────────────────┘
```

## State Machine

```
┌──────────────────────────────────────────────────────────┐
│                     Initial State                        │
│  • searchQuery: ''                                       │
│  • searchInput: ''                                       │
│  • totalHits: 0                                          │
│  • jumpListOpen: false                                   │
└──────────────────────────────────────────────────────────┘
                        │
                        │ Cmd/Ctrl+F pressed
                        ▼
┌──────────────────────────────────────────────────────────┐
│                   Search Input Focused                    │
│  • Input has focus                                       │
│  • Text selected (if any)                                │
│  • User can type query                                   │
└──────────────────────────────────────────────────────────┘
                        │
                        │ Enter pressed (in input)
                        ▼
┌──────────────────────────────────────────────────────────┐
│                   Search Executed                         │
│  • performSearch() called                                │
│  • searchQuery set                                       │
│  • highlightSearchTerms() runs                           │
│  • totalHits updated                                     │
│  • hitList populated                                     │
└──────────────────────────────────────────────────────────┘
                        │
                        │ Results found
                        ▼
┌──────────────────────────────────────────────────────────┐
│              Active Search with Results                   │
│  • currentHitIndex: 0                                    │
│  • First result highlighted                              │
│  • Navigation shortcuts enabled                          │
│  • Jump list available                                   │
└──────────────────────────────────────────────────────────┘
        │                           │                  │
        │ Enter/Cmd+G               │ Shift+Enter/     │ Cmd+Alt+F
        ▼                           │ Cmd+Shift+G      ▼
┌────────────────┐                  ▼            ┌────────────────┐
│  Next Result   │         ┌────────────────┐   │ Jump List Open │
│  index++       │         │ Previous Result│   │ (Sidebar)      │
│  Scroll & HL   │         │ index--        │   │ Show all hits  │
└────────────────┘         │ Scroll & HL    │   └────────────────┘
                           └────────────────┘
        │                           │                  │
        │                           │                  │ Escape
        └───────────────┬───────────┘                  │
                        │                              │
                        │ Escape pressed               │
                        ▼                              ▼
┌──────────────────────────────────────────────────────────┐
│                   Search Cleared                          │
│  • searchQuery: ''                                       │
│  • searchInput: ''                                       │
│  • totalHits: 0                                          │
│  • jumpListOpen: false                                   │
│  • All highlights removed                                │
│  • Input blurred                                         │
└──────────────────────────────────────────────────────────┘
```

## Component Interaction Map

```
┌────────────────────────────────────────────────────────────────┐
│                         DocumentView.vue                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                          │
│  │  Template Layer  │                                          │
│  └──────────────────┘                                          │
│           │                                                     │
│           ├─► Search Input (ref="searchInputRef")              │
│           │   • v-model="searchInput"                          │
│           │   • @keydown.enter="performSearch"                 │
│           │   • placeholder with hint                          │
│           │                                                     │
│           ├─► Find Bar Navigation                              │
│           │   • Previous/Next buttons                          │
│           │   • Match counter                                  │
│           │   • Jump list toggle                               │
│           │                                                     │
│           └─► Text Layer                                       │
│               • <mark> highlights                              │
│               • .search-highlight class                        │
│               • .search-highlight-active                       │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │   Script Layer   │                                          │
│  └──────────────────┘                                          │
│           │                                                     │
│           ├─► Reactive State                                   │
│           │   • searchInputRef (ref to DOM)                    │
│           │   • searchQuery (current query)                    │
│           │   • searchInput (input value)                      │
│           │   • totalHits (result count)                       │
│           │   • currentHitIndex (active result)                │
│           │   • hitList (all results)                          │
│           │   • jumpListOpen (sidebar state)                   │
│           │                                                     │
│           ├─► Event Handlers                                   │
│           │   • handleKeyboardShortcuts()                      │
│           │   • performSearch()                                │
│           │   • clearSearch()                                  │
│           │   • nextHit()                                      │
│           │   • prevHit()                                      │
│           │   • jumpToHit()                                    │
│           │   • highlightSearchTerms()                         │
│           │   • scrollToHit()                                  │
│           │                                                     │
│           └─► Lifecycle Hooks                                  │
│               • onMounted()                                    │
│                 └─► addEventListener('keydown')                │
│               • onBeforeUnmount()                              │
│                 └─► removeEventListener('keydown')            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                      Browser Event System                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Window Keydown Event                                          │
│       │                                                         │
│       ▼                                                         │
│  handleKeyboardShortcuts(event)                                │
│       │                                                         │
│       ├─► Detect platform (Mac vs Win/Linux)                   │
│       ├─► Check if input is focused                            │
│       ├─► Match key combination                                │
│       ├─► Prevent default if handled                           │
│       └─► Call appropriate handler function                    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Keyboard Shortcut Decision Tree

```
User Presses Key
    │
    ├─ Is Cmd/Ctrl+F?
    │   └─ YES → Focus search input, select text, prevent default ✓
    │
    ├─ Is Escape?
    │   ├─ Has searchQuery OR input focused?
    │   │   └─ YES → Clear search, blur input, close jump list, prevent default ✓
    │   └─ NO → Do nothing, allow default
    │
    ├─ Is Enter (not in input)?
    │   ├─ totalHits > 0?
    │   │   └─ YES → Navigate to next result, prevent default ✓
    │   └─ NO → Do nothing
    │
    ├─ Is Cmd/Ctrl+G (no shift)?
    │   ├─ totalHits > 0?
    │   │   └─ YES → Navigate to next result, prevent default ✓
    │   └─ NO → Do nothing
    │
    ├─ Is Shift+Enter (not in input)?
    │   ├─ totalHits > 0?
    │   │   └─ YES → Navigate to previous result, prevent default ✓
    │   └─ NO → Do nothing
    │
    ├─ Is Cmd/Ctrl+Shift+G?
    │   ├─ totalHits > 0?
    │   │   └─ YES → Navigate to previous result, prevent default ✓
    │   └─ NO → Do nothing
    │
    └─ Is Cmd/Ctrl+Alt+F?
        ├─ hitList.length > 0?
        │   └─ YES → Toggle jump list, prevent default ✓
        └─ NO → Do nothing
```

## Platform Detection Logic

```javascript
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

┌──────────────┐
│ User System  │
└──────────────┘
       │
       ├─ macOS → isMac = true
       │           Use event.metaKey (⌘ Command)
       │
       └─ Windows/Linux → isMac = false
                          Use event.ctrlKey (Ctrl)

Example:
- Mac user presses ⌘+F
  → event.metaKey = true
  → cmdOrCtrl = true
  → Shortcut activates ✓

- Windows user presses Ctrl+F
  → event.ctrlKey = true
  → cmdOrCtrl = true
  → Shortcut activates ✓
```

## Visual Feedback Flow

```
User Action               →  Visual Feedback
──────────────────────       ────────────────────────────
Cmd/Ctrl+F                →  Search input gains focus
                             Existing text selected
                             Blue focus ring appears

Type search query         →  Input shows typed text
Enter                     →  Yellow highlights appear
                             First result gets pink highlight
                             Counter shows "1/N"

Cmd+G or Enter            →  Pink highlight moves to next
                             Counter updates "2/N"
                             Page scrolls smoothly

Cmd+Shift+G               →  Pink highlight moves to previous
                             Counter updates "1/N"
                             Page scrolls smoothly

Cmd+Alt+F                 →  Jump list sidebar toggles
                             Arrow icon rotates
                             Results list animates in/out

Escape                    →  All highlights removed
                             Input cleared
                             Focus removed
                             Jump list closes
```
