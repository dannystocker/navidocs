# Agent Communication Protocol
**Cloud ↔ Local Machine Coordination Framework**

**Document Version:** 1.0
**Created:** 2025-11-13
**Last Updated:** 2025-11-13 11:15 UTC
**Status:** ACTIVE - Production Communication Framework

---

## Executive Summary

This document defines how **CLOUD agents** (running 5 parallel sessions in Claude.com) communicate with the **LOCAL machine** (navidocs repository on home/setup) to coordinate work, request decisions, report blockers, and synchronize deployments.

**Key Principles:**
1. **Asynchronous**: Agents don't wait for responses; they check for updates every 5 minutes
2. **Git-Native**: All communication flows through git commits and files
3. **GitHub-Backed**: GitHub Issues provide high-visibility escalation path
4. **Human-Transparent**: Local machine (Danny) can see all agent requests at a glance
5. **Fault-Tolerant**: Network disconnects don't break workflow; agents resume from last checkpoint

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ CLOUD ENVIRONMENT (Claude.com - 5 Parallel Sessions)       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Session 1 (Market Research)      Session 2 (Integration)   │
│  Agents S1-H01 to S1-H10           Agents S2-H0A to S2-H10  │
│  ↓ Read: AUTONOMOUS-NEXT-TASKS    ↓ Create: GitHub Issues   │
│  ↓ Commit: intelligence/session-1/ ↓ Commit: intelligence/   │
│  ↓ Push to origin                  ↓ Push to origin          │
│                                                              │
│  Session 3 (UX/Sales)              Session 4 (Planning)      │
│  Agents S3-H01 to S3-H10           Agents S4-H0A to S4-H10  │
│                                                              │
│  Session 5 (Validation)                                      │
│  Agents S5-H0A to S5-H10                                    │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    [Git Sync Every 5min]
                           │
       ┌───────────────────┼───────────────────┐
       ↓                   ↓                   ↓
   ┌─────────┐        ┌──────────┐      ┌──────────┐
   │   Git   │        │ GitHub   │      │  Files   │
   │ Remote  │        │  Issues  │      │  Sync    │
   │ (GitHub)│        │  (Alert) │      │  (Async) │
   └────┬────┘        └────┬─────┘      └────┬─────┘
        │                  │                 │
        └──────────────────┼─────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│ LOCAL MACHINE (Danny + Navidocs Repo)              │
├───────────────────────────────────────────────────┤
│                                                    │
│  📄 AUTONOMOUS-NEXT-TASKS.md (Agent instructions) │
│  🔔 GitHub Issues (Agent requests)                │
│  📁 intelligence/session-X/ (Agent outputs)       │
│  📋 AGENT_COMMUNICATION_PROTOCOL.md (this doc)    │
│                                                    │
│  Human Actions:                                    │
│  - Read agent status every 5 minutes               │
│  - Respond to GitHub issues with decisions        │
│  - Update AUTONOMOUS-NEXT-TASKS.md with new work  │
│  - Push changes (agents detect within 5 min)      │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Communication Channels

### 1. File-Based Communication (Primary)

**File:** `AUTONOMOUS-NEXT-TASKS.md`
- **Direction:** Local → Cloud
- **Format:** Markdown task list with agent assignments
- **Update Frequency:** Every 5-30 minutes during active sessions
- **Cloud Poll Frequency:** Every 5 minutes (git fetch + show)

**How it works:**
```bash
# Local machine updates task:
Danny: "Agent 2 needs to wait for Redis confirmation by 11:30"
→ Edit AUTONOMOUS-NEXT-TASKS.md, Agent 2 section
→ Commit: git commit -m "[AGENT-SYNC] Update Agent 2 Redis blocker"
→ Push: git push origin navidocs-cloud-coordination

# Cloud agent detects change:
Agent S2-H02: (every 5 minutes)
→ git fetch origin navidocs-cloud-coordination
→ git show origin:AUTONOMOUS-NEXT-TASKS.md
→ Parse Agent 2 section
→ Read: "Blocker: Waiting for Redis... Fallback: PostgreSQL"
→ Execute: Implement PostgreSQL fallback
```

