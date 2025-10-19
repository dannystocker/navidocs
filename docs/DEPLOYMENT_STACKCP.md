# Deploying NaviDocs on StackCP (20i Hosting)

## What is StackCP?

**StackCP** is a proprietary hosting control panel developed by **20i** (a UK-based hosting provider).

### Key Facts:
- **Developer**: 20i (https://www.20i.com)
- **Type**: Custom-built control panel (alternative to cPanel/Plesk)
- **Target**: Reseller hosting and shared hosting customers
- **Features**: Email management, File Manager, FTP, databases, malware scanning, 80+ one-click installs

## Important: Node.js Support on StackCP

### ❌ Standard Shared Hosting (StackCP)
**Node.js is NOT supported on 20i's shared hosting platform.**

From 20i documentation:
> "Node.JS isn't currently supported on the shared hosting platform. If NodeJS is a requirement, you should consider purchasing Managed Hosting."

### ✅ Managed VPS/Cloud Hosting (with StackCP)
**Node.js IS supported on 20i's Managed VPS and Cloud Server offerings.**

These include:
- Node.js application registration tool
- Custom executable directory permissions
- Full control over server environment

## Understanding "Executable Directory" on StackCP

When you mentioned **"shared hosting but with an executable directory"**, this likely refers to:

### Option 1: Managed Cloud Hosting (Most Likely)
20i's **Managed Cloud Hosting** allows:
- ✅ Running Node.js applications
- ✅ Custom executable binaries (like Meilisearch, Tesseract)
- ✅ SSH access
- ✅ Custom directory permissions
- ✅ Long-running processes (workers)

**This is what you need for NaviDocs!**

### Option 2: Shared Hosting with Limited Binaries (Not Suitable)
Some shared hosts allow static binaries in specific directories, but:
- ❌ No Node.js runtime
- ❌ No long-running processes
- ❌ No background workers
- ❌ Limited to PHP/Python CGI scripts

**NaviDocs requires Node.js - shared hosting won't work.**

## StackCP Tech Stack (Based on 20i Infrastructure)

### Server Environment:
```
Operating System: Linux (likely CentOS/AlmaLinux)
Web Server: Apache/Nginx (varies by plan)
Control Panel: StackCP (proprietary)
Database: MySQL/MariaDB (managed)
File Manager: Built-in StackCP File Manager
FTP/SFTP: Supported
SSH: Available on VPS/Cloud plans
```

### For Managed Hosting (Node.js):
```
Node.js: Multiple versions available (select via StackCP)
Package Manager: npm/yarn
Process Manager: PM2 or custom (you manage)
Reverse Proxy: Configured via StackCP
SSL/TLS: Let's Encrypt (free, auto-renew)
```

### Directory Structure (Typical):
```
/home/username/
├── public_html/          # Web root (static files)
├── node_apps/            # Node.js applications
│   └── navidocs/
│       ├── server/
│       ├── client/dist/  # Built frontend
│       ├── uploads/
│       └── logs/
├── bin/                  # Custom executables
│   ├── meilisearch
│   └── tesseract (if not system-installed)
├── .env                  # Environment variables
└── logs/                 # Application logs
```

## NaviDocs Deployment on StackCP (Managed Hosting)

### Prerequisites:
- ✅ **Managed VPS or Cloud Server** (NOT shared hosting)
- ✅ SSH access enabled
- ✅ Node.js enabled via StackCP
- ✅ Database created via StackCP

### Step-by-Step Deployment:

#### 1. Enable Node.js in StackCP
```
1. Log into StackCP
2. Go to "Advanced" → "Node.js Applications"
3. Click "Add Application"
4. Set Node.js version (recommend LTS: 20.x)
5. Set application path: /home/username/node_apps/navidocs
6. Set startup file: server/index.js
7. Set environment: production
8. Save
```

#### 2. Upload NaviDocs via SSH
```bash
# SSH into your server
ssh username@yourserver.20i.com

# Create directory
mkdir -p ~/node_apps/navidocs
cd ~/node_apps/navidocs

# Clone or upload your code
git clone https://github.com/yourusername/navidocs.git .

# Install dependencies
cd server
npm install --production

cd ../client
npm install
npm run build
```

#### 3. Install System Dependencies

##### Option A: If you have sudo access (VPS):
```bash
# Install Tesseract
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-eng poppler-utils

# Install Redis
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

##### Option B: If no sudo (Managed Cloud):
```bash
# Download Meilisearch binary
cd ~/bin
wget https://github.com/meilisearch/meilisearch/releases/download/v1.11.3/meilisearch-linux-amd64
mv meilisearch-linux-amd64 meilisearch
chmod +x meilisearch

# Add to PATH
echo 'export PATH=$HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Contact 20i support to install Tesseract and Redis
# Or use Google Cloud Vision API instead of Tesseract
```

#### 4. Configure Environment
```bash
cd ~/node_apps/navidocs/server

# Create .env file
cat > .env << 'EOF'
# Server
NODE_ENV=production
PORT=3001

# Database
DATABASE_PATH=/home/username/node_apps/navidocs/server/db/navidocs.db

# Redis (check with: redis-cli ping)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=changeme123
MEILISEARCH_INDEX_NAME=navidocs-pages

# OCR - Use Google Cloud Vision (no local Tesseract needed!)
PREFERRED_OCR_ENGINE=google-vision
GOOGLE_APPLICATION_CREDENTIALS=/home/username/node_apps/navidocs/server/config/google-credentials.json

# File Upload
MAX_FILE_SIZE=50000000
UPLOAD_DIR=/home/username/node_apps/navidocs/uploads

# JWT
JWT_SECRET=your-secure-random-string-here
JWT_EXPIRES_IN=7d
EOF
```

#### 5. Initialize Database
```bash
cd ~/node_apps/navidocs/server
node db/init.js
```

#### 6. Start Services

##### Meilisearch:
```bash
# Create systemd service or use screen/tmux
screen -S meilisearch
~/bin/meilisearch --master-key="changeme123" \
  --db-path=~/node_apps/navidocs/meilisearch-data \
  --http-addr=127.0.0.1:7700 \
  --env=production
# Press Ctrl+A then D to detach
```

##### OCR Worker:
```bash
screen -S ocr-worker
cd ~/node_apps/navidocs
node server/workers/ocr-worker.js
# Press Ctrl+A then D to detach
```

##### Main Application (via StackCP):
```
1. Go to StackCP → Node.js Applications
2. Find your NaviDocs app
3. Click "Start"
4. StackCP will manage the process automatically
```

#### 7. Configure Reverse Proxy in StackCP
```
1. StackCP → Domains → yoursite.com
2. Add reverse proxy:
   - Source: yoursite.com
   - Target: http://127.0.0.1:3001
   - Enable SSL (Let's Encrypt)
3. Save
```

#### 8. Build and Serve Frontend
```bash
# Option A: Serve via Node.js (included in backend)
# Already done - the backend serves the built frontend

# Option B: Serve via Apache/Nginx (StackCP manages)
cd ~/node_apps/navidocs/client
npm run build

# Copy build to web root
cp -r dist/* ~/public_html/

# Configure StackCP to proxy API calls to Node.js:
# yoursite.com/api/* → http://127.0.0.1:3001/api/*
```

## Recommended Approach for StackCP

### Use Google Cloud Vision API for OCR
Since StackCP shared/managed hosting may have limited system package installation:

```env
# Avoid Tesseract dependency issues
PREFERRED_OCR_ENGINE=google-vision

# Or use Drive API (slower but free)
PREFERRED_OCR_ENGINE=google-drive
```

This eliminates the need for:
- Tesseract binaries
- Poppler utils
- Language training data

### Use Managed Redis
Check if 20i offers managed Redis, or use Redis Cloud (free tier):
```env
REDIS_HOST=your-redis-instance.redis.cloud
REDIS_PORT=12345
REDIS_PASSWORD=your-password
```

### Monitor with PM2
```bash
# Install PM2
npm install -g pm2

# Start worker with PM2
pm2 start server/workers/ocr-worker.js --name navidocs-worker

# Save PM2 configuration
pm2 save

# Setup PM2 startup (if you have sudo)
pm2 startup
```

## StackCP Limitations for NaviDocs

### ⚠️ Challenges:
1. **Limited system package installation** (no apt-get on shared)
2. **No background service management** (no systemd on shared)
3. **Resource limits** (CPU, RAM, concurrent connections)
4. **File system permissions** (may restrict executable binaries)

### ✅ Solutions:
1. **Use Google Cloud APIs** instead of local binaries
2. **Use PM2 or screen** for background processes
3. **Upgrade to VPS** if limits are hit
4. **Contact 20i support** for executable permissions

## Alternative: Deploy on VPS Instead

If StackCP's managed hosting is too restrictive, consider:

### 20i Managed VPS (Full Control):
```
✅ Full sudo access
✅ Install any packages
✅ Systemd services
✅ More resources
✅ Better for NaviDocs
```

### Other VPS Providers:
- **DigitalOcean** ($6/month droplet)
- **Linode** ($5/month)
- **Vultr** ($6/month)
- **AWS Lightsail** ($3.50/month)

All offer:
- Full Linux environment
- Node.js support
- Background workers
- Custom executables

## Getting Help

### 20i Support:
- **Email**: support@20i.com
- **Docs**: https://docs.20i.com
- **Ask about**:
  - Node.js version availability
  - Executable binary permissions
  - Background process management
  - Redis/Meilisearch installation

### StackCP-Specific Questions:
1. Can I run custom binaries in `~/bin`?
2. Is Redis available or can I use Redis Cloud?
3. Can I keep background workers running (OCR worker)?
4. What's the best way to manage Node.js processes?

## Summary

**StackCP** is 20i's control panel, but for **NaviDocs you need**:

| Feature | Shared Hosting | Managed VPS | ✅ Needed for NaviDocs |
|---------|---------------|-------------|----------------------|
| Node.js | ❌ | ✅ | ✅ |
| Custom binaries | ❌ | ✅ | ⚠️ Optional (use Google APIs) |
| Background workers | ❌ | ✅ | ✅ |
| Redis | ❌ | ✅ | ✅ |
| SSH access | ❌ | ✅ | ✅ |

**Recommendation**:
- If you have **Managed VPS/Cloud** with StackCP: Follow this guide ✅
- If you have **Shared Hosting** with StackCP: Upgrade to VPS or switch providers ❌

The "executable directory" likely means you have VPS access - verify with 20i support!
