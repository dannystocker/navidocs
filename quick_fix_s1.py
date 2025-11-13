with open('CLOUD_SESSION_1_MARKET_RESEARCH.md', 'r') as f:
    content = f.read()

# Fix Agent 1
content = content.replace(
    '''### Agent 1:
**AGENT ID:** S1-H01
**Research:**
- Jeanneau Prestige + Sunseeker 40-60ft market (units sold annually, price range €800K-€1.5M)
- Riviera Plaisance Euro Voiles volume (150+ boats/year validated)
- Typical owner demographics (age, usage patterns, pain points)
- Boat ownership costs (annual maintenance, storage, upgrades)

**Deliverable:** Market sizing report for recreational boat segment with citations''',
    '''### Agent 1: Recreational Boat Market (Prestige + Sunseeker)
**AGENT ID:** S1-H01
**PERSONA:** Joe Trader (Epic V4 Merchant-Philosopher) - detect discontinuities, market trends
**Research:**
- **ACTUAL SALE PRICES:** Search YachtWorld, Boat Trader ads for current + historical sales
- Price trend analysis 2020-2025 (COVID boom impact, current market)
- Jeanneau Prestige + Sunseeker 40-60ft market (units sold annually, €800K-€1.5M range)
- Riviera Plaisance Euro Voiles volume (150+ boats/year validated)
- Owner demographics (age, usage patterns, pain points)
- Boat ownership costs (maintenance, storage, upgrades)

**Deliverable:** Market report with ACTUAL sale data + trend analysis (Joe Trader discontinuity lens)'''
)

# Fix other broken headers
for i in range(2, 11):
    content = content.replace(f'### Agent {i}:', f'### Agent {i}')
    content = content.replace(f'### Agent {i}\n**AGENT ID:** S1-H{i:02d}\n**\n', f'### Agent {i}\n**AGENT ID:** S1-H{i:02d}\n')

with open('CLOUD_SESSION_1_MARKET_RESEARCH.md', 'w') as f:
    f.write(content)

print("Fixed Session 1")
