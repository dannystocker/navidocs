# Secure GitHub Access for Cloud Agents

**Problem:** Cloud agents on StackCP need read access to private repo `dannystocker/navidocs`
**Security Goal:** No exposure of main GitHub credentials, revokable access, minimal permissions

---

## Option 1: GitHub Deploy Keys (RECOMMENDED)

**Best for:** Read-only access to a single private repo
**Security:** Excellent - key only works for one repo, easily revokable

### How It Works
1. Generate SSH key pair on StackCP
2. Add public key to GitHub repo as "Deploy Key" (read-only)
3. Cloud agents use private key to clone/pull
4. Key never leaves StackCP server

### Setup Steps (10 minutes)

#### Step 1: Generate Deploy Key on StackCP

```bash
# SSH to StackCP
ssh stackcp

# Generate dedicated key (no passphrase for automation)
ssh-keygen -t ed25519 -C "navidocs-cloud-deploy" -f ~/.ssh/navidocs_deploy_key -N ""

# This creates:
# ~/.ssh/navidocs_deploy_key (private - keep secure!)
# ~/.ssh/navidocs_deploy_key.pub (public - add to GitHub)

# Display public key to copy
cat ~/.ssh/navidocs_deploy_key.pub
```

#### Step 2: Add Deploy Key to GitHub

1. Go to: https://github.com/dannystocker/navidocs/settings/keys
2. Click "Add deploy key"
3. Title: `StackCP Cloud Agents (Read-Only)`
4. Key: Paste the contents of `navidocs_deploy_key.pub`
5. ✅ **IMPORTANT:** Leave "Allow write access" UNCHECKED (read-only)
6. Click "Add key"

#### Step 3: Configure Git on StackCP

```bash
# Still on StackCP
cat >> ~/.ssh/config << 'EOF'
Host github.com-navidocs
    HostName github.com
    User git
    IdentityFile ~/.ssh/navidocs_deploy_key
    IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config

# Test connection
ssh -T git@github.com-navidocs
# Should see: "Hi dannystocker/navidocs! You've successfully authenticated..."
```

#### Step 4: Clone Repo Using Deploy Key

```bash
# Clone using the deploy key
git clone git@github.com-navidocs:dannystocker/navidocs.git ~/navidocs-cloud

# Or if already cloned, update remote
cd ~/navidocs-cloud
git remote set-url origin git@github.com-navidocs:dannystocker/navidocs.git

# Test pull
git pull
```

#### Step 5: Cloud Agents Use It

```bash
# In cloud agent script
cd ~/navidocs-cloud
git fetch origin
git checkout mvp-demo-build
git pull

# Private key is automatically used via SSH config
```

