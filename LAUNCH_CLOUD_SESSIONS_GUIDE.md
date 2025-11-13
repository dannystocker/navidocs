# Launch Cloud Sessions - Step-by-Step Guide

**Status:** ✅ All infrastructure ready (chat system PID 14596, session prompts prepared)
**Time Required:** 15 minutes to launch all 5 sessions
**Updated:** 2025-11-13 11:10 UTC

---

## Prerequisites (Already Complete)

- ✅ Chat system running (PID 14596)
- ✅ 5 session prompt files created
- ✅ agents.md updated with NaviDocs context
- ✅ GitHub repo accessible (dannystocker/navidocs)
- ✅ StackCP environment verified
- ✅ Demo files deployed

---

## How Cloud Sessions Work

**Important:** Cloud sessions run in **Claude Code Cloud (web browser)**, NOT directly on StackCP.

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────┘

Local Claude (You)          StackCP Server         Cloud Sessions (Browser)
┌────────────┐             ┌────────────┐          ┌──────────────┐
│  Sonnet    │─Messages───>│ File Sync  │<────────>│ Session 1-5  │
│  Leader    │<───────────>│ (SSH)      │          │ (Haiku)      │
└────────────┘             └────────────┘          └──────────────┘
      │                           │                        │
      └───── Commands ────────────┴────── Work Results ───┘
```

**Key Point:** StackCP is the **message broker** (file storage), not the execution environment.

---

## Step 1: Access Session Prompts

Each prompt file contains everything a cloud session needs to know:

```bash
# Location (already created)
/home/setup/navidocs/CLOUD_SESSION_PROMPT_1_PHOTO_INVENTORY.md     (4.4K)
/home/setup/navidocs/CLOUD_SESSION_PROMPT_2_DOCUMENT_SEARCH.md     (5.5K)
/home/setup/navidocs/CLOUD_SESSION_PROMPT_3_MAINTENANCE_TIMELINE.md (6.0K)
/home/setup/navidocs/CLOUD_SESSION_PROMPT_4_DEMO_POLISH.md         (7.5K)
/home/setup/navidocs/CLOUD_SESSION_PROMPT_5_INTEGRATION_TESTING.md (11K)
```

**Each prompt includes:**
- Session ID and role
- NaviDocs project context
- Intra-agent communication protocol
- SSH commands for StackCP access
- Task assignments
- Chat system usage instructions

---

## Step 2: Open Claude Code Cloud

**Option A: Claude.ai (Recommended)**
1. Go to https://claude.ai
2. Click "Continue with Claude Code" or access Claude Code Cloud interface
3. Open 5 browser tabs (one per session)

**Option B: Claude Code Cloud Direct**
1. Access Claude Code Cloud web interface
2. Open 5 separate sessions

---

## Step 3: Launch Sessions (15 minutes)

### Session 1: Photo Inventory + OCR

```bash
# 1. Open session prompt
cat /home/setup/navidocs/CLOUD_SESSION_PROMPT_1_PHOTO_INVENTORY.md

# 2. Copy ENTIRE file contents
# 3. Paste into Claude Code Cloud Session 1
# 4. Wait for session to acknowledge and begin work
```

**What Session 1 will do:**
- Clone navidocs repo from GitHub
- Build photo inventory system (90 min)
- Integrate OCR for receipts using Claude Code CLI
- Deploy depreciation calculation display
- Report status via `/tmp/send-to-cloud.sh`

### Session 2: Document Search

```bash
# 1. Open session prompt
cat /home/setup/navidocs/CLOUD_SESSION_PROMPT_2_DOCUMENT_SEARCH.md

# 2. Copy and paste into Claude Code Cloud Session 2
```

**What Session 2 will do:**
- Integrate Meilisearch (already running on port 7700)
- Build PDF upload system (60 min)
- Configure instant search <200ms
- Test with Azimut 55S manuals

### Session 3: Maintenance Timeline

```bash
cat /home/setup/navidocs/CLOUD_SESSION_PROMPT_3_MAINTENANCE_TIMELINE.md
# Copy and paste into Claude Code Cloud Session 3
```

**What Session 3 will do:**
- Build service log interface (60 min)
- Implement warranty alert system
- Create provider contact management
- Auto-detect warranty duration from online research

### Session 4: Demo Polish

```bash
cat /home/setup/navidocs/CLOUD_SESSION_PROMPT_4_DEMO_POLISH.md
# Copy and paste into Claude Code Cloud Session 4
```

**What Session 4 will do:**
- Load Azimut 55S case study data (30 min)
- Apply IBM Carbon + Meilisearch styling
- Polish UI transitions and animations
- Verify mobile responsiveness

### Session 5: Integration Testing

```bash
cat /home/setup/navidocs/CLOUD_SESSION_PROMPT_5_INTEGRATION_TESTING.md
# Copy and paste into Claude Code Cloud Session 5
```

**What Session 5 will do:**
- Run integration tests across all features
- Verify chat system communication
- Validate data consistency
- Generate test report
- Coordinate final deployment

---

## Step 4: Monitor Progress (Local Claude)

### Check Messages from Cloud Sessions

```bash
# Read all messages from all sessions
/tmp/read-from-cloud.sh

# Read specific session
/tmp/read-from-cloud.sh 1  # Photo Inventory
/tmp/read-from-cloud.sh 2  # Document Search
/tmp/read-from-cloud.sh 3  # Maintenance Timeline
/tmp/read-from-cloud.sh 4  # Demo Polish
/tmp/read-from-cloud.sh 5  # Integration Testing
```

### Send Instructions to Cloud Sessions

```bash
# Send to specific session
/tmp/send-to-cloud.sh 1 "Status Check" "How's photo inventory progress?"

