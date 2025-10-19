# StackCP Deployment Debate Brief

**For**: Security Expert, OCI Architect, Tech Lead Discussion
**Subject**: NaviDocs Deployment on StackCP Shared Hosting
**Date**: 2025-10-19
**Status**: Awaiting technical consensus

---

## The Situation

NaviDocs was designed with standard deployment assumptions (local services, normal filesystem permissions, VPS-like environment). Recent evaluation of StackCP (20i shared hosting) revealed **critical constraints** that break these assumptions.

**Key Discovery**: Only `/tmp` directory has executable permissions; home directory is mounted `noexec`.

---

## Critical Constraints Summary

### 1. File System Constraints
- **Executable location**: ONLY `/tmp/` (all code, native modules)
- **Persistent storage**: `~/navidocs/` (database, uploads, logs, config)
- **Persistence risk**: `/tmp` may be cleared on reboot
- **Security risk**: `/tmp` is readable by other StackCP users

### 2. Service Constraints
- **No local Redis**: Must use Redis Cloud (free 30MB tier)
- **No local Tesseract**: Must use Google Cloud Vision API (free 1K pages/month)
- **Meilisearch**: Already running on server (bonus)
- **Process manager**: StackCP Node.js Manager (GUI-based) OR manual (nohup)

### 3. Development Constraints
- **npm execution**: Must use `/tmp/node /path/to/npm-cli.js` wrapper
- **Native modules**: Must compile in `/tmp` (better-sqlite3, bcrypt)
- **Path configuration**: All paths must be environment-configurable
- **Deployment**: Code from Git to `/tmp`, data backups to `~`

---

## Architectural Impact

### Code Changes Required (2-3 days)
1. Centralized path configuration (`server/config/paths.js`)
2. Update all file operations to use configurable paths
3. Environment detection (local vs StackCP)
4. Startup validation (fail fast if paths wrong)

### Operational Changes Required (1-2 days)
1. Daily checkpoint script (`/tmp` → `~/code-checkpoint/`)
2. Health check script (detect `/tmp` code loss, auto-recover)
3. Data backup script (SQLite + uploads, NOT code)
4. Restore procedure (Git → `/tmp`, backups → data)

### Documentation Changes Required (1-2 days)
1. Rewrite QUICKSTART.md (split local vs StackCP)
2. Update ARCHITECTURE-SUMMARY.md (add deployment constraints)
3. Revise 2-week-launch-plan.md (StackCP-specific steps)
4. Create deployment runbook

**Total Effort**: 5-7 days focused work

---

## Key Questions for Debate

### For Security Expert:

1. **Risk Assessment**: `/tmp/navidocs` is readable by other StackCP users
   - Threat: Source code exposure (including algorithm logic)
   - Threat: `.env` symlink in `/tmp` could expose secrets
   - Mitigation: Keep secrets in `~/navidocs/.env` (noexec but protected), symlink carefully
   - **Question**: Is this acceptable risk for MVP, or blocker requiring VPS migration?

2. **External Service Security**: Redis Cloud + Google Vision API
   - Benefit: Managed services, professional security
   - Risk: Network dependency, potential service compromise
   - **Question**: Does cloud-first approach meet security requirements?

3. **Code Integrity**: `/tmp` persistence risk
   - Risk: Code could be cleared, replaced, or tampered with
   - Mitigation: Daily checksums, auto-recovery from Git
   - **Question**: Can we trust code integrity in `/tmp`?

### For OCI Architect:

1. **Container Alternative**: Should we abandon StackCP for containerized deployment?
   - Option A: Docker on StackCP (if supported)
   - Option B: Migrate to container hosting (Fly.io, Railway, etc.)
   - Option C: DigitalOcean App Platform (container-based)
   - **Question**: Is the StackCP complexity worth it vs. $5/month VPS?

2. **Architecture Portability**: How to maintain deployment flexibility?
   - Current: Local dev, StackCP prod
   - Future: VPS, Kubernetes, serverless?
   - **Question**: Should we design for StackCP OR design agnostic with StackCP adapter?

3. **Operational Complexity**: Is this maintainable long-term?
   - Custom scripts: checkpoint, health checks, recovery
   - Two-location deployment: `/tmp` + `~`
   - Manual monitoring: /tmp persistence
   - **Question**: Does this operational overhead scale?

### For Tech Lead:

1. **Developer Experience**: How does this affect development workflow?
   - Local dev: Standard npm, relative paths
   - StackCP deploy: Wrapper scripts, absolute paths, manual recovery
   - **Question**: Can we maintain DX while supporting StackCP?

2. **Testing Strategy**: How to test StackCP-specific scenarios?
   - Unit tests: Path configuration
   - Integration tests: Checkpoint/restore
   - E2E tests: Deployment on fresh StackCP account
   - **Question**: What's the minimum viable test coverage?

3. **Rollout Plan**: How to phase this in?
   - Phase 1: Core path configuration (blocks everything else)
   - Phase 2: Operational scripts (enables deployment)
   - Phase 3: Documentation (enables users)
   - Phase 4: Beta test on StackCP (validates assumptions)
   - **Question**: Can we ship without full StackCP support first?

