#!/bin/bash
#
# StackCP Hosting Environment Evaluation Script
# Checks capabilities for running NaviDocs
#

echo "=================================="
echo "StackCP Environment Evaluation"
echo "=================================="
echo ""

# System Information
echo "1. SYSTEM INFORMATION"
echo "--------------------"
echo "Hostname: $(hostname)"
echo "OS: $(uname -s) $(uname -r)"
echo "Architecture: $(uname -m)"
echo ""

# Current User and Permissions
echo "2. USER & PERMISSIONS"
echo "--------------------"
echo "Current user: $(whoami)"
echo "User ID: $(id)"
echo "Home directory: $HOME"
echo "Current directory: $(pwd)"
echo ""

# Check if we have sudo
echo "3. PRIVILEGE CHECK"
echo "--------------------"
if sudo -n true 2>/dev/null; then
    echo "✅ Sudo access: YES"
else
    echo "❌ Sudo access: NO"
fi
echo ""

# Node.js
echo "4. NODE.JS AVAILABILITY"
echo "--------------------"
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js: $(node --version)"
    echo "   NPM: $(npm --version)"
    echo "   Location: $(which node)"
else
    echo "❌ Node.js: NOT INSTALLED"
fi
echo ""

# Check for nvm
if [ -d "$HOME/.nvm" ]; then
    echo "✅ NVM directory found: $HOME/.nvm"
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh"
        echo "   NVM version: $(nvm --version)"
        echo "   Available Node versions:"
        nvm list
    fi
fi
echo ""

# Python
echo "5. PYTHON AVAILABILITY"
echo "--------------------"
if command -v python3 >/dev/null 2>&1; then
    echo "✅ Python3: $(python3 --version)"
else
    echo "❌ Python3: NOT INSTALLED"
fi
echo ""

# Database
echo "6. DATABASE ACCESS"
echo "--------------------"
if command -v mysql >/dev/null 2>&1; then
    echo "✅ MySQL client: $(mysql --version)"
else
    echo "❌ MySQL client: NOT INSTALLED"
fi

if command -v sqlite3 >/dev/null 2>&1; then
    echo "✅ SQLite3: $(sqlite3 --version)"
else
    echo "❌ SQLite3: NOT INSTALLED"
fi
echo ""

# Redis
echo "7. REDIS AVAILABILITY"
echo "--------------------"
if command -v redis-cli >/dev/null 2>&1; then
    echo "✅ Redis CLI: $(redis-cli --version)"
    if redis-cli ping 2>/dev/null | grep -q PONG; then
        echo "✅ Redis server: RUNNING (localhost:6379)"
    else
        echo "⚠️  Redis CLI installed but server not accessible"
    fi
else
    echo "❌ Redis: NOT INSTALLED"
fi
echo ""

# Tesseract OCR
echo "8. TESSERACT OCR"
echo "--------------------"
if command -v tesseract >/dev/null 2>&1; then
    echo "✅ Tesseract: $(tesseract --version 2>&1 | head -1)"
    echo "   Languages:"
    tesseract --list-langs 2>&1 | grep -v "List of available languages"
else
    echo "❌ Tesseract: NOT INSTALLED"
fi
echo ""

# ImageMagick / Poppler
echo "9. IMAGE PROCESSING TOOLS"
echo "--------------------"
if command -v convert >/dev/null 2>&1; then
    echo "✅ ImageMagick: $(convert --version | head -1)"
else
    echo "❌ ImageMagick: NOT INSTALLED"
fi

if command -v pdftoppm >/dev/null 2>&1; then
    echo "✅ pdftoppm (Poppler): $(pdftoppm -v 2>&1 | head -1)"
else
    echo "❌ pdftoppm (Poppler): NOT INSTALLED"
fi
echo ""

# Git
echo "10. VERSION CONTROL"
echo "--------------------"
if command -v git >/dev/null 2>&1; then
    echo "✅ Git: $(git --version)"
else
    echo "❌ Git: NOT INSTALLED"
fi
echo ""

# Process Management
echo "11. PROCESS MANAGEMENT"
echo "--------------------"
if command -v pm2 >/dev/null 2>&1; then
    echo "✅ PM2: $(pm2 --version)"
else
    echo "❌ PM2: NOT INSTALLED"
fi

if command -v screen >/dev/null 2>&1; then
    echo "✅ Screen: YES"
else
    echo "❌ Screen: NOT INSTALLED"
fi

if command -v tmux >/dev/null 2>&1; then
    echo "✅ Tmux: YES"
else
    echo "❌ Tmux: NOT INSTALLED"
fi
echo ""

# Directory Structure
echo "12. DIRECTORY STRUCTURE"
echo "--------------------"
echo "Home directory contents:"
ls -la $HOME | head -20
echo ""

# Check common paths
echo "Common paths:"
for dir in public_html www htdocs bin node_apps apps; do
    if [ -d "$HOME/$dir" ]; then
        echo "✅ $HOME/$dir (exists)"
    else
        echo "❌ $HOME/$dir (not found)"
    fi
