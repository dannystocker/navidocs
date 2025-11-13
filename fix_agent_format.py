import re

files = [
    'CLOUD_SESSION_1_MARKET_RESEARCH.md',
    'CLOUD_SESSION_2_TECHNICAL_INTEGRATION.md',
    'CLOUD_SESSION_3_UX_SALES_ENABLEMENT.md',
    'CLOUD_SESSION_4_IMPLEMENTATION_PLANNING.md',
    'CLOUD_SESSION_5_SYNTHESIS_VALIDATION.md',
]

for filename in files:
    with open(filename, 'r') as f:
        content = f.read()
    
    # Fix duplicate AGENT ID lines (keep only first occurrence)
    content = re.sub(r'(\*\*AGENT ID:\*\* \S+-H\d+)[^\n]*\n\*\*AGENT ID:\*\* (\S+-H\d+)', r'\1', content)
    
    # Fix broken headers like "### Agent 1:\n**AGENT ID:** S1-H01 Recreational Boat..."
    # Should be "### Agent 1: Recreational Boat...\n**AGENT ID:** S1-H01"
    content = re.sub(
        r'### Agent (\d+):\s*\n\*\*AGENT ID:\*\* (\S+-H\d+)\s+(.+?)(?=\n\*\*)',
        r'### Agent \1: \3\n**AGENT ID:** \2\n**',
        content
    )
    
    with open(filename, 'w') as f:
        f.write(content)
    
    print(f"Fixed {filename}")

print("All formatting fixed!")
