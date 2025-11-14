# NaviDocs4 Session Recovery - Upload Bundle to StackCP

**Mission:** Save the 8 unpushed infrafabric commits (Session 3 SIP/Communication APIs) to StackCP server for recovery.

**StackCP Account:** digital-lab.ca@ssh.gb.stackcp.com
**Target Path:** ~/public_html/icantwait.ca/navidocs/recovery/

---

## Step 1: Create SSH Key File

The bundle backup already exists at `~/infrafabric-session3-backup.bundle` (117KB).

Now create the SSH key to connect to StackCP:

```bash
# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Create SSH private key
cat > ~/.ssh/stackcp_recovery_key << 'EOF'
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBKroElS1nZ11nQnkeg2AHZCTSbvvOcx3tPWesv4lANYAAAAKAnIZQGJyGU
BgAAAAtzc2gtZWQyNTUxOQAAACBKroElS1nZ11nQnkeg2AHZCTSbvvOcx3tPWesv4lANYA
AAAEBo3lvJ/Jwv95XFWVxEqXFyRDjqo9ofLMiRx9I88aFsy0qugSVLWdnXWdCeR6DYAdkJ
NJu+85zHe09Z6y/iUA1gAAAAG2RpZ2l0YWwtbGFiLmNhQGljYW50d2FpdC5jYQEC
-----END OPENSSH PRIVATE KEY-----
EOF

# Set correct permissions (SSH requires this)
chmod 600 ~/.ssh/stackcp_recovery_key

# Test SSH connection
ssh -i ~/.ssh/stackcp_recovery_key \
    -o StrictHostKeyChecking=no \
    digital-lab.ca@ssh.gb.stackcp.com \
    "echo 'SSH connection successful'"
```

---

## Step 2: Create Recovery Directory on StackCP

```bash
# Create the recovery directory under icantwait.ca
ssh -i ~/.ssh/stackcp_recovery_key \
    digital-lab.ca@ssh.gb.stackcp.com \
    "mkdir -p ~/public_html/icantwait.ca/navidocs/recovery && \
     chmod 755 ~/public_html/icantwait.ca/navidocs/recovery && \
     echo 'Recovery directory created at icantwait.ca/navidocs/recovery/'"
```

---

## Step 3: Upload Bundle to StackCP

```bash
# Upload the git bundle
scp -i ~/.ssh/stackcp_recovery_key \
    ~/infrafabric-session3-backup.bundle \
    digital-lab.ca@ssh.gb.stackcp.com:~/public_html/icantwait.ca/navidocs/recovery/

# Verify upload
ssh -i ~/.ssh/stackcp_recovery_key \
    digital-lab.ca@ssh.gb.stackcp.com \
    "ls -lh ~/public_html/icantwait.ca/navidocs/recovery/ && \
     echo '' && \
     echo 'Bundle uploaded successfully to icantwait.ca!'"
```

---

## Step 4: Create Recovery Instructions File

```bash
# Create instructions on StackCP server
ssh -i ~/.ssh/stackcp_recovery_key \
    digital-lab.ca@ssh.gb.stackcp.com \
    "cat > ~/public_html/icantwait.ca/navidocs/recovery/RECOVERY_INSTRUCTIONS.txt << 'INSTRUCTIONS'
# NaviDocs4 Session 3 Recovery Instructions

## Bundle Contents
- 8 commits from infrafabric Session 3 (SIP/Communication APIs)
- 14 files changed, 4,238+ lines
- Branch: claude/debug-session-freezing-011CV2mM1FVCwsC8GoBR2aQy

## Commits Included
- bbfba3f - status: Session 3 marked COMPLETE
- a641110 - complete: Session 3 SIP/Communication APIs (11 files)
- e21fa9e - claim: Session 3 claimed
- b702e0d - Session 2 COMPLETE
- 74b58d0 - Google Cloud Platform APIs
- a4a404c - Vultr Cloud APIs
- 88e98ee - S3-compatible storage
- 48c7d03 - Session 2 claimed

## How to Recover (From Local WSL)

### Download Bundle
scp digital-lab.ca@ssh.gb.stackcp.com:~/public_html/icantwait.ca/navidocs/recovery/infrafabric-session3-backup.bundle /home/setup/

### Apply to Local Infrafabric Repo
cd /home/setup/infrafabric
git fetch /home/setup/infrafabric-session3-backup.bundle claude/debug-session-freezing-011CV2mM1FVCwsC8GoBR2aQy:navidocs4-session3-recovered

### Push to GitHub
git push origin navidocs4-session3-recovered

### Or Cherry-Pick Specific Commits
git log navidocs4-session3-recovered
git cherry-pick <commit-hash>

## Verification
git bundle verify infrafabric-session3-backup.bundle

## Access via Web
https://icantwait.ca/navidocs/recovery/infrafabric-session3-backup.bundle
(if directory listing enabled)

## Generated
2025-11-14 from navidocs4 Cloud Code session
INSTRUCTIONS
"

echo "Recovery instructions created on server"
```

