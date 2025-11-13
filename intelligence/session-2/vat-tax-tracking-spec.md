# VAT/Tax Jurisdiction Tracking & Compliance Reminders System Specification

**Agent Identity:** S2-H03A
**Created:** 2025-11-13
**Status:** CRITICAL Priority System Design

---

## Executive Summary

This specification defines a comprehensive VAT/Tax Jurisdiction Tracking system designed to ensure compliance with complex and jurisdiction-specific regulations governing non-VAT paid yachts operating in the European Union and global waters. The system tracks VAT status, monitors exit deadlines, calculates compliance requirements, and sends timely reminders to prevent costly penalties.

---

## Part 1: VAT Regulation Research Findings

### 1.1 European Union Core Framework

**Temporary Admission (TA) Regime:**
- Non-EU flagged yachts can operate in EU waters under Temporary Admission for **18 months maximum**
- Owner/beneficial owner must be established **outside the EU Customs Territory**
- Yacht must be used for **private/pleasure purposes only**
- **Total aggregate lifetime limit:** 10 years maximum in EU waters under TA
- After expiry, yacht must exit EU territory or VAT/customs duties become payable
- If yacht remains beyond 18 months without exit, penalties include:
  - Full VAT assessment (18-25% depending on jurisdiction)
  - Customs duties
  - Potential yacht seizure
  - "Customs smuggling" penalties

**Documentation Requirements:**
- Entry declaration: Written or oral (Annex 71-01) to customs at first port of entry
- Exit proof: At minimum requires:
  - Non-EU marina mooring invoice with dates
  - Customs stamp/receipt from non-EU jurisdiction
  - NO minimum time required outside EU (can immediately return for new TA period)
- Inventory document (Schedule 71-01RD) recommended for clear entry date confirmation

**Extensions:**
- Lay-up extensions: 6 months additional (to 24 months total) if vessel is laid up
- Emergency/exceptional circumstances: Beyond 24 months require customs authorization (rare)

### 1.2 France-Specific Requirements

**Entry Regulations:**
- Standard EU TA rules apply
- VAT rate: 20% (full rate)
- Monaco treated identically for VAT purposes

**Exit Requirements:**
- Must exit before 18 months expire
- Exit proof documentation must be specific and credible
- French customs (Douanes) increasingly enforce compliance with heightened scrutiny in 2025-2026
- Entry/Exit System (EES) implementation:
  - Began October 12, 2025
  - Completion expected April 9, 2026
  - Passports will be stamped during rollout - creates audit trail
  - Increases likelihood of customs matching passport entries/exits with yacht documentation

**Grace Periods:**
- Official grace period: **0 days** (must exit by deadline, no extension automatic)
- Practical grace: 1-2 weeks often tolerated if owner can show good faith intention to exit
- Risk increases exponentially after deadline

**Penalties:**
- 20% VAT + customs duties
- Administrative penalties: 50-100% of tax due
- Potential criminal liability for "customs smuggling" if deemed fraudulent

### 1.3 Spain-Specific Requirements

**Entry Regulations:**
- "Oral declaration" (Annex 71-01) required in **writing** (despite name) with customs authorities
- Non-EU resident automatically triggers TA eligibility
- 12-nautical-mile test: Crossing Spanish maritime boundary establishes TA status

**Exit Requirements:**
- 18-month period from first EU entry (not Spain-specific entry)
- Reset mechanism: Exit to non-EU jurisdiction and return for new TA period
- **Special advantage:** Melilla and Ceuta are NOT in EU Customs Territory
  - Can "dock" briefly in Melilla/Ceuta to reset 18-month clock
  - No minimum stay required
  - Significantly easier than full non-EU exit

**Jurisdiction Variations:**
- Spanish ports have reputation for being more flexible than French ports
- However, compliance documentation standards same as France
- Port authority enforcement: Less strict than Mediterranean French ports

**Penalties:**
- Same as France: 20% VAT + customs duties + administrative penalties

### 1.4 Italy-Specific Requirements

**Entry Regulations:**
- "Costituto d'Arrivo" document required when entering Italian territorial waters
- Issued by maritime authority at first national mooring port
- Valid for **12 months**
- Must be returned upon departure

**Exit Requirements:**
- 18-month TA period standard
- Italy known for strict enforcement via Financial Police (Guardia di Finanza)
- Routine marina checks for foreign yacht duration of stay
- Owners have reported being given only **days notice** before forced exit compliance checks

**Enforcement Characteristics:**
- Most aggressive enforcement of Mediterranean EU countries
- Financial Police conduct random marina inspections
- Targeting identified risk vessels with extended TA periods
- Less tolerant of documentation gaps than France/Spain

**Penalties:**
- Same structure: VAT + customs duties + administrative penalties
- Potential criminal prosecution more likely than other Mediterranean countries
- Asset seizure risk elevated

### 1.5 Global Non-EU Jurisdictions

#### Monaco
- **VAT Status:** 20% (part of French VAT system)
- **Exit Equivalent:** Must exit EU with same 18-month rules
- **Leasing Schemes:** Available to mitigate VAT impact
- **Strategic Use:** Acts as EU-adjacent mooring; cannot substitute for exit

#### Gibraltar
- **VAT Status:** EXEMPT - Not in EU Customs/VAT area
- **Exit Strategy:** Sailing to Gibraltar = re-export from EU customs
- **Advantage:** Can reset TA clock easily; counts as non-EU exit
- **Registry:** Red Ensign Group (British Overseas Territory) - first-class flag
- **Strategic Role:** Preferred reset location for Mediterranean operations

#### Malta
- **VAT Status:** 18% (higher than most EU, but with unique mitigation schemes)
- **Leasing Scheme:** VAT reduced to 5.4% with proper structure
  - Full 18% paid at registration, fully reclaimed in VAT return
  - Only lease portion taxed based on actual EU vs. non-EU usage
  - If 60% time outside EU waters: only 40% of lease taxed