**Cloud Agent Polling Implementation:**
```bash
#!/bin/bash
# Cloud agent polling script (runs every 5 minutes)
AGENT_ID="S2-H02"  # Agent 2
SESSION=2

while true; do
  git fetch origin navidocs-cloud-coordination
  CURRENT_TASK=$(git show origin:AUTONOMOUS-NEXT-TASKS.md | \
    grep -A 50 "## Agent 2:" | grep -m 1 "Status:")

  if [ "$CURRENT_TASK" != "$LAST_TASK" ]; then
    echo "New task detected: $CURRENT_TASK"
    # Execute new task...
  fi

  LAST_TASK="$CURRENT_TASK"
  sleep 300  # 5 minutes
done
```

---

### 2. GitHub Issues (Escalation + Visibility)

**Template:** `.github/ISSUE_TEMPLATE/agent-ping.md`
- **Direction:** Cloud → Local (primary), Local → Cloud (response)
- **Format:** Structured GitHub issue with agent details
- **Creation:** When agent has BLOCKER or needs human decision
- **Resolution:** Local machine closes with decision/action

**When to Create GitHub Issue:**

| Scenario | Create Issue? | Example |
|----------|---------------|---------​|
| Status update (on track) | No | "Agent 1: 60% complete" |
| Task blocked | YES | "Agent 2: Waiting for Redis response, need decision by 11:30" |
| Needs decision | YES | "Agent 4: ProcessWire API unavailable, use scraper or wait?" |
| Ready to deploy | YES | "Agent 1: Inventory system deploy-ready, approve staging?" |
| Integration conflict | YES | "Agent 10: Data model mismatch between Agents 2 and 5" |
| Query/clarification | YES | "Agent 3: Need property photos format (PNG vs WEBP)?" |

**Issue Creation Flow:**
```markdown
Agent S2-H02 detects Redis blocker:
→ Title: "[AGENT-2] Redis availability confirmation needed"
→ Labels: agent-communication, blocker
→ Assigns to: [GitHub user - Danny/Coordinator]
→ Sets deadline: 2025-11-13 11:30 UTC

Danny (local) receives notification:
→ Reads issue details
→ Makes decision: "If no response by 11:30, use PostgreSQL"
→ Updates AUTONOMOUS-NEXT-TASKS.md Agent 2 section
→ Comments on issue: "Proceeding with PostgreSQL fallback"
→ Closes issue (agent sees closure = decision made)

Agent S2-H02 detects closed issue:
→ Pulls latest AUTONOMOUS-NEXT-TASKS.md
→ Sees: "Fallback: PostgreSQL caching"
→ Implements fallback
→ Reports completion in next status update
```

---

### 3. Git Commits (Status Signals)

**Direction:** Cloud → Local (one-way signal)
- **Format:** Git commit messages with agent status codes
- **Frequency:** When agent completes major milestone
- **Message Format:** `[SESSION-X-AGENT-N] Brief description of completion`

**Example Commit Messages:**
```
[SESSION-2-AGENT-1] Photo inventory CRUD endpoints complete, OCR parsing 95% done
[SESSION-2-AGENT-2] Meilisearch index optimized, PostgreSQL cache layer active
[SESSION-2-AGENT-10] Integration tests passing, 2 minor conflicts resolved
[SESSION-1-ESCALATION] Market analysis >20% variance detected between agents
```

**Local Machine Git Log Monitoring:**
```bash
# Danny can see agent progress in git log
git log --oneline --decorate origin/navidocs-cloud-coordination | head -20

# Output:
# da1263d [SESSION-2-AGENT-1] Photo inventory CRUD endpoints complete
# 9f8c3a2 [SESSION-2-AGENT-0A] Helper agent: citation validation complete
# 8e7b1f5 [SESSION-2-AGENT-2] Meilisearch optimization in progress
```

