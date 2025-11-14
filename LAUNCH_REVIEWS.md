# Launch Parallel Code Reviews - Quick Guide

## ✅ Services Started

**Backend:** http://localhost:3201 (Node.js Express)
**Frontend:** http://localhost:3200 (Vite dev server)

**Process IDs:**
- Server: Check with `ps aux | grep "node index.js"`
- Client: Check with `ps aux | grep vite`

**Logs:**
- Backend: `/tmp/navidocs-server.log`
- Frontend: `/tmp/navidocs-client.log`

---

## 🚀 Launch Reviews (2 Options)

### **Option 1: Automated Parallel Reviews**

Both Codex and Gemini review simultaneously (5-10 minutes):

```bash
cd /home/setup/navidocs
./run-parallel-reviews.sh
```

This will:
- ✅ Check services are running
- 🤖 Launch Codex review (security + architecture)
- 💎 Launch Gemini review (performance + UX)
- 📊 Generate 2 reports in `reviews/` directory

---

### **Option 2: Manual Reviews**

**For Codex (if you have codex CLI):**
```bash
cd /home/setup/navidocs
cat CODEX_SIMPLE_PROMPT.txt | codex --model gpt-5-high --max-tokens 16000 > reviews/codex_manual.md
```

**For Gemini (using gemini CLI):**
```bash
cd /home/setup/navidocs
cat GEMINI_REVIEW_PROMPT.txt | gemini chat > reviews/gemini_manual.md
```

---

## 📋 What Each Reviewer Focuses On

### **Codex GPT-5 High:**
- 🔒 **Security:** SQL injection, XSS, auth bypasses, file upload vulnerabilities
- 🏗️ **Architecture:** Code organization, separation of concerns, component design
- 📝 **Code Quality:** Naming, error handling, function complexity
- ⚙️ **Best Practices:** OWASP Top 10, RBAC, secrets management

### **Gemini 2.0 Flash Thinking:**
- ⚡ **Performance:** Bundle size, lazy loading, N+1 queries, database indexes
- 🎨 **UX/UI:** Touch targets, contrast, font sizes, loading states
- ♿ **Accessibility:** ARIA labels, keyboard nav, screen readers
- 📱 **Mobile:** Responsive design, marine environment (gloves, sunlight)

---

## 📊 Expected Output

Both reviews will generate markdown reports in `reviews/`:

```
reviews/
├── codex_20251114_162730.md      (Security + Architecture)
└── gemini_20251114_162730.md     (Performance + UX)
```

**Report Format:**
- Executive summary (rating 1-10)
- Critical issues (🔴 must fix before launch)
- High priority issues (🟡 degrades experience)
- Medium/low priority issues
- Code examples (before/after fixes)
- Effort estimates (hours + cost at €80/hr)

---

## 🔧 Troubleshooting

**If services aren't running:**
```bash
# Check process status
ps aux | grep -E "node index|vite"

# View logs
tail -f /tmp/navidocs-server.log
tail -f /tmp/navidocs-client.log

# Restart if needed
cd /home/setup/navidocs
./start-all.sh
```

**If Codex CLI not found:**
```bash
# Install Codex CLI (if available)
npm install -g @anthropic/codex-cli

# Or use API directly
# Paste CODEX_SIMPLE_PROMPT.txt into your preferred Codex interface
```

**If Gemini CLI not found:**
```bash
# Gemini CLI should be installed
which gemini

# If not, check installation
gemini --version

# Or run manually
cat GEMINI_REVIEW_PROMPT.txt | gemini chat
```

---

## ⏱️ Timeline

**Automated Reviews (Parallel):** 5-10 minutes total
- Codex: 5-7 minutes (deep security scan)
- Gemini: 3-5 minutes (performance analysis)

**Manual Reviews:** 2-3 hours per reviewer
- Read prompts
- Run audit commands
- Analyze code
- Write detailed reports

---

## 🎯 Next Steps After Reviews

1. **Read both reports** (look for 🔴 critical issues first)
2. **Merge findings** into single action plan
3. **Fix critical issues** (usually <4 hours total)
4. **Re-run reviews** to verify fixes
5. **Commit improvements** to GitHub

---

## 📈 Success Metrics

**Security:**
- 0 SQL injection vulnerabilities
- 0 hardcoded secrets
- 100% routes with authentication
- 0 critical npm audit issues

**Performance:**
- Bundle size <500KB gzipped
- API responses <200ms p95
- Lighthouse score >90 all categories
- Database queries with indexes

**UX:**
- Touch targets ≥60×60px (glove-friendly)
- Contrast ratio ≥7:1 (sunlight readable)
- ARIA labels on all interactive elements
- 0 horizontal scroll on mobile

---

## 🚀 Ready to Launch Reviews!

```bash
cd /home/setup/navidocs
./run-parallel-reviews.sh
```

The reviewers will handle everything. Sit back and wait for comprehensive reports! ☕