- **Commercial Operations:** Companies operating commercial yachts from Malta exempt from income tax and VAT on high seas operations
- **Strategic Use:** More expensive than Gibraltar but legitimizes yacht presence

#### Cayman Islands
- **VAT Status:** NO VAT - Tax-neutral jurisdiction
- **Registration:** Popular for offshore yacht ownership structures
- **Tax Benefits:** No income tax, capital gains tax, or inheritance tax
- **Import Duty:** 22-27% (offset by VAT savings)
- **Red Ensign Protection:** Category 1 British Registry - first-class flag
- **Strategic Role:** Reduces overall tax burden; often combined with EU TA for mixed operations

#### Caribbean (Bahamas)
- **VAT/Tax:** 10% VAT on foreign yacht charters + 4% port tax (14% combined)
- **Strategic Use:** Limited VAT advantages; not preferred for tax optimization

#### United States
- **Tax Implications:** US citizens/residents must comply regardless of jurisdiction
  - Form 1040 filing requirements
  - FATCA/FBAR reporting for foreign accounts
- **Sales Tax:** Varies by state (0-10%); generally higher than EU
- **Advantage:** Can reset TA clock (counts as non-EU exit)
- **Strategic Role:** Limited VAT benefit but necessary for US-based operations

---

## Part 2: System Architecture & Database Schema

### 2.1 Core Database Tables

#### Table: `boat_tax_status`
Purpose: Track VAT status and exit deadline compliance for each vessel

```sql
CREATE TABLE boat_tax_status (
  boat_id UUID PRIMARY KEY,
  boat_name VARCHAR(255) NOT NULL,
  flag_jurisdiction VARCHAR(100) NOT NULL, -- 'EU', 'Cayman Islands', 'Malta', etc.
  vat_paid BOOLEAN NOT NULL DEFAULT FALSE, -- true = paid VAT on entry; false = non-VAT
  vat_amount DECIMAL(12, 2), -- If VAT paid, amount (in EUR)
  vat_paid_date DATE, -- When VAT was paid (if applicable)
  home_jurisdiction VARCHAR(100) NOT NULL, -- FR, ES, IT, GI, MT, KY, US, other
  owner_residence VARCHAR(255), -- Outside/inside EU for TA eligibility

  -- Temporary Admission tracking
  ta_status VARCHAR(50) NOT NULL DEFAULT 'INACTIVE', -- 'ACTIVE', 'EXTENDED', 'EXPIRED', 'INACTIVE'
  ta_entry_date DATE, -- First EU entry date (starts 18-month clock)
  ta_expiry_date DATE, -- Calculated: ta_entry_date + 18 months
  ta_entry_port VARCHAR(255), -- Port of first EU entry
  ta_entry_customs_ref VARCHAR(100), -- Customs reference number (if assigned)

  -- Exit history & scheduling
  last_eu_exit_date DATE, -- Most recent documented exit from EU waters
  last_exit_location VARCHAR(255), -- Where yacht was documented as exiting
  last_exit_documentation VARCHAR(500), -- Reference to supporting docs
  next_required_exit_date DATE, -- Calculated deadline (expiry_date)

  -- For tracking cumulative lifetime EU usage
  ta_cumulative_months INT DEFAULT 0, -- Total months ever spent in EU under TA
  ta_lifetime_limit_months INT DEFAULT 120, -- 10 years = 120 months max
  ta_years_remaining DECIMAL(3, 1), -- Calculated: (120 - cumulative) / 12

  -- Compliance & alerts
  compliance_status VARCHAR(50) NOT NULL DEFAULT 'COMPLIANT', -- 'COMPLIANT', 'AT_RISK', 'NON_COMPLIANT', 'OVERDUE'
  days_until_exit INT, -- Calculated: next_required_exit_date - today()
  alert_level VARCHAR(50) DEFAULT 'NONE', -- 'NONE', 'YELLOW' (60d), 'ORANGE' (30d), 'RED' (14d), 'CRITICAL' (7d+)

  -- Audit & system fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_compliance_check TIMESTAMP,
  notes TEXT
);
```

#### Table: `jurisdiction_rules`
Purpose: Store jurisdiction-specific rules engine for VAT compliance

