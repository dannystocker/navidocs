# NaviDocs Stakeholder Dashboard & Email Integration Strategy
**Critical Strategic Questions Answered**
**Created:** 2025-11-13
**For:** Session 1 (Agent 3A: After-Sales Pain Points) + Session 2 (Agent 10A: Dashboard Design)

---

## 🎯 Strategic Questions to Answer

1. **What do after-sales need so they don't want to quit their jobs?**
2. **What does Sylvain need to monitor customer engagement and satisfaction?**
3. **Should NaviDocs open to a boat dashboard? What does it look like for each stakeholder?**
4. **Email auto-import with boat name mention - how to avoid confidential doc leaks?**
5. **Stakeholder access control: own docs only, or batch validation?**

---

## 1. After-Sales Pain Points (Why They Want to Quit)

### **Current After-Sales Nightmare:**

**Problem 1: Repetitive Questions (80% of time)**
- Owner: "When was last service?" → After-sales searches emails, calls marina, waits for response
- Owner: "Where's the warranty for X?" → After-sales searches filing system, maybe asks broker
- Owner: "How do I reset the autopilot?" → After-sales searches manual PDFs, troubleshoots
- **Result:** After-sales = human search engine, answering same questions 100x/year

**Problem 2: No Visibility into Owner Satisfaction**
- Owner stops responding to messages → churn risk unknown until owner complains to Sylvain
- No way to track: Is owner using the boat? Happy with service? Likely to buy next boat from us?
- **Result:** After-sales reacts to problems, never prevents them

**Problem 3: Manual Data Entry Hell**
- Service completed → manually log in CRM (if they even have one)
- Owner sends receipt photo via WhatsApp → manually file somewhere
- Warranty claim → manually gather docs, email manufacturer, track status
- **Result:** After-sales = data entry clerk, not relationship manager

**Problem 4: No Clear Success Metrics**
- Boss asks: "How many owners are satisfied?" → After-sales: "Uh... nobody complained this week?"
- No KPIs: response time, issue resolution rate, owner satisfaction score
- **Result:** After-sales has no way to prove their value

### **NaviDocs Solution for After-Sales:**

**1. AI Agent Handles 80% of Repetitive Questions**
- Owner asks in WhatsApp: "When was last service?" → AI responds instantly with maintenance log
- Owner: "Where's tender warranty?" → AI responds with doc link
- **Result:** After-sales freed from being human search engine

