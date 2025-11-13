import re

files = [
    ('CLOUD_SESSION_1_MARKET_RESEARCH.md', 'S1'),
    ('CLOUD_SESSION_2_TECHNICAL_INTEGRATION.md', 'S2'),
    ('CLOUD_SESSION_3_UX_SALES_ENABLEMENT.md', 'S3'),
    ('CLOUD_SESSION_4_IMPLEMENTATION_PLANNING.md', 'S4'),
    ('CLOUD_SESSION_5_SYNTHESIS_VALIDATION.md', 'S5'),
]

for filename, session_id in files:
    with open(filename, 'r') as f:
        content = f.read()
    
    # Add agent IDs to each "### Agent X:" section
    for i in range(1, 11):
        pattern = f'### Agent {i}:'
        replacement = f'### Agent {i}:\n**AGENT ID:** {session_id}-H{i:02d}'
        content = re.sub(pattern, replacement, content)
    
    with open(filename, 'w') as f:
        f.write(content)
    
    print(f"Updated {filename} with {session_id} agent IDs")

print("\nAll files updated!")
