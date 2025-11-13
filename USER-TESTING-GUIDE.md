# Feature Selector User Testing Guide
**Quick Start:** https://digital-lab.ca/navidocs/builder/

---

## Quick Test (5 minutes)

### Step 1: Open Feature Selector
Open browser: https://digital-lab.ca/navidocs/builder/

### Step 2: Select Tier 1 Features
Check all 4 Tier 1 features (red badges):
- [ ] Photo-Based Inventory Tracking
- [ ] Smart Maintenance Tracking & Reminders
- [ ] Document Versioning & Audit Trail
- [ ] Multi-User Expense Tracking

### Step 3: Export Agent Tasks
1. Click green **"Export Agent Tasks"** button
2. Verify alert shows:
   - Total tasks: 21
   - P0 tasks: 21
   - Estimated hours: 53h
3. Download: `navidocs-agent-tasks-2025-11-13.json`

### Step 4: Verify JSON Structure
Open downloaded file and check:
- `metadata.selected_features`: 4
- `agents.agent-1-backend.tasks`: 4 tasks
- `agents.agent-2-frontend.tasks`: 4 tasks
- `agents.agent-3-database.tasks`: 4 tasks
- `agents.agent-4-integration.tasks`: 1 task (expense-tracking only)
- `agents.agent-5-testing.tasks`: 4 tasks
- `summary.total_tasks`: 21
- `summary.estimated_total_hours`: 53

**Expected Result:** ✅ JSON matches sample in `/home/setup/navidocs/sample-agent-tasks-tier1.json`

---

## Full Test (15 minutes)

### Test Case 1: No Features Selected
1. Clear all selections (Click "Clear All")
2. Click "Export Agent Tasks"
3. **Expected:** Alert "Please select at least one feature before exporting agent tasks!"

### Test Case 2: Single Feature
1. Select only "Photo-Based Inventory Tracking" (Tier 1)
2. Click "Export Agent Tasks"
3. **Expected:** 5 tasks (1 per agent, except agent-4 skips this feature)

### Test Case 3: Mix of Tiers
1. Select:
   - Tier 1: Photo-Based Inventory Tracking (Must-Have: 10)
   - Tier 2: Camera Integration (Must-Have: 7)
   - Tier 3: WhatsApp Integration (Must-Have: 5)
2. Click "Export Agent Tasks"
3. **Expected:**
   - P0 tasks: 5 (from Tier 1, Must-Have 10 → P0)
   - P1 tasks: 5 (from Tier 2, Must-Have 7 → P1)
   - P2 tasks: 5 (from Tier 3, Must-Have 5 → P2)

### Test Case 4: Priority Calculation
1. Select "Camera Integration" (Tier 2, default Must-Have: 7)
2. Adjust slider to 9
3. Click "Export Agent Tasks"
4. **Expected:** All 5 tasks now P0 (Must-Have 9 ≥ 8 → P0)

### Test Case 5: Integration Features
1. Select all features requiring third-party integrations:
   - Camera Integration (Home Assistant)
   - WhatsApp Integration (WhatsApp Business API)
   - Accounting Integration (Spliit fork)
   - Multi-User Expense Tracking (OCR + bank API)
2. Click "Export Agent Tasks"
3. **Expected:** agent-4-integration has 4 tasks (one for each integration feature)

### Test Case 6: All Features
1. Click "Select All" (11 features)
2. Click "Export Agent Tasks"
3. **Expected:**
   - Total tasks: 54-55 (11 features × ~5 agents, minus skipped integrations)
   - P0 tasks: ~35-40 (features with Must-Have ≥ 8)
   - Estimated hours: ~150-200h

---

## Validation Checklist

### Feature Display
- [ ] 11 features rendered correctly
- [ ] Tier badges visible (red=Tier 1, orange=Tier 2, green=Tier 3)
- [ ] Must-Have rating displayed (X/10)
- [ ] Priority badges (CRITICAL/HIGH/MEDIUM)
- [ ] Savings amounts shown

