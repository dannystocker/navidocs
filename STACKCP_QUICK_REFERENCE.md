# StackCP Deployment: Quick Reference Card

**For**: Fast decision-making during technical debate
**Date**: 2025-10-19

---

## The Core Problem

```
Standard Deployment:          StackCP Reality:
~/navidocs/                   /tmp/navidocs/     ← Code (executable, volatile)
├── server/                   ~/navidocs/        ← Data (noexec, persistent)
├── uploads/
└── db/                       Implications:
                              - npm wrapper needed
                              - Dual-location backups
                              - Code persistence risk
                              - Path abstraction required
```

---

## Three Paths Forward (Decision Matrix)

| Aspect | Path A: Full StackCP | Path B: Hybrid | Path C: VPS |
|--------|---------------------|----------------|-------------|
| **Time to Deploy** | 5-7 days | 3-4 days | 1 day |
| **Monthly Cost** | $0 new | $0 new | $5-6 |
| **Complexity** | High | Medium | Low |
| **Security Risk** | Medium-High | Medium | Low |
| **Technical Debt** | High | Medium | Low |
| **Maintenance** | Ongoing custom | Some custom | Standard |
| **Scalability** | Limited | Good | Excellent |
| **Developer DX** | Poor | Fair | Excellent |

---

## Critical Architectural Changes (All Paths Need Some)

### Required for StackCP (Path A/B)
```javascript
// server/config/paths.js
export const DATABASE_PATH = process.env.DATABASE_PATH ||
  (isStackCP ? '~/navidocs/db/navidocs.db' : './db/navidocs.db');

// Checkpoint script (daily cron)
rsync -av /tmp/navidocs/ ~/navidocs/code-checkpoint/

// Health check (every 6 hours)
if [ ! -f /tmp/navidocs/server/index.js ]; then
  restore_from_checkpoint_or_git
fi
```

### Required for Any Deployment (Good Practice)
```javascript
// Environment-based configuration
const CONFIG = {
  databasePath: process.env.DATABASE_PATH,
  uploadDir: process.env.UPLOAD_DIR,
  logDir: process.env.LOG_DIR
};

// Startup validation
if (!fs.existsSync(CONFIG.databasePath)) {
  throw new Error(`Database path not found: ${CONFIG.databasePath}`);
}
```

---

## Security Risk Assessment

### StackCP-Specific Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| `/tmp` code readable by others | **HIGH** | Open source anyway? |
| Code tampering/replacement | **MEDIUM** | Checksum validation on startup |
| Secrets in `/tmp` symlinks | **HIGH** | Keep `.env` in `~/navidocs/` only |
| External service compromise | **MEDIUM** | Use managed services (Redis Cloud) |

### VPS Risks (for comparison)
| Risk | Impact | Mitigation |
|------|--------|------------|
| Direct internet exposure | **MEDIUM** | Firewall, fail2ban |
| Unpatched vulnerabilities | **MEDIUM** | Auto-updates, monitoring |
| Root access compromise | **HIGH** | SSH keys, no root login |

**Verdict**: VPS has standard, well-understood risks; StackCP has novel risks

---

## Cost Analysis (Real Numbers)

### StackCP Option
```
Setup time:           5-7 days (Path A) or 3-4 days (Path B)
Developer hourly:     $50-100/hour (if billing)
Setup cost:           $2,000-2,800 (5-7 days × 8 hours × $50)
Monthly recurring:    $0 (within free tiers)
Operational time:     2-4 hours/month (monitoring, checkpoints)
Operational cost:     $100-200/month

TOTAL YEAR 1:         $2,000-2,800 (setup) + $1,200-2,400 (ops) = $3,200-5,200
```

### VPS Option
```
Setup time:           1 day
Setup cost:           $400 (1 day × 8 hours × $50)
Monthly recurring:    $6/month (DigitalOcean)
Operational time:     0.5-1 hour/month (standard maintenance)
Operational cost:     $25-50/month

TOTAL YEAR 1:         $400 (setup) + $72 (VPS) + $300-600 (ops) = $772-1,072
```