---

### 4. File Sync (Agent Outputs)

**Directory:** `intelligence/session-X/`
- **Direction:** Cloud → Local
- **Format:** Markdown documents + JSON data files
- **Frequency:** Generated when agents complete tasks
- **Polling by next agents:** Every 5 minutes (check file existence)

**Output Files per Session:**

```
intelligence/
├── session-1/
│   ├── market-analysis.md              (Main findings)
│   ├── session-1-citations.json        (IF.TTT-compliant citations)
│   ├── session-1-handoff.md            (Ready for next session)
│   ├── QUALITY_FEEDBACK.md             (Session 5 validation notes)
│   └── logs/                           (Agent execution logs)
│
├── session-2/
│   ├── architecture.md                 (Technical design)
│   ├── integration-specs.md            (API contracts)
│   ├── session-2-handoff.md            (Ready for Session 4)
│   └── ESCALATION-[issue].md           (If blockers detected)
│
└── [session-3, 4, 5 similar structure]
```

**Dependency Polling Pattern:**
```bash
# Session 2 Agent 10 waits for Session 1 completion
# (every 5 minutes)
if [ -f "intelligence/session-1/session-1-handoff.md" ]; then
  echo "✅ Session 1 complete"
  # Read handoff and proceed with synthesis
else
  echo "⏳ Waiting for Session 1..."
  # Try again in 5 minutes
fi
```

---

## Communication Workflows

### Workflow 1: Normal Task Execution

```
t=0: Cloud agents read AUTONOMOUS-NEXT-TASKS.md (task assigned)
     ├─ Agent sees: "Status: DEPLOY-READY, Blockers: None"
     └─ Agent executes task (e.g., implement feature X)

t=30min: Agent completes task
         ├─ Creates intelligence/session-2/agent-1-output.md
         ├─ Commits: "[SESSION-2-AGENT-1] Task complete"
         ├─ Pushes to origin/navidocs-cloud-coordination
         └─ Continues polling for next task

t=35min: Local machine (Danny) detects completion
         ├─ Reads git log
         ├─ Verifies output files exist
         ├─ Updates AUTONOMOUS-NEXT-TASKS.md: "Status: ✅ COMPLETE"
         ├─ Commits update
         ├─ Pushes to origin
         └─ Unblocks dependent agents

t=40min: Dependent agents (Agent 10) detect unblock
         ├─ Polls AUTONOMOUS-NEXT-TASKS.md
         ├─ Sees: Agent 1 ✅ COMPLETE
         ├─ Reads intelligence/session-2/agent-1-output.md
         ├─ Proceeds with synthesis
         └─ [Cycle repeats]
```

### Workflow 2: Blocker Resolution

```
t=0: Agent encounters blocker (Redis not installed)
     ├─ Updates AUTONOMOUS-NEXT-TASKS.md: "🔴 BLOCKED: Waiting for Redis"
     ├─ Creates GitHub Issue: "[AGENT-2] Redis confirmation needed by 11:30"
     ├─ Pushes to origin
     └─ Enters wait mode (retry polling every 5 min)

t=10min: Local machine (Danny) sees:
         ├─ Git notification: new issue created
         ├─ Reads GitHub issue details
         ├─ Decides: "Use PostgreSQL fallback"
         ├─ Comments on issue: "Proceed with PostgreSQL"
         ├─ Updates AUTONOMOUS-NEXT-TASKS.md:
         │  - "Status: 🟡 IN-PROGRESS"
         │  - "Fallback: PostgreSQL caching (line 95)"
         ├─ Closes GitHub issue (signals decision made)
         └─ Pushes update

t=15min: Agent detects:
         ├─ GitHub issue closed (decision made!)
         ├─ Polls AUTONOMOUS-NEXT-TASKS.md
         ├─ Reads: "Fallback: PostgreSQL caching"
         ├─ Implements fallback
         ├─ Continues with task
         └─ Reports completion in next commit

t=45min: Agent reports: "[SESSION-2-AGENT-2] PostgreSQL cache layer active"
         └─ Cycle continues...
```

