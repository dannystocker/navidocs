# NaviDocs Visual Design System
## Comprehensive Design Guidelines for Pitch Materials

**Document Version:** 1.0
**Created:** November 13, 2025
**Agent:** S3-H09 (Session 3, Haiku Agent 09)
**Purpose:** Visual consistency across all NaviDocs pitch materials and presentations

---

## 1. COLOR PALETTE

### Primary Colors (Nautical Maritime Theme)

| Color Name | Hex Code | RGB | Usage | Notes |
|-----------|----------|-----|-------|-------|
| **Ocean Deep** | #003D5C | 0, 61, 92 | Primary backgrounds, main text | Dark professional blue, inspired by deep ocean waters |
| **Wave Blue** | #0066CC | 0, 102, 204 | Secondary elements, headings | Bright maritime blue for visual hierarchy |
| **Sail White** | #FFFFFF | 255, 255, 255 | Backgrounds, cards, text | Clean, professional white for contrast |
| **Foam Light** | #F0F4F8 | 240, 244, 248 | Subtle backgrounds, hover states | Very light blue-gray for soft contrast |

### Secondary Colors (Accents & CTAs)

| Color Name | Hex Code | RGB | Usage | Notes |
|-----------|----------|-----|-------|-------|
| **Anchor Gold** | #D4AF37 | 212, 175, 55 | CTAs, highlights, premium features | Warm metallic accent for luxury/trust |
| **Coral Alert** | #FF6B5B | 255, 107, 91 | Warnings, important alerts | Warm coral for visibility without harsh red |
| **Turquoise Success** | #2DBB9E | 45, 187, 158 | Success states, confirmations | Fresh, positive ocean accent |
| **Compass Rose** | #E6722D | 230, 114, 45 | Secondary CTAs, emphasis | Warm orange for navigation/action |

### Neutral Colors (Typography & Backgrounds)

| Color Name | Hex Code | RGB | Usage | Notes |
|-----------|----------|-----|-------|-------|
| **Charcoal** | #2C3E50 | 44, 62, 80 | Primary text, dark elements | High contrast for readability |
| **Slate Gray** | #708090 | 112, 128, 144 | Secondary text, metadata | Medium gray for de-emphasized content |
| **Light Gray** | #E8EDF2 | 232, 237, 242 | Dividers, borders | Subtle separation between elements |
| **Off-White** | #FAFBFC | 250, 251, 252 | Backgrounds, subtle contrast | Nearly white for minimal contrast backgrounds |

### Semantic Colors (Status Indicators)

| Status | Hex Code | Usage | Meaning |
|--------|----------|-------|---------|
| **Success** | #27AE60 | ✓ Check marks, confirmations | Operation successful |
| **Warning** | #F39C12 | ⚠ Caution symbols, reviews | User attention needed |
| **Error** | #E74C3C | ✕ Errors, critical issues | Problem requires action |
| **Info** | #3498DB | ℹ Information, hints | Neutral information |

### Color Combinations (Approved Pairings)

```
Text + Background Combinations (WCAG AAA Compliant):
- Ocean Deep (#003D5C) on Sail White (#FFFFFF) - 9.2:1 contrast
- Charcoal (#2C3E50) on Foam Light (#F0F4F8) - 8.5:1 contrast
- Sail White (#FFFFFF) on Ocean Deep (#003D5C) - 9.2:1 contrast
- Wave Blue (#0066CC) on Off-White (#FAFBFC) - 5.1:1 contrast
```

---

## 2. TYPOGRAPHY

### Font Families

**Primary Font Stack (Headings & Emphasis):**
```
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
Weight: 600 (SemiBold), 700 (Bold)
License: Open Source (Google Fonts)
```

**Secondary Font Stack (Body & UI):**
```
font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
Weight: 400 (Regular), 500 (Medium), 600 (SemiBold)
License: Open Source (Google Fonts)
```

**Monospace Font (Code, Data):**
```
font-family: 'JetBrains Mono', 'Courier New', monospace;
Weight: 400 (Regular), 600 (SemiBold)
License: Open Source
```

### Typography Hierarchy

#### H1 - Page Title
```
Font: Inter, Bold (700)
Size: 48px (desktop) / 36px (mobile)
Line Height: 1.2 (57.6px desktop)
Letter Spacing: -0.5px
Color: Ocean Deep (#003D5C)
Margin: 0 0 32px 0
Example: "Transform Your Yacht Operations with AI-Powered Predictive Maintenance"
```

#### H2 - Section Heading
```
Font: Inter, SemiBold (600)
Size: 36px (desktop) / 28px (mobile)
Line Height: 1.3 (46.8px desktop)
Letter Spacing: -0.3px
Color: Ocean Deep (#003D5C)
Margin: 32px 0 16px 0
Example: "Key Features That Drive Value"
```

