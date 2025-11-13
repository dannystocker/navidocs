# NaviDocs Cloud Sessions - Intra-Agent Communication Protocol
**Based on:** InfraFabric IF.bus + SWARM-COMMUNICATION-SECURITY.md
**Status:** ✅ READY - Apply to all 5 cloud sessions
**Generated:** 2025-11-13

---

## Why Intra-Agent Communication is Critical

**Key Insight from InfraFabric:**
> "Intra-agent communication enables specialized agents to challenge each other's evidence, preventing single-agent hallucinations from becoming consensus reality. Without it, you get 9 agents making 9 independent mistakes instead of 1 collective truth."

**For NaviDocs Sessions:**
- **Agent 1 (Market Research)** finds "Prestige yachts sell for €250K"
- **Agent 2 (Competitor Analysis)** finds ads showing €1.5M prices
- **WITHOUT communication:** Both reports go to synthesis unchallenged
- **WITH communication:** Agent 2 sends CHALLENGE → Evidence.Agent detects 500% variance → ESCALATE to Sonnet coordinator

---

## IFMessage Schema for NaviDocs Swarms

### Base Message Structure

```json
{
  "performative": "inform",
  "sender": "if://agent/session-1/haiku-3",
  "receiver": ["if://agent/session-1/haiku-10"],
  "conversation_id": "if://conversation/navidocs-session-1-2025-11-13",
  "topic": "if://topic/session-1/market-research/owner-pain-points",
  "protocol": "fipa-request",
  "content": {
    "task": "Owner pain points analysis",
    "claim": "Inventory tracking prevents €15K-€50K forgotten value at resale",
    "evidence": [
      "https://yachtworld.com/forums/thread-12345",
      "https://thetraderonline.com/boats/resale-value-mistakes"
    ],
    "confidence": 0.85,
    "cost_tokens": 1247
  },
  "citation_ids": ["if://citation/inventory-pain-point-2025-11-13"],
  "timestamp": "2025-11-13T10:00:00Z",
  "sequence_num": 3,
  "trace_id": "s1-h03-001"
}
```

### Speech Acts (FIPA-ACL Performatives)

**Available Performatives:**
1. **inform** - Agent shares findings with others
2. **request** - Agent asks another agent for help/data
3. **query-if** - Agent asks if claim is true
4. **confirm** - Agent verifies another agent's claim
5. **disconfirm** - Agent challenges another agent's claim
6. **propose** - Agent suggests approach/solution
7. **agree** - Agent confirms proposal
8. **refuse** - Agent declines request (with reason)
9. **ESCALATE** - Agent flags critical conflict for Sonnet coordinator

### Example Communication Flows

#### Flow 1: Multi-Source Verification (Session 1, Agents 1→10)

```yaml
# Agent 1 (S1-H01): Market sizing
- performative: "inform"
  content:
    claim: "Mediterranean yacht sales €2.3B annually"
    evidence: ["https://yacht-market-report.com/2024"]
    confidence: 0.70  # Only 1 source
  receiver: ["if://agent/session-1/haiku-10"]  # Synthesis agent

# Agent 10 (S1-H10) detects low confidence, requests verification
- performative: "request"
  content:
    task: "Verify market size claim with 2nd source"
    reason: "IF.TTT requires 2+ sources for high-value claims"
  receiver: ["if://agent/session-1/haiku-2"]  # Competitor analysis agent

# Agent 2 (S1-H02) searches competitor reports
- performative: "confirm"
  content:
    original_claim: "Mediterranean yacht sales €2.3B annually"
    evidence: ["https://statista.com/yacht-market-europe-2024"]
    confidence: 0.90  # Now 2 sources
  receiver: ["if://agent/session-1/haiku-10"]

# Agent 10 synthesizes
- performative: "inform"
  content:
    claim: "Mediterranean yacht sales €2.3B annually (VERIFIED)"
    sources: 2
    confidence: 0.90
  receiver: ["if://agent/session-1/coordinator"]  # Sonnet
```

#### Flow 2: Cross-Domain Validation (Session 2, Agents 2→4)

```yaml
# Agent 2 (S2-H02): Inventory tracking design
- performative: "propose"
  content:
    feature: "Inventory tracking via manual entry forms"
    rationale: "Simple, no OCR complexity"
  receiver: ["if://agent/session-2/haiku-4"]  # Camera integration agent

# Agent 4 (S2-H04) challenges with camera capability
- performative: "disconfirm"
  content:
    original_proposal: "Manual entry only"
    challenge: "Camera feeds can auto-detect equipment (tender, electronics) via CV"
    evidence: ["OpenCV boat equipment detection models"]
    alternative: "Hybrid: Manual + camera-assisted auto-detection"
  receiver: ["if://agent/session-2/haiku-2", "if://agent/session-2/haiku-10"]

# Agent 2 revises proposal
- performative: "agree"
  content:
    revised_proposal: "Inventory tracking: Manual entry + camera-assisted CV detection"
    integration_point: "Use S2-H04's camera feed for equipment detection"
  receiver: ["if://agent/session-2/haiku-10"]
```

