-- NaviDocs Database Schema Migration
-- Created: 2025-11-14
-- Description: PostgreSQL migrations for 16 new tables to support boat documentation features

-- Table 1: inventory_items (equipment tracking, depreciation, photos)
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    boat_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    current_value DECIMAL(10,2),
    photo_urls TEXT[],
    depreciation_rate DECIMAL(5,4) DEFAULT 0.1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inventory_boat ON inventory_items(boat_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);

-- Table 2: maintenance_records (service history, reminders)
CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    boat_id INTEGER NOT NULL,
    service_type VARCHAR(100),
    date DATE,
    provider VARCHAR(255),
    cost DECIMAL(10,2),
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_maintenance_boat ON maintenance_records(boat_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_due ON maintenance_records(next_due_date);

-- Table 3: camera_feeds (Home Assistant RTSP integration)
CREATE TABLE IF NOT EXISTS camera_feeds (
    id SERIAL PRIMARY KEY,
    boat_id INTEGER NOT NULL,
    camera_name VARCHAR(255),
    rtsp_url TEXT,
    last_snapshot_url TEXT,
    webhook_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_camera_boat ON camera_feeds(boat_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_camera_webhook ON camera_feeds(webhook_token);

-- Table 4: contacts (marina, mechanics, vendors)
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    name VARCHAR(255),
    type VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);

-- Table 5: expenses (multi-user splitting, OCR receipts)
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    boat_id INTEGER NOT NULL,
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    date DATE,
    category VARCHAR(100),
    receipt_url TEXT,
    ocr_text TEXT,
    split_users JSONB,
    approval_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expenses_boat ON expenses(boat_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(approval_status);

-- Table 6: warranties (expiration alerts, claims)
CREATE TABLE IF NOT EXISTS warranties (
    id SERIAL PRIMARY KEY,
    boat_id INTEGER NOT NULL,
    item_name VARCHAR(255),
    provider VARCHAR(255),
    start_date DATE,
    end_date DATE,
    coverage_details TEXT,
    claim_history JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_warranties_boat ON warranties(boat_id);
CREATE INDEX IF NOT EXISTS idx_warranties_end ON warranties(end_date);

-- Table 7: calendars (service, warranty, onboard schedules)
CREATE TABLE IF NOT EXISTS calendars (
    id SERIAL PRIMARY KEY,
    boat_id INTEGER NOT NULL,
    event_type VARCHAR(100),
    title VARCHAR(255),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    reminder_days_before INTEGER DEFAULT 7,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendars_boat ON calendars(boat_id);
CREATE INDEX IF NOT EXISTS idx_calendars_start ON calendars(start_date);

-- Table 8: notifications (WhatsApp integration)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(100),
    message TEXT,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    delivery_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent_at);

-- Table 9: tax_tracking (VAT/customs stamps)
CREATE TABLE IF NOT EXISTS tax_tracking (
    id SERIAL PRIMARY KEY,
    boat_id INTEGER NOT NULL,
    country VARCHAR(3),
    tax_type VARCHAR(100),
    document_url TEXT,
    issue_date DATE,
    expiry_date DATE,
    amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tax_boat ON tax_tracking(boat_id);
CREATE INDEX IF NOT EXISTS idx_tax_expiry ON tax_tracking(expiry_date);

-- Table 10: tags (categorization system)
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Table 11: attachments (file storage metadata)
CREATE TABLE IF NOT EXISTS attachments (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    file_url TEXT,
    file_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);

-- Table 12: audit_logs (activity tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Table 13: user_preferences (settings)
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE,
    theme VARCHAR(50) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    notifications_enabled BOOLEAN DEFAULT true,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_preferences_user ON user_preferences(user_id);

-- Table 14: api_keys (external integrations)
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    service_name VARCHAR(100),
    api_key_encrypted TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_apikeys_user ON api_keys(user_id);

-- Table 15: webhooks (event subscriptions)
CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER,
    event_type VARCHAR(100),
    url TEXT,
    secret_token VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_event ON webhooks(event_type);

-- Table 16: search_history (user search analytics)
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    query TEXT,
    results_count INTEGER,
    clicked_result_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_search_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_created ON search_history(created_at);

-- End of migration file