### Workflow 3: Escalation (Critical Issue)

```
t=0: Agent detects critical conflict
     ├─ Creates: intelligence/session-2/ESCALATION-data-model-conflict.md
     ├─ Details: "Agent 2 uses UUID, Agent 5 uses integer ID"
     ├─ Creates high-priority GitHub Issue: "[ESCALATION] Data model conflict"
     ├─ Sets P0 priority
     ├─ Tags issue: escalation, blocker
     └─ Enters halt mode (stops work until resolved)

t=5min: Local machine (Danny) receives:
        ├─ GitHub notification (P0 escalation)
        ├─ Reads ESCALATION-* file
        ├─ Reviews Agent 2 and 5 outputs
        ├─ Makes decision: "Use UUID everywhere"
        ├─ Updates AUTONOMOUS-NEXT-TASKS.md:
        │  - "Agent 5: Re-implement using UUID (see escalation resolution)"
        ├─ Renames: ESCALATION-* → RESOLVED-data-model-conflict.md
        ├─ Commits: "[ESCALATION-RESOLVED] UUID standardization"
        ├─ Comments on GitHub issue with decision
        └─ Closes issue

t=10min: Agent 5 detects:
         ├─ Polls AUTONOMOUS-NEXT-TASKS.md
         ├─ Sees: "RESOLVED-data-model-conflict.md"
         ├─ Reads resolution: "Use UUID everywhere"
         ├─ Re-implements using UUID
         ├─ Commits: "[SESSION-4-AGENT-5] Data model UUID compliance"
         └─ Resumes normal execution

t=60min: All agents synchronized on UUID standard
         └─ Session continues normally
```

---

## File Naming Conventions

### AUTONOMOUS-NEXT-TASKS.md

**Structure:** One section per agent, updated frequently
```markdown
## Agent N: [Feature Name]
**Status:** ✅ COMPLETE | 🟡 IN-PROGRESS | 🟡 READY | 🔴 BLOCKED
**Last Update:** [timestamp]
**Owner:** [Session]-H[number]

### Current Tasks
- [x] Completed subtask
- [ ] In-progress subtask
- [ ] Blocked subtask

### Blockers
[What's preventing completion]

### Next Actions
[What agent should do]

### Token Budget Used
- Allocation: X tokens
- Current: Y tokens
- Remaining: Z tokens
```

### Escalation Files

**Pattern:** `intelligence/session-X/ESCALATION-[brief-description].md`

**When created:** Agent detects critical issue
**When resolved:** Renamed to `RESOLVED-[brief-description].md`
**Format:**
```markdown
# ESCALATION: [Issue Title]
**Agent:** [Session-Agent ID]
**Severity:** P0 | P1 | P2
**Created:** [timestamp]
**Deadline:** [timestamp]

## Problem
[Detailed description of issue]

## Impact
[Which agents blocked, which sessions affected]

## Proposed Solutions
1. [Option A with pros/cons]
2. [Option B with pros/cons]
3. [Option C with pros/cons]

## Recommendation
[Which option is best and why]
```

### Agent Output Files

**Pattern:** `intelligence/session-X/[agent-output-topic].md`

**Examples:**
- `intelligence/session-1/market-analysis.md` (Session 1, main analysis)
- `intelligence/session-2/architecture.md` (Session 2, technical design)
- `intelligence/session-3/pitch-deck.md` (Session 3, sales materials)
- `intelligence/session-2/agent-1-output.md` (Specific agent output)

**Structure:**
```markdown
# [Topic]
**Agent:** S[Session]-H[Agent]
**Created:** [timestamp]
**Status:** COMPLETE | IN-PROGRESS | DRAFT

## Executive Summary
[2-3 sentence overview]

## Findings
[Detailed results]

## Recommendations
[What to do with findings]

## Next Steps
[What Agent N+1 should do]

## Citations
[IF.TTT-compliant citations with SHA-256 hashes]
```