**Savings with VPS**: $2,400-4,100 in Year 1

---

## Decision Tree

```
START
  |
  ├─ Is StackCP a hard requirement? ────YES──→ Is security acceptable? ──YES──→ Path A/B (StackCP)
  |                                     |                                 └──NO───→ Escalate (need VPS)
  |                                     |
  └─────────────NO──────────────────────┘
                                        |
                                        ├─ Budget < $6/month? ──YES──→ Path A/B (StackCP, accept tradeoffs)
                                        |                       └──NO───→ Path C (VPS recommended)
                                        |
                                        └─ Need containers? ────YES──→ Container platform (Fly.io, Railway)
                                                               └──NO───→ Path C (VPS)
```

---

## Key Questions (Answer in < 5 min)

1. **Why StackCP?** (check all that apply)
   - [ ] Already paying for it (sunk cost)
   - [ ] Cannot afford $6/month VPS
   - [ ] Educational/learning exercise
   - [ ] Other: _______________________

2. **Security posture** (choose one)
   - [ ] Open source project (code exposure OK)
   - [ ] Proprietary algorithms (code must be protected)
   - [ ] Sensitive user data (high security required)

3. **Timeline** (choose one)
   - [ ] Ship MVP in 1 week (VPS recommended)
   - [ ] Ship MVP in 2-3 weeks (StackCP feasible)
   - [ ] No rush (either works)

4. **Long-term vision** (choose one)
   - [ ] Personal/small project (StackCP or VPS fine)
   - [ ] Startup/growth (VPS or container platform)
   - [ ] Enterprise/multi-region (container platform)

5. **Maintenance capacity** (choose one)
   - [ ] Solo dev, minimal time (VPS recommended)
   - [ ] Team, can handle custom ops (StackCP OK)
   - [ ] DevOps team (either works)

---

## Recommendation Algorithm

```python
def recommend_deployment(answers):
    # Hard requirements
    if answers.stackcp_required and not answers.security_acceptable:
        return "ESCALATE: Need VPS but StackCP required"

    if answers.stackcp_required and answers.security_acceptable:
        return "Path B: Hybrid (support StackCP, plan migration)"

    # Budget-driven
    if answers.budget < 6 and answers.timeline > 2_weeks:
        return "Path A: Full StackCP (if time allows)"

    # Default: VPS is simplest
    if answers.timeline <= 1_week or answers.security_high:
        return "Path C: VPS (standard deployment)"

    # Containers for scale
    if answers.long_term == "startup" or answers.long_term == "enterprise":
        return "Container Platform (Fly.io, Railway)"

    # Fallback
    return "Path C: VPS (safest choice)"
```

---

## What Changes in Each Path

### Path A: Full StackCP Adaptation
**Code**:
- ✅ `server/config/paths.js` (centralized)
- ✅ All file operations use config
- ✅ Environment detection (local vs StackCP)
- ✅ Startup validation

**Scripts**:
- ✅ `/tmp/npm` wrapper
- ✅ `checkpoint-navidocs-code` (daily)
- ✅ `check-navidocs-code` (health check)
- ✅ `backup-navidocs-data` (database + uploads)
- ✅ `restore-navidocs` (Git + data restore)

**Docs**:
- ✅ QUICKSTART-STACKCP.md
- ✅ ARCHITECTURE-SUMMARY.md (add constraints)
- ✅ 2-week-launch-plan.md (StackCP steps)

**Cron Jobs**:
- ✅ Daily checkpoint
- ✅ Daily data backup
- ✅ 6-hour health check

### Path B: Hybrid (Recommended Compromise)
**Code**:
- ✅ `server/config/paths.js` (useful everywhere)
- ✅ Environment variables for all paths
- ⚠️ Skip StackCP-specific health checks (document manual recovery)