#### H3 - Subsection Heading
```
Font: Inter, SemiBold (600)
Size: 24px (desktop) / 20px (mobile)
Line Height: 1.4 (33.6px desktop)
Letter Spacing: 0px
Color: Wave Blue (#0066CC)
Margin: 24px 0 12px 0
Example: "Real-Time Monitoring & Alerts"
```

#### H4 - Minor Heading / Card Title
```
Font: Inter, SemiBold (600)
Size: 18px
Line Height: 1.4 (25.2px)
Letter Spacing: 0px
Color: Ocean Deep (#003D5C)
Margin: 16px 0 8px 0
```

#### Body Text (Large)
```
Font: Open Sans, Regular (400)
Size: 18px
Line Height: 1.6 (28.8px)
Letter Spacing: 0.2px
Color: Charcoal (#2C3E50)
Used for: Lead paragraphs, important content
```

#### Body Text (Standard)
```
Font: Open Sans, Regular (400)
Size: 16px
Line Height: 1.6 (25.6px)
Letter Spacing: 0px
Color: Charcoal (#2C3E50)
Used for: Main body copy, descriptions
```

#### Body Text (Small)
```
Font: Open Sans, Regular (400)
Size: 14px
Line Height: 1.5 (21px)
Letter Spacing: 0px
Color: Slate Gray (#708090)
Used for: Secondary information, captions, metadata
```

#### Label / UI Text
```
Font: Open Sans, Medium (500)
Size: 12px
Line Height: 1.5 (18px)
Letter Spacing: 0.5px
Color: Ocean Deep (#003D5C)
Used for: Labels, badges, small UI elements
Text Transform: Uppercase in some contexts
```

### Spacing & Vertical Rhythm

```
Base Unit: 8px (0.5rem)

Vertical Spacing Scale:
- XS: 4px (0.25rem) - minimal spacing
- S: 8px (0.5rem) - tight spacing
- M: 16px (1rem) - standard spacing
- L: 24px (1.5rem) - generous spacing
- XL: 32px (2rem) - section spacing
- XXL: 48px (3rem) - major section breaks

Paragraph Spacing:
- Between paragraphs: 16px
- Between sections: 32px
- Line height consistency: Maintain 1.5-1.6 for readability
```

---

## 3. ICON SET

### Icon Style Guidelines

