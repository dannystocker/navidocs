---
name: Agent Ping
about: Cloud agent needs local machine action or is reporting status
title: '[AGENT-N] Brief description'
labels: agent-communication
assignees: ''
---

## Agent Information
**Agent ID:** S[Session]-H[Number] (e.g., S2-H01)
**Agent Name:** [Feature Name]
**Session:** [Session Number]

## Request Type
- [ ] BLOCKER - Cannot proceed without local action
- [ ] QUESTION - Need clarification or decision
- [ ] DEPLOY-READY - Task complete, ready to ship
- [ ] STATUS-UPDATE - Progress report
- [ ] ESCALATION - Critical issue needs human review

## Priority
- [ ] P0 - CRITICAL (blocks other agents)
- [ ] P1 - HIGH (delays session completion)
- [ ] P2 - MEDIUM (nice-to-have)
- [ ] P3 - LOW (future work)

## Details

### What I Need
[Describe the specific action, decision, or clarification needed]

### Why It Matters
[Explain impact on session progress and other agents]

### Timeline
- **Requested:** [timestamp]
- **Deadline:** [timestamp]
- **Impact on Session:** [Agent 2 waits, Session 2 blocked after, etc.]

### Suggested Solution
[Optional: your proposed fix]

## Related Tasks
- References: `AUTONOMOUS-NEXT-TASKS.md` (Agent [N])
- Session: [Link to session coordination file]
- Blockers: [Other related issues]

## Local Machine Context

### Last Known State
```
[Copy relevant output from AUTONOMOUS-NEXT-TASKS.md Agent section]
```

### Files Affected
```
server/services/[service].ts
server/routes/[route].ts
components/[component].tsx
```

### Token Budget Impact
- Allocated: X tokens
- Currently Used: Y tokens
- Remaining: Z tokens
- Risk: [GREEN/YELLOW/RED]

## Communication Preference
- [ ] Update AUTONOMOUS-NEXT-TASKS.md and commit
- [ ] GitHub Issue response
- [ ] Git file commit (new file in intelligence/session-X/)
- [ ] Close this issue when resolved

## Checklist
- [ ] I've checked AUTONOMOUS-NEXT-TASKS.md for current status
- [ ] I've searched for duplicate issues
- [ ] I've included relevant timestamps
- [ ] I've noted token budget impact
- [ ] I've specified deadline/priority clearly

---

## Agent Completion Checklist

**When task is COMPLETE, update this with:**

### Delivery Evidence
- [ ] Code committed to branch
- [ ] Tests passing
- [ ] Files created: [list files]
- [ ] Outputs generated: [list deliverables]

### Quality Validation
- [ ] Code review passed
- [ ] No integration conflicts detected
- [ ] Performance within budget
- [ ] Documentation updated

### Next Steps
- [ ] Ready for Agent [N+1] to depend on
- [ ] Requires human review before next step
- [ ] Unblocks Session [X]
- [ ] No blockers for following agents

### Metrics
- **Tokens Used:** [X of Y allocated]
- **Time Spent:** [HH:MM]
- **Efficiency:** [Y% of allocated tokens]
- **Quality Score:** [0-100%]

---

## Notes for Local Machine
[Any additional context, errors, or important findings]