---

## Three Paths Forward

### Path A: Full StackCP Adaptation (5-7 days)
**Pros**:
- Use existing hosting (no new costs)
- Learn shared hosting constraints (educational)
- Meilisearch already running (bonus)

**Cons**:
- Significant architecture changes
- Operational complexity (checkpoint scripts, monitoring)
- Security risks (`/tmp` exposure, external services)
- Technical debt (StackCP-specific code)

**Recommendation**: Only if StackCP hosting is **must-have** constraint

---

### Path B: Hybrid Approach (3-4 days)
**Pros**:
- Design path-agnostic architecture (good practice anyway)
- Support StackCP as deployment option (not primary)
- Maintain standard development workflow
- Easy migration to VPS later

**Cons**:
- Still requires StackCP scripts and documentation
- Testing complexity (multiple environments)
- Partial investment in StackCP-specific tooling

**Recommendation**: Best balance of flexibility and investment

---

### Path C: Abandon StackCP, Use VPS (1 day)
**Pros**:
- Standard deployment (PM2, systemd, local services)
- Better security (isolated environment)
- Simpler operations (single code location)
- Lower technical debt
- Easier to document and support

**Cons**:
- Additional cost ($5-10/month DigitalOcean/Linode)
- Need to manage VPS (updates, security patches)
- Lose Meilisearch bonus (need to install)

**Recommendation**: Simplest path, industry-standard approach

---

## Cost Comparison

### StackCP Deployment (Path A/B)
```
StackCP Hosting:         $X/month (already paying)
Redis Cloud:             $0 (free 30MB tier)
Google Vision API:       $0 (free 1K pages/month)
Development time:        5-7 days (Path A) or 3-4 days (Path B)
Operational overhead:    Ongoing (monitoring, checkpoints)
---
Total new cost:          $0/month
Total time investment:   3-7 days + ongoing maintenance
```

### VPS Deployment (Path C)
```
DigitalOcean Droplet:    $6/month (1GB RAM, 25GB SSD)
  OR Linode Nanode:      $5/month (1GB RAM, 25GB SSD)
Development time:        1 day (standard deployment)
Operational overhead:    Standard (systemd, cron backups)
---
Total new cost:          $5-6/month
Total time investment:   1 day + standard VPS maintenance
```

### Real-World Scenarios

**Small marina (50 manuals/month)**:
- StackCP: $0 new cost, 5-7 days setup + ongoing overhead
- VPS: $6/month, 1 day setup, minimal overhead

**Medium marina (500 manuals/month)**:
- StackCP: May exceed free tiers → $6-10/month for Redis + Vision
- VPS: $6/month, can run all services locally

**Verdict**: VPS is simpler and potentially cheaper at scale

---

## Security Risk Matrix

| Risk | StackCP | VPS |
|------|---------|-----|
| Source code exposure | **HIGH** (`/tmp` readable) | **LOW** (isolated) |
| Secrets exposure | **MEDIUM** (careful symlinks) | **LOW** (standard perms) |
| External service compromise | **MEDIUM** (Redis/Google Cloud) | **LOW** (local services) |
| Code tampering | **MEDIUM** (`/tmp` volatile) | **LOW** (standard deploy) |
| Data breach | **LOW** (same in both) | **LOW** (same in both) |
| DDoS vulnerability | **LOW** (shared IP protected) | **MEDIUM** (direct exposure) |

**Overall Security**: VPS is more secure for production data

---

## Technical Debt Analysis

### StackCP-Specific Technical Debt
1. **Path configuration abstraction** (useful everywhere, low debt)
2. **Checkpoint/recovery scripts** (StackCP-only, medium debt)
3. **npm wrapper scripts** (StackCP-only, low debt)
4. **Dual-location deployment logic** (StackCP-only, high debt)
5. **Health checks for /tmp loss** (StackCP-only, medium debt)
6. **StackCP-specific documentation** (maintenance burden)

**Debt Score**: Medium-High (some useful, some waste)

### VPS Technical Debt
1. **Standard systemd services** (industry standard, no debt)
2. **Standard backup scripts** (reusable, no debt)
3. **PM2 process management** (industry standard, no debt)
4. **VPS-specific documentation** (broadly useful, low debt)

**Debt Score**: Low (standard practices)

---

## Recommendations for Debate

### Tech Lead Perspective

**Recommended Path**: **Path C (VPS)** for production, **Path B (Hybrid)** if StackCP is required

**Reasoning**:
1. **Developer Experience**: VPS maintains standard workflow, StackCP requires special handling
2. **Time Investment**: 1 day (VPS) vs 5-7 days (StackCP) for same functionality
3. **Operational Complexity**: VPS is industry-standard, StackCP requires custom tooling
4. **Technical Debt**: VPS has minimal debt, StackCP accumulates StackCP-specific code
5. **Security**: VPS provides better isolation and code integrity