```sql
CREATE TABLE jurisdiction_rules (
  rule_id UUID PRIMARY KEY,
  jurisdiction_code VARCHAR(50) NOT NULL UNIQUE, -- 'FR', 'ES', 'IT', 'GI', 'MT', etc.
  jurisdiction_name VARCHAR(255) NOT NULL,

  -- TA Period Rules
  ta_max_months INT DEFAULT 18, -- Base temporary admission period
  ta_max_months_extended INT, -- Extended period if lay-up (e.g., 24 for France)
  ta_total_lifetime_months INT DEFAULT 120, -- 10 years for EU
  ta_grace_period_days INT DEFAULT 0, -- Days after expiry before enforcement

  -- VAT & Tax Rules
  standard_vat_rate DECIMAL(5, 2), -- Standard VAT %
  leasing_vat_rate DECIMAL(5, 2), -- Reduced VAT if leasing scheme available
  can_use_leasing_scheme BOOLEAN DEFAULT FALSE,
  other_applicable_taxes DECIMAL(5, 2), -- Customs duty, etc.

  -- Exit Requirements
  requires_custom_exit_doc BOOLEAN DEFAULT TRUE, -- Must have customs stamp
  requires_marina_invoice BOOLEAN DEFAULT TRUE, -- Must have mooring proof
  requires_minimum_outside_days INT DEFAULT 0, -- Minimum days outside before re-entry
  reset_location_codes VARCHAR(500), -- Alternative reset locations (e.g., 'MELILLA,CEUTA' for Spain)

  -- Enforcement & Penalties
  enforcement_strictness VARCHAR(50), -- 'STRICT', 'MODERATE', 'LENIENT'
  known_enforcement_frequency VARCHAR(50), -- 'HIGH', 'MEDIUM', 'LOW'
  typical_penalty_multiplier DECIMAL(3, 2), -- Multiplier on base VAT (1.5 = 50% additional)
  can_prosecute_criminally BOOLEAN DEFAULT FALSE,
  asset_seizure_risk BOOLEAN DEFAULT FALSE,

  -- Documentation & Communication
  customs_authority_name VARCHAR(255),
  customs_authority_email VARCHAR(255),
  customs_authority_phone VARCHAR(20),
  relevant_regulations_urls TEXT, -- Links to official resources

  -- Effective dates (for regulation updates)
  rule_effective_date DATE,
  rule_expiry_date DATE,
  last_updated DATE DEFAULT CURRENT_DATE,
  update_source VARCHAR(255), -- 'Official EU', 'National Customs', etc.

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Table: `exit_history`
Purpose: Audit trail of documented exits and compliance events

```sql
CREATE TABLE exit_history (
  exit_id UUID PRIMARY KEY,
  boat_id UUID NOT NULL REFERENCES boat_tax_status(boat_id),

  exit_date DATE NOT NULL,
  exit_location VARCHAR(255) NOT NULL,
  exit_jurisdiction VARCHAR(100),

  -- Documentation
  marina_invoice_number VARCHAR(100),
  marina_name VARCHAR(255),
  customs_stamp_number VARCHAR(100),
  customs_authority VARCHAR(255),
  documentation_confidence VARCHAR(50), -- 'HIGH', 'MEDIUM', 'LOW'
  supporting_documents_count INT,

  -- Compliance check
  resets_ta_period BOOLEAN, -- true if this exit qualifies for TA reset
  ta_period_after_exit INT, -- New TA expiry calculated from this exit

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_date TIMESTAMP, -- When documentation was verified
  verification_notes TEXT
);
```

#### Table: `compliance_alerts`
Purpose: Track and manage alert notifications

```sql
CREATE TABLE compliance_alerts (
  alert_id UUID PRIMARY KEY,
  boat_id UUID NOT NULL REFERENCES boat_tax_status(boat_id),

  alert_type VARCHAR(50) NOT NULL, -- 'EXIT_DEADLINE', 'LIFETIME_LIMIT', 'DOCUMENTATION_MISSING', etc.
  severity_level VARCHAR(50) NOT NULL, -- 'INFO', 'WARNING', 'CRITICAL'
  days_until_deadline INT,

  trigger_threshold_days INT, -- What triggered this alert (60, 30, 14, 7)
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  message_subject VARCHAR(255),
  message_body TEXT,

  notification_channels VARCHAR(500), -- 'EMAIL', 'SMS', 'IN_APP', 'CALENDAR'
  notifications_sent_at TIMESTAMP,

  resolution_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'RESOLVED', 'ESCALATED'
  resolved_at TIMESTAMP,
  resolution_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Table: `vat_payment_records`
Purpose: Track when VAT was paid and documentation

```sql
CREATE TABLE vat_payment_records (
  payment_id UUID PRIMARY KEY,
  boat_id UUID NOT NULL REFERENCES boat_tax_status(boat_id),

  payment_date DATE NOT NULL,
  vat_amount DECIMAL(12, 2) NOT NULL,
  vat_percentage DECIMAL(5, 2), -- 18%, 20%, etc.
  payment_jurisdiction VARCHAR(100),
  payment_location VARCHAR(255),

  payment_method VARCHAR(50), -- 'CUSTOMS_ENTRY', 'LEASING_SCHEME', 'OTHER'
  payment_reference VARCHAR(100), -- Invoice number, receipt, etc.

  documentation_attached BOOLEAN,
  document_references VARCHAR(500), -- File paths/IDs

  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 Database Relationships Diagram

```
boat_tax_status (central entity)
  ├── jurisdiction_rules (many-to-one: boat.home_jurisdiction → jurisdiction.jurisdiction_code)
  ├── exit_history (one-to-many: boat.boat_id ← exit.boat_id)
  ├── compliance_alerts (one-to-many: boat.boat_id ← alert.boat_id)
  └── vat_payment_records (one-to-many: boat.boat_id ← payment.boat_id)
```

---

## Part 3: Compliance Calculation Algorithm

### 3.1 Core Algorithm: Calculate Days Until Required Exit

```pseudocode
FUNCTION calculateDaysUntilExit(boat_id):
    boat = GET boat_tax_status WHERE boat_id = boat_id

    IF boat.vat_paid == TRUE:
        RETURN null  // No exit deadline for VAT-paid boats

    IF boat.ta_status == 'INACTIVE':
        RETURN null  // No active TA period

    // Get jurisdiction-specific rules
    rules = GET jurisdiction_rules WHERE jurisdiction_code = boat.home_jurisdiction

    // Calculate expiry date
    IF boat.ta_status == 'EXTENDED':
        // Laid-up extension scenario
        ta_expiry = boat.ta_entry_date + rules.ta_max_months_extended
    ELSE:
        ta_expiry = boat.ta_entry_date + rules.ta_max_months

    // Store calculated expiry
    UPDATE boat_tax_status SET ta_expiry_date = ta_expiry WHERE boat_id = boat_id

    // Calculate days remaining
    days_remaining = ta_expiry - TODAY()

    // Check lifetime cumulative usage
    IF (boat.ta_cumulative_months + (days_remaining / 30)) > rules.ta_total_lifetime_months:
        FLAG alert: "Approaching lifetime VAT exemption limit"
        days_remaining = MIN(days_remaining, days_until_lifetime_exhaustion)

    RETURN days_remaining
END FUNCTION
```

### 3.2 Compliance Status Determination

```pseudocode
FUNCTION updateComplianceStatus(boat_id):
    days_until = calculateDaysUntilExit(boat_id)
    boat = GET boat_tax_status WHERE boat_id = boat_id
    rules = GET jurisdiction_rules WHERE jurisdiction_code = boat.home_jurisdiction

    IF boat.vat_paid:
        compliance_status = 'NOT_APPLICABLE'

    ELSE IF days_until == null:
        compliance_status = 'COMPLIANT'

    ELSE IF days_until < 0:
        compliance_status = 'NON_COMPLIANT'  // EXPIRED
        alert_level = 'CRITICAL'

    ELSE IF days_until <= rules.ta_grace_period_days:
        compliance_status = 'AT_RISK'
        alert_level = 'RED'

    ELSE IF days_until <= 7:
        compliance_status = 'AT_RISK'
        alert_level = 'CRITICAL'

    ELSE IF days_until <= 14:
        compliance_status = 'AT_RISK'
        alert_level = 'ORANGE'

    ELSE IF days_until <= 30:
        compliance_status = 'AT_RISK'
        alert_level = 'ORANGE'

    ELSE IF days_until <= 60:
        compliance_status = 'COMPLIANT' (but monitored)
        alert_level = 'YELLOW'

    ELSE:
        compliance_status = 'COMPLIANT'
        alert_level = 'NONE'

    // Update database
    UPDATE boat_tax_status SET
        compliance_status = compliance_status,
        alert_level = alert_level,
        days_until_exit = days_until,
        last_compliance_check = NOW()
    WHERE boat_id = boat_id

    RETURN {status: compliance_status, level: alert_level, days: days_until}
END FUNCTION
```

### 3.3 Lifetime Usage Calculation

```pseudocode
FUNCTION calculateCumulativeTA_Usage(boat_id):
    exits = GET exit_history WHERE boat_id = boat_id ORDER BY exit_date ASC
    cumulative_months = 0

    FOR EACH exit IN exits:
        IF exit.resets_ta_period == TRUE:
            // Calculate months between previous exit and this exit
            IF exits.previous_exit EXISTS:
                months_in_period = (exit.exit_date - exits.previous_exit.exit_date) / 30.4
            ELSE:
                months_in_period = 0  // First exit, no prior period

            cumulative_months += months_in_period

    boat = GET boat_tax_status WHERE boat_id = boat_id
    rules = GET jurisdiction_rules WHERE jurisdiction_code = boat.home_jurisdiction

    years_remaining = (rules.ta_total_lifetime_months - cumulative_months) / 12

    UPDATE boat_tax_status SET
        ta_cumulative_months = cumulative_months,
        ta_years_remaining = years_remaining
    WHERE boat_id = boat_id

    IF years_remaining < 0:
        ALERT: "CRITICAL: Lifetime TA allocation exhausted"

    RETURN years_remaining
END FUNCTION
```

---

## Part 4: Jurisdiction-Specific Rules Engine

### 4.1 Rules Engine Architecture

The rules engine is a data-driven system stored in the `jurisdiction_rules` table with the following design patterns:

**Pattern 1: Multi-Jurisdiction Support**
```
Each boat's home_jurisdiction field links to jurisdiction_rules
When compliance calculation runs, it queries jurisdiction-specific rules
Example: Same boat tracked in FR and ES uses different rule sets when moved
```

**Pattern 2: Dynamic Rule Updates**
Rules can be updated without code deployment:
- Update mechanism: CSV import or manual database edit
- Versioning: rule_effective_date and rule_expiry_date track validity
- Audit trail: last_updated and update_source fields
- Notification: System alerts owner when rules change for their jurisdiction

**Pattern 3: Rule Application Hierarchy**
1. Get boat's home_jurisdiction
2. Query jurisdiction_rules for that code
3. Apply rules to boat's ta_status and dates
4. If jurisdiction lacks rules, fall back to EU standard (18/120 month rules)

### 4.2 Jurisdiction Rule Configurations

**France Configuration:**
```json
{
  "jurisdiction_code": "FR",
  "ta_max_months": 18,
  "ta_max_months_extended": 24,
  "ta_grace_period_days": 0,
  "standard_vat_rate": 20.0,
  "enforcement_strictness": "STRICT",
  "known_enforcement_frequency": "HIGH",
  "reset_location_codes": ["MC"],  // Monaco (no advantage, same VAT)
  "customs_authority": "Douanes Françaises",
  "note": "EES system implementation Oct 2025 increases passport audit trail"
}
```

**Spain Configuration:**
```json
{
  "jurisdiction_code": "ES",
  "ta_max_months": 18,
  "ta_max_months_extended": 24,
  "ta_grace_period_days": 0,
  "standard_vat_rate": 21.0,
  "enforcement_strictness": "MODERATE",
  "known_enforcement_frequency": "MEDIUM",
  "reset_location_codes": ["MELILLA", "CEUTA"],  // Non-EU enclaves
  "can_use_alternative_reset": true,
  "customs_authority": "Aduanas Españolas"
}
```

**Italy Configuration:**
```json
{
  "jurisdiction_code": "IT",
  "ta_max_months": 18,
  "ta_max_months_extended": 24,
  "ta_grace_period_days": 0,
  "standard_vat_rate": 22.0,
  "enforcement_strictness": "STRICT",
  "known_enforcement_frequency": "HIGH",
  "typical_penalty_multiplier": 1.75,
  "can_prosecute_criminally": true,
  "customs_authority": "Guardia di Finanza"
}
```

**Gibraltar Configuration:**
```json
{
  "jurisdiction_code": "GI",
  "ta_max_months": null,  // Not applicable - not in EU
  "standard_vat_rate": 0.0,  // VAT exempt
  "can_use_as_reset_location": true,
  "enforcement_strictness": "LOW",
  "strategic_role": "EU Exit Point"
}
```

**Malta Configuration:**
```json
{
  "jurisdiction_code": "MT",
  "ta_max_months": 18,
  "ta_max_months_extended": 24,
  "standard_vat_rate": 18.0,
  "can_use_leasing_scheme": true,
  "leasing_vat_rate": 5.4,
  "enforcement_strictness": "MODERATE",
  "strategic_role": "Permanent EU presence with tax mitigation"
}
```

### 4.3 Rules Update Mechanism

**Automated Update Process:**
1. Monitor official EU Customs Portal for regulation changes
2. Quarterly review of jurisdiction-specific rule documents
3. When changes detected:
   - Update jurisdiction_rules table
   - Trigger compliance recalculation for all boats in affected jurisdiction
   - Generate notification to boat owners
   - Log update in audit trail (update_source = 'Official EU' or 'National Customs')

**Manual Override Process:**
1. Verify change through official sources
2. Create new jurisdiction_rules record with old rule_expiry_date
3. Insert new record with rule_effective_date = today()
4. Review affected boats: search WHERE home_jurisdiction = updated_code
5. Send notification: "Jurisdiction rules updated - your compliance deadline may have changed"

---

## Part 5: Reminder & Alert System

### 5.1 Alert Trigger Schedule

Alerts are generated and sent at specific compliance thresholds:

```
COMPLIANCE TIMELINE & ALERT TRIGGERS:

60 Days Until Exit:  YELLOW ALERT ("Alert: EU Exit Required in 60 days")
├─ Severity: INFO
├─ Action: Start planning exit procedures
├─ Frequency: Once per 60-day threshold
└─ Channels: Email + In-App Notification

30 Days Until Exit:  ORANGE ALERT ("Warning: EU Exit Required in 30 days")
├─ Severity: WARNING
├─ Action: Book marina outside EU, arrange logistics
├─ Frequency: Once per 30-day threshold
└─ Channels: Email + SMS + In-App Notification + Calendar Event

14 Days Until Exit:  ORANGE ALERT ("Warning: EU Exit Required in 14 days")
├─ Severity: WARNING
├─ Action: Confirm travel logistics, document prepared
├─ Frequency: Once per 14-day threshold
└─ Channels: Email + SMS + In-App Notification + Calendar Event

7 Days Until Exit:  RED ALERT ("Urgent: EU Exit Required in 7 days")
├─ Severity: CRITICAL
├─ Action: Final confirmation, captain briefing, departure prep
├─ Frequency: Once per 7-day threshold
└─ Channels: Email + SMS + In-App Notification + Calendar Event + Call

EXPIRED:  CRITICAL ALERT ("OVERDUE: EU Exit Deadline Passed")
├─ Severity: CRITICAL
├─ Action: Immediate compliance or legal action risk
├─ Frequency: Daily until resolved
└─ Channels: All channels + Escalation to compliance officer
```

### 5.2 Alert Message Templates by Jurisdiction

**France Alert Template (60-day warning):**
```
Subject: "VAT Compliance Alert: Yacht [boat_name] EU Exit Required in 60 Days"

Body:
Your yacht [boat_name] (Flag: [flag]) is currently under Temporary Admission (TA)
in France, with EU exit deadline: [ta_expiry_date].

French Customs (Douanes) enforces VAT compliance strictly. Failure to exit by
[ta_expiry_date] will result in:
- 20% VAT assessment (~€[calculated_vat])
- Customs duties
- Administrative penalties (50-100% of tax)
- Potential criminal charges for customs violation

ACTION REQUIRED:
1. Confirm planned exit location (non-EU jurisdiction)
2. Book marina outside EU (Gibraltar recommended: no VAT)
3. Arrange travel logistics and crew scheduling
4. Prepare exit documentation:
   - Marina invoice (date and mooring proof)
   - Customs exit stamp from destination port

French Customs Authority: [customs_contact]
"
```

**Spain Alert Template (14-day warning):**
```
Subject: "Urgent: VAT Compliance - EU Exit in 14 Days Required"

Body:
Your yacht [boat_name] must exit EU waters by [ta_expiry_date] to comply with
Spanish maritime VAT regulations.

ALTERNATIVE: Spain allows reset via Melilla/Ceuta (non-EU Spanish enclaves)
- Shorter voyage: Only 6-7 days vs. full non-EU exit
- Same compliance reset: Resets 18-month TA clock
- Less expensive: Reduces travel/fuel costs

QUICK EXIT OPTION (Melilla):
- Depart: [ta_expiry_date - 7 days]
- Marina booking required (provide documentation)
- Customs documentation: Exit stamp from Melilla port
- Return to EU permitted immediately with new 18-month TA

Standard EU Exit (Gibraltar):
- Recommended if yacht staying outside EU >3 months
- VAT exempt: 0% VAT benefit
- Professional marina documentation available

Spanish Customs (Aduanas): [customs_contact]
"
```

**Italy Alert Template (7-day critical):**
```
Subject: "CRITICAL: Guardia di Finanza Compliance Deadline - 7 Days"

Body:
URGENT: Your yacht [boat_name] must exit Italian waters by [ta_expiry_date].

Italy has STRICT enforcement. Guardia di Finanza (Financial Police) conduct
routine marina inspections. Failure to comply risks:
- 22% VAT + 75% penalties = ~€[calculated_penalty] total liability
- Criminal prosecution for customs violations
- Yacht seizure and impound
- Vessel blacklist (prevents future Italian operations)

7-DAY ACTION PLAN:
Day 1-2: Confirm exit location and book non-EU marina
Day 3-4: Arrange crew, fuel, provisions
Day 5-6: Prepare all documentation
Day 7: Final departure confirmation and notification to Italian Customs

Required Documentation for Exit:
- Departure notification to Italian port authority
- Non-EU marina mooring invoice (with dates and customs stamp)
- Copies of yacht registration and insurance

Italian Customs (Agenzia delle Dogane): [customs_contact]
Guardia di Finanza (emergency): +39-117
"
```

### 5.3 Alert System Architecture

**Alert Generation Process:**
```
CRON JOB: Runs daily at 02:00 UTC
├─ Query: SELECT * FROM boat_tax_status WHERE ta_status = 'ACTIVE' AND vat_paid = FALSE
├─ For each boat:
│  ├─ Call updateComplianceStatus(boat_id)
│  ├─ If alert_level changed or new threshold crossed:
│  │  ├─ Check if alert already sent for this threshold
│  │  ├─ If not sent:
│  │  │  ├─ Generate alert message (jurisdiction-specific template)
│  │  │  ├─ Insert row into compliance_alerts table
│  │  │  ├─ Queue notification job (email, SMS, in-app)
│  │  │  └─ Create calendar event (via S2-H07A integration)
│  │  └─ If sent:
│  │     └─ Skip (don't spam owner with duplicate alerts)
│  └─ Update boat_tax_status.last_compliance_check = NOW()
└─ End daily job
```

**Notification Channel Routing:**
```
Email:     All alerts (primary contact method)
SMS:       30-day, 14-day, 7-day, Overdue only (too frequent for 60-day)
In-App:    All alerts (dashboard notification badge)
Calendar:  Deadline alerts (30-day and beyond to S2-H07A calendar system)
Phone:     Overdue only (escalation - voice call to owner/captain)
```

---

## Part 6: Dashboard Widget Design

### 6.1 Compliance Dashboard Widget

**Widget: "VAT/Tax Compliance Status"**

```
┌─────────────────────────────────────────────────────────┐
│ VAT/Tax Compliance Status                         ⓘ ⚙️  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Yacht: [Boat Name] | Flag: [Flag Jurisdiction]         │
│ Location: [Current Port, Jurisdiction]                  │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ VAT Status: [NON-VAT PAID]                        │   │
│ │ Temporary Admission (TA): ACTIVE                  │   │
│ │ TA Entry Date: [date]                             │   │
│ │ TA Expiry Date: [date]                            │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ COMPLIANCE STATUS: ● [STATUS]                     │   │
│ │                                                   │   │
│ │ Days Until Required Exit: [N] days                │   │
│ │ Alert Level: [YELLOW|ORANGE|RED|CRITICAL]        │   │
│ │                                                   │   │
│ │ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [60%]   │   │
│ │ [60 days]      [30 days]  [14 days] [7 days]     │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ Jurisdiction Rules: [FR|ES|IT|GI|MT]                   │
│ ├─ TA Max Period: 18 months                            │
│ ├─ VAT Rate: 20% (if payable)                          │
│ ├─ Enforcement: STRICT                                 │
│ └─ Reset Locations: [Monaco, Gibraltar, Melilla]       │
│                                                          │
│ Cumulative TA Usage: [6.5 years] / 10 years            │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ [65%]     │
│                                                          │
│ Last Compliance Check: [date/time]                      │
│ Next Auto-Check: [date/time]                            │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ RECOMMENDED ACTIONS:                             │   │
│ │                                                  │   │
│ │ [30 Days Until] Book non-EU marina              │   │
│ │ [14 Days Until] Arrange crew & logistics        │   │
│ │ [7 Days Until] Prepare all exit documents       │   │
│ │ [Overdue] LEGAL RISK - Contact advisor now      │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ [View Detailed Compliance Report] [Configure Alerts]    │
│ [Download Documentation Checklist]                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Widget: "Multi-Yacht Fleet Compliance Overview"** (if managing multiple boats)

```
┌──────────────────────────────────────────────────────────────────┐
│ Fleet VAT Compliance Summary                              ⓘ ⚙️  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Total Yachts: 5  │ Compliant: 3 │ At Risk: 2 │ Overdue: 0       │
│                                                                   │
│ ┌─ Yacht 1: Bella Notte (FR) ────────────────────────────────┐  │
│ │ Status: ● COMPLIANT  │ Exit in 45 days  │ YELLOW             │  │
│ │ Cumulative TA: 3.2 yrs / 10 yrs  ████░░░░░░░░░░░░░░░░░░░  │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌─ Yacht 2: Mar Azul (ES) ───────────────────────────────────┐  │
│ │ Status: ● AT_RISK  │ Exit in 8 days  │ RED (CRITICAL)       │  │
│ │ Cumulative TA: 5.1 yrs / 10 yrs  █████░░░░░░░░░░░░░░░░░░  │  │
│ │ ⚠️ Book Melilla exit IMMEDIATELY                             │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌─ Yacht 3: Stella d'Oro (IT) ──────────────────────────────┐  │
│ │ Status: ● COMPLIANT  │ Exit in 92 days  │ NONE              │  │
│ │ Cumulative TA: 1.8 yrs / 10 yrs  ██░░░░░░░░░░░░░░░░░░░░░  │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌─ Yacht 4: Golden Gate (MT) ───────────────────────────────┐  │
│ │ Status: ● AT_RISK  │ Exit in 22 days  │ ORANGE              │  │
│ │ Cumulative TA: 7.3 yrs / 10 yrs  ███████░░░░░░░░░░░░░░░░░  │  │
│ │ Leasing scheme applied (reduced VAT 5.4%)                   │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ ┌─ Yacht 5: Liberty (KY) ─────────────────────────────────┐  │
│ │ Status: ● COMPLIANT  │ VAT-PAID (No deadline)           │  │
│ │ VAT paid at entry: €125,000 (20%)  ──────────────────    │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                                   │
│ [Export Compliance Report] [Mass Notification] [Bulk Actions]    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Widget Features & Interactions

**Color-Coded Alert Indicators:**
- ● Green: COMPLIANT (60+ days remaining)
- ● Yellow: COMPLIANT monitored (60-day threshold)
- ● Orange: AT_RISK (30-14 day window)
- ● Red: CRITICAL (7 days or overdue)
- ● Black: NON_COMPLIANT (expired, legal risk)

**Interactive Elements:**
- Click boat name → View full compliance report
- Click alert level → View detailed rules for jurisdiction
- Click recommended actions → Open action checklist/task manager
- "Comply Now" button → Launch exit scheduling wizard
- "View Documentation" → Access stored exit requirements docs
- "Contact Customs" → Pre-filled email templates

**Data Refresh:**
- Auto-refresh every 4 hours
- Manual refresh button available
- Last updated timestamp shown
- Upcoming scheduled checks visible

---

## Part 7: Integration with S2-H07A Calendar System

### 7.1 Calendar Integration Architecture

**Integration Point:** Feed exit deadlines and compliance events to S2-H07A calendar

**Data Flow:**
```
boat_tax_status (boat.next_required_exit_date)
    ↓
    compliance_alerts (when alert.severity_level >= WARNING)
    ↓
    Calendar Event Generator (IF.bus message)
    ↓
    S2-H07A Calendar System (if://agent/session-2/haiku-07A)
    ↓
    User's Calendar (Google Calendar, Outlook, iCal, etc.)
```

### 7.2 Calendar Event Specification

**Event Type 1: Exit Deadline (Hard Deadline)**
```json
{
  "event_type": "tax_exit_required",
  "boat_id": "uuid",
  "boat_name": "Bella Notte",
  "title": "🚢 EU Exit Required - Bella Notte (FR) - VAT Compliance",
  "description": "DEADLINE: Your non-VAT yacht must exit EU waters to comply with French VAT regulations. Failure to exit will result in €125,000+ VAT liability and potential criminal charges. Exit confirmed destination: Gibraltar. Required documents: marina invoice + customs stamp.",
  "start_date": "2025-12-15",  // Next required exit date
  "start_time": null,  // All-day event
  "end_date": "2025-12-15",
  "location": "EU Waters (Depart) → Gibraltar (Destination)",
  "jurisdiction": "FR",
  "priority": "CRITICAL",
  "color": "red",
  "alert_triggers": [
    {"days_before": 30, "method": "email"},
    {"days_before": 14, "method": "email_sms"},
    {"days_before": 7, "method": "email_sms_popup"},
    {"days_before": 0, "method": "all"}
  ],
  "related_tasks": [
    "Book non-EU marina (Gibraltar/Melilla/etc)",
    "Arrange crew and logistics",
    "Prepare exit documentation",
    "Notify customs authorities",
    "Confirm vessel insurance for transit"
  ],
  "attachments": [
    "Exit-Requirements-Checklist-FR.pdf",
    "Customs-Contact-Information.pdf",
    "Marina-Booking-Template.docx"
  ]
}
```

**Event Type 2: Reminder Events (60/30/14/7 days)**
```json
{
  "event_type": "vat_compliance_reminder",
  "boat_id": "uuid",
  "boat_name": "Mar Azul",
  "title": "⚠️ [30 Days] EU Exit Required - Mar Azul (ES)",
  "description": "30 DAYS until EU exit deadline (2025-12-10). Action required: Book marina destination, arrange logistics. Alternative: Use Melilla/Ceuta for faster reset.",
  "start_date": "2025-11-10",
  "duration": "1 day",
  "priority": "HIGH",
  "color": "orange",
  "recurring": false
}
```

**Event Type 3: Lifetime TA Limit Warning**
```json
{
  "event_type": "tax_lifetime_limit_warning",
  "boat_id": "uuid",
  "boat_name": "Stella d'Oro",
  "title": "⚠️ Approaching 10-Year TA Lifetime Limit - Stella d'Oro",
  "description": "Your yacht has spent 8.5 of 10 years in EU waters under temporary admission. After 10 years total, you MUST pay full VAT or register permanently. Remaining window: ~18 months.",
  "start_date": "2025-11-13",
  "priority": "HIGH",
  "color": "orange"
}
```

### 7.3 IF.bus Integration Message

**Request: S2-H03A → S2-H07A**

```json
{
  "performative": "request",
  "sender": "if://agent/session-2/haiku-03A",
  "receiver": ["if://agent/session-2/haiku-07A"],
  "content_type": "calendar_integration",
  "content": {
    "integration_name": "VAT Compliance Deadline Tracking",
    "integration_type": "recurring_deadline_feed",

    "data_source": {
      "system": "VAT Tax Jurisdiction Tracking (S2-H03A)",
      "table": "boat_tax_status",
      "query_fields": ["boat_id", "boat_name", "flag_jurisdiction", "home_jurisdiction", "next_required_exit_date", "ta_expiry_date", "compliance_status", "alert_level"]
    },

    "event_mapping": {
      "rule": "When boat.alert_level changes or boat.next_required_exit_date approaches",

      "events_to_create": [
        {
          "trigger": "boat.ta_status == 'ACTIVE' AND boat.vat_paid == FALSE",
          "event_type": "tax_exit_required",
          "calendar_date": "boat.next_required_exit_date",
          "title_template": "🚢 EU Exit Required - {{boat.boat_name}} ({{boat.home_jurisdiction}}) - VAT Compliance",
          "description_template": "DEADLINE: Exit {{boat.home_jurisdiction}} waters by {{boat.ta_expiry_date}} to comply with non-VAT yacht regulations. Failure to exit results in {{boat.home_jurisdiction}}.penalty_amount VAT + penalties.",
          "color": "red",
          "priority": "CRITICAL"
        },
        {
          "trigger": "boat.days_until_exit == 60",
          "event_type": "vat_compliance_reminder",
          "calendar_date": "date.today",
          "title_template": "[60 Days] EU Exit Deadline Approaching - {{boat.boat_name}}",
          "color": "yellow",
          "priority": "MEDIUM"
        },
        {
          "trigger": "boat.days_until_exit == 30",
          "event_type": "vat_compliance_reminder",
          "calendar_date": "date.today",
          "title_template": "⚠️ [30 Days] EU Exit Required - {{boat.boat_name}}",
          "color": "orange",
          "priority": "HIGH"
        },
        {
          "trigger": "boat.days_until_exit == 14",
          "event_type": "vat_compliance_reminder",
          "calendar_date": "date.today",
          "title_template": "⚠️ [14 Days] EU Exit Required - {{boat.boat_name}} - URGENT",
          "color": "orange",
          "priority": "HIGH"
        },
        {
          "trigger": "boat.days_until_exit == 7",
          "event_type": "vat_compliance_reminder",
          "calendar_date": "date.today",
          "title_template": "🚨 [7 Days] EU Exit URGENT - {{boat.boat_name}} - LEGAL RISK",
          "color": "red",
          "priority": "CRITICAL"
        }
      ]
    },

    "sync_frequency": "daily_at_02:00_UTC",
    "sync_method": "incremental_delta",
    "conflict_resolution": "calendar_event_is_authoritative",

    "requested_calendar_features": [
      "color_coding: red=critical, orange=high, yellow=medium",
      "recurring_reminders: 7/14/30/60 days before deadline",
      "attachments: exit-requirements-checklist, customs-contact-info",
      "task_integration: create subtasks for exit preparation steps",
      "timezone_support: local yacht operating timezone + UTC",
      "notifications: email + SMS + in-app push"
    ]
  }
}
```

**Expected Response: S2-H07A → S2-H03A**

```json
{
  "performative": "inform",
  "sender": "if://agent/session-2/haiku-07A",
  "receiver": ["if://agent/session-2/haiku-03A"],
  "content_type": "integration_status",
  "content": {
    "status": "active",
    "integration_id": "calendar-vat-compliance-001",
    "calendar_systems_connected": ["Google Calendar", "Outlook 365", "iCal", "Apple Calendar"],
    "event_sync_status": "operational",
    "events_created": 47,
    "events_pending_creation": 3,
    "last_sync": "2025-11-13T02:00:00Z",
    "next_sync": "2025-11-14T02:00:00Z",
    "user_notifications_enabled": true,
    "notification_channels": ["email", "sms", "in_app_popup"]
  }
}
```

---

## Part 8: Data Management & Maintenance

### 8.1 Regular Maintenance Tasks

**Daily (02:00 UTC):**
- Calculate days_until_exit for all active boats
- Update compliance_status for all boats
- Generate alerts for threshold crossings
- Sync calendar events with S2-H07A

**Weekly (Sundays 03:00 UTC):**
- Review overdue boats (compliance_status = 'NON_COMPLIANT')
- Send escalation notifications
- Generate fleet compliance report
- Identify boats approaching lifetime TA limit

**Monthly (1st day, 04:00 UTC):**
- Review jurisdiction_rules for regulation updates
- Verify exit_history documentation
- Generate compliance audit trail
- Calculate cumulative TA usage

**Quarterly:**
- Review enforcement patterns per jurisdiction
- Update enforcement_strictness and known_enforcement_frequency
- Monitor regulation changes (EU, national customs)
- Update jurisdiction rule configurations

### 8.2 Backup & Archive Strategy

- Daily backup of boat_tax_status and exit_history tables
- Archive compliance_alerts older than 2 years
- Maintain 5-year historical records for audit purposes
- Document all jurisdiction_rules changes with timestamp

---

## Part 9: Implementation Roadmap

### Phase 1: MVP (Week 1-2)
- Database schema creation (all 5 tables)
- Core compliance calculation algorithm
- 60/30/14/7 day alert generation
- Basic dashboard widget (single boat view)

### Phase 2: Expansion (Week 3-4)
- Multi-jurisdiction rules engine
- Jurisdiction-specific alert templates
- Exit documentation tracking (exit_history table)
- Calendar integration (S2-H07A IF.bus)

### Phase 3: Refinement (Week 5-6)
- Fleet overview dashboard
- Lifetime TA usage calculations
- Automated daily/weekly/monthly maintenance jobs
- Rule update mechanism

### Phase 4: Optimization (Week 7+)
- Advanced reporting and compliance metrics
- Mobile app notifications
- Integration with external calendar systems
- Machine learning for early-warning pattern detection

---

## Compliance & Risk Summary

| Jurisdiction | VAT Rate | Exit Frequency | Enforcement | Lifetime Limit | Penalties | Reset Options |
|---|---|---|---|---|---|---|
| **France** | 20% | 18 months | STRICT/HIGH | 10 years | +50-100% | Monaco (same VAT) |
| **Spain** | 21% | 18 months | MODERATE | 10 years | +50-100% | Melilla, Ceuta, Gibraltar |
| **Italy** | 22% | 18 months | STRICT/HIGH | 10 years | +75%+ criminal | Gibraltar, non-EU ports |
| **Monaco** | 20% | 18 months | STRICT | 10 years | +50-100% | Same as France |
| **Gibraltar** | 0% VAT | N/A (non-EU) | LOW | N/A | N/A | Strategic reset point |
| **Malta** | 18% (5.4% lease) | 18 months | MODERATE | 10 years | Standard | Permanent EU option |
| **Cayman Is.** | NO VAT | N/A (non-EU) | N/A | N/A | Import duty 22-27% | Strategic registry |

---

## Glossary

- **TA (Temporary Admission):** EU customs regime allowing non-EU yachts 18 months in EU waters
- **VAT (Value Added Tax):** Tax assessed on yacht value upon entry; ranges 18-22% in EU
- **Customs Duty:** Import tax assessed beyond VAT; 5-10% typical
- **Exit Documentation:** Proof yacht left EU (marina invoice + customs stamp from non-EU port)
- **Reset:** Leaving EU and re-entering starts new 18-month TA clock
- **Non-VAT Paid:** Yacht purchased outside EU; brings into EU under TA exemption
- **VAT-Paid:** Yacht purchased in EU with VAT already paid; no exit deadline
- **Lifetime Limit:** 10-year maximum under TA across entire yacht ownership
- **Compliance Status:** COMPLIANT (60+ days), AT_RISK (7-60 days), NON_COMPLIANT (expired)
- **Enforcement Strictness:** STRICT (France/Italy), MODERATE (Spain), LENIENT (non-EU)

---

**Specification Version:** 1.0
**Last Updated:** 2025-11-13
**Authored by:** S2-H03A (VAT/Tax Jurisdiction Tracking & Compliance Reminders)