#### Flow 3: ESCALATE Protocol (Session 1, Conflict Detection)

```yaml
# Agent 1 (S1-H01): Market research
- performative: "inform"
  content:
    claim: "Jeanneau Prestige 40-50ft price range €250K-€480K"
    evidence: ["YachtWorld listing (1 data point)"]
    confidence: 0.65

# Agent 3 (S1-H03): Owner pain points
- performative: "inform"
  content:
    claim: "Owner quoted €15K forgotten tender on €1.5M boat resale"
    evidence: ["Forum post, broker interview"]
    confidence: 0.75

# Agent 10 (S1-H10) detects conflict (€250K vs €1.5M = 500% variance)
- performative: "ESCALATE"
  content:
    conflict_type: "Price range inconsistency"
    agent_1_claim: "€250K-€480K (S1-H01)"
    agent_3_claim: "€1.5M boat (S1-H03)"
    variance: "500%"
    requires_resolution: true
    recommendation: "Re-search YachtWorld/Boat Trader for Prestige 40-50ft ACTUAL sale prices"
  receiver: ["if://agent/session-1/coordinator"]  # Sonnet resolves

# Sonnet coordinator investigates
- performative: "request"
  content:
    task: "Search YachtWorld ads for Jeanneau Prestige 50 SOLD listings"
    priority: "high"
  receiver: ["if://agent/session-1/haiku-1"]

# Agent 1 re-searches
- performative: "inform"
  content:
    claim: "Jeanneau Prestige 50 price range €800K-€1.5M (CORRECTED)"
    evidence: [
      "YachtWorld: Prestige 50 sold €1.2M (2024)",
      "Boat Trader: Prestige 50 sold €950K (2023)"
    ]
    confidence: 0.95
    note: "Previous €250K estimate was for smaller Jeanneau models, NOT Prestige line"
  receiver: ["if://agent/session-1/haiku-10", "if://agent/session-1/coordinator"]
```

---

## Communication Patterns by Session

### Session 1: Market Research (Distributed Intelligence)

**C-UAS Pattern:** DETECT → TRACK → IDENTIFY → SYNTHESIZE

```
S1-H01 (Market Size) ────┐
S1-H02 (Competitors) ────┤
S1-H03 (Pain Points) ────┤
S1-H04 (Inventory ROI) ──┼──→ S1-H10 (Evidence Synthesis) ──→ Sonnet (Final Report)
S1-H05 (Sticky Features) ┤           ↓
S1-H06 (Search UX) ───────┤      ESCALATE (if conflicts)
S1-H07 (Pricing) ─────────┤           ↓
S1-H08 (Home Assistant) ──┤      Sonnet Resolves
S1-H09 (Objections) ──────┘
```

**Key Communication Flows:**
1. **Agents 1-9 → Agent 10:** Send findings with confidence scores
2. **Agent 10 → Agents 1-9:** Request verification if confidence <0.75
3. **Agent 10 → Sonnet:** ESCALATE conflicts (>20% variance)
4. **Sonnet → Agent X:** Request re-investigation with specific instructions

### Session 2: Technical Architecture (Collaborative Design)

**Wu Lun Pattern (Confucian Relationships):** Peer review + hierarchical approval

```
S2-H01 (Codebase) ──────→ S2-H10 (Synthesis)
                          ↓
S2-H02 (Inventory) ─────→ S2-H04 (Cameras) ─┐
   ↓ propose                ↓ challenge      │
   ↓                        ↓                 ├──→ S2-H10 ──→ Sonnet
S2-H03 (Maintenance) ────→ S2-H05 (Contacts) ┘
   ↓ propose                ↓ validate

S2-H06 (Expense) ────────→ S2-H07 (Search UX) ──→ S2-H10
   ↓ propose                ↓ challenge (avoid long lists!)
```

**Key Communication Flows:**
1. **Design Proposals:** Agents 2-7 propose features
2. **Peer Review:** Adjacent agents challenge/validate designs
3. **Integration Checks:** Agent 10 ensures no conflicts (e.g., inventory + cameras)
4. **Sonnet Approval:** Final architecture review