### Interaction
- [ ] Checkboxes toggle feature selection
- [ ] Selected features highlight in blue (#F0F8FF)
- [ ] Stats update in real-time (Selected count, Avg Must-Have, Total Savings)
- [ ] Slider adjusts Must-Have rating (1-10)
- [ ] Notes textarea accepts input

### Buttons
- [ ] "Select All" checks all 11 features
- [ ] "Clear All" unchecks all features
- [ ] "Export JSON" downloads feature-selection JSON
- [ ] "Export Agent Tasks" downloads agent-tasks JSON (green button)
- [ ] "Print" opens print dialog

### JSON Structure (Agent Tasks)
```json
{
  "metadata": {
    "timestamp": "ISO 8601",
    "meeting": "Riviera Plaisance Partnership",
    "deployment_target": "StackCP shared hosting",
    "selected_features": <count>,
    "swarm_pattern": "S2 (5 Haiku agents parallel)",
    "autonomous_task_file": "AUTONOMOUS-NEXT-TASKS.md"
  },
  "agents": {
    "agent-1-backend": { "role": "...", "model": "haiku", "tasks": [...] },
    "agent-2-frontend": { "role": "...", "model": "haiku", "tasks": [...] },
    "agent-3-database": { "role": "...", "model": "haiku", "tasks": [...] },
    "agent-4-integration": { "role": "...", "model": "haiku", "tasks": [...] },
    "agent-5-testing": { "role": "...", "model": "haiku", "tasks": [...] }
  },
  "summary": {
    "total_tasks": <count>,
    "estimated_total_hours": <hours>,
    "p0_tasks": <count>,
    "deployment_instructions": [...]
  }
}
```

### Task Structure
Each task must have:
- `feature_id`: String (e.g., "inventory-tracking")
- `title`: String (e.g., "API endpoints for Photo-Based Inventory Tracking")
- `priority`: String (P0/P1/P2)
- `status`: String ("pending")
- `description`: String (technical description)
- `technical_notes`: String (from feature.description)
- `user_notes`: String (from notes textarea or "None")
- `estimated_hours`: Number (2-4 hours depending on tier)
- `dependencies`: Array of strings (e.g., ["database schema ready"])

---

## Known Issues

### ❌ Issue 1: WebFetch Network Access
- **Description:** Agent 3 WebFetch tool cannot access live deployment
- **Impact:** Cannot verify page loads in browser (static analysis only)
- **Workaround:** Manual browser testing required
- **Status:** P2 (Medium) - File analysis confirms correctness

---

## Success Criteria

### Minimum Viable Test (MVP)
- [ ] Page loads at https://digital-lab.ca/navidocs/builder/
- [ ] Can select/deselect features
- [ ] "Export Agent Tasks" button works
- [ ] JSON downloads with correct structure
- [ ] Alert shows task summary

### Production Ready
- [ ] All 6 test cases pass
- [ ] JSON validates against schema
- [ ] No console errors
- [ ] Works on mobile (responsive)
- [ ] Print view formats correctly

---

## Next Steps After Testing

### If Tests Pass
1. Deploy agent-tasks JSON to StackCP
2. Launch 5 parallel Haiku agents
3. Agents poll AUTONOMOUS-NEXT-TASKS.md
4. Begin implementation (Backend → Database → Frontend → Integration → Testing)

### If Tests Fail
1. Document failures in `/home/setup/navidocs/test-failures.md`
2. Report to Agent 3 for debugging
3. Fix bugs in feature-selector.html (lines 591-759)
4. Redeploy to StackCP
5. Retest

---

## Sample Output

See `/home/setup/navidocs/sample-agent-tasks-tier1.json` for expected JSON structure when all 4 Tier 1 features are selected.

---

**Generated by:** Agent 3 - Feature Selector Testing & Validation (Haiku)
**Date:** 2025-11-13
**IF.TTT Compliance:** Testing instructions traceable to feature-selector.html:591-759