### Handoff Files

**Pattern:** `intelligence/session-X/session-X-handoff.md`

**Purpose:** Session X declares completion; next session uses as starting point

**Structure:**
```markdown
# Session X Handoff
**Session:** [X]
**Agents:** S[X]-H01 through S[X]-HN
**Duration:** [HH:MM]
**Token Cost:** $[cost]
**Status:** ✅ COMPLETE

## Key Findings
- [Finding 1 from Agent 1]
- [Finding 2 from Agent 2]
- [Synthesis from Agent 10]

## Deliverables
- [File 1 with location]
- [File 2 with location]
- [File 3 with location]

## Quality Metrics
- Evidence quality: X%
- Consensus: Y%
- Token efficiency: Z%

## For Next Session
[What Session Y should focus on or be aware of]

## Citations
[Complete citation list with IF.TTT compliance]
```

---

## GitHub Issue Management

### Issue Template: agent-ping.md

**Location:** `.github/ISSUE_TEMPLATE/agent-ping.md`

**Auto-populated fields:**
```markdown
---
name: Agent Ping
about: Cloud agent needs local machine action
title: '[AGENT-N] Brief description'
labels: agent-communication
---
```

**Required fields for cloud agents:**
- Agent ID: `S[Session]-H[number]`
- Request Type: BLOCKER | QUESTION | DEPLOY-READY | STATUS-UPDATE | ESCALATION
- Priority: P0 (CRITICAL) | P1 (HIGH) | P2 (MEDIUM) | P3 (LOW)
- Deadline: When decision needed

### Issue Labels

| Label | Meaning | Auto-Close? |
|-------|---------|------------|
| agent-communication | Standard agent ping | No (await response) |
| blocker | Agent cannot proceed | No (needs resolution) |
| escalation | Critical issue | No (needs human decision) |
| question | Agent needs clarification | No (needs answer) |
| deploy-ready | Feature ready to ship | No (needs approval) |
| resolved | Issue has been addressed | Yes (auto-close in 1hr) |
| on-track | Status update, no action needed | Yes (auto-close immediately) |

---

## Network Resilience

### What Happens if GitHub is Unreachable?

```
Scenario: GitHub API down, but origin remote still accessible

Cloud Agent:
1. Attempt to create GitHub issue (FAILS)
2. Fall back to git-based communication:
   - Create file: intelligence/session-X/ISSUE-[id].md
   - Commit and push (uses git, not GitHub API)
3. Local machine still sees notification (git log updated)
4. When GitHub recovers, retry GitHub issue creation

Local Machine:
1. Can still poll via git fetch (doesn't require GitHub API)
2. Can still read AUTONOMOUS-NEXT-TASKS.md and respond
3. Can still read git commits and ISSUE files
```

### What Happens if Network is Down?

```
Scenario: Temporary network outage

Cloud Agent:
1. Queues work locally (agent VM has disk storage)
2. Every 30 seconds: attempts git push
3. When network recovers: pushes all queued commits at once
4. No work is lost; just delayed

Local Machine:
1. Cannot poll for updates (no internet)
2. Agent work continues (independent operation)
3. When network recovers: Danny runs git pull
4. Sees all agent progress in git log
5. Can respond with new AUTONOMOUS-NEXT-TASKS.md
```

---

## Integration Patterns

### Pattern 1: Sequential Dependencies

```
Session 1 (Market Research)
    ↓ [Handoff file created]
Session 2 (Architecture)
    ↓ [Agents 0A-0D provide parallel support while waiting]
Session 3 + Session 4 (UX + Implementation)
    ↓ [Both depend on Sessions 1+2]
Session 5 (Validation)
```

**How it works:**
1. Session 1 Agent 10 creates `intelligence/session-1/session-1-handoff.md`
2. Session 2 Agents 1-9 poll every 5 min for handoff file
3. When file appears, Session 2 proceeds
4. Session 2 Agent 10 creates its own handoff
5. Sessions 3 + 4 poll for Session 2 handoff
6. Continue pattern...