**Compromise Position** (if StackCP is required):
- Implement **Path B (Hybrid)**: Path-agnostic core, StackCP adapter
- Design for portability (easy VPS migration later)
- Document StackCP as "advanced deployment option"
- Use StackCP for MVP, migrate to VPS if successful

### Security Considerations

**Red Flags for StackCP**:
1. `/tmp` code exposure to other users
2. Code integrity concerns (volatility, tampering)
3. External service dependencies (attack surface)

**Acceptable if**:
- No sensitive algorithms in code (open source anyway?)
- Secrets properly protected in `~/navidocs/.env`
- Health checks validate code integrity on startup
- External services use strong authentication

### OCI Considerations

**StackCP is NOT container-friendly**:
- No Docker support on shared hosting
- Custom deployment model doesn't align with container best practices
- Better alternatives: Fly.io ($0-5/month), Railway ($5/month), Render ($7/month)

**If containerization is a goal**: Skip StackCP entirely, use container platform from day 1

---

## Decision Framework

### Choose StackCP IF:
- [ ] Already paying for StackCP hosting (sunk cost)
- [ ] Cannot afford $5/month VPS (budget constraint)
- [ ] Educational value of shared hosting constraints (learning)
- [ ] Willing to accept security tradeoffs (low-risk data)
- [ ] Have 5-7 days to invest in adaptation

### Choose VPS IF:
- [ ] Production security is priority (sensitive data)
- [ ] Want standard deployment model (less complexity)
- [ ] Need local services (Redis, Tesseract)
- [ ] Future scalability important (easy horizontal scaling)
- [ ] Want to ship MVP quickly (1 day vs 5-7 days)

### Choose Container Platform IF:
- [ ] Want modern deployment model (Dockerfile, Git push deploy)
- [ ] Need auto-scaling (traffic spikes)
- [ ] Multi-region deployment (future)
- [ ] CI/CD integration (GitHub Actions → auto-deploy)
- [ ] Budget allows ($5-10/month)

---

## Questions for Group Decision

1. **Is StackCP hosting a hard requirement, or can we consider VPS?**
   - If required: Why? (cost, existing account, other constraints?)
   - If flexible: What's the decision criteria?

2. **What's the risk tolerance for `/tmp` code exposure?**
   - Is NaviDocs code open source anyway? (if yes, exposure is lower risk)
   - Are there proprietary algorithms that must be protected?

3. **What's the timeline for MVP launch?**
   - If urgent: VPS is faster (1 day vs 5-7 days)
   - If flexible: StackCP adaptation is feasible

4. **What's the long-term vision for deployment?**
   - Single-server: VPS is fine
   - Multi-region: Container platform is better
   - StackCP forever: Full adaptation needed

5. **Who will maintain operational scripts?**
   - If solo dev: VPS is simpler (less to maintain)
   - If team: StackCP complexity is manageable

---

## Proposed Action Items

### Immediate (Before Debate)
- [ ] Verify `/tmp` persistence on StackCP (how often is it cleared?)
- [ ] Test `/tmp` file permissions (can other users read?)
- [ ] Confirm StackCP Node.js Manager capabilities
- [ ] Price check: DigitalOcean vs Linode vs Fly.io vs Railway

### If Choosing StackCP (Path A/B)
- [ ] Implement `server/config/paths.js` (centralized configuration)
- [ ] Create StackCP deployment scripts
- [ ] Write operational scripts (checkpoint, health check, backup)
- [ ] Test on StackCP with dummy app
- [ ] Security review: `.env` protection, code exposure
- [ ] Document StackCP-specific workflows

### If Choosing VPS (Path C)
- [ ] Sign up for VPS provider (DigitalOcean recommended)
- [ ] Write standard deployment script (PM2 + systemd)
- [ ] Install Meilisearch, Redis, Tesseract
- [ ] Deploy NaviDocs with standard workflow
- [ ] Set up backups (daily SQLite + uploads)
- [ ] Document VPS deployment

### If Choosing Container Platform
- [ ] Create Dockerfile for NaviDocs
- [ ] Test locally with Docker Compose
- [ ] Choose platform (Fly.io, Railway, Render)
- [ ] Set up CI/CD (GitHub Actions → auto-deploy)
- [ ] Configure external services (managed Redis, Meilisearch)
- [ ] Document container deployment

---

## Summary for Debate

**Situation**: StackCP has unique constraints that require architectural changes
**Options**: Full StackCP adaptation (5-7 days), Hybrid (3-4 days), VPS (1 day)
**Recommendation**: VPS for production, Hybrid if StackCP required
**Key Decisions Needed**:
1. Is StackCP a hard requirement?
2. What's the security risk tolerance?
3. What's the MVP timeline?
4. What's the long-term deployment vision?

**Next Steps**: Debate, decide path, implement chosen approach

---

**Prepared by**: Tech Lead
**Date**: 2025-10-19
**For Review**: Security Expert, OCI Architect
**Decision Deadline**: Before Phase 1 implementation begins
