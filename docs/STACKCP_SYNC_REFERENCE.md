# StackCP Production Sync Reference (2025-11-27)

This document provides the actual SCP commands and file locations for syncing
drifted production files from StackCP back into the Git repository.

## StackCP Server Access

**Server:** icantwait.ca (hosted on StackCP)
**SSH Key:** Stored in ~/.ssh/icantwait.ca
**Remote Path:** `/public_html/icantwait.ca/`
**Connection:** StackCP SSH key authentication

## Recovered Files - Original Locations

### 1. Database Connection Configuration
```bash
# Original location on StackCP
/public_html/icantwait.ca/server/config/db_connect.js

# Download command:
scp -i ~/.ssh/icantwait.ca ggq@icantwait.ca:/public_html/icantwait.ca/server/config/db_connect.js ./server/config/

# Analysis:
# - Contains production MySQL connection pooling
# - Database credentials are environment-variable injected (secure pattern)
# - Connection timeout and keepalive configuration
# - Timezone standardization for international data
```

### 2. Mobile Document Viewer
```bash
# Original location on StackCP
/public_html/icantwait.ca/public/js/doc-viewer.js

# Download command:
scp -i ~/.ssh/icantwait.ca ggq@icantwait.ca:/public_html/icantwait.ca/public/js/doc-viewer.js ./public/js/

# Analysis:
# - Mobile UI enhancements for tablet/iPad viewing
# - Touch gesture support: swipe navigation and pinch-to-zoom
# - Swiss market requirement: responsive design for international use
# - Dark mode support
# - Phase 2 feature that was deployed to production but not committed to Git
```

### 3. Production API Routes
```bash
# Original location on StackCP
/public_html/icantwait.ca/routes/api_v1.js

# Download command:
scp -i ~/.ssh/icantwait.ca ggq@icantwait.ca:/public_html/icantwait.ca/routes/api_v1.js ./routes/

# Analysis:
# - RESTful API endpoints for document management
# - Pagination support with safety limits
# - Input validation and parameterized queries (SQL injection protection)
# - Consistent JSON response format
# - Hot-fixes for performance not in main repository
# - Security review pending (credentials checking)
```

### 4. Apache Rewrite Rules
```bash
# Original location on StackCP
/public_html/icantwait.ca/.htaccess

# Download command:
scp -i ~/.ssh/icantwait.ca ggq@icantwait.ca:/public_html/icantwait.ca/.htaccess ./

# Analysis:
# - HTTPS enforcement with load balancer support (X-Forwarded-Proto check)
# - SPA routing: clean URL rewriting without extensions
# - Security headers: XSS, MIME-sniffing, clickjacking protection
# - Gzip compression for performance
# - Asset caching strategy (7 days for static, 0 for HTML)
# - Sensitive file protection (env, config, passwords, sql files)
```

### 5. Roadmap Documentation
```bash
# Original location in Windows Downloads
C:\Users\setup\Downloads\ROADMAP_V2.md

# This file was recovered from local filesystem analysis
# Contents document Phase 2 planning and partial implementation status
```

## Database Schema for Phase 2

The recovered files assume the following database structure exists:

```sql
-- Main documents table
CREATE TABLE IF NOT EXISTS documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FULLTEXT INDEX ft_title_desc (title, description)
);

-- Users table (for Phase 2 RBAC)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('viewer', 'editor', 'manager', 'admin') DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit trail for compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Manual Sync Process (If Needed)

### Step 1: Connect to StackCP Server
```bash
# Using SSH key authentication
ssh -i ~/.ssh/icantwait.ca ggq@icantwait.ca

# Verify you're connected to the right server
pwd  # Should show /home/ggq or similar
ls -la /public_html/icantwait.ca/
```

### Step 2: List Current Production Files
```bash
# Show current state of production files
ls -la /public_html/icantwait.ca/server/config/
ls -la /public_html/icantwait.ca/public/js/
ls -la /public_html/icantwait.ca/routes/
ls -la /public_html/icantwait.ca/ | grep htaccess
```

### Step 3: Download Individual Files
```bash
# Download each file to your local machine
scp -i ~/.ssh/icantwait.ca ggq@icantwait.ca:/public_html/icantwait.ca/server/config/db_connect.js ./server/config/
scp -i ~/.ssh/icantwait.ca ggq@icantwait.ca:/public_html/icantwait.ca/public/js/doc-viewer.js ./public/js/
scp -i ~/.ssh/icantwait.ca ggq@icantwait.ca:/public_html/icantwait.ca/routes/api_v1.js ./routes/
scp -i ~/.ssh/icantwait.ca ggq@icantwait.ca:/public_html/icantwait.ca/.htaccess ./
```

### Step 4: Verify Downloaded Files
```bash
# Check files were downloaded correctly
ls -la server/config/db_connect.js
ls -la public/js/doc-viewer.js
ls -la routes/api_v1.js
ls -la .htaccess

# Check file sizes match
stat server/config/db_connect.js
```

## Known Production Hot-Fixes Not in Git

1. **db_connect.js**
   - Connection pooling optimizations
   - Keepalive configuration for long-running queries
   - Timezone standardization

2. **doc-viewer.js**
   - Mobile UI patch for iPad viewing
   - Touch gesture support
   - Dark mode theme

3. **api_v1.js**
   - Performance improvements in pagination
   - Better error handling in endpoint responses
   - Rate limiting stubs

4. **.htaccess**
   - Updated security headers
   - Gzip compression rules
   - Cache optimization for assets

## Security Considerations

### Credentials Management
- Database credentials in db_connect.js should be environment variables
- No hardcoded passwords in production
- Use `.env` file or secrets manager (Hashicorp Vault, AWS Secrets Manager)

### API Security
- JWT authentication on all endpoints
- CORS headers configured correctly
- Rate limiting on public endpoints
- Input validation on all POST/PUT endpoints

### Apache Configuration
- Security headers properly set
- HTTPS enforcement working
- Sensitive files protected
- Rewrite rules preventing directory traversal

## Next Steps

1. **Agent 1 (Integrator)** - ✅ File recovery and documentation
2. **Agent 2 (SecureExec)** - Credential sanitization and security audit
3. **Agent 3 (DevOps)** - Deployment validation and testing
4. **Manual Review** - Team approval before merging to main branch

## Troubleshooting

### SSH Connection Issues
```bash
# Test SSH connection
ssh -i ~/.ssh/icantwait.ca -v ggq@icantwait.ca

# Verify SSH key permissions (should be 600)
chmod 600 ~/.ssh/icantwait.ca
```

### File Permission Issues
```bash
# Files should be readable after download
chmod 644 server/config/db_connect.js
chmod 644 public/js/doc-viewer.js
chmod 644 routes/api_v1.js
chmod 644 .htaccess
```

### Database Connection Issues
```bash
# Test database connection after recovery
node -e "const db = require('./server/config/db_connect'); db.query('SELECT NOW()').then(console.log)"
```

---

**Last Updated:** 2025-11-27
**Recovery Status:** Complete
**Next Phase:** Agent 2 - Security Review and Sanitization