### Security Benefits
- ✅ Key only works for `dannystocker/navidocs` (not other repos)
- ✅ Read-only access (agents can't push)
- ✅ Revokable instantly from GitHub UI
- ✅ No main GitHub credentials exposed
- ✅ Key never transmitted (stays on StackCP)

### Revocation (if compromised)
1. Go to: https://github.com/dannystocker/navidocs/settings/keys
2. Find "StackCP Cloud Agents (Read-Only)"
3. Click "Delete"
4. Access immediately revoked

---

## Option 2: GitHub Personal Access Token (Fine-Grained)

**Best for:** More control over permissions and expiration
**Security:** Good - token can be scoped and expires

### How It Works
1. Create fine-grained token with read-only access to `navidocs` repo
2. Store token in StackCP environment variable
3. Use HTTPS clone with token authentication

### Setup Steps

#### Step 1: Create Fine-Grained Token

1. Go to: https://github.com/settings/tokens?type=beta
2. Click "Generate new token" → "Generate new token (Beta)"
3. Settings:
   - **Token name:** `NaviDocs Cloud Agents (Read-Only)`
   - **Expiration:** 90 days (or custom)
   - **Repository access:** Only select repositories → `dannystocker/navidocs`
   - **Permissions:**
     - Repository permissions:
       - Contents: **Read-only** ✅
       - Metadata: **Read-only** ✅ (auto-selected)
     - DO NOT grant any write permissions
4. Click "Generate token"
5. **COPY TOKEN IMMEDIATELY** (you won't see it again!)

#### Step 2: Store Token Securely on StackCP

```bash
ssh stackcp

# Store in secure file (readable only by you)
echo "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" > ~/.navidocs_github_token
chmod 600 ~/.navidocs_github_token

# Or in environment variable
echo 'export NAVIDOCS_GITHUB_TOKEN="ghp_xxxxx..."' >> ~/.bashrc
source ~/.bashrc
```

#### Step 3: Clone with Token

```bash
# Read token from file
TOKEN=$(cat ~/.navidocs_github_token)

# Clone using token
git clone https://x-access-token:${TOKEN}@github.com/dannystocker/navidocs.git ~/navidocs-cloud

# Or configure credential helper
git config --global credential.helper store
echo "https://x-access-token:${TOKEN}@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials
```

#### Step 4: Cloud Agents Use It

```bash
# Token is automatically used
cd ~/navidocs-cloud
git pull origin mvp-demo-build
```

### Security Benefits
- ✅ Fine-grained permissions (only Contents: Read)
- ✅ Auto-expires after 90 days
- ✅ Can be scoped to specific repos
- ✅ Revokable from GitHub settings

### Revocation
1. Go to: https://github.com/settings/tokens?type=beta
2. Find "NaviDocs Cloud Agents (Read-Only)"
3. Click "Delete"

---

## Option 3: SSH Agent Forwarding (MOST SECURE)

**Best for:** Using your local credentials without storing on StackCP
**Security:** Excellent - no keys stored on cloud server

### How It Works
1. Your local SSH key is forwarded through SSH connection
2. Cloud agent uses YOUR credentials via the tunnel
3. No keys stored on StackCP

### Setup Steps

#### Step 1: Enable SSH Agent Forwarding Locally

```bash
# On your local machine
# Ensure SSH agent is running
eval "$(ssh-agent -s)"

# Add your GitHub key
ssh-add ~/.ssh/id_ed25519  # or your GitHub key

# Verify
ssh-add -l
```

#### Step 2: Configure SSH Forwarding

```bash
# Edit ~/.ssh/config on local machine
cat >> ~/.ssh/config << 'EOF'
Host stackcp
    HostName ssh.gb.stackcp.com
    User digital-lab.ca
    ForwardAgent yes
EOF
```

#### Step 3: Test Forwarding

```bash
# SSH to StackCP with agent forwarding
ssh stackcp

# From StackCP, test GitHub access (using YOUR local key!)
ssh -T git@github.com
# Should see: "Hi dannystocker! You've successfully authenticated..."
```

#### Step 4: Clone Repo

```bash
# On StackCP (using forwarded credentials)
git clone git@github.com:dannystocker/navidocs.git ~/navidocs-cloud
```

### Security Benefits
- ✅ No keys stored on StackCP
- ✅ Uses your existing GitHub access
- ✅ Automatic when you SSH to StackCP
- ✅ Stops working when you disconnect

### Limitations
- ❌ Only works while you're SSH'd in
- ❌ Cloud agents can't run autonomously
- ❌ Not suitable for automated background tasks

**NOT RECOMMENDED for this use case** (agents need to run autonomously)

---

## Comparison Table

| Feature | Deploy Keys | Fine-Grained Token | SSH Forwarding |
|---------|-------------|-------------------|----------------|
| **Setup Time** | 10 min | 5 min | 2 min |
| **Autonomous Use** | ✅ Yes | ✅ Yes | ❌ No (requires SSH session) |
| **Read-Only** | ✅ Enforced | ✅ Configurable | ❌ Uses your full access |
| **Revokable** | ✅ Instant | ✅ Instant | ✅ Auto (on disconnect) |
| **Repo-Specific** | ✅ Yes | ✅ Yes | ❌ All repos you access |
| **Key Storage** | StackCP only | StackCP only | Local only |
| **Expiration** | None | Configurable | Per session |
| **Best For** | Cloud agents | Temp access | Interactive use |

---

## RECOMMENDED SOLUTION: Deploy Keys + Environment Security

### Complete Secure Setup (15 minutes)

```bash
# ============================================
# STEP 1: Generate deploy key on StackCP
# ============================================
ssh stackcp << 'SETUP'
  # Generate key
  ssh-keygen -t ed25519 -C "navidocs-cloud-$(date +%Y%m%d)" \
    -f ~/.ssh/navidocs_deploy_key -N ""

  # Secure permissions
  chmod 700 ~/.ssh
  chmod 600 ~/.ssh/navidocs_deploy_key
  chmod 644 ~/.ssh/navidocs_deploy_key.pub

  # Configure SSH
  cat >> ~/.ssh/config << 'EOF'
Host github.com-navidocs
    HostName github.com
    User git
    IdentityFile ~/.ssh/navidocs_deploy_key
    IdentitiesOnly yes
    StrictHostKeyChecking no
EOF
  chmod 600 ~/.ssh/config

  # Display public key
  echo "========================================"
  echo "ADD THIS PUBLIC KEY TO GITHUB:"
  echo "https://github.com/dannystocker/navidocs/settings/keys"
  echo "========================================"
  cat ~/.ssh/navidocs_deploy_key.pub
  echo "========================================"
SETUP

# ============================================
# STEP 2: Add public key to GitHub manually
# ============================================
# (You must do this in browser - see above)

# ============================================
# STEP 3: Test and clone on StackCP
# ============================================
ssh stackcp << 'TEST'
  # Test connection
  ssh -T git@github.com-navidocs

  # Clone repo
  git clone git@github.com-navidocs:dannystocker/navidocs.git ~/navidocs-cloud

  # Verify
  cd ~/navidocs-cloud
  git remote -v
  git branch -a

  echo "✅ Secure GitHub access configured!"
TEST
```

### Additional Security Hardening

```bash
# On StackCP: Restrict file permissions
ssh stackcp << 'SECURE'
  # Ensure home directory is not world-readable
  chmod 750 ~

  # Secure SSH directory
  chmod 700 ~/.ssh
  chmod 600 ~/.ssh/navidocs_deploy_key

  # Secure navidocs directory
  chmod 750 ~/navidocs-cloud

  # Create audit log
  echo "$(date): Deploy key created for navidocs cloud agents" >> ~/.security_audit.log
  chmod 600 ~/.security_audit.log
SECURE
```

---

## Security Checklist

Before deploying cloud agents:

- [ ] Deploy key generated on StackCP (not local machine)
- [ ] Public key added to GitHub with **Read-only** access
- [ ] Private key permissions set to 600
- [ ] SSH config uses IdentitiesOnly yes
- [ ] Test clone/pull works
- [ ] Document key creation in security audit log
- [ ] Set calendar reminder to rotate key in 6 months
- [ ] Store backup of public key locally (for audit trail)

---

## Key Rotation Schedule

**Recommended:** Rotate deploy keys every 6 months

```bash
# Create calendar reminder
echo "2025-05-13: Rotate NaviDocs StackCP deploy key" >> ~/security-reminders.txt
```

**Rotation process:**
1. Generate new deploy key on StackCP
2. Add new public key to GitHub (keep old key active)
3. Update git config to use new key
4. Test clone/pull with new key
5. Remove old deploy key from GitHub
6. Delete old private key from StackCP

---

## Emergency Revocation

If you suspect the deploy key is compromised:

```bash
# 1. Revoke from GitHub immediately
# Go to: https://github.com/dannystocker/navidocs/settings/keys
# Delete the deploy key

# 2. Rotate key on StackCP
ssh stackcp "rm ~/.ssh/navidocs_deploy_key*"

# 3. Generate new key (follow setup steps above)

# 4. Update security audit log
ssh stackcp "echo '$(date): EMERGENCY - Deploy key revoked and rotated' >> ~/.security_audit.log"
```

---

## Status: READY TO IMPLEMENT

**Recommended:** Deploy Keys (Option 1)

**Next steps:**
1. Run the complete setup script above (15 min)
2. Test clone/pull from StackCP
3. Document in security audit log
4. Deploy cloud agents

**Security level:** ✅ Production-ready