**2. Satisfaction Dashboard (Real-Time Visibility)**
- See which owners are engaged (checking camera, logging expenses, using app)
- See which owners are at risk (haven't logged in 30 days, no maintenance logged, no WhatsApp activity)
- **Churn Prevention:** Proactively reach out before owner gets frustrated

**3. Automated Data Entry**
- Service completed → Captain logs in WhatsApp → AI auto-creates maintenance entry
- Owner sends receipt photo → AI OCR extracts, creates expense entry, files doc
- Warranty claim → AI gathers all related docs, generates submission package
- **Result:** After-sales = relationship manager, not data entry clerk

**4. Clear Success Metrics**
- Average response time to owner questions
- Issue resolution rate (how many issues closed vs escalated)
- Owner satisfaction score (based on engagement + survey responses)
- **Result:** After-sales can prove their value to management

---

## 2. Sylvain's Customer Engagement & Satisfaction Dashboard

### **What Sylvain Needs to Know:**

**Pre-Sale (Lead Qualification):**
- Which boat models have highest owner satisfaction?
- What are top 3 pain points owners report in first 90 days?
- Which features drive repeat purchases (owners who buy 2nd boat from us)?

**Post-Sale (Retention & Upsell):**
- Which owners are likely to buy next boat from us? (engagement score: high = likely buyer)
- Which owners are at churn risk? (low engagement = might buy elsewhere next time)
- Which owners are good referral sources? (high satisfaction + social activity)

### **Sylvain's Dashboard (Dealer/Broker View):**

**Tab 1: Fleet Overview**
- Total boats sold with NaviDocs included: 150
- Active users: 127 (85% activation rate)
- At-risk boats (no activity 30+ days): 8 (5%)
- High engagement boats (daily activity): 45 (30%)

**Tab 2: Customer Satisfaction Heatmap**
- Boat ID → Owner → Last active → Satisfaction score (1-10)
- Color-coded: Green (9-10), Yellow (6-8), Red (1-5), Gray (no data)
- Click boat → drill down to: maintenance frequency, expense patterns, WhatsApp activity

**Tab 3: Engagement Trends**
- Chart: Weekly active users over time (trending up = good, down = investigate)
- Feature usage: Camera checks (60%), Maintenance logs (40%), Expense tracking (30%)
- Churn indicators: Owners who stopped logging in (follow-up needed)

**Tab 4: After-Sales Performance**
- Average response time: 12 minutes (target: <15min)
- Issue resolution rate: 92% (target: >90%)
- Owner NPS (Net Promoter Score): +67 (excellent)

**Tab 5: Upsell Opportunities**
- Owners with high engagement + boat age >3 years = likely to upgrade soon
- Owners asking about new features = potential add-on sales (cameras, monitoring hardware)

### **Privacy & GDPR Compliance:**
- Sylvain sees **aggregated satisfaction scores**, not individual owner messages
- Individual owner data (WhatsApp chats, expenses) visible only to: Owner, After-sales, Captain (role-based access)
- Dashboard shows: "Owner X has satisfaction score 8/10" but NOT "Owner X said..."

---

## 3. Stakeholder Dashboards (Role-Based Views)

### **Principle: Each Stakeholder Opens to THEIR Dashboard**

**When you open NaviDocs, you see:**
- **Owner:** My boat dashboard (camera, maintenance due, expenses YTD, recent docs)
- **Captain:** Fleet dashboard (if managing multiple boats) OR single boat ops dashboard
- **After-Sales:** Support queue (pending questions, at-risk boats, recent activity)
- **Sylvain (Broker):** Satisfaction heatmap (all boats sold, engagement trends, upsell opportunities)
- **Accountant:** Financial dashboard (expense reports, tax deductions, budget vs actual)
- **Chef/Crew:** Provisioning dashboard (inventory, expense submissions, contact list)

---

### **Owner Dashboard (Default Landing Page)**

```
┌─────────────────────────────────────────────────────────┐
│ MY BOAT: "AURORA" (Prestige 50, 2023) │ VAT: Paid      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📷 CAMERA FEED (Live)          📅 CALENDAR (This Week) │
│  ┌─────────┐ ┌─────────┐       • Thu: Engine service   │
│  │ Bow     │ │ Stern   │       • Sat: Owner onboard    │
│  │ [image] │ │ [image] │       • Mon: Warranty expires │
│  └─────────┘ └─────────┘         (tender pump)         │
│  Last check: 2 hours ago                                │
│                                 🔧 MAINTENANCE DUE      │
│  📋 RECENT ACTIVITY             • Engine service: 12 days│
│  • Captain logged fuel expense  • Hull cleaning: overdue│
│  • After-sales replied in chat                         │
│  • Maintenance reminder sent    💰 EXPENSES (This Month)│
│                                 €1,240 / €2,000 budget │
│  📄 RECENT DOCUMENTS                                    │
│  • Tender warranty (v2)         🎯 ACTION ITEMS         │
│  • Engine manual updated        [ ] Approve captain     │
│  • Insurance cert (2025)                expense €45     │
│                                 [ ] Schedule hull clean │
│  📊 QUICK STATS                 [ ] Renew tender warranty│
│  • Boat value: €1.2M                                    │
│  • Days used: 18 / 40 (YTD)     💬 WHATSAPP GROUP       │
│  • Annual cost: €42K            • 3 unread messages     │
│                                 • AI answered 2 questions│
│                                                         │
│  🔍 QUICK SEARCH: [Search docs, inventory, calendar]    │
└─────────────────────────────────────────────────────────┘
```

**NEW FEATURES ADDED:**
- **VAT Status:** Top-right shows "VAT: Paid" or "VAT: Non-Paid (Exit due: 23 days)"
- **Calendar Widget:** Shows this week's events (service, owner onboard, warranty expires, work planned)
- **Calendar Integration:** All 4 calendar types visible (service, warranty, owner dates, work roadmap)

**Key Principles:**
- **Status-at-a-glance:** Camera live, maintenance due, budget status
- **Action items front-and-center:** Approve expenses, schedule service
- **Recent activity:** What happened since I last checked?
- **One-tap actions:** "Call my mechanic", "Check cameras", "Approve expense"

---

### **Captain Dashboard**

```
┌─────────────────────────────────────────────────────────┐
│ FLEET OPERATIONS: 3 Boats                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🚤 AURORA (Prestige 50)        🚤 SERENITY (Sunseeker)│
│  • Fuel: 80%                    • Fuel: 45% ⚠️          │
│  • Next service: 12 days        • Next service: 2 days  │
│  • Pending expense: €45         • All clear             │
│                                                         │
│  📋 TODAY'S TASKS                                       │
│  [ ] Refuel SERENITY (urgent)                          │
│  [ ] Submit provisioning receipt (€120)                │
│  [ ] Respond to owner question (WhatsApp)              │
│                                                         │
│  💰 EXPENSE SUBMISSIONS (Pending Approval)              │
│  • €45 fuel (AURORA) - awaiting owner approval         │
│  • €120 provisions (SERENITY) - submitted 2h ago       │
│                                                         │
│  📞 QUICK CONTACTS                                      │
│  • Marina: [Call] [Email]                              │
│  • Mechanic: [Call] [Email]                            │
│  • Fuel delivery: [Call]                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Principles:**
- **Multi-boat view:** If captain manages fleet
- **Ops-focused:** Fuel, maintenance, supplies
- **Expense submission workflow:** Easy photo → OCR → submit
- **Quick contacts:** One-tap call for emergencies

---

### **After-Sales Dashboard**

```
┌─────────────────────────────────────────────────────────┐
│ AFTER-SALES SUPPORT QUEUE                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔴 URGENT (2)                  🟡 FOLLOW-UP NEEDED (5) │
│  • AURORA: Owner asking about   • SERENITY: No activity│
│    autopilot error (2 hours)        30 days (churn risk)│
│  • MISTRAL: Camera offline       • Check if owner OK   │
│                                                         │
│  🟢 RESOLVED TODAY (8)           📊 SATISFACTION SCORES │
│  • Warranty question answered    • Average: 8.2/10     │
│  • Maintenance scheduled         • This week: +0.3     │
│  • Receipt filed                 • NPS: +65            │
│                                                         │
│  📋 MY BOATS (Assigned: 42)                             │
│  ┌──────────────────────────────────────────┐          │
│  │ Boat      Owner    Last    Satisfaction  │          │
│  │ AURORA    John M   2h ago   9/10 ✅      │          │
│  │ SERENITY  Sarah L  30d ago  6/10 ⚠️      │          │
│  │ MISTRAL   Pierre D 1d ago   8/10 ✅      │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  🤖 AI AGENT STATS (Today)                              │
│  • Questions answered: 24                               │
│  • Questions escalated to me: 3 (12%)                  │
│  • Avg response time: 8 seconds                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Principles:**
- **Triage view:** Urgent, follow-up, resolved
- **At-risk boats highlighted:** Proactive outreach before churn
- **AI agent helps:** 88% of questions auto-answered, after-sales handles 12% escalations
- **Success metrics visible:** Response time, satisfaction scores, AI performance

---

### **Sylvain (Broker) Dashboard**

```
┌─────────────────────────────────────────────────────────┐
│ RIVIERA PLAISANCE EURO VOILES - NaviDocs Analytics      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 FLEET HEALTH (150 Boats Sold with NaviDocs)        │
│  • Active users: 127 (85%)      • Satisfaction: 8.2/10│
│  • At-risk: 8 (5%)              • NPS: +67 (excellent)│
│  • High engagement: 45 (30%)                           │
│                                                         │
│  📈 ENGAGEMENT TRENDS (Last 90 Days)                    │
│  [Chart: Weekly active users trending UP +12%]         │
│                                                         │
│  🎯 UPSELL OPPORTUNITIES (18 Boats)                     │
│  • High engagement + 3+ years old = likely to upgrade  │
│  • Owners asking about cameras (5) = hardware upsell   │
│  • Owners with high expenses = may want accounting pkg │
│                                                         │
│  ⚠️ CHURN RISK (8 Boats - Follow-Up Needed)            │
│  • SERENITY: No activity 30 days (owner may be unhappy)│
│  • OCEANIA: Low satisfaction (4/10) - investigate      │
│                                                         │
│  🏆 TOP PERFORMING AFTER-SALES                          │
│  • Marie (avg response: 8min, satisfaction: 9.1/10)    │
│  • Jean (avg response: 12min, satisfaction: 8.7/10)    │
│                                                         │
│  💰 BUSINESS METRICS                                    │
│  • MRR (Monthly Recurring): €1,905 (127 × €15)        │
│  • Churn rate: 2% (excellent)                          │
│  • Lifetime value per boat: €1,800 (10-year avg)      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Principles:**
- **Business intelligence:** Who's likely to buy next boat? Who's at churn risk?
- **After-sales performance:** Which team members are stars?
- **Upsell opportunities:** Data-driven sales pipeline
- **Privacy-compliant:** Aggregated scores, not individual owner messages

---

### **Accountant Dashboard**

```
┌─────────────────────────────────────────────────────────┐
│ FINANCIAL OVERVIEW: "AURORA"                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💰 YEAR-TO-DATE (2025)                                 │
│  • Total expenses: €42,340                              │
│  • Budget: €48,000 (12% under)                         │
│  • Tax deductible: €8,450 (charter income related)     │
│                                                         │
│  📊 EXPENSE BREAKDOWN                                   │
│  • Marina fees: €18,000 (43%)                          │
│  • Maintenance: €12,000 (28%)                          │
│  • Fuel: €6,500 (15%)                                  │
│  • Insurance: €4,200 (10%)                             │
│  • Provisioning: €1,640 (4%)                           │
│                                                         │
│  🧾 PENDING RECEIPTS (Need Approval)                    │
│  • Captain expense: €45 fuel (2h ago)                  │
│  • Owner expense: €1,200 electronics (yesterday)       │
│                                                         │
│  📥 EXPORT OPTIONS                                      │
│  [Download Excel] [Download CSV] [Send to Accountant] │
│                                                         │
│  🔍 SEARCH RECEIPTS                                     │
│  [Search by vendor, date, category, amount]            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Principles:**
- **Financial clarity:** Where is the money going?
- **Tax compliance:** Auto-identify deductible expenses (if boat used for charter)
- **Receipt audit trail:** Every expense has receipt photo + OCR data + IF.TTT signature
- **Export-friendly:** Accountant can download Excel for year-end filing

---

### **Chef/Crew Dashboard**

```
┌─────────────────────────────────────────────────────────┐
│ CREW OPERATIONS: "AURORA"                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🍽️ PROVISIONING                                        │
│  • Current inventory: 85% stocked                       │
│  • Low stock alerts: Wine (3 bottles), Coffee (1 bag) │
│  • Next provisioning: 5 days                           │
│                                                         │
│  💰 EXPENSE SUBMISSIONS                                 │
│  • Pending: €120 groceries (submitted 2h ago)          │
│  • Approved this month: €850                           │
│  • Budget remaining: €150                               │
│                                                         │
│  📞 QUICK CONTACTS                                      │
│  • Supplier (wine): [Call] [Email]                     │
│  • Supplier (produce): [Call] [Email]                  │
│  • Captain: [Call] [WhatsApp]                          │
│                                                         │
│  📋 NOTES FROM OWNER                                    │
│  • Guest dietary restrictions: 2 vegetarian, 1 gluten-free│
│  • Preferred wines: Bordeaux reds, Chablis whites      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Principles:**
- **Ops-focused:** Inventory, budget, suppliers
- **Easy expense submission:** Photo receipt → OCR → submit
- **Communication:** Quick access to captain, suppliers, owner notes

---

## 4. Email Auto-Import with Boat Name Mention

### **The Vision:**
Owner receives email with subject "AURORA tender warranty" → NaviDocs auto-imports attachment as document

### **The Challenges:**

**Challenge 1: Confidentiality**
- Broker emails owner about "AURORA" (their boat) + "SERENITY" (another client's boat) in same email
- NaviDocs should NOT import SERENITY docs to AURORA's tenant

**Challenge 2: Spam/Noise**
- Owner receives marketing email mentioning "prestige yachts" → should NOT auto-import

**Challenge 3: Multi-Tenant Isolation**
- Captain manages 3 boats → emails might mention all 3 → which tenant gets the doc?

### **Solution: Email Auto-Import with Validation Workflow**

**Step 1: Email Monitoring (OAuth Consent)**
- Owner opts-in: "Connect my Gmail/Outlook to NaviDocs"
- OAuth permission: Read emails, attachments (no send access)
- Privacy: NaviDocs server processes locally, doesn't store email body (only metadata + attachments)

**Step 2: Smart Filtering (AI + Rules)**
- Email mentions boat name ("AURORA") → Flag for review
- Email has attachment (PDF, image, docx) → Higher priority
- Email from known contacts (broker, marina, manufacturer) → Higher confidence
- Email subject contains keywords: warranty, manual, invoice, receipt, certificate → Higher confidence

**Step 3: Batch Validation (Weekly Digest)**
- NaviDocs generates email digest: "We found 5 emails mentioning AURORA with attachments. Review before import?"
- Owner sees:
  ```
  ┌─────────────────────────────────────────────────────────┐
  │ Email Auto-Import Review (5 emails this week)           │
  ├─────────────────────────────────────────────────────────┤
  │ [✓] From: marina@antibes.fr                            │
  │     Subject: AURORA - Hull cleaning invoice             │
  │     Attachment: invoice_12345.pdf                       │
  │     → Import to: Maintenance / Invoices                │
  │                                                         │
  │ [✓] From: warranty@jeanneau.com                         │
  │     Subject: Tender warranty - AURORA & SERENITY        │
  │     Attachment: warranty_tender.pdf                     │
  │     → Import to: Warranties (tender only)              │
  │     ⚠️ Email mentions other boat (SERENITY) - filtered │
  │                                                         │
  │ [✗] From: marketing@yachtworld.com                      │
  │     Subject: New Prestige listings near AURORA          │
  │     Attachment: catalog.pdf                             │
  │     → SPAM (marketing)                                 │
  │                                                         │
  │ [Quick Actions]                                         │
  │ [Approve All ✓] [Approve Selected] [Reject All]       │
  └─────────────────────────────────────────────────────────┘
  ```

**Step 4: One-Click Approval**
- Owner clicks "Approve All ✓" → documents imported with IF.TTT compliance:
  - Source: email (from, subject, date)
  - SHA-256 hash of attachment
  - Ed25519 signature (imported_by: owner@example.com)
  - Citation ID: if://doc/navidocs/boat-123/warranty-tender-email-import

**Step 5: Confidentiality Protection**
- **Content filtering:** Email mentions "SERENITY" → AI extracts only "AURORA" sections
- **Attachment splitting:** If email has 2 attachments (1 for AURORA, 1 for SERENITY) → only import AURORA attachment
- **Manual review required:** If AI can't confidently separate → flag for owner review ("This email mentions multiple boats - please manually select what to import")

### **Privacy & Security:**

**What NaviDocs CAN do:**
- Read email metadata (from, to, subject, date)
- Download attachments (with owner consent)
- OCR extract text from attachments

**What NaviDocs CANNOT do:**
- Store full email body (only metadata + attachments)
- Send emails on owner's behalf
- Access emails without OAuth consent
- Share email data across tenants (strict multi-tenant isolation)

**GDPR Compliance:**
- Owner can revoke OAuth at any time
- Email monitoring is opt-in (not default)
- NaviDocs deletes processed emails after 30 days (only keeps imported docs)
- Owner can export all email import logs (audit trail)

---

## 5. Stakeholder Access Control

### **Principle: Role-Based Access Control (RBAC)**

**Access Levels:**

**Level 1: Owner (Full Access)**
- See ALL documents, expenses, maintenance logs, camera feeds
- Approve captain expenses
- Invite/remove stakeholders
- Configure email auto-import

**Level 2: Captain (Operational Access)**
- See: Maintenance logs, contacts, inventory, camera feeds
- Submit: Expenses (with receipt), maintenance entries
- CANNOT see: Owner's personal expenses, financial summaries, broker communications

**Level 3: After-Sales (Support Access)**
- See: Documents (warranties, manuals), maintenance logs, WhatsApp chat history
- Submit: Maintenance reminders, document updates
- CANNOT see: Owner's personal expenses, captain reimbursements, camera feeds (privacy)

**Level 4: Broker (Aggregated Access)**
- See: Satisfaction scores, engagement metrics, at-risk boats
- CANNOT see: Individual owner messages, expenses, camera feeds, documents (privacy)

**Level 5: Accountant (Financial Access)**
- See: Expenses, receipts, budget reports, tax deduction reports
- Export: Excel/CSV downloads
- CANNOT see: WhatsApp chats, camera feeds, maintenance logs (not financially relevant)

**Level 6: Chef/Crew (Limited Ops Access)**
- See: Provisioning inventory, contacts, owner notes (dietary restrictions)
- Submit: Expenses (groceries, supplies)
- CANNOT see: Owner's personal docs, financial summaries, broker communications

### **Access Control Matrix:**

| Feature | Owner | Captain | After-Sales | Broker | Accountant | Chef/Crew |
|---------|-------|---------|-------------|--------|------------|-----------|
| **Documents (warranties, manuals)** | ✅ Full | ✅ View | ✅ View | ❌ | ❌ | ❌ |
| **Maintenance logs** | ✅ Full | ✅ Full | ✅ View | ❌ | ❌ | ❌ |
| **Inventory** | ✅ Full | ✅ View | ❌ | ❌ | ❌ | ✅ View (provisions) |
| **Camera feeds** | ✅ Full | ✅ View | ❌ | ❌ | ❌ | ❌ |
| **Owner expenses** | ✅ Full | ❌ | ❌ | ❌ | ✅ View | ❌ |
| **Captain expenses** | ✅ Approve | ✅ Submit | ❌ | ❌ | ✅ View | ❌ |
| **Crew expenses** | ✅ Approve | ✅ Approve | ❌ | ❌ | ✅ View | ✅ Submit |
| **WhatsApp chat** | ✅ Full | ✅ Full | ✅ View | ❌ | ❌ | ✅ View (relevant) |
| **Financial reports** | ✅ Full | ❌ | ❌ | ❌ | ✅ Full | ❌ |
| **Satisfaction dashboard** | ❌ | ❌ | ✅ View (own boats) | ✅ View (all) | ❌ | ❌ |
| **Email auto-import** | ✅ Configure | ❌ | ❌ | ❌ | ❌ | ❌ |

### **Email Validation: Who Approves What?**

**Scenario 1: Email Mentions Boat Name**
- Auto-import candidate detected → Owner receives weekly digest → Owner approves/rejects

**Scenario 2: Captain Receives Email**
- Captain opts-in to email monitoring (separate OAuth) → Captain receives digest → Captain approves/rejects
- Owner can see what captain imported (audit trail)

**Scenario 3: Batch Validation**
- Weekly digest (not daily/hourly) → reduces notification fatigue
- Owner can set rules: "Auto-approve emails from marina@antibes.fr" → reduces manual review

**Scenario 4: Confidential Docs (Multiple Boats Mentioned)**
- Email mentions AURORA + SERENITY → AI flags: "This email mentions other boats - manual review required"
- Owner must explicitly approve what gets imported (no auto-import for multi-boat emails)

---

## 6. Implementation Priorities (Session 2 Agent 10A)

### **MVP (Week 1-2):**
1. **Owner dashboard** (default landing page)
2. **Captain dashboard** (fleet view + expense submission)
3. **After-sales dashboard** (support queue + AI agent stats)
4. **Role-based access control** (owner, captain, after-sales only)

### **Phase 2 (Week 3-4):**
5. **Sylvain dashboard** (satisfaction heatmap + engagement trends)
6. **Accountant dashboard** (expense reports + export)
7. **Email auto-import** (OAuth + batch validation)

### **Phase 3 (Post-MVP):**
8. **Chef/crew dashboard** (provisioning + expense submission)
9. **Email auto-import rules engine** ("Auto-approve from marina@antibes.fr")
10. **Multi-language support** (French, English, Italian, Spanish for international owners)

---

## 7. Key Insights for Session 1 (Market Research)

### **New Agent 3A: After-Sales Pain Points (CRITICAL)**

**Research:**
- What makes after-sales teams want to quit their jobs?
  - Repetitive questions (80% of time answering same things)
  - No visibility into owner satisfaction (reactive, not proactive)
  - Manual data entry hell (CRM logging, filing receipts)
  - No clear success metrics (can't prove their value)

**Competitive Analysis:**
- Do boat management apps solve after-sales pain points? (Most focus on owners, not after-sales)
- Do CRM systems integrate with boat management? (Usually siloed)

**Value Proposition for Riviera Plaisance:**
- After-sales team productivity: 80% time savings on repetitive questions (AI handles)
- Churn prevention: Proactive outreach to at-risk boats (satisfaction dashboard)
- Sylvain's business intelligence: Know which owners will buy next boat (engagement scores)

**Deliverable:** After-sales pain point analysis + NaviDocs value prop for broker/after-sales teams

---

## 8. Key Design Principles

**Principle 1: Default to YOUR Dashboard**
- Owner opens app → Owner dashboard
- Captain opens app → Captain dashboard (not owner's view)
- After-sales opens app → Support queue (not owner's view)

**Principle 2: Privacy by Default**
- Stakeholders see ONLY what they need for their role
- Broker sees aggregated satisfaction scores, NOT individual owner messages
- Accountant sees expenses, NOT camera feeds

**Principle 3: Mobile-First**
- All dashboards designed for phone (owners check from phone 80% of time)
- Quick actions: "Call mechanic", "Approve expense", "Check camera"
- Minimal scrolling: Status-at-a-glance on first screen

**Principle 4: Proactive, Not Reactive**
- After-sales sees at-risk boats BEFORE owner complains
- Owner sees maintenance due BEFORE engine fails
- Captain sees fuel low BEFORE running out

**Principle 5: AI Reduces Busywork**
- AI answers 80% of repetitive questions
- AI auto-extracts receipt data (no manual entry)
- AI flags emails for import (batch review, not one-by-one)

---

## 9. VAT/Tax Jurisdiction Tracking & Compliance (NEW CRITICAL FEATURE)

### **The Problem:**

**Non-VAT Boats Must Leave EU Waters for Customs Stamp**
- Boats purchased outside EU (no VAT paid) must periodically exit EU waters to maintain tax-exempt status
- Each EU country has different exit requirements:
  - **France:** 18-month exemption, must exit every X months (research exact regs)
  - **Spain:** Different requirements than France (research specific regs)
  - **Italy:** Different requirements again (research specific regs)
  - **Monaco/Gibraltar:** Special tax jurisdictions with own rules
- **Penalty for non-compliance:** €300K+ VAT liability on €1.5M boat (catastrophic)

**Owner Challenge:**
- Forgets exit deadline → suddenly owes massive VAT bill
- Travels between FR/ES/IT marinas → confused about which jurisdiction's rules apply
- No easy way to track: "When did I last exit EU? When is next required exit?"

### **NaviDocs Solution:**

**VAT Status Dashboard Widget:**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ VAT COMPLIANCE ALERT                                 │
├─────────────────────────────────────────────────────────┤
│ Boat Status: Non-VAT (Tax Exempt)                      │
│ Home Jurisdiction: France (18-month exemption)          │
│ Last EU Exit: March 15, 2025 (Tunisia)                 │
│ Next Exit Required: September 10, 2025 (23 days)       │
│                                                         │
│ ⏰ Reminders Set:                                       │
│ • 60 days: ✅ Sent (July 12)                           │
│ • 30 days: ✅ Sent (August 11)                         │
│ • 14 days: ⏳ Pending (August 27)                      │
│ • 7 days: ⏳ Pending (September 3)                     │
│                                                         │
│ 📅 Suggested Exit Trips:                                │
│ • Tunisia (3-day trip, €450 fuel)                      │
│ • Morocco (5-day trip, €750 fuel)                      │
│ • Algeria (2-day trip, €350 fuel)                      │
│                                                         │
│ [Schedule Exit] [Mark as Exited] [View History]       │
└─────────────────────────────────────────────────────────┘
```

**Jurisdiction Rules Engine:**
- Database stores rules per jurisdiction:
  ```json
  {
    "country": "France",
    "vat_exempt_period_months": 18,
    "exit_frequency_months": 6,
    "grace_period_days": 30,
    "penalty_description": "Full VAT liability on boat value",
    "documentation_required": ["Customs stamp", "Marina exit receipt", "Fuel receipt in foreign port"],
    "last_updated": "2025-01-15"
  }
  ```
- Owner profile stores:
  - VAT status: paid/non-paid
  - Home jurisdiction (FR/ES/IT/MC/etc.)
  - Purchase date (start of exemption clock)
  - Last EU exit date (proof: customs stamp scan)
  - Next required exit date (calculated)

**Calendar Integration:**
- VAT exit deadline appears on **Work Roadmap Calendar** (high priority)
- Conflict detection: "Owner scheduled onboard July 15-22, but EU exit required by July 20 → flag conflict"
- Smart suggestions: "You're planning Tunisia trip July 18-21. Perfect timing for required EU exit!"

**Multi-Jurisdiction Support:**
- Owner moves from France (Antibes) → Spain (Barcelona) → Italy (Portofino)
- NaviDocs tracks: "Boat currently in Spain (Barcelona). Spanish regs apply: Exit required every 4 months."
- Dashboard updates: "⚠️ Jurisdiction changed: Now following Spain regulations (stricter than France)"

**Compliance History:**
- Audit trail: Every EU exit logged with:
  - Exit date
  - Destination port (outside EU)
  - Proof: Customs stamp scan (uploaded photo)
  - IF.TTT compliance: SHA-256 hash + ed25519 signature + citation ID
- Owner can export: "VAT Compliance Report (2020-2025)" for tax authority audit

### **Implementation (Session 2 Agent 3A):**
1. Research EU/FR/ES/IT/global yacht tax regulations
2. Design jurisdiction rules engine (database schema + update mechanism)
3. VAT status tracking (boat profile + compliance dashboard)
4. Reminder system (60/30/14/7 days before required exit)
5. Integration with calendar system (exit deadlines on Work Roadmap Calendar)
6. Compliance history with IF.TTT audit trail

---

## 10. Multi-Calendar System (NEW CRITICAL FEATURE)

### **The Problem:**

**Owners Have 4 Different Types of Events:**
1. **Service events:** "Engine service due in 12 days"
2. **Warranty events:** "Tender pump warranty expires in 30 days"
3. **Owner trips:** "I'm on the boat July 15-22"
4. **Planned work:** "Hull repaint scheduled August 2025 (€15K budget)"

**Current Nightmare:**
- Service reminders in email (lost in inbox)
- Warranty dates on paper receipts (forgotten in drawer)
- Owner trips in personal Google Calendar (captain doesn't see)
- Planned work in WhatsApp chat ("Did we agree on €15K or €20K?")

**Result:** Owner forgets warranty expires, loses €2K tender pump under warranty. Captain doesn't know owner arriving, boat unprepared.

### **NaviDocs Solution:**

**Unified Calendar Dashboard (All 4 Calendar Types):**
```
┌─────────────────────────────────────────────────────────┐
│ 📅 CALENDAR: August 2025                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  MON 11  TUE 12  WED 13  THU 14  FRI 15  SAT 16  SUN 17│
│   🔧       🔧      ⚙️      👤      👤      👤      👤   │
│  Service  Service Hull    Owner  Owner  Owner  Owner  │
│  due      starts  work    arrives                      │
│           (€450)  (€15K)                               │
│                                                         │
│  MON 18  TUE 19  WED 20  THU 21  FRI 22  SAT 23  SUN 24│
│   👤      👤      ⚠️      ⚠️      🏁       🔧      📄   │
│  Owner   Owner   Hull    Hull    Owner   Tender  Tender│
│                   work    work    departs service warranty│
│                   (cont)  (cont)          (€120) expires │
│                                                         │
│  Legend:                                                │
│  🔧 Service Calendar (maintenance due/scheduled)        │
│  ⚙️ Work Roadmap Calendar (planned work + budget)       │
│  👤 Owner Onboard Calendar (owner trips)                │
│  📄 Warranty Calendar (expiration dates)                │
│  ⚠️ Conflict Detected (hull work while owner onboard)   │
│  🏁 VAT Exit Required (compliance deadline)             │
└─────────────────────────────────────────────────────────┘
```

### **4 Calendar Types:**

**1. Service Calendar (from Maintenance Log)**
- **Source:** Agent 3 (Maintenance Log) feeds service due dates
- **Events:**
  - Past services: "Engine service completed July 1, 2025 (€450)"
  - Upcoming services: "Hull cleaning due in 5 days"
  - Recurring: "Oil change every 100 engine hours (next: 87 hours)"
- **Reminders:** 60/30/14/7 days before service due
- **Smart:** Service due + Owner onboard soon → "Schedule service BEFORE owner arrives"

**2. Warranty Calendar (from Inventory Tracking)**
- **Source:** Agent 2 (Inventory) feeds warranty expiration dates
- **Events:**
  - Equipment purchase date: "Tender pump installed March 2024"
  - Warranty expiration: "Tender pump warranty expires August 24, 2025 (6 months left)"
  - Reminders: 90/60/30 days before expiration → "File warranty claim now if needed"
- **Smart:** Warranty expires soon + Equipment has issue → "File warranty claim within 23 days!"

**3. Owner Onboard Calendar (Owner-Entered)**
- **Source:** Owner manually adds trips: "On boat: July 15-22, 2025"
- **Events:**
  - Owner scheduled trips (past + future)
  - Guest trips (if owner lends boat to friends)
- **Visibility:**
  - Captain sees: "Owner arrives in 3 days → prep boat (fuel, cleaning, provisioning)"
  - After-sales sees: "Owner active (engagement tracking for satisfaction dashboard)"
  - Sylvain sees: "Owner using boat 18 days/year (low engagement → churn risk?)"
- **Smart:** Owner arrives + Low fuel → "Refuel before owner arrival (3 days)"

**4. Work Roadmap Calendar (Planned Work + Budget)**
- **Source:** Captain/owner propose work: "Hull repaint: €15K, scheduled August 2025"
- **Events:**
  - Proposed work (not yet approved)
  - Approved work (owner signed off on budget)
  - In-progress work
  - Completed work (actual cost vs budget)
- **Budget signoff workflow:**
  1. Captain proposes: "Hull repaint needed (€15K estimate, 5-day job)"
  2. Owner receives notification: "Approve hull repaint? €15K budget"
  3. Owner approves/rejects/negotiates
  4. Status: Proposed → Approved → Scheduled → In Progress → Complete
- **Smart:** Work planned + Owner onboard → "Conflict! Hull work August 10-20, but owner onboard August 15-22 → reschedule work or trip?"

### **Conflict Detection Examples:**

**Conflict 1: Work vs Owner Onboard**
```
⚠️ CALENDAR CONFLICT DETECTED
Hull repaint scheduled: August 10-20, 2025
Owner onboard: August 15-22, 2025
→ Boat unavailable during owner trip!

[Reschedule Work] [Reschedule Trip] [Ignore Conflict]
```

**Conflict 2: Service Due vs Owner Arriving**
```
🔧 SERVICE DUE + OWNER ARRIVING
Engine service due: August 12, 2025
Owner arrives: August 15, 2025 (3 days later)
→ Schedule service BEFORE owner arrival!

[Schedule Service Aug 10] [Remind Captain]
```

**Conflict 3: Warranty Expires vs Planned Work**
```
⏰ WARRANTY EXPIRING SOON
Tender pump warranty expires: August 24, 2025 (18 days)
Tender service planned: September 5, 2025
→ Move service BEFORE warranty expires to file claim if needed!

[Reschedule Service] [Mark Warranty as OK]
```

### **Smart Notifications (Context-Aware):**

**Example 1: Multi-Factor Alert**
- Service due (7 days)
- Owner onboard (3 days)
- Low fuel (30%)
- **NaviDocs sends:** "Captain: Owner arrives in 3 days. Before arrival: (1) Engine service due, (2) Refuel (30% remaining). [Schedule Both]"

**Example 2: Engagement Tracking**
- Owner scheduled trips: 0 in last 90 days
- After-sales dashboard: "⚠️ AURORA at-risk: No owner activity 90+ days. Proactive outreach recommended."

**Example 3: Budget vs Actual**
- Work roadmap: "Hull repaint approved (€15K budget)"
- Actual cost: "Hull repaint complete (€17K actual, €2K over budget)"
- Owner notification: "Hull repaint complete. Cost: €17K (€2K over €15K budget). [View Details]"

### **Implementation (Session 2 Agent 7A):**
1. Design unified calendar architecture (4 calendar types, single UI)
2. Database schema: `calendar_events` (event_type, date, status, budget, actual_cost)
3. Smart notifications (context-aware: service + owner + fuel → combined alert)
4. Conflict detection engine (work vs owner, service vs warranty)
5. Budget signoff workflow (proposed → approved → complete with actual cost)
6. Integration:
   - Agent 3 (Maintenance) → Service Calendar
   - Agent 2 (Inventory) → Warranty Calendar
   - Agent 3A (VAT) → Work Roadmap Calendar (exit deadlines)
   - Agent 6 (Accounting) → Work Roadmap Calendar (budget vs actual tracking)

---

## Next Steps for Session 2

**Agent 10A: Stakeholder Dashboard Design (NEW AGENT)**
- Read this document (STAKEHOLDER_DASHBOARD_STRATEGY.md)
- Design wireframes for 6 stakeholder dashboards
- Define RBAC matrix (who sees what)
- Email auto-import workflow with batch validation
- Integration with Session 2 architecture (WhatsApp, accounting, document versioning)

**Deliverable:** Complete stakeholder dashboard spec + wireframes + RBAC implementation plan

---

**This is what makes NaviDocs truly compelling: It solves pain points for EVERYONE, not just the owner.**

- Owner: Peace of mind (camera, maintenance reminders)
- Captain: Easy expense submission + fleet ops
- After-sales: AI handles 80% of questions + churn prevention
- Sylvain: Business intelligence (who'll buy next boat?)
- Accountant: Tax compliance made easy
- Chef/Crew: Provisioning made simple

**Result: Sylvain has no choice but to include NaviDocs by default. Everyone benefits.**