### Session 3: UX/Sales (Adversarial Testing)

**Pattern:** Pitch → Objection → Counter-objection → Refinement

```
S3-H01 (Pitch Deck) ──────→ S3-H05 (Objection Handling) ──→ S3-H10
   ↓ pitch                     ↓ challenges ("Why not use X?")

S3-H03 (ROI Calculator) ────→ S3-H05 (Validate assumptions)
   ↓ claims                    ↓ verify

S3-H04 (Demo Script) ────────→ S3-H06 (Success Stories) ──→ S3-H10
   ↓ flow                      ↓ validate against real cases
```

**Key Communication Flows:**
1. **Pitch → Objection:** Agent 5 challenges every pitch claim
2. **ROI → Validation:** Agent 5 verifies ROI assumptions with market data
3. **Demo → Testing:** Agent 6 checks if demo matches real-world success stories

### Session 4: Implementation (Sprint Coordination)

**Pattern:** Sequential handoffs (Week 1 → Week 2 → Week 3 → Week 4)

```
S4-H01 (Week 1 Sprint) ──→ S4-H02 (Week 2 Sprint)
   ↓ handoff                  ↓ depends on Week 1 deliverables

S4-H02 (Week 2 Sprint) ──→ S4-H03 (Week 3 Sprint)
   ↓ handoff                  ↓ depends on Week 2

S4-H03 (Week 3 Sprint) ──→ S4-H04 (Week 4 Sprint)
   ↓ handoff                  ↓ depends on Week 3

S4-H04 (Week 4 Sprint) ──→ S4-H10 (Integration Testing Plan)
```

**Key Communication Flows:**
1. **Week Handoffs:** Each week agent sends deliverables + blockers to next week
2. **Dependency Checks:** Week N checks if Week N-1 unblocks their tasks
3. **Agent 10 Synthesis:** Ensure 4-week roadmap is coherent

### Session 5: Guardian Validation (Consensus Building)

**Pattern:** Individual reviews → Debate → Vote → Synthesis

```
Core Guardians (1-6) ────┐
Western Philosophers ─────┤
Eastern Philosophers ─────┼──→ IF.sam Debate ──→ S5-H10 (Consensus Report)
IF.sam Facets (8) ────────┘        ↓
                              ESCALATE (if <80% consensus)
                                    ↓
                              Sonnet Mediates
```

**Key Communication Flows:**
1. **Review → Debate:** Each guardian sends critique to IF.sam board
2. **IF.sam Synthesis:** Debate among 8 facets (Light Side vs Dark Side)
3. **Vote → Consensus:** Agent 10 tallies votes, checks for >80% threshold
4. **ESCALATE:** If consensus fails, Sonnet mediates

---

## IF.TTT Compliance

### Every Message Must Include:

1. **citation_ids:** Links to evidence sources
2. **confidence:** Explicit score (0.0-1.0)
3. **evidence:** Observable artifacts (URLs, file:line, git commits)
4. **trace_id:** Unique identifier for audit trail

### Signature Requirements (Anti-Forgery):

```json
{
  "signature": {
    "algorithm": "ed25519",
    "public_key": "ed25519:AAAC3NzaC1...",
    "signature_bytes": "ed25519:p9RLz6Y4...",
    "signed_fields": [
      "performative", "sender", "receiver",
      "content", "citation_ids", "timestamp"
    ]
  }
}
```

**Why:** Prevents agent impersonation, ensures non-repudiation

---

## Token Cost Tracking (IF.optimise)

**Every message includes:**
```json
{
  "cost_tokens": 1247,
  "model": "haiku",
  "efficiency_score": 0.82  // tokens_used / tokens_budgeted
}
```

**Agent 10 (Synthesis) tracks total:**
```json
{
  "session_cost": {
    "total_tokens": 52450,
    "total_usd": 0.86,
    "budget_remaining": 14.14,
    "efficiency": "71% Haiku delegation ✅"
  }
}
```

---

## Error Handling & Resilience (Stoic Prudence)

### Retry Policy (Exponential Backoff)

```yaml
request:
  retry_attempts: 3
  backoff: [1s, 5s, 15s]
  on_failure: "ESCALATE to coordinator"
```

### Timeout Policy

```yaml
message_timeout:
  inform: 60s       # Simple findings
  request: 300s     # Complex queries (web search, etc.)
  ESCALATE: 30s     # Critical conflicts need fast resolution
```

### Graceful Degradation

**If Agent X doesn't respond:**
1. **Agent 10 proceeds** with available data
2. **Flags missing input:** "S1-H07 pricing analysis: TIMEOUT (not included in synthesis)"
3. **ESCALATE to Sonnet:** "Agent 7 unresponsive - proceed without pricing?"

