# S² Mission 4: Sonnet Planner/Coordinator
**Agent ID:** S2-PLANNER
**Model:** Claude Sonnet 4.5
**Role:** Swarm orchestrator across all 3 missions
**Estimated Duration:** Concurrent with all missions (12-20 hours total)

---

## 🎯 Planner Responsibilities

### 1. Mission Sequencing
**Task:** Coordinate execution order of 3 swarms

```
Mission 1 (Backend) → 6-8 hours
    ↓ (Backend APIs ready)
Mission 2 (Frontend) → 6-8 hours
    ↓ (UI + APIs integrated)
Mission 3 (Integration/Testing) → 4-6 hours
    ↓
Production Deployment ✅
```

**Critical Dependencies:**
- Mission 2 CANNOT start until Mission 1 complete
- Mission 3 CANNOT start until Missions 1 & 2 complete
- Monitor blocker chains (if Backend API fails, unblock Frontend immediately)

---

### 2. Blocker Resolution
**Task:** Unblock agents across all swarms

**Common Blockers:**
- Agent B-01 (Migrations) takes longer than expected → Notify Frontend swarm of delay
- Backend API 500 errors → Debug with Backend agent, provide fix to Frontend
- Frontend component needs API change → Coordinate with Backend agent for quick patch
- Integration test failures → Identify root cause (Backend? Frontend? Both?)

**Protocol:**
```json
{
  "blocker_id": "BLOCK-001",
  "agent_blocked": "S2-FRONTEND-H03",
  "root_cause": "Backend B-02 returns 500 on photo upload",
  "assigned_to": "S2-BACKEND-H02",
  "priority": "P0",
  "eta_resolution": "30 minutes"
}
```

---

### 3. Idle Task Management
**Task:** Assign productive work to agents waiting for dependencies

**Idle Tasks (Priority Order):**
1. **Write tests** - Agents can write tests before implementation
2. **Documentation** - OpenAPI specs, Storybook stories, user guides
3. **Code review** - Review other agents' work
4. **Performance optimization** - Profile existing code, identify bottlenecks
5. **Help blocked agents** - Pair programming, debugging

**Example:**
```
Frontend Agent F-03 is waiting for Backend B-02 to finish.
→ S2-PLANNER assigns: "Write Jest tests for Inventory component"
→ F-03 writes tests with mock data
→ When B-02 completes, F-03 switches mock data to real API
```

---

### 4. Quality Assurance
**Task:** Enforce IF.TTT compliance across all agents

**Traceable:**
- [ ] Every API endpoint documented (OpenAPI 3.0)
- [ ] Every UI component documented (Storybook)
- [ ] Git commits atomic (one feature per commit)
- [ ] IF.citation references in code comments

**Transparent:**
- [ ] Decision log maintained (why certain tech choices made)
- [ ] Token cost tracked per agent
- [ ] Blocker log maintained (who was blocked, for how long, why)
- [ ] Performance metrics logged (API latency, page load time)

**Trustworthy:**
- [ ] All tests passing (unit + integration + E2E)
- [ ] Security audit complete (no critical vulnerabilities)
- [ ] Accessibility audit complete (WCAG 2.1 AA)
- [ ] Production deployment successful (zero downtime)

---

### 5. Integration with Ongoing InfraFabric S²
**Task:** Coordinate NaviDocs development with InfraFabric API expansion

**InfraFabric Context:**
- InfraFabric is expanding API reach across hosting/cloud/SIP/billing
- MCP bridge tested and production-ready (92% philosophy compliance)
- Multi-agent swarm patterns validated

**NaviDocs Integration:**
1. **Shared MCP Bridge** - Use same message bus for agent coordination
2. **IF.TTT Standards** - Apply same audit trail patterns from bridge
3. **Swarm Patterns** - Reuse InfraFabric swarm coordination logic
4. **Git Workflow** - Feature branches for NaviDocs work, merge to main when complete

**Coordination Protocol:**
- NaviDocs agents report to S2-PLANNER
- S2-PLANNER reports NaviDocs progress to user
- If InfraFabric agents need NaviDocs data (e.g., for hosting automation), coordinate via MCP bridge

---

## 📊 Planner Metrics

**Track These Metrics:**
1. **Swarm efficiency** - How many agents idle vs working (target: <10% idle time)
2. **Blocker resolution time** - Average time to unblock agent (target: <30 min)
3. **Token cost** - Sonnet + Haiku usage (budget: $10-$15 for all 4 missions)
4. **Time to completion** - Mission 1-3 total time (target: <20 hours)
5. **Quality score** - % tests passing, Lighthouse score, security audit (target: >90%)

---

## 🚀 Planner Workflow

### Phase 1: Mission 1 (Backend)
```
1. Spawn 10 Haiku agents (B-01 through B-10)
2. Monitor B-01 completion (migrations)
3. Unblock B-02 through B-10 when migrations done
4. Track progress (50+ APIs implemented?)
5. Run integration tests (all APIs functional?)
6. Approve Mission 1 completion → Start Mission 2
```

### Phase 2: Mission 2 (Frontend)
```
1. Spawn 10 Haiku agents (F-01 through F-10)
2. Monitor API integration (Frontend calling Backend APIs)
3. Debug API errors (coordinate with Backend agents if needed)
4. Track progress (8 dashboard modules complete?)
5. Run E2E tests (user flows working?)
6. Approve Mission 2 completion → Start Mission 3
```

### Phase 3: Mission 3 (Integration/Testing)
```
1. Spawn 10 Haiku agents (I-01 through I-10)
2. Monitor test suite execution (Playwright, Jest, Lighthouse)
3. Fix critical bugs (coordinate with Backend/Frontend agents)
4. Performance optimization (lazy loading, caching)
5. Security audit (penetration testing, vulnerability scan)
6. Approve Mission 3 completion → Production Deployment ✅
```

---

## 🔗 Context Links

**Required Reading:**
- Complete Dossier: https://github.com/dannystocker/navidocs/blob/main/NAVIDOCS_COMPLETE_INTELLIGENCE_DOSSIER.md
- InfraFabric Coordination: https://github.com/dannystocker/infrafabric/blob/claude/debug-session-freezing-011CV2mM1FVCwsC8GoBR2aQy/CLAUDE-CODE-CLI-START-HERE.md

---

**Estimated Cost:** $4-$6 (Sonnet usage across 3 missions)
**Estimated Time:** 12-20 hours (concurrent with all missions)

---

**Generated:** 2025-11-14
**Citation:** if://mission/navidocs-s2-planner-2025-11-14
