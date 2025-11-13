protocol = '''
## Agent Identity & Check-In Protocol

**YOU ARE:** Sonnet coordinator for Session {session_num} ({session_name})

**YOUR HAIKU SWARM:** You have 10 Haiku agents available. Use as many as needed (not required to use all 10).

**AGENT IDENTITY SYSTEM:**
When spawning a Haiku agent, assign it an identity: `{session_id}-H01` through `{session_id}-H10`
Each agent MUST:
1. **Check in** at start: "I am {session_id}-H03, assigned to [task name]"
2. **Reference their task** by searching this document for "Agent 3:" (matching their number)
3. **Retain identity** throughout execution
4. **Report completion** with identity: "{session_id}-H03 complete: [deliverable summary]"

**TASK DEPENDENCIES:**
- Most agents can run in parallel
- Agent 10 typically synthesizes results from Agents 1-9 (must wait for completion)

---

'''

sessions = [
    ('CLOUD_SESSION_2_TECHNICAL_INTEGRATION.md', 2, 'Technical Architecture', 'S2'),
    ('CLOUD_SESSION_3_UX_SALES_ENABLEMENT.md', 3, 'UX/Sales', 'S3'),
    ('CLOUD_SESSION_4_IMPLEMENTATION_PLANNING.md', 4, 'Implementation Planning', 'S4'),
    ('CLOUD_SESSION_5_SYNTHESIS_VALIDATION.md', 5, 'Evidence Synthesis', 'S5'),
]

for filename, num, name, sid in sessions:
    with open(filename, 'r') as f:
        content = f.read()
    
    # Find where to insert (before "## Your Tasks")
    marker = '## Your Tasks'
    if marker in content:
        parts = content.split(marker, 1)
        formatted_protocol = protocol.format(session_num=num, session_name=name, session_id=sid)
        new_content = parts[0] + formatted_protocol + marker + parts[1]
        
        with open(filename, 'w') as f:
            f.write(new_content)
        print(f"Added protocol to {filename}")
    else:
        print(f"WARNING: Could not find marker in {filename}")

print("Identity protocols added!")