---

## Step 5: Verify Everything

```bash
# Final verification
ssh -i ~/.ssh/stackcp_recovery_key \
    digital-lab.ca@ssh.gb.stackcp.com \
    "echo '=== RECOVERY DIRECTORY CONTENTS ===' && \
     ls -lah ~/public_html/icantwait.ca/navidocs/recovery/ && \
     echo '' && \
     echo '=== BUNDLE VERIFICATION ===' && \
     git bundle verify ~/public_html/icantwait.ca/navidocs/recovery/infrafabric-session3-backup.bundle && \
     echo '' && \
     echo '✅ ALL RECOVERY FILES UPLOADED TO ICANTWAIT.CA SUCCESSFULLY'"
```

---

## Step 6: Clean Up (Optional)

```bash
# Remove SSH key from Cloud session (security)
rm ~/.ssh/stackcp_recovery_key

echo "✅ Recovery complete! Bundle saved to StackCP server."
echo ""
echo "Access from local WSL:"
echo "  scp stackcp:~/public_html/icantwait.ca/navidocs/recovery/infrafabric-session3-backup.bundle /home/setup/"
echo ""
echo "Or download via web:"
echo "  https://icantwait.ca/navidocs/recovery/infrafabric-session3-backup.bundle"
```

---

## Summary

**What this does:**
1. Creates SSH key to connect to StackCP (digital-lab.ca account)
2. Creates recovery directory: `~/public_html/icantwait.ca/navidocs/recovery/`
3. Uploads git bundle: `infrafabric-session3-backup.bundle` (117KB)
4. Creates recovery instructions file
5. Verifies upload successful
6. Cleans up SSH key (optional security step)

**Result:**
- ✅ 8 commits saved to StackCP server (icantwait.ca site)
- ✅ Accessible from any session with StackCP SSH access
- ✅ Can download via SCP or potentially via web (https://icantwait.ca/navidocs/recovery/)
- ✅ Bundle verified as valid git bundle

**StackCP Connection:**
- **Host:** ssh.gb.stackcp.com
- **User:** digital-lab.ca
- **Path:** ~/public_html/icantwait.ca/navidocs/recovery/

---

## After Upload - Recovery from Local WSL

Once uploaded, you can recover from `/home/setup/` (local WSL):

```bash
# Download bundle from icantwait.ca
scp stackcp:~/public_html/icantwait.ca/navidocs/recovery/infrafabric-session3-backup.bundle /home/setup/

# Apply to infrafabric repo
cd /home/setup/infrafabric
git fetch /home/setup/infrafabric-session3-backup.bundle \
    claude/debug-session-freezing-011CV2mM1FVCwsC8GoBR2aQy:navidocs4-session3-recovered

# Push to GitHub
git push origin navidocs4-session3-recovered
```

---

**Generated:** 2025-11-14
**For:** navidocs4 Cloud Code session recovery
**Target:** StackCP icantwait.ca site (digital-lab.ca account)
**Bundle Size:** 117KB (8 commits, 4,238 lines)
**Web Access:** https://icantwait.ca/navidocs/recovery/
