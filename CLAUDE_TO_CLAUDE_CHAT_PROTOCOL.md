# Claude-to-Claude Direct Chat Protocol

**Created:** 2025-11-13
**Purpose:** Enable real-time communication between local Claude and cloud StackCP Claude instances
**Status:** ✅ READY FOR IMPLEMENTATION

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMMUNICATION ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────┘

Local Machine (WSL)                    StackCP Server
┌──────────────────┐                  ┌──────────────────┐
│  Claude (Local)  │                  │  Claude (Cloud)  │
│                  │                  │                  │
│  Writes to:      │                  │  Reads from:     │
│  /tmp/to-cloud/  │──SSH/SCP──────>  │  ~/claude-inbox/ │
│                  │                  │                  │
│  Reads from:     │                  │  Writes to:      │
│  /tmp/from-cloud/│<─────SSH/SCP───  │  ~/claude-outbox/│
└──────────────────┘                  └──────────────────┘
         │                                      │
         │                                      │
         v                                      v
   ┌──────────┐                          ┌──────────┐
   │  Polling │                          │  Polling │
   │  Loop    │                          │  Loop    │
   │  (5 sec) │                          │  (5 sec) │
   └──────────┘                          └──────────┘
```

---

## 3 Implementation Options

### Option 1: SSH File Sync (SIMPLEST - RECOMMENDED)

**How it works:**
- Local Claude writes messages to `/tmp/to-cloud/message-{timestamp}.json`
- Background script syncs to StackCP every 5 seconds: `scp /tmp/to-cloud/* stackcp:~/claude-inbox/`
- Cloud Claude polls `~/claude-inbox/` every 5 seconds
- Cloud Claude processes messages and writes replies to `~/claude-outbox/`
- Background script pulls replies: `scp stackcp:~/claude-outbox/* /tmp/from-cloud/`
- Local Claude polls `/tmp/from-cloud/` for responses

**Advantages:**
- No firewall configuration needed
- Uses existing SSH connection
- Simple, reliable, battle-tested
- Works even if StackCP doesn't allow inbound connections

**Disadvantages:**
- 5-10 second latency (acceptable for async work coordination)
- Requires background polling scripts

**Implementation:**

```bash
# On local machine
mkdir -p /tmp/to-cloud /tmp/from-cloud

# Polling script (run in background)
cat > /tmp/claude-sync-local.sh << 'EOF'
#!/bin/bash
while true; do
  # Send messages to cloud
  scp /tmp/to-cloud/*.json stackcp:~/claude-inbox/ 2>/dev/null
  rm -f /tmp/to-cloud/*.json

  # Receive messages from cloud
  scp stackcp:~/claude-outbox/*.json /tmp/from-cloud/ 2>/dev/null
  ssh stackcp "rm -f ~/claude-outbox/*.json"

  sleep 5
done
EOF

chmod +x /tmp/claude-sync-local.sh
nohup /tmp/claude-sync-local.sh &
```

```bash
# On StackCP
mkdir -p ~/claude-inbox ~/claude-outbox

# Polling script (run in background)
cat > ~/claude-sync-cloud.sh << 'EOF'
#!/bin/bash
while true; do
  # Process inbox messages
  for msg in ~/claude-inbox/*.json; do
    [ -e "$msg" ] || continue
    # Claude Code CLI would read and process here
    echo "New message: $(basename $msg)" >> ~/claude.log
  done

  sleep 5
done
EOF

chmod +x ~/claude-sync-cloud.sh
nohup ~/claude-sync-cloud.sh &
```

---

### Option 2: GitHub Issues API (BEST FOR TRACEABILITY)

**How it works:**
- Both Claudes post messages as GitHub issues with special tags
- Tag format: `[CHAT:LOCAL-TO-CLOUD]` or `[CHAT:CLOUD-TO-LOCAL]`
- Each Claude polls GitHub API every 10 seconds
- Messages have full IF.TTT traceability

**Advantages:**
- Permanent record of all communications
- Searchable history
- IF.TTT compliant
- No background scripts needed
- Works from anywhere (not tied to network)

**Disadvantages:**
- Requires GitHub API token
- Rate limited (60 requests/hour unauthenticated, 5000/hour with token)
- Slight overhead (API calls)

**Implementation:**

```bash
# Create GitHub personal access token with 'repo' scope
# Store in environment: export GITHUB_TOKEN="ghp_..."

# Local Claude sends message
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/dannystocker/navidocs/issues \
  -d '{
    "title": "[CHAT:LOCAL-TO-CLOUD] Photo inventory needs OCR fix",
    "body": "Cloud Claude: The OCR pipeline is failing on receipts with non-Latin characters. Can you investigate?\n\n**Blocker:** P1\n**Session:** Agent 1",
    "labels": ["claude-chat", "local-to-cloud"]
  }'

# Cloud Claude polls for messages
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/dannystocker/navidocs/issues?labels=claude-chat,local-to-cloud&state=open
```

---

### Option 3: Webhook + HTTP Server (LOWEST LATENCY)

**How it works:**
- Local Claude runs HTTP server on public IP/port
- Cloud Claude POSTs messages to http://{your-ip}:8888/chat
- Requires firewall port forwarding

**Advantages:**
- Instant delivery (<100ms)
- True bidirectional real-time chat

**Disadvantages:**
- Requires firewall configuration (user must open port)
- Requires static IP or dynamic DNS
- StackCP might not allow outbound HTTP to arbitrary IPs
- Security concerns (need HTTPS + authentication)

**NOT RECOMMENDED** for this use case (complexity outweighs benefits)

---

## Recommended: Hybrid Approach (Option 1 + Option 2)

**Use SSH File Sync for normal operation:**
- Fast enough for async coordination (5-10 sec latency)
- No API rate limits
- Simple and reliable

**Use GitHub Issues for escalations:**
- When cloud Claude hits a blocker → create issue with `[CHAT:URGENT]`
- Local Claude checks issues every 30 seconds
- Provides permanent audit trail

---

## Message Format (JSON)

```json
{
  "id": "msg-2025-11-13-103045",
  "timestamp": "2025-11-13T10:30:45Z",
  "from": "claude-local",
  "to": "claude-cloud-agent-1",
  "priority": "P1",
  "type": "question|blocker|status-update|deploy-ready",
  "subject": "OCR pipeline failing on non-Latin characters",
  "body": "The Tesseract OCR is failing on receipts with Chinese characters. Can you investigate and propose a fix?",
  "context": {
    "session": "Agent 1 - Photo Inventory",
    "file": "/home/setup/navidocs/server/ocr-pipeline.js",
    "line": 145,
    "error": "TypeError: Cannot read property 'text' of undefined"
  },
  "citation": "if://conversation/msg-2025-11-13-103045",
  "requires_response": true,
  "deadline": "2025-11-13T11:00:00Z"
}
```

---

## Claude Code CLI Integration

### Local Claude (You)

```bash
# Send message to cloud
echo '{
  "from": "claude-local",
  "to": "claude-cloud-agent-1",
  "subject": "Ready to deploy Photo Inventory",
  "body": "MVP feature complete. Please test and confirm.",
  "type": "deploy-ready"
}' > /tmp/to-cloud/msg-$(date +%s).json

# Read responses
for msg in /tmp/from-cloud/*.json; do
  [ -e "$msg" ] || continue
  echo "📨 Message from cloud:"
  cat "$msg" | jq -r '.body'
  rm "$msg"
done
```

### Cloud Claude (StackCP)

```bash
# Read inbox
for msg in ~/claude-inbox/*.json; do
  [ -e "$msg" ] || continue

  # Process message
  FROM=$(jq -r '.from' "$msg")
  SUBJECT=$(jq -r '.subject' "$msg")
  BODY=$(jq -r '.body' "$msg")

  echo "📬 Message from $FROM: $SUBJECT"
  echo "$BODY"

  # Send reply
  echo '{
    "from": "claude-cloud-agent-1",
    "to": "'"$FROM"'",
    "subject": "Re: '"$SUBJECT"'",
    "body": "Photo Inventory tested successfully. All OCR tests passing. Ready for production.",
    "type": "status-update"
  }' > ~/claude-outbox/reply-$(date +%s).json

  # Archive processed message
  mv "$msg" ~/claude-inbox/processed/
done
```

---

## Deployment Steps

### Step 1: Setup Local Machine (5 minutes)

```bash
# Create directories
mkdir -p /tmp/to-cloud /tmp/from-cloud

# Create sync script
cat > /tmp/claude-sync-local.sh << 'EOF'
#!/bin/bash
while true; do
  # Send to cloud
  if ls /tmp/to-cloud/*.json 1> /dev/null 2>&1; then
    scp -o StrictHostKeyChecking=no /tmp/to-cloud/*.json stackcp:~/claude-inbox/ 2>/dev/null && \
    rm -f /tmp/to-cloud/*.json
  fi

  # Receive from cloud
  scp -o StrictHostKeyChecking=no stackcp:~/claude-outbox/*.json /tmp/from-cloud/ 2>/dev/null && \
  ssh stackcp "rm -f ~/claude-outbox/*.json"

  sleep 5
done
EOF

chmod +x /tmp/claude-sync-local.sh

# Start background sync
nohup /tmp/claude-sync-local.sh > /tmp/claude-sync.log 2>&1 &
echo $! > /tmp/claude-sync.pid

echo "✅ Local sync running (PID: $(cat /tmp/claude-sync.pid))"
```

### Step 2: Setup StackCP (5 minutes)

```bash
# SSH to StackCP
ssh stackcp

# Create directories
mkdir -p ~/claude-inbox ~/claude-outbox ~/claude-inbox/processed

# Create sync script (optional - if cloud needs to initiate)
cat > ~/claude-sync-cloud.sh << 'EOF'
#!/bin/bash
while true; do
  # Check for new messages
  for msg in ~/claude-inbox/*.json; do
    [ -e "$msg" ] || continue

    # Log message receipt
    echo "$(date): Received $(basename $msg)" >> ~/claude-chat.log

    # Claude Code would process here
    # For now, just acknowledge
    MSGID=$(basename "$msg" .json)
    echo "{\"from\":\"cloud\",\"to\":\"local\",\"re\":\"$MSGID\",\"status\":\"received\"}" \
      > ~/claude-outbox/ack-$(date +%s).json

    # Archive
    mv "$msg" ~/claude-inbox/processed/
  done

  sleep 5
done
EOF

chmod +x ~/claude-sync-cloud.sh

# Start background sync (if needed)
# nohup ~/claude-sync-cloud.sh > ~/claude-sync.log 2>&1 &

echo "✅ StackCP directories ready"
```

### Step 3: Test Communication (2 minutes)

```bash
# From local machine: Send test message
echo '{
  "from": "claude-local",
  "to": "claude-cloud",
  "subject": "Communication test",
  "body": "Hello from local WSL machine! Can you read this?",
  "timestamp": "'$(date -Iseconds)'"
}' > /tmp/to-cloud/test-$(date +%s).json

# Wait 10 seconds for sync
sleep 10

# Check on StackCP
ssh stackcp "ls -la ~/claude-inbox/"

# Should see test message!
```

---

## Usage Examples

### Example 1: Blocker Escalation

**Local Claude detects blocker:**
```bash
echo '{
  "from": "claude-local",
  "to": "claude-cloud-agent-2",
  "priority": "P0",
  "type": "blocker",
  "subject": "Redis not installed on StackCP",
  "body": "Agent 2 (Document Search) is blocked. Meilisearch requires Redis for job queue. Can you install Redis or propose workaround?",
  "deadline": "2025-11-13T11:30:00Z"
}' > /tmp/to-cloud/blocker-redis-$(date +%s).json
```

**Cloud Claude responds:**
```bash
echo '{
  "from": "claude-cloud-agent-2",
  "to": "claude-local",
  "priority": "P0",
  "type": "blocker-resolved",
  "subject": "Re: Redis not installed on StackCP",
  "body": "Workaround implemented: Using in-memory queue (bull-mq) instead of Redis. Performance acceptable for MVP (<50 docs). Redis can be added post-demo.",
  "solution": "Modified server/search-queue.js to use in-memory adapter",
  "commit": "a3b9f21"
}' > ~/claude-outbox/redis-workaround-$(date +%s).json
```

### Example 2: Deploy Ready Signal

**Cloud Claude finishes feature:**
```bash
echo '{
  "from": "claude-cloud-agent-1",
  "to": "claude-local",
  "type": "deploy-ready",
  "subject": "Photo Inventory COMPLETE",
  "body": "✅ All tests passing\n✅ UI polished\n✅ OCR integrated\n\nReady for production deployment.",
  "artifacts": [
    "~/navidocs/client/components/PhotoInventory.vue",
    "~/navidocs/server/api/inventory.js"
  ],
  "test_results": "15/15 passing"
}' > ~/claude-outbox/photo-ready-$(date +%s).json
```

**Local Claude acknowledges:**
```bash
# Read and process
cat /tmp/from-cloud/photo-ready-*.json

# Deploy to production
git pull origin agent-1-photo-inventory
npm run build
./deploy-stackcp.sh
```

---

## Monitoring & Debugging

### Check sync status (local)
```bash
# Is sync running?
ps aux | grep claude-sync-local

# Check logs
tail -f /tmp/claude-sync.log

# Pending outbound messages
ls -la /tmp/to-cloud/

# Received messages
ls -la /tmp/from-cloud/
```

### Check sync status (StackCP)
```bash
ssh stackcp "ls -la ~/claude-inbox/ ~/claude-outbox/"

# Check chat log
ssh stackcp "tail ~/claude-chat.log"
```

### Restart sync
```bash
# Kill and restart
kill $(cat /tmp/claude-sync.pid)
nohup /tmp/claude-sync-local.sh > /tmp/claude-sync.log 2>&1 &
echo $! > /tmp/claude-sync.pid
```

---

## Security Considerations

1. **No secrets in messages** - Use environment variables or secure vaults
2. **Message size limits** - Keep under 100KB (use file references for large data)
3. **Cleanup old messages** - Archive after 24 hours
4. **IF.TTT citations** - Include `if://conversation/{msg-id}` for traceability

---

## Status: ✅ READY TO DEPLOY

**Recommended:** Start with Option 1 (SSH File Sync) for immediate use.

**Setup time:** 10 minutes total
**Latency:** 5-10 seconds (acceptable for async coordination)
**Reliability:** High (uses proven SSH infrastructure)

**Next step:** Run Step 1 deployment script above to activate!