done
echo ""

# Writable directories
echo "13. WRITE PERMISSIONS"
echo "--------------------"
test_dir="$HOME/test_write_$(date +%s)"
if mkdir -p "$test_dir" 2>/dev/null; then
    echo "✅ Can create directories in home"

    # Test executable
    test_file="$test_dir/test.sh"
    echo '#!/bin/bash' > "$test_file"
    echo 'echo "Executable test"' >> "$test_file"
    chmod +x "$test_file"

    if [ -x "$test_file" ]; then
        echo "✅ Can create executable files"
        if "$test_file" 2>/dev/null; then
            echo "✅ Can execute custom scripts"
        else
            echo "❌ Cannot execute custom scripts (noexec mount?)"
        fi
    else
        echo "❌ Cannot set executable permission"
    fi

    rm -rf "$test_dir"
else
    echo "❌ Cannot create directories in home"
fi
echo ""

# Network
echo "14. NETWORK ACCESS"
echo "--------------------"
echo "Listening ports:"
netstat -tln 2>/dev/null | grep LISTEN || ss -tln 2>/dev/null | grep LISTEN || echo "Cannot check ports"
echo ""

echo "Outbound connectivity:"
if curl -s --max-time 5 https://www.google.com > /dev/null; then
    echo "✅ HTTPS outbound: YES"
else
    echo "❌ HTTPS outbound: BLOCKED/FAILED"
fi
echo ""

# Resource Limits
echo "15. RESOURCE LIMITS"
echo "--------------------"
echo "ulimit -a:"
ulimit -a
echo ""

# Disk Space
echo "16. DISK SPACE"
echo "--------------------"
df -h $HOME 2>/dev/null || echo "Cannot check disk space"
echo ""

# Memory
echo "17. MEMORY"
echo "--------------------"
free -h 2>/dev/null || echo "Cannot check memory"
echo ""

# Running Processes
echo "18. RUNNING PROCESSES"
echo "--------------------"
echo "User processes:"
ps aux | grep $(whoami) | head -10
echo ""

# Check for control panel
echo "19. HOSTING CONTROL PANEL"
echo "--------------------"
if [ -f "$HOME/.stackcp" ] || [ -d "$HOME/.stackcp" ]; then
    echo "✅ StackCP detected"
elif [ -f "$HOME/.cpanel" ] || [ -d "$HOME/.cpanel" ]; then
    echo "cPanel detected"
elif [ -f "$HOME/plesk" ] || [ -d "$HOME/plesk" ]; then
    echo "Plesk detected"
else
    echo "Control panel: Unknown"
fi
echo ""

# Environment Variables
echo "20. ENVIRONMENT VARIABLES"
echo "--------------------"
echo "PATH: $PATH"
echo "NODE_VERSION: $NODE_VERSION"
echo "SHELL: $SHELL"
echo ""

# Summary
echo "=================================="
echo "NAVIDOCS COMPATIBILITY SUMMARY"
echo "=================================="
echo ""

compatible=true

# Check critical requirements
echo "Critical Requirements:"
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js: AVAILABLE"
else
    echo "❌ Node.js: MISSING (CRITICAL)"
    compatible=false
fi

if command -v redis-cli >/dev/null 2>&1 && redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "✅ Redis: AVAILABLE"
else
    echo "⚠️  Redis: NOT AVAILABLE (can use Redis Cloud)"
fi

if command -v sqlite3 >/dev/null 2>&1; then
    echo "✅ SQLite3: AVAILABLE"
else
    echo "❌ SQLite3: MISSING (CRITICAL)"
    compatible=false
fi

echo ""
echo "Optional Requirements:"
if command -v tesseract >/dev/null 2>&1; then
    echo "✅ Tesseract: AVAILABLE"
else
    echo "⚠️  Tesseract: NOT AVAILABLE (can use Google Vision API)"
fi

if command -v pm2 >/dev/null 2>&1 || command -v screen >/dev/null 2>&1; then
    echo "✅ Process manager: AVAILABLE"
else
    echo "⚠️  Process manager: NOT AVAILABLE (workers may not persist)"
fi

echo ""
if [ "$compatible" = true ]; then
    echo "🎉 RESULT: This environment CAN run NaviDocs!"
    echo ""
    echo "Recommendations:"
    echo "1. Use Google Cloud Vision API for OCR (no Tesseract needed)"
    echo "2. Use Redis Cloud if local Redis not available"
    echo "3. Install PM2 for process management: npm install -g pm2"
else
    echo "❌ RESULT: This environment CANNOT run NaviDocs"
    echo ""
    echo "Missing critical requirements. Consider:"
    echo "1. Upgrade to Managed VPS/Cloud hosting"
    echo "2. Contact hosting provider about Node.js support"
fi

echo ""
echo "=================================="
echo "Evaluation complete!"
echo "=================================="
