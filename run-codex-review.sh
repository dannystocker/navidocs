#!/bin/bash

# NaviDocs Codex Review Runner
# Executes comprehensive code review using Codex CLI

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  NaviDocs Comprehensive Code Review - Codex GPT-5 High   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if codex CLI is available
if ! command -v codex &> /dev/null; then
    echo "❌ Error: 'codex' CLI not found"
    echo "Please install: npm install -g @anthropic/codex-cli"
    exit 1
fi

echo "✅ Codex CLI found"
echo ""

# Navigate to navidocs directory
cd /home/setup/navidocs

echo "📂 Working directory: $(pwd)"
echo "🌿 Git branch: $(git branch --show-current)"
echo ""

# Create output directory
mkdir -p reviews
OUTPUT_FILE="reviews/CODEX_REVIEW_$(date +%Y%m%d_%H%M%S).md"

echo "📝 Output file: $OUTPUT_FILE"
echo ""
echo "🚀 Starting Codex review (this may take 5-10 minutes)..."
echo ""

# Run Codex with the comprehensive review prompt
codex \
  --model gpt-5-high \
  --temperature 0.1 \
  --max-tokens 16000 \
  --prompt "$(cat CODEX_REVIEW_PROMPT.md)" \
  --context-files "$(find client/src -name '*.vue' -o -name '*.js' | head -20 | tr '\n' ',')" \
  --context-files "$(find server -name '*.js' | head -20 | tr '\n' ',')" \
  --output "$OUTPUT_FILE"

echo ""
echo "✅ Review complete!"
echo ""
echo "📄 Report saved to: $OUTPUT_FILE"
echo ""
echo "📊 Quick stats:"
wc -l "$OUTPUT_FILE"
echo ""
echo "🔍 To view the report:"
echo "   cat $OUTPUT_FILE"
echo "   or"
echo "   less $OUTPUT_FILE"
echo ""