### Pattern 2: Parallel Support (Helper Agents)

```
Session 2 Agents 0A, 0B, 0C, 0D (Helper Agents)
    ↓
Assist Session 1 (validation, citations, web scraping)
    ↓
When Session 1 complete, assist Session 3
    ↓
Cross-session quality and progress monitoring
```

**How it works:**
1. Helper agents check `AUTONOMOUS-NEXT-TASKS.md` every 5 min
2. Identify sessions needing support
3. Provide targeted assistance (validation, citations, research)
4. Report findings back to main agents
5. Continue until all sessions complete

### Pattern 3: Quality Feedback Loop

```
Session 5 Agent 0B (Quality Monitoring)
    ↓
Polls intelligence/session-1/, session-2/, session-3/, session-4/
    ↓
Detects quality issues (missing citations, etc.)
    ↓
Creates QUALITY_FEEDBACK.md (updated every 5 min)
    ↓
Sessions 1-4 detect feedback
    ↓
Fix issues proactively (don't wait for final validation)
```

**How it works:**
1. Session 5 Agent 0B commits `QUALITY_FEEDBACK.md` every 5 minutes
2. Sessions 1-4 poll for `QUALITY_FEEDBACK.md` every 5 minutes
3. If feedback detected, fix issues immediately
4. Re-commit fixed files
5. Session 5 Agent 0B verifies fixes in next feedback round
6. Continuous quality improvement (doesn't wait for end)

---

## Monitoring Dashboard

### For Local Machine (Danny)

**Check every 5 minutes:**
```bash
# Show agent status summary
git log --oneline origin/navidocs-cloud-coordination | head -10

# Show open agent pings (GitHub issues)
gh issue list --state=open --label=agent-communication

# Show escalations
ls -la intelligence/session-*/ESCALATION-*.md 2>/dev/null || echo "No escalations"

# Show task status
git show origin:AUTONOMOUS-NEXT-TASKS.md | grep "Status:" | head -10
```

### For Cloud Agents

**Check every 5 minutes:**
```bash
# Get latest task assignments
git fetch origin navidocs-cloud-coordination
TASKS=$(git show origin:AUTONOMOUS-NEXT-TASKS.md)

# Parse your agent section
MY_AGENT="Agent 2"
MY_SECTION=$(echo "$TASKS" | grep -A 30 "## $MY_AGENT:")

# Extract status
STATUS=$(echo "$MY_SECTION" | grep "Status:" | sed 's/.*Status: //')
BLOCKERS=$(echo "$MY_SECTION" | grep -A 10 "Blockers" | head -5)

# Check for escalations
ESCALATIONS=$(git show origin:intelligence/session-2/ 2>/dev/null | \
  grep -l "ESCALATION" || echo "none")
```

---

## Security & Access Control

### Git Branch Access

**Branch:** `navidocs-cloud-coordination`
- **Push Access:** Cloud sessions (automated), Local machine (Danny)
- **Pull Access:** Public (anyone can read)
- **Protection:** Branch protection enabled (no force push)

### GitHub Issue Access

**Labels:** `agent-communication`
- **Create:** Cloud agents (automated), Local machine
- **Comment:** Cloud agents, Local machine, Reviewers
- **Close:** Only Local machine (signals decision made)

### File Permissions

| File | Read | Write | Why |
|------|------|-------|-----|
| AUTONOMOUS-NEXT-TASKS.md | All | Local only | Controls what agents do |
| intelligence/session-X/*.md | All | Cloud agents | Agent outputs |
| ESCALATION-*.md | All | Cloud agents | Issue escalation |
| RESOLVED-*.md | All | Local only | Marks escalation resolved |

---

## Troubleshooting

### Agent Not Detecting Updates

**Symptom:** Agent still executing old task after 10 minutes

**Diagnosis:**
1. Check if git fetch succeeded: `git fetch origin navidocs-cloud-coordination`
2. Verify file was updated: `git show origin:AUTONOMOUS-NEXT-TASKS.md | grep "## Agent [N]:" -A 5`
3. Check agent polling loop: Is it running? Check process list

**Solution:**
1. Force re-read: `git fetch --force origin`
2. Kill and restart agent process
3. Create manual GitHub issue to wake agent up

### GitHub Issue Not Created

**Symptom:** Agent attempted to create issue but it doesn't appear

**Diagnosis:**
1. Check if GitHub API is accessible: `curl https://api.github.com`
2. Check authentication: `gh auth status`
3. Verify rate limit: `gh api /rate_limit`

**Solution:**
1. If API down: Fall back to git-based ISSUE-*.md files
2. If auth failed: Re-authenticate: `gh auth login`
3. If rate limited: Wait 60 minutes, retry

### Merge Conflicts in AUTONOMOUS-NEXT-TASKS.md

**Symptom:** Push fails with merge conflict

**Diagnosis:**
1. Danny and agent both edited file simultaneously
2. Agent edited old version, Danny updated newer version

**Solution:**
1. Agent: `git pull origin navidocs-cloud-coordination`
2. Agent: Resolve conflicts (keep Danny's latest edits + your new edits)
3. Agent: `git add AUTONOMOUS-NEXT-TASKS.md && git commit && git push`
4. Danny: Verify resolution looks correct

### Escalation File Not Detected

**Symptom:** Agent created ESCALATION-*.md but local machine didn't notice

**Diagnosis:**
1. Check if file exists: `ls intelligence/session-X/ESCALATION-*`
2. Check if git tracked it: `git log -- intelligence/session-X/ESCALATION-*`
3. Verify remote has it: `git ls-tree -r origin:intelligence/session-X/`

**Solution:**
1. Agent: `git add intelligence/session-X/ESCALATION-*.md && git commit && git push`
2. Local: `git pull origin navidocs-cloud-coordination`
3. Local: Verify with `git ls-tree -r origin:intelligence/session-X/`

---

## Appendix: Command Reference

### Local Machine Commands

```bash
# Monitor agent progress
watch -n 300 'git log --oneline origin/navidocs-cloud-coordination | head -10'

# See all agent GitHub issues
gh issue list --state=open --label=agent-communication -R dannystocker/navidocs

# Update tasks for all agents
# (Edit AUTONOMOUS-NEXT-TASKS.md, then:)
git add AUTONOMOUS-NEXT-TASKS.md
git commit -m "[AGENT-SYNC] Update task status for Agents 1-10"
git push origin navidocs-cloud-coordination

# View complete session outputs
ls intelligence/session-*/

# Check for escalations
find intelligence/session-*/ -name "ESCALATION-*"
```

### Cloud Agent Commands

```bash
# Poll for task updates (every 5 minutes)
git fetch origin navidocs-cloud-coordination
git show origin:AUTONOMOUS-NEXT-TASKS.md | grep "## Agent [N]:" -A 30

# Commit completion
git add intelligence/session-X/my-output.md
git commit -m "[SESSION-X-AGENT-N] Task complete: [brief description]"
git push origin navidocs-cloud-coordination

# Check for escalation resolutions
git show origin:intelligence/session-X/RESOLVED-*.md

# Create backup if no network
git add . && git commit -m "[OFFLINE] Local checkpoint: [description]"
# (When network recovers: git push)
```

---

## Document Maintenance

**Owner:** Local Machine Coordinator (Danny)
**Review Frequency:** Every session (every 2-3 hours)
**Update Triggers:**
- New escalation pattern discovered
- Communication failure
- Process improvement
- New integration pattern

**Version History:**
- v1.0 (2025-11-13): Initial framework, 5-session coordination

---

**Status:** ACTIVE - Ready for cloud ↔ local coordination
**Last Updated:** 2025-11-13 11:15 UTC
**Next Review:** 2025-11-13 after Session 1 launches