**Scripts**:
- ✅ `scripts/stackcp/deploy.sh` (StackCP-specific)
- ✅ `scripts/local/dev.sh` (local development)
- ⚠️ Minimal StackCP operational scripts (document, don't automate)

**Docs**:
- ✅ Split local vs StackCP guides
- ✅ Document StackCP as "advanced option"
- ⚠️ Warn about operational complexity

### Path C: VPS (Simplest)
**Code**:
- ⚠️ Optional: Path configuration (good practice, not required)
- ⚠️ No StackCP-specific code

**Scripts**:
- ✅ Standard PM2 ecosystem file
- ✅ Standard systemd service
- ✅ Standard backup script (single location)

**Docs**:
- ✅ Standard VPS deployment guide
- ✅ systemd + PM2 setup
- ✅ Standard operations (restart, logs, backups)

---

## Immediate Actions (Next 60 Minutes)

### If Choosing StackCP
1. **Verify** `/tmp` persistence (ask StackCP support)
2. **Test** `/tmp` permissions (can other users read?)
3. **Create** `server/config/paths.js` (30 min)
4. **Write** `.env.stackcp.example` (15 min)
5. **Draft** checkpoint script (15 min)

### If Choosing VPS
1. **Sign up** DigitalOcean or Linode (5 min)
2. **Deploy** Ubuntu 22.04 droplet (2 min)
3. **Install** Node.js, PM2, Meilisearch, Redis (20 min)
4. **Deploy** NaviDocs with standard process (20 min)
5. **Test** upload + search (13 min)

### If Choosing Container Platform
1. **Create** Dockerfile (20 min)
2. **Test** locally with docker-compose (15 min)
3. **Sign up** Fly.io or Railway (5 min)
4. **Deploy** via CLI (10 min)
5. **Test** production deployment (10 min)

---

## Red Flags (Abort Criteria)

### StackCP is NOT viable if:
- [ ] `/tmp` is cleared daily (code loss risk too high)
- [ ] Cannot get `/tmp/node` to work (no workaround)
- [ ] StackCP blocks long-running processes (workers fail)
- [ ] Security review rejects `/tmp` code exposure
- [ ] Timeline is < 2 weeks (not enough time)

### VPS is NOT viable if:
- [ ] Literally $0 budget (but then how is StackCP paid?)
- [ ] Cannot manage server (no SSH skills)
- [ ] Regulatory requirement for shared hosting (rare)

---

## Final Recommendation (Tech Lead)

**Default Choice: Path C (VPS)**

**Reasons**:
1. **Time**: 1 day vs 5-7 days (4-6 days saved)
2. **Cost**: $772/year vs $3,200/year (77% savings)
3. **Security**: Standard risks vs novel risks
4. **Maintenance**: Standard ops vs custom scripts
5. **Scalability**: Easy horizontal scaling vs limited

**Acceptable Alternative: Path B (Hybrid)**

**If**:
- StackCP is already paid for (sunk cost)
- Educational value is important (learn constraints)
- Timeline allows 3-4 days
- Security risks are acceptable (open source project)

**NOT Recommended: Path A (Full StackCP)**

**Unless**:
- StackCP is absolute hard requirement (contractual?)
- Have dedicated team for custom operations
- Plan to productize StackCP deployment (sell as service)

---

## Debate Checklist

Before ending debate, ensure consensus on:
- [ ] **Chosen path**: A, B, or C?
- [ ] **Timeline**: When to complete implementation?
- [ ] **Owner**: Who implements the chosen path?
- [ ] **Review**: Who reviews security/architecture?
- [ ] **Fallback**: What if chosen path fails?
- [ ] **Metrics**: How to measure success?

---

**Prepared by**: Tech Lead
**Decision Time**: < 30 minutes recommended
**Implementation Start**: Immediately after decision