**Overall Style:**
- **Design Language:** Minimalist, stroke-based icons
- **Stroke Weight:** 2px (primary), 1.5px (secondary)
- **Viewbox:** 24x24px (standard), 32x32px (large)
- **Corner Radius:** 2px for modern feel
- **Color:** Primary = Wave Blue (#0066CC), Accent = Anchor Gold (#D4AF37)
- **Inspiration:** Maritime symbols, clean geometric forms

### Core Icon Set

#### 1. Warranties Icon
```
ASCII Representation:
┌─────────────────┐
│  ╭───╮          │
│  │ ✓ │ ⚓      │
│  ╰───╯          │
│  PROTECTED      │
└─────────────────┘

Description: Shield with anchor and checkmark
Usage: Warranty features, guarantees, compliance
Primary Color: Turquoise Success (#2DBB9E)
Variants: Solid, outline, with banner
```

#### 2. Documents Icon
```
ASCII Representation:
┌─────────────────┐
│  ┌──────────┐   │
│  │ ─ ─ ─    │   │
│  │ ─ ─ ─    │   │
│  │ ─ ─ ─    │   │
│  └──────────┘   │
└─────────────────┘

Description: Document/page with horizontal lines
Usage: Documentation, reports, maintenance logs, service records
Primary Color: Wave Blue (#0066CC)
Variants: Single page, stacked pages, with checkmark
```

#### 3. Alerts/Notifications Icon
```
ASCII Representation:
┌─────────────────┐
│      △          │
│     ╱ ╲         │
│    ╱   ╲        │
│   ╱ !!! ╲       │
│  ╱       ╲      │
│ ╱_________╲     │
└─────────────────┘

Description: Exclamation mark in triangle
Usage: Alerts, warnings, critical notifications
Primary Color: Coral Alert (#FF6B5B) or Warning Orange (#F39C12)
Variants: With exclamation, with question mark, pulsing animation
```

#### 4. Camera/Monitoring Icon
```
ASCII Representation:
┌─────────────────┐
│  ╭─────────╮    │
│  │ ◯ ····· │    │
│  │ ········ │    │
│  ╰────▼────╯    │
│      ▼▼         │
└─────────────────┘

Description: Camera/video surveillance with sensor
Usage: Real-time monitoring, vessel tracking, live feeds
Primary Color: Wave Blue (#0066CC)
Variants: Camera, video frame, satellite, eye symbol
```

#### 5. Maintenance/Tools Icon
```
ASCII Representation:
┌─────────────────┐
│   ╲    ╱        │
│    ╲  ╱         │
│  ┏━━╱╲━━┓       │
│  ┃   ╳   ┃      │
│  ┗━━╲╱━━┛       │
│    ╱  ╲         │
│   ╱    ╲        │
└─────────────────┘

Description: Wrench and hammer crossed (tools)
Usage: Maintenance schedules, preventive care, service intervals
Primary Color: Compass Rose (#E6722D)
Variants: Single wrench, wrench+hammer, with checkmark
```

#### 6. Expense/Money Icon
```
ASCII Representation:
┌─────────────────┐
│  ╔═══════╗      │
│  ║   $   ║      │
│  ║  ◯◯◯  ║      │
│  ║  ◯◯◯  ║      │
│  ╚═══════╝      │
└─────────────────┘

Description: Coin or currency symbol in box
Usage: Pricing, costs, expense savings, ROI calculations
Primary Color: Anchor Gold (#D4AF37)
Variants: Single coin, stacked coins, with arrow up/down
```

#### 7. Search Icon
```
ASCII Representation:
┌─────────────────┐
│   ╭─────╮       │
│   │     │       │
│   │  ⊚  │       │
│   │     │       │
│   ╰──┬──╯       │
│      ╲          │
│       ╲         │
│        ╲        │
└─────────────────┘

Description: Magnifying glass with handle
Usage: Search functionality, discovery, exploration
Primary Color: Wave Blue (#0066CC)
Variants: Standard, with dot, with binoculars
```

#### 8. Home Assistant Integration Icon
```
ASCII Representation:
┌─────────────────┐
│   ╭─────╮       │
│   │ ⌂⚡  │       │
│   │ ⚙⚙  │       │
│   ╰─────╯       │
│      ↔↔         │
│   ╭─────╮       │
│   │ ◯◯◯  │      │
│   ╰─────╯       │
└─────────────────┘

Description: Two integrated systems with data flow
Usage: Smart home integration, third-party connections, API
Primary Color: Wave Blue (#0066CC)
Variants: With arrows (bidirectional), with nodes (network)
```

#### 9. Additional System Icons

**Anchor Icon (NaviDocs Brand)**
```
Description: Classic anchor symbol
Usage: Logo, brand mark, primary navigation
Primary Color: Anchor Gold (#D4AF37)
Size: 32x32px, scalable to 48x48px
```

**Navigation Arrow**
```
Description: Chevron or arrow pointing right
Usage: CTAs, next step indicators, navigation
Primary Color: Wave Blue (#0066CC)
Variants: Right, left, up, down, diagonal
```

**Plus/Add Icon**
```
Description: Simple plus symbol
Usage: Add new item, expand, additional features
Primary Color: Wave Blue (#0066CC)
Stroke: 2px
```

---

## 4. SLIDE LAYOUT TEMPLATES

### Slide Layout Structure

**Page Dimensions:** 16:9 aspect ratio (1920x1080px)
**Margins:** 60px all sides (internal content area: 1800x960px)
**Grid:** 12-column layout, 8px baseline

### Template 1: Title Slide Layout

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│         ╭────────────────────────────────╮              │
│         │  NAVIDOCS                     │              │
│         │  ⚓                            │              │
│         ╰────────────────────────────────╯              │
│                                                          │
│         Main Title                                      │
│         Transform Your Yacht Operations                │
│                                                          │
│         Subtitle / Tagline                             │
│         AI-Powered Predictive Maintenance             │
│                                                          │
│                                                          │
│                                                          │
│         Company Name | Date | Presenter Name           │
│                                                          │
└──────────────────────────────────────────────────────────┘

Components:
- Anchor logo: Top-center, Anchor Gold (#D4AF37), 80x80px
- Title: H1 (48px, Ocean Deep), centered
- Subtitle: Body Large (18px, Slate Gray), centered
- Footer: 3-column (company | date | presenter), 12px text
- Background: Sail White (#FFFFFF) with subtle Foam Light accent (left edge, 200px wide)
```

### Template 2: Content Slide Layout

```
┌──────────────────────────────────────────────────────────┐
│  ⚓ Section Title                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Heading                                                │
│                                                          │
│  • Bullet point with icon                              │
│    Detailed explanation text                           │
│                                                          │
│  • Bullet point with icon                              │
│    Detailed explanation text                           │
│                                                          │
│                                                          │
│                          [Optional Image/Graphic]       │
│                                                          │
│                                                          │
│                                                          │
│  Page # | Footer Text                                  │
└──────────────────────────────────────────────────────────┘

Components:
- Header bar: Ocean Deep (#003D5C), 80px height
- Section title: H2 in white, left-aligned with anchor icon
- Divider line: Light Gray, 2px, full width
- Content: 2-column layout (60% text, 40% visual)
- Bullets: 24px icons (Wave Blue), 16px text
- Footer: 12px text, Slate Gray, right-aligned page number
```

### Template 3: Comparison/Table Layout

```
┌──────────────────────────────────────────────────────────┐
│  ⚓ Competitive Comparison                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┬────────────┬────────────┬────────────┐  │
│  │ Feature    │ Legacy     │ Competitor │ NaviDocs   │  │
│  │            │ Systems    │ (Generic)  │            │  │
│  ├────────────┼────────────┼────────────┼────────────┤  │
│  │ Monitoring │ ⊘ Manual   │ ◐ Partial  │ ✓ Real-time│  │
│  │ Alerts     │ ⊘ Email    │ ◐ Limited  │ ✓ Multi-ch │  │
│  │ Predictive │ ⊘ None     │ ⊘ None     │ ✓ AI-driven│  │
│  │ Cost       │ ◐ High     │ ◐ Medium   │ ✓ 40% less │  │
│  │ Integration│ ⊘ Limited  │ ◐ Partial  │ ✓ Full     │  │
│  └────────────┴────────────┴────────────┴────────────┘  │
│                                                          │
│  Legend: ✓ Full | ◐ Partial | ⊘ None                   │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘

Components:
- Table header: Ocean Deep (#003D5C) background, white text
- Rows: Alternating Foam Light (#F0F4F8) and white
- Check marks: Turquoise Success (#2DBB9E), 20px
- Partial symbol: Compass Rose (#E6722D)
- Missing: Coral Alert (#FF6B5B)
- Borders: Light Gray, 1px
```

### Template 4: Timeline/Roadmap Layout

```
┌──────────────────────────────────────────────────────────┐
│  ⚓ Product Roadmap                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Q4 2024      Q1 2025       Q2 2025        Q3 2025     │
│    ○           ⊙            ○              ●            │
│    │───────────│────────────│──────────────│            │
│    │           │            │              │            │
│  MVP          Phase 2      Phase 3        Phase 4      │
│  Launch       Multi-User   Industry       Global       │
│  Core         Integration  Compliance     Expansion    │
│  Features                                               │
│                                                          │
│  • Real-time     • Role-based    • SOLAS 2024   • 50+   │
│    Monitoring      Access          Compliance     Flag   │
│  • ML Alerts     • API            • Extended      States │
│  • Mobile          Integration      Support      Support│
│  • Basic          • Third-party                          │
│    Reporting      Data Links                            │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘

Components:
- Timeline line: Light Gray (1px), horizontal
- Milestones: Large circles (Ocean Deep #003D5C, 16px), with stage indicator
- Current stage: Filled circle (Wave Blue #0066CC)
- Quarters: H3 (24px), Wave Blue
- Feature bullets: 16px text, Charcoal
- Connectors: Dashed lines between phases
```

### Template 5: Quote/Testimonial Layout

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                                                          │
│              ❝  Testimonial Text                        │
│              [2-3 sentences about benefits]             │
│              Powerful impact statement  ❞               │
│                                                          │
│                                                          │
│              — Client Name                              │
│              Title | Company                            │
│              [Optional: Location]                       │
│                                                          │
│                                                          │
│              [Optional: Client Logo or Avatar]          │
│                                                          │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘

Components:
- Quote marks: Anchor Gold (#D4AF37), 80px
- Quote text: H2 (36px), Ocean Deep, centered
- Attribution: Body Small (14px), Slate Gray
- Background: Subtle gradient (Foam Light to white)
- Border-left: Wave Blue accent, 4px width
- Avatar: Circular frame, 80x80px
```

### Template 6: CTA/Closing Slide Layout

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│         READY TO TRANSFORM YOUR OPERATIONS?             │
│                                                          │
│         [Compelling closing statement about ROI]        │
│                                                          │
│                                                          │
│              ┌──────────────────────────┐               │
│              │   SCHEDULE DEMO TODAY    │               │
│              │   Primary CTA Button     │               │
│              └──────────────────────────┘               │
│                                                          │
│         ┌──────────────┬───────────────┐                │
│         │ Learn More   │  Contact Us   │                │
│         │   Secondary  │   Secondary   │                │
│         └──────────────┴───────────────┘                │
│                                                          │
│                                                          │
│         www.navidocs.ai | hello@navidocs.ai             │
│         +1 (305) 555-0100                               │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘

Components:
- Main heading: H1 (48px), Ocean Deep, centered
- Subheading: Body Large (18px), Slate Gray
- Primary CTA: Large button (Anchor Gold background, white text)
- Secondary CTAs: Medium buttons (Wave Blue outline, Ocean Deep text)
- Contact info: Small text (14px), centered footer
- Background: Subtle anchors watermark (very light)
```

---

## 5. COMPONENT STYLING

### 5.1 Button Components

#### Primary Button (Main Call-to-Action)
```
Background Color: Anchor Gold (#D4AF37)
Text Color: Sail White (#FFFFFF) or Ocean Deep (#003D5C)
Border: None
Padding: 16px 32px (vertical | horizontal)
Border Radius: 6px
Font: Open Sans, SemiBold (600), 16px
Letter Spacing: 0.5px
Box Shadow: 0 4px 12px rgba(212, 175, 55, 0.3)
Hover State:
  - Background: Darken #D4AF37 by 10% (#C49B2E)
  - Transform: translateY(-2px)
  - Box Shadow: 0 6px 16px rgba(212, 175, 55, 0.4)
Active State:
  - Background: Darken #D4AF37 by 20% (#B68728)
  - Transform: translateY(0px)
Focus State:
  - Outline: 3px solid Wave Blue (#0066CC)
  - Outline Offset: 2px
Disabled State:
  - Background: Light Gray (#E8EDF2)
  - Text Color: Slate Gray (#708090)
  - Cursor: not-allowed
  - Opacity: 0.6
Min Width: 120px (ensure touch targets 44x44px minimum)
```

#### Secondary Button (Alternative Action)
```
Background Color: Transparent
Text Color: Wave Blue (#0066CC)
Border: 2px solid Wave Blue (#0066CC)
Padding: 14px 30px (account for border)
Border Radius: 6px
Font: Open Sans, SemiBold (600), 16px
Hover State:
  - Background: Foam Light (#F0F4F8)
  - Color: Ocean Deep (#003D5C)
  - Border Color: Ocean Deep (#003D5C)
Active State:
  - Background: Light Gray (#E8EDF2)
Focus State:
  - Outline: 3px solid Anchor Gold (#D4AF37)
  - Outline Offset: 2px
Disabled State:
  - Border Color: Light Gray (#E8EDF2)
  - Text Color: Slate Gray (#708090)
  - Opacity: 0.5
```

#### Outline Button (Tertiary Action)
```
Background Color: Transparent
Text Color: Ocean Deep (#003D5C)
Border: 1px solid Light Gray (#E8EDF2)
Padding: 15px 30px
Border Radius: 6px
Font: Open Sans, Regular (400), 16px
Hover State:
  - Background: Off-White (#FAFBFC)
  - Border Color: Wave Blue (#0066CC)
  - Color: Wave Blue (#0066CC)
Active State:
  - Background: Foam Light (#F0F4F8)
  - Border Color: Ocean Deep (#003D5C)
Focus State:
  - Outline: 2px solid Wave Blue (#0066CC)
  - Outline Offset: 2px
```

#### Button Icon Integration
```
Icon Size: 18px (16px for small buttons)
Icon Spacing: 8px from text
Icon Color: Inherits from text color
Position: Left or right (typically left)
Example: ⚓ Schedule Demo
```

### 5.2 Card/Panel Components

#### Feature Card
```
Background: Sail White (#FFFFFF)
Border: 1px solid Light Gray (#E8EDF2)
Border Radius: 8px
Padding: 24px
Box Shadow: 0 2px 8px rgba(0, 0, 0, 0.06)
Hover State:
  - Box Shadow: 0 8px 24px rgba(0, 0, 0, 0.12)
  - Transform: translateY(-4px)
  - Transition: all 300ms ease-in-out

Layout:
  ┌─────────────────────────┐
  │ [Icon 32px] Title       │
  │                         │
  │ Description text (14px) │
  │ 2-3 lines of content    │
  │                         │
  │ [Learn More →]          │
  └─────────────────────────┘

Icon: Wave Blue (#0066CC), 32x32px
Title: H4 (18px), Ocean Deep, SemiBold
Description: Body Small (14px), Slate Gray
Link: 12px, Wave Blue, with chevron icon
```

#### Data/Info Card
```
Background: Foam Light (#F0F4F8)
Border: None
Border Radius: 6px
Padding: 16px 20px
Border-left: 4px solid Wave Blue (#0066CC)

Layout:
  ⚓ Card Title (14px, Bold)
  Value (24px, Bold, Ocean Deep)
  Supporting text (12px, Slate Gray)

Example:
  ⚓ Downtime Reduced
  68%
  Compared to industry average
```

#### Alert/Callout Card
```
Background: Varies by type
Border-left: 4px solid (accent color)
Border Radius: 6px
Padding: 16px 20px
Display: flex (icon + content)

Types:

Success Alert:
  Background: #E8F8F5 (light turquoise)
  Border-left: Turquoise Success (#2DBB9E)
  Icon: ✓ (#2DBB9E)
  Title: Bold, Ocean Deep
  Message: Regular, Charcoal

Warning Alert:
  Background: #FDEBD0 (light orange)
  Border-left: Warning Orange (#F39C12)
  Icon: ⚠ (#F39C12)
  Title: Bold, Ocean Deep
  Message: Regular, Charcoal

Error Alert:
  Background: #FADBD8 (light red)
  Border-left: Error Red (#E74C3C)
  Icon: ✕ (#E74C3C)
  Title: Bold, Ocean Deep
  Message: Regular, Charcoal

Info Alert:
  Background: #D6EAF8 (light blue)
  Border-left: Info Blue (#3498DB)
  Icon: ℹ (#3498DB)
  Title: Bold, Ocean Deep
  Message: Regular, Charcoal
```

### 5.3 Table Components

```
Table Layout:
┌──────────────┬──────────────┬──────────────┐
│ Header       │ Header       │ Header       │
├──────────────┼──────────────┼──────────────┤
│ Data         │ Data         │ Data         │
├──────────────┼──────────────┼──────────────┤
│ Data         │ Data         │ Data         │
└──────────────┴──────────────┴──────────────┘

Header Row:
  Background: Ocean Deep (#003D5C)
  Text Color: Sail White (#FFFFFF)
  Font: Open Sans, SemiBold (600), 14px
  Padding: 12px 16px
  Letter Spacing: 0.5px

Data Rows:
  Background: Alternating white and Foam Light (#F0F4F8)
  Text Color: Charcoal (#2C3E50)
  Font: Open Sans, Regular (400), 14px
  Padding: 12px 16px
  Border-bottom: 1px solid Light Gray (#E8EDF2)

Hover Row:
  Background: Light Gray (#E8EDF2)
  Cursor: pointer (if clickable)

Alignment:
  - Headers: Left-aligned (except numbers: right-aligned)
  - Data: Match header alignment
  - Padding between cells: 16px horizontal
```

### 5.4 Chart/Graph Components

#### Chart Container
```
Background: Sail White (#FFFFFF)
Border: 1px solid Light Gray (#E8EDF2)
Border Radius: 6px
Padding: 24px
Box Shadow: 0 2px 8px rgba(0, 0, 0, 0.06)

Title: H3 (24px), Ocean Deep
Legend: 12px, Slate Gray, horizontal or vertical
Axis Labels: 12px, Slate Gray
Grid Lines: Subtle, Light Gray, 1px dashed
```

#### Chart Color Palette (In Order of Use)
```
1. Wave Blue (#0066CC) - Primary metric
2. Turquoise Success (#2DBB9E) - Positive/Secondary
3. Anchor Gold (#D4AF37) - Highlight/Tertiary
4. Compass Rose (#E6722D) - Fourth series
5. Coral Alert (#FF6B5B) - Negative/Alert
6. Info Blue (#3498DB) - Additional series
```

#### Recommended Chart Types
```
- Line Charts: Time-series data (maintenance history)
  Colors: Wave Blue primary, Turquoise secondary

- Bar Charts: Comparisons (cost comparison, metrics)
  Colors: Anchor Gold primary, Wave Blue secondary

- Pie/Donut: Composition (fleet breakdown, downtime causes)
  Colors: Use all primary/secondary colors in sequence

- Area Charts: Trends (ROI growth, downtime reduction)
  Colors: Wave Blue with 40% opacity for fill
```

### 5.5 Callout Boxes

#### Feature Callout
```
┌─────────────────────────────────────────┐
│ ⚓ Key Benefit Title                     │
├─────────────────────────────────────────┤
│ Detailed explanation of the benefit     │
│ with metrics or supporting data         │
│                                         │
│ Benefits:                               │
│ • Specific outcome 1                    │
│ • Specific outcome 2                    │
│ • Specific outcome 3                    │
└─────────────────────────────────────────┘

Background: Foam Light (#F0F4F8)
Border: 2px solid Wave Blue (#0066CC)
Border Radius: 8px
Padding: 20px 24px
Icon: 24px, Anchor Gold (#D4AF37)
Title: H3 (24px), Ocean Deep, SemiBold
Text: Body Standard (16px), Charcoal
Bullets: 16px, with Wave Blue check icons
```

#### Stat/Number Callout
```
┌──────────────────┐
│   72%            │
│   COST SAVINGS   │
│                  │
│ Average annual   │
│ reduction vs.    │
│ manual systems   │
└──────────────────┘

Background: Anchor Gold (#D4AF37)
Text Color: Sail White (#FFFFFF)
Border Radius: 8px
Padding: 24px
Number: 48px, Bold
Label: 12px, SemiBold, Uppercase, Letter Spacing 0.5px
Subtext: 14px, Regular

Alternative Dark Version (for dark backgrounds):
Background: Ocean Deep (#003D5C)
Text Color: Sail White (#FFFFFF)
Border: 2px solid Anchor Gold (#D4AF37)
Number: 36px, Bold, Anchor Gold
```

### 5.6 Progress Indicators

#### Progress Bar
```
Background Track: Light Gray (#E8EDF2)
Fill Color: Wave Blue (#0066CC)
Border Radius: 8px
Height: 8px
Width: Full container
Padding: 4px (optional border)

Animated Fill:
  Transition: width 300ms ease-in-out

Example (75% complete):
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  █████████████████████████████░░░░░░░░░
  ▲ 75% ▲
```

#### Step Indicator
```
Step 1 (Completed):
  Circle: 32px, Turquoise Success (#2DBB9E)
  Number: White, Bold
  Checkmark overlay: Optional

Step 2 (Current/Active):
  Circle: 32px, Wave Blue (#0066CC)
  Number: White, Bold
  Ring: 2px outer ring, Anchor Gold (#D4AF37)

Step 3 (Upcoming):
  Circle: 32px, Light Gray (#E8EDF2)
  Number: Slate Gray (#708090)

Connector Line:
  Between circles: Depends on status
  Completed steps: Turquoise Success (#2DBB9E)
  Current step: Wave Blue (#0066CC)
  Upcoming: Light Gray (#E8EDF2)

Layout:
  ○───●───○
  1   2   3
```

---

## 6. USAGE EXAMPLES

### Example 1: Feature Comparison Section

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Why Choose NaviDocs?                                        │
│                                                              │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│ │   Icon      │   Icon      │   Icon      │   Icon      │  │
│ │   Feature 1 │   Feature 2 │   Feature 3 │   Feature 4 │  │
│ │   Sub text  │   Sub text  │   Sub text  │   Sub text  │  │
│ └─────────────┴─────────────┴─────────────┴─────────────┘  │
│                                                              │
│ Real-time      Predictive      Integrations   24/7         │
│ Monitoring     Maintenance     with Smart Home Support       │
│                                                              │
│ Get instant    AI detects      Works with     Our expert    │
│ alerts about   problems        Home          team is        │
│ vessel status  before they     Assistant and  always        │
│ anywhere       occur           other 500+     ready to      │
│                                platforms      help          │
└─────────────────────────────────────────────────────────────┘
```

**Color Application:**
- Section heading: Ocean Deep (#003D5C), H2 size
- Icons: Wave Blue (#0066CC), 32x32px
- Feature titles: Ocean Deep (#003D5C), 18px Bold
- Subtitles: Slate Gray (#708090), 14px

### Example 2: ROI Callout Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    $420K     │  │     68%       │  │  42 hrs/mo   │      │
│  │  ANNUAL      │  │  DOWNTIME     │  │   SAVED      │      │
│  │  SAVINGS     │  │  REDUCTION    │  │   TIME       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  Average 500-ton yacht. Real deployment data.              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Styling:**
- Stat boxes: Anchor Gold (#D4AF37) background, 6px border radius
- Numbers: 48px Bold, Sail White
- Labels: 14px, All caps, Sail White, Letter spacing 0.5px
- Supporting text: 12px, Slate Gray, centered below

### Example 3: Alert/Status Message

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠  Engine Temperature High                                 │
│  Predicted failure in 18 hours. Recommend immediate service.│
│  ┌──────────────────────────────────┐                       │
│  │ View Maintenance Plan  Schedule   │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**Styling:**
- Background: Warning Alert color (#FDEBD0)
- Icon: Warning Orange (#F39C12), 24px
- Title: 16px Bold, Ocean Deep
- Message: 14px Regular, Charcoal
- CTA Button: Secondary style (outline with Wave Blue border)

### Example 4: Timeline Section

```
Q4 2024          Q1 2025           Q2 2025            Q3 2025
  ●────────────────●────────────────●────────────────●

MVP Launch       Multi-User        Industry          Global
                 Integration       Compliance        Expansion

✓ Real-time      ✓ Role-based      ✓ SOLAS 2024      ✓ 50+ Flag
  Monitoring       Access Control    Compliance         States
✓ ML Alerts      ✓ Advanced APIs   ✓ ISO 14001       ✓ Multi-
✓ Mobile         ✓ Third-party       Certification     language
  Application      Integrations    ✓ DNV GL          ✓ Regional
✓ Basic          ✓ Live Data       ✓ Extended          Compliance
  Reporting         Streaming        Training
```

**Styling:**
- Timeline line: Light Gray, 2px
- Milestones (active): Wave Blue (#0066CC), 16px circles, filled
- Milestones (inactive): Ocean Deep (#003D5C) outline, 16px circles
- Quarters: H3 (24px), Ocean Deep, centered above timeline
- Phase titles: H4 (18px), Ocean Deep, SemiBold
- Features: 14px, Turquoise check icon (#2DBB9E), Charcoal text

### Example 5: Contact/CTA Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│             READY FOR A GAME-CHANGING SOLUTION?             │
│                                                              │
│         Let us show you how NaviDocs works for your fleet   │
│                                                              │
│            ┌──────────────────────────────┐                 │
│            │ Schedule 30-Minute Demo      │                 │
│            │ No Credit Card Required      │                 │
│            └──────────────────────────────┘                 │
│                                                              │
│         Questions? hello@navidocs.ai | +1 (305) 555-0100   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Styling:**
- Background: Subtle gradient (white to Foam Light)
- Main heading: H1 (36px), Ocean Deep, centered, bold
- Subheading: 18px, Slate Gray, centered
- Primary button: Large CTA button (Anchor Gold background)
- Contact text: 12px, Slate Gray, centered
- Section spacing: 48px margins top/bottom

---

## 7. ACCESSIBILITY & BEST PRACTICES

### Color Contrast Guidelines

All text color combinations must meet WCAG AAA standards (7:1 contrast ratio minimum for body text, 4.5:1 for large text):

```
Approved High-Contrast Pairs:
✓ Ocean Deep (#003D5C) on Sail White (#FFFFFF) - 9.2:1
✓ Charcoal (#2C3E50) on Foam Light (#F0F4F8) - 8.5:1
✓ Sail White (#FFFFFF) on Ocean Deep (#003D5C) - 9.2:1
✓ Sail White (#FFFFFF) on Wave Blue (#0066CC) - 5.1:1

Avoid These Combinations:
✗ Wave Blue (#0066CC) on Foam Light (#F0F4F8) - 4.1:1
✗ Light Gray (#E8EDF2) on Sail White (#FFFFFF) - 1.2:1
✗ Anchor Gold (#D4AF37) on Sail White (#FFFFFF) - 3.8:1
```

### Responsive Design

```
Desktop: 1920x1080px minimum
- Full width layouts
- Multi-column grids
- Large typography

Tablet: 1024x768px
- 2-column layouts possible
- Reduced padding/margins
- Slightly smaller type

Mobile: 375x667px
- Single column layouts
- Larger touch targets (44x44px minimum)
- Simplified navigation

Breakpoints:
- 320px: Mobile small
- 768px: Tablet
- 1024px: Desktop
- 1920px: Large desktop
```

### Typography Guidelines

- Minimum font size: 12px (for UI labels only)
- Body text: 14px minimum (16px preferred)
- Headings: Use semantic HTML (H1-H6) in order
- Line length: 50-75 characters for optimal readability
- Line height: 1.5-1.6 for body text, 1.2-1.3 for headings

### Icon Guidelines

- Minimum icon size: 16x16px
- Never use color alone to convey meaning (pair with icons/text)
- Provide text labels for all icon buttons
- Maintain 8px spacing around clickable icons (minimum 44x44px touch target)

---

## 8. IMPLEMENTATION CHECKLIST

### For Presentation Decks

- [ ] Use approved color palette throughout
- [ ] Maintain 60px margins on all sides
- [ ] Use consistent typography hierarchy
- [ ] Include anchor icon/logo on title slides
- [ ] Add page numbers to footer (except title slide)
- [ ] Use 2-3 colors maximum per slide (primary + accent)
- [ ] Ensure all text has sufficient contrast
- [ ] Size images/graphics at 72 DPI minimum for clarity

### For Interactive Dashboards

- [ ] Implement all button states (hover, active, focus, disabled)
- [ ] Use approved icons from icon set
- [ ] Apply correct spacing (8px base unit)
- [ ] Ensure keyboard navigation works
- [ ] Test with screen readers
- [ ] Verify color contrast ratios

### For Marketing Materials

- [ ] Consistent use of color palette
- [ ] Professional photography/imagery that complements maritime theme
- [ ] Clear visual hierarchy with typography
- [ ] Strategic use of white space
- [ ] Call-to-action buttons prominently featured
- [ ] Brand anchor logo visible on all materials

---

## 9. EXPORT & ASSET MANAGEMENT

### Design File Recommendations

```
Recommended Tools:
- Figma (cloud-based, collaborative)
- Adobe XD (for prototyping)
- Sketch (for detailed design work)

Asset Export Guidelines:
- Export icons as SVG (scalable, small file size)
- Export illustrations as SVG or 2x PNG
- Use WebP format for photos (better compression)
- Maintain 2x versions for Retina displays
- Create separate files for each component
```

### File Naming Convention

```
[Component]-[Variant]-[State].[Format]

Examples:
- button-primary-default.svg
- button-primary-hover.svg
- card-feature-default.svg
- icon-anchor-24px.svg
- chart-revenue-example.png
- wave-divider-blue.svg
```

---

## 10. BRAND VOICE IN DESIGN

The visual design system reinforces these brand attributes:

**Trust**: Deep blues, gold accents, solid geometry convey stability and reliability
**Innovation**: Clean, modern typefaces and cutting-edge icon design
**Approachability**: Warm gold accents, generous spacing, human-centered design
**Excellence**: Precision in typography, pixel-perfect alignment, attention to detail
**Maritime Heritage**: Nautical color palette, anchor iconography, ocean-inspired themes

---

## Document Metadata

**Version:** 1.0
**Last Updated:** November 13, 2025
**Design Lead:** S3-H09
**Status:** Active
**Next Review:** December 13, 2025

---

## Appendix A: Quick Reference Guide

### Primary Colors
- Ocean Deep: #003D5C
- Wave Blue: #0066CC
- Sail White: #FFFFFF
- Anchor Gold: #D4AF37

### Typography
- Headings: Inter (Bold/SemiBold)
- Body: Open Sans (Regular)
- Monospace: JetBrains Mono

### Common Spacing
- Small: 8px
- Medium: 16px
- Large: 24px
- XL: 32px

### Icon Sizes
- Small UI: 16x16px
- Medium: 24x24px
- Large: 32x32px
- XL: 48x48px

---

**END OF DESIGN SYSTEM GUIDE**

This comprehensive visual design system provides complete guidelines for creating cohesive, professional NaviDocs pitch materials that resonate with the yacht industry audience while maintaining modern design principles.