# Send to all sessions (broadcast)
for i in {1..5}; do
  /tmp/send-to-cloud.sh $i "Priority Update" "Focus on demo-ready features first"
done
```

### Monitor Chat Logs

```bash
# Real-time monitoring
tail -f /tmp/claude-sync.log

# Check sync status
grep "ERROR" /tmp/claude-sync.log  # Should be empty
grep "Sent" /tmp/claude-sync.log | tail -10  # Recent sends
```

---

## Step 5: Coordinate Work (Sonnet Leader Role)

As the local Sonnet leader, you:

1. **Receive blockers:** Cloud Haiku agents report issues via chat
2. **Make decisions:** Architecture choices, priority conflicts, scope changes
3. **Resolve conflicts:** When two sessions need the same resource
4. **Approve deploys:** Final say on production deployments

**Example Coordination:**

```bash
# Session 1 reports blocker
/tmp/read-from-cloud.sh 1
# → "BLOCKER: OCR API rate limit hit (429 errors). Need alternative approach."

# You respond with decision
/tmp/send-to-cloud.sh 1 "DECISION: OCR Approach" \
  "Switch to local Tesseract OCR instead of API. Install: apt-get install tesseract-ocr"

# Session 1 acknowledges and continues
/tmp/read-from-cloud.sh 1
# → "ACKNOWLEDGED: Installing Tesseract locally. ETA 10 min."
```

---

## Step 6: StackCP agents.md Setup (Optional)

If you want cloud sessions to have local agents.md reference on StackCP:

```bash
# Clone infrafabric repo to StackCP
ssh stackcp "cd ~ && git clone https://github.com/dannystocker/infrafabric.git"

# Update agents.md (already has latest NaviDocs info)
ssh stackcp "cd ~/infrafabric && git pull"

# Cloud sessions can now read:
# ~/infrafabric/agents.md (lines 988-1200 have NaviDocs context)
```

**But this is NOT required** - session prompts already contain all needed context.

---

## Troubleshooting

### Chat System Issues

```bash
# Check if sync script is running
ps aux | grep claude-sync
# Should show: PID 14596 /bin/bash /tmp/claude-sync-5-sessions.sh

# Restart if needed
/tmp/activate-claude-chat.sh

# Verify directories exist on StackCP
ssh stackcp "ls -la ~/claude-inbox/ ~/claude-outbox/"
```

### Session Not Responding

```bash
# Check if session received message
ssh stackcp "ls -la ~/claude-inbox/session-1/"

# Check if session sent reply
ssh stackcp "ls -la ~/claude-outbox/session-1/"

# Manual message check
/tmp/read-from-cloud.sh 1
```

### GitHub Access Issues

Cloud sessions need GitHub access for private repo. Two options:

**Option A: Setup Deploy Key** (Recommended - read-only)
```bash
# Follow guide:
cat /home/setup/navidocs/SECURE_GITHUB_ACCESS_FOR_CLOUD.md
```

**Option B: Make repo public temporarily** (Quick but not secure)
```bash
# Go to: https://github.com/dannystocker/navidocs/settings
# Change visibility: Private → Public
# After demo: Change back to Private
```

---

## Quick Reference Commands

```bash
# Send message to cloud session
/tmp/send-to-cloud.sh <1-5> "Subject" "Body"

# Read messages from cloud
/tmp/read-from-cloud.sh [session]

# Monitor chat logs
tail -f /tmp/claude-sync.log

# Check chat system status
ps aux | grep claude-sync

# Restart chat system
/tmp/activate-claude-chat.sh

# Verify StackCP connectivity
ssh stackcp "hostname && whoami"

# Check Meilisearch running
ssh stackcp "curl -s http://localhost:7700/health"
```

---

## Expected Timeline

```
T+0min:   Launch all 5 sessions (copy-paste prompts)
T+5min:   Sessions clone repos, verify environment
T+15min:  Session 1 begins photo inventory work
T+20min:  Session 2 begins document search
T+25min:  Session 3 begins maintenance timeline
T+30min:  Session 4 begins demo polish
T+90min:  Session 1 reports photo inventory complete
T+120min: Sessions 2-4 report feature complete
T+180min: Session 5 runs integration tests
T+200min: ALL SESSIONS COMPLETE → Demo ready
```

---

## Success Criteria

**You'll know cloud sessions are working when:**

1. ✅ `/tmp/read-from-cloud.sh` shows messages from sessions
2. ✅ Sessions report progress every 15-30 minutes
3. ✅ Blockers are escalated and resolved via chat
4. ✅ Features are deployed to StackCP navidocs-app/
5. ✅ Integration tests pass (Session 5 final report)

---

## Next Steps After Launch

1. **Monitor first 15 minutes** - Ensure all sessions started successfully
2. **Check for blockers** - Run `/tmp/read-from-cloud.sh` every 10 minutes
3. **Coordinate work** - Respond to questions and approve decisions
4. **Verify deployments** - Test features as they're completed
5. **Final integration** - Session 5 validates everything works together

---

**Status:** Ready to launch cloud sessions NOW
**Demo Deadline:** ~3 hours from now (Riviera Plaisance at 15:00 UTC)
**Communication:** Chat system operational (PID 14596)

**To begin:** Copy contents of `CLOUD_SESSION_PROMPT_1_PHOTO_INVENTORY.md` into Claude Code Cloud Session 1