---

## Implementation Instructions for Session Coordinators

### Sonnet Coordinator Responsibilities:

1. **Spawn agents with IF.bus protocol:**
```python
await spawn_agent(
    agent_id="if://agent/session-1/haiku-3",
    task="Owner pain points analysis",
    communication_protocol="IF.bus",
    topics=["if://topic/session-1/market-research"]
)
```

2. **Monitor message bus for ESCALATEs:**
```python
while session_active:
    messages = await poll_messages(topic="if://topic/escalations")
    for msg in messages:
        if msg.performative == "ESCALATE":
            await resolve_conflict(msg)
```

3. **Track token costs:**
```python
total_cost = sum(msg.content.cost_tokens for msg in all_messages)
if total_cost > budget_threshold:
    await alert_user(f"Session {session_id} approaching budget limit")
```

### Haiku Agent Responsibilities:

1. **Check in with identity:**
```python
await send_message(
    performative="inform",
    content="I am S1-H03, assigned to Owner Pain Points Analysis",
    receiver="if://agent/session-1/coordinator"
)
```

2. **Send findings to synthesis agent:**
```python
await send_message(
    performative="inform",
    content={
        "claim": "Inventory tracking prevents €15K-€50K loss",
        "evidence": ["..."],
        "confidence": 0.85
    },
    receiver="if://agent/session-1/haiku-10"  # Always send to Agent 10
)
```

3. **Respond to verification requests:**
```python
requests = await poll_messages(receiver_filter="if://agent/session-1/haiku-3")
for req in requests:
    if req.performative == "request":
        result = await process_request(req.content.task)
        await send_message(
            performative="confirm",
            content=result,
            receiver=req.sender  # Reply to requester
        )
```

---

## Testing the Protocol

### Minimal Viable Test (Session 1, 3 agents)

**Scenario:** Detect price conflict and ESCALATE

```python
# Agent 1: Report low price
S1_H01.send("inform", claim="Prestige 50 price €250K")

# Agent 3: Report high price
S1_H03.send("inform", claim="Owner has €1.5M Prestige 50")

# Agent 10: Detect conflict
variance = (1.5M - 250K) / 250K  # 500%
if variance > 0.20:
    S1_H10.send("ESCALATE", content="500% price variance")

# Sonnet: Resolve
Sonnet.send("request", task="Re-search YachtWorld for Prestige 50 SOLD prices", receiver="S1-H01")
```

**Expected Result:**
- Agent 10 detects conflict
- Sonnet receives ESCALATE
- Agent 1 re-investigates
- Corrected price €800K-€1.5M reported

---

## Benefits Summary

**Without Intra-Agent Communication:**
- 10 agents make 10 independent mistakes
- Conflicts undetected until human reviews
- Low confidence claims go unchallenged
- Single-source hallucinations propagate

**With IF.bus Protocol:**
- Agent 10 detects conflicts automatically (>20% variance → ESCALATE)
- Multi-source verification enforced (IF.TTT requirement)
- Cross-domain validation (Agent 4 challenges Agent 2 designs)
- Token costs tracked in real-time (IF.optimise)
- Cryptographic integrity (Ed25519 signatures)

**Result:** Higher quality intelligence, faster conflict resolution, medical-grade evidence standards.

---

## Next Steps

1. **Update all 5 cloud session files** with IF.bus communication protocol
2. **Add message examples** to each agent's task description
3. **Update Agent 10 (Synthesis)** to include conflict detection logic
4. **Test with Session 1** (market research) before launching Sessions 2-5

**Files to Update:**
- `CLOUD_SESSION_1_MARKET_RESEARCH.md` - Add IF.bus protocol section
- `CLOUD_SESSION_2_TECHNICAL_INTEGRATION.md` - Add peer review flow
- `CLOUD_SESSION_3_UX_SALES_ENABLEMENT.md` - Add adversarial testing
- `CLOUD_SESSION_4_IMPLEMENTATION_PLANNING.md` - Add sprint handoffs
- `CLOUD_SESSION_5_SYNTHESIS_VALIDATION.md` - Add consensus protocol

---

**Citation:** if://doc/navidocs/swarm-communication-protocol-2025-11-13
**References:**
- `/home/setup/infrafabric/docs/SWARM-COMMUNICATION-SECURITY.md`
- `/home/setup/infrafabric/docs/INTRA-AGENT-COMMUNICATION-VALUE-ANALYSIS.md`
- `/home/setup/infrafabric/docs/HAIKU-SWARM-TEST-FRAMEWORK.md`
