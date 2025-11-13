# NaviDocs - Remote Gitea Setup Guide

**Date:** 2025-10-24
**Remote Server:** 192.168.1.39
**User:** claude
**Purpose:** Push navidocs repository to remote Gitea instance

---

## Connection Information Extracted

From your MobaXterm configuration:
- **Host:** 192.168.1.39
- **Port:** 22 (SSH)
- **Username:** claude
- **Password:** (encrypted in MobaXterm - you'll need to provide this)

---

## Prerequisites

### 1. Verify Remote Server Accessibility

Test SSH connection:
```bash
ssh claude@192.168.1.39
```

Once connected, verify Gitea is running:
```bash
# Check if Gitea is installed
which gitea

# Check Gitea status (if running as systemd service)
sudo systemctl status gitea

# Check Gitea version
gitea --version

# Check if Gitea web interface is accessible
curl -I http://192.168.1.39:3000 2>/dev/null || curl -I http://192.168.1.39:4000
```

### 2. Identify Gitea Port

Common Gitea ports:
- 3000 (default)
- 4000 (custom)
- 8080 (alternative)

Check which port Gitea is running on:
```bash
sudo netstat -tulpn | grep gitea
# OR
sudo ss -tulpn | grep gitea
```

---

## Option 1: Manual Push (Recommended)

### Step 1: Create Repository on Remote Gitea

**Via Web Interface:**
1. Open browser: `http://192.168.1.39:PORT` (replace PORT with actual Gitea port)
2. Login with your Gitea credentials
3. Click "+" → "New Repository"
4. Repository Name: **navidocs**
5. Visibility: Private (recommended)
6. DO NOT initialize with README (repo already has files)
7. Click "Create Repository"

**Via CLI (if you have admin access):**
```bash
ssh claude@192.168.1.39

# Create repository for user 'claude'
cd /path/to/gitea
./gitea admin repo create \
  --owner claude \
  --name navidocs \
  --private
```

### Step 2: Add Remote to Local Repository

```bash
cd /home/setup/navidocs

# Add remote (replace PORT with actual Gitea port)
git remote add remote-gitea http://192.168.1.39:PORT/claude/navidocs.git

# Verify remote was added
git remote -v
```

### Step 3: Push to Remote Gitea

```bash
cd /home/setup/navidocs

# Push all branches
git push remote-gitea --all

# Push all tags (if any)
git push remote-gitea --tags
```

**Authentication:**
- You'll be prompted for username: `claude`
- You'll be prompted for password: (your Gitea password)

---

## Option 2: SSH Key Authentication (More Secure)

### Step 1: Generate SSH Key (if not already done)

```bash
# Check if you already have an SSH key
ls -la ~/.ssh/id_rsa.pub

# If not, generate one
ssh-keygen -t rsa -b 4096 -C "claude@192.168.1.39" -f ~/.ssh/id_rsa_gitea
```

### Step 2: Copy Public Key to Remote Server

```bash
# Copy public key to remote server
ssh-copy-id -i ~/.ssh/id_rsa_gitea.pub claude@192.168.1.39

# Or manually:
cat ~/.ssh/id_rsa_gitea.pub
# Then paste into Gitea web interface:
# Settings → SSH / GPG Keys → Add Key
```

### Step 3: Add SSH Remote

```bash
cd /home/setup/navidocs

# Add SSH remote (replace PORT with actual Gitea SSH port, usually 22)
git remote add remote-gitea ssh://claude@192.168.1.39:22/claude/navidocs.git

# OR if using custom SSH port (common for Gitea):
git remote add remote-gitea ssh://claude@192.168.1.39:2222/claude/navidocs.git

# Test connection
ssh -T claude@192.168.1.39
```

### Step 4: Push via SSH

```bash
cd /home/setup/navidocs
git push remote-gitea --all
git push remote-gitea --tags
```

---

## Option 3: Automated Script

Save this script as `/home/setup/navidocs/push-to-remote-gitea.sh`:

```bash
#!/bin/bash

# Configuration
REMOTE_HOST="192.168.1.39"
REMOTE_USER="claude"
GITEA_PORT="3000"  # Change this to your Gitea port
REPO_NAME="navidocs"
LOCAL_REPO="/home/setup/navidocs"

echo "=================================="
echo "NaviDocs - Remote Gitea Push Script"
echo "=================================="
echo ""
echo "Remote: http://${REMOTE_HOST}:${GITEA_PORT}/${REMOTE_USER}/${REPO_NAME}.git"
echo "Local:  ${LOCAL_REPO}"
echo ""

# Navigate to repository
cd "${LOCAL_REPO}" || exit 1

# Check if remote exists
if git remote | grep -q "remote-gitea"; then
    echo "✓ Remote 'remote-gitea' already exists"
    git remote -v | grep remote-gitea
else
    echo "Adding remote 'remote-gitea'..."
    git remote add remote-gitea "http://${REMOTE_HOST}:${GITEA_PORT}/${REMOTE_USER}/${REPO_NAME}.git"
    echo "✓ Remote added"
fi

echo ""
echo "Checking local repository status..."
git status --short

echo ""
echo "Pushing to remote Gitea..."
echo "(You'll be prompted for username and password)"
echo ""

# Push all branches and tags
git push remote-gitea --all
git push remote-gitea --tags

echo ""
echo "=================================="
echo "✓ Push complete!"
echo "=================================="
echo ""
echo "Verify at: http://${REMOTE_HOST}:${GITEA_PORT}/${REMOTE_USER}/${REPO_NAME}"
```

Make executable and run:
```bash
chmod +x /home/setup/navidocs/push-to-remote-gitea.sh
/home/setup/navidocs/push-to-remote-gitea.sh
```

---

## Troubleshooting

### Issue: "Repository not found"

**Solution:**
1. Ensure you created the repository on remote Gitea first
2. Verify the URL is correct:
   ```bash
   # Test URL accessibility
   curl http://192.168.1.39:PORT/claude/navidocs
   ```

### Issue: "Authentication failed"

**Solution:**
1. Verify username is correct: `claude`
2. Verify password is correct
3. Check if Gitea allows password authentication:
   ```bash
   # In Gitea app.ini, check:
   # [service]
   # DISABLE_REGISTRATION = false
   # REQUIRE_SIGNIN_VIEW = false
   ```

### Issue: "Connection refused"

**Solution:**
1. Verify Gitea is running:
   ```bash
   ssh claude@192.168.1.39 "sudo systemctl status gitea"
   ```
2. Check firewall rules:
   ```bash
   ssh claude@192.168.1.39 "sudo ufw status"
   ```
3. Verify Gitea port:
   ```bash
   ssh claude@192.168.1.39 "sudo netstat -tulpn | grep gitea"
   ```

### Issue: "Permission denied (publickey)"

**Solution:** Use HTTP authentication or set up SSH keys (see Option 2 above)

---

## Verification Checklist

After pushing, verify:

- [ ] Can access Gitea web interface: `http://192.168.1.39:PORT`
- [ ] Repository is visible in Gitea UI
- [ ] All commits are present (check commit history)
- [ ] All files are present (check file browser)
- [ ] All branches pushed:
  ```bash
  ssh claude@192.168.1.39
  cd /path/to/gitea/repos/claude/navidocs.git
  git branch -a
  ```

---

## Current Local Repository Status

```bash
# Check current status
cd /home/setup/navidocs
git status
git log --oneline -5
git branch -a
git remote -v
```

**Expected Output:**
```
origin  http://localhost:4000/ggq-admin/navidocs.git (fetch)
origin  http://localhost:4000/ggq-admin/navidocs.git (push)
```

---

## What Will Be Pushed

**Repository:** navidocs
**Location:** `/home/setup/navidocs/`
**Size:** ~50 MB (estimate)

**Contents:**
- ✅ Complete source code (client + server)
- ✅ All documentation (33+ markdown files)
- ✅ Test suite (comprehensive testing docs)
- ✅ Security audits (3 reports)
- ✅ Configuration files (.env.example, tailwind.config.js, etc.)
- ✅ Git history (21+ commits)

**Recent Work Included:**
- ✅ LibraryView.vue (new document library UI)
- ✅ Multi-tenancy security audit
- ✅ Disappearing documents bug report
- ✅ Comprehensive test documentation
- ✅ Liliane1 archive analysis
- ✅ Port migration (3000-5500 → 8000-8999)

---

## Quick Start Command

If you know the Gitea port and have created the repository, run:

```bash
cd /home/setup/navidocs

# Add remote (change PORT to your Gitea port, likely 3000 or 4000)
git remote add remote-gitea http://192.168.1.39:PORT/claude/navidocs.git

# Push everything
git push remote-gitea --all
git push remote-gitea --tags

# Verify
echo "✓ Pushed to: http://192.168.1.39:PORT/claude/navidocs"
```

---

## Alternative: Use Existing Local Gitea to Clone/Mirror

If you don't have direct access to create repositories on the remote Gitea, you can:

1. **Use local Gitea to create a bundle:**
   ```bash
   cd /home/setup/navidocs
   git bundle create navidocs.bundle --all
   ```

2. **Transfer bundle to remote server:**
   ```bash
   scp navidocs.bundle claude@192.168.1.39:/tmp/
   ```

3. **Clone from bundle on remote server:**
   ```bash
   ssh claude@192.168.1.39
   cd /path/to/gitea/repos/claude/
   git clone /tmp/navidocs.bundle navidocs.git
   ```

---

## Security Note

**Passwords:**
- The MobaXterm config contains encrypted passwords
- I cannot decrypt these passwords
- You'll need to provide the password when prompted
- Consider using SSH key authentication for better security

**Recommended:**
1. Set up SSH key authentication (Option 2 above)
2. Use Git credential helper to cache credentials:
   ```bash
   git config --global credential.helper cache
   # Or store permanently (less secure):
   git config --global credential.helper store
   ```

---

## Next Steps

1. **Determine Gitea Port:**
   ```bash
   ssh claude@192.168.1.39 "sudo netstat -tulpn | grep gitea"
   ```

2. **Create Repository on Remote Gitea** (via web interface or CLI)

3. **Run Push Command:**
   ```bash
   cd /home/setup/navidocs
   git remote add remote-gitea http://192.168.1.39:PORT/claude/navidocs.git
   git push remote-gitea --all
   ```

4. **Verify in Browser:**
   ```
   http://192.168.1.39:PORT/claude/navidocs
   ```

---

## Support

If you encounter issues:
1. Check SSH connection: `ssh claude@192.168.1.39`
2. Check Gitea status: `sudo systemctl status gitea`
3. Check Gitea logs: `sudo journalctl -u gitea -n 50`
4. Check Gitea port: `sudo netstat -tulpn | grep gitea`

---

**Created:** 2025-10-24
**For:** NaviDocs remote Gitea deployment
**Server:** 192.168.1.39 (claude user)
