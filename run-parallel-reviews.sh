#!/bin/bash

# NaviDocs Parallel Code Review - Codex + Gemini
# Both AI reviewers work simultaneously on different aspects

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  NaviDocs Parallel Code Review - Codex + Gemini              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

cd /home/setup/navidocs

# Create reviews directory
mkdir -p reviews
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 NaviDocs Services Status:"
echo "   Backend: http://localhost:3201 ($(curl -s http://localhost:3201/health > /dev/null && echo "✅ Running" || echo "❌ Down"))"
echo "   Frontend: http://localhost:3200 ($(curl -s http://localhost:3200 > /dev/null && echo "✅ Running" || echo "❌ Down"))"
echo ""

echo "📋 Review Plan:"
echo "   • Codex GPT-5: Security + Architecture deep dive"
echo "   • Gemini 2.0 Flash Thinking: Performance + UX analysis"
echo ""

# Launch Codex review in background
echo "🤖 Starting Codex review (security & architecture focus)..."
{
    echo "# Codex Review - Security & Architecture Focus" > reviews/codex_${TIMESTAMP}.md
    echo "" >> reviews/codex_${TIMESTAMP}.md
    echo "**Started:** $(date)" >> reviews/codex_${TIMESTAMP}.md
    echo "**Model:** GPT-5 High" >> reviews/codex_${TIMESTAMP}.md
    echo "" >> reviews/codex_${TIMESTAMP}.md

    # If codex CLI exists, use it
    if command -v codex &> /dev/null; then
        cat CODEX_SIMPLE_PROMPT.txt | codex --model gpt-5-high --max-tokens 16000 >> reviews/codex_${TIMESTAMP}.md 2>&1
    else
        echo "⚠️  Codex CLI not found - skipping automated review" >> reviews/codex_${TIMESTAMP}.md
        echo "" >> reviews/codex_${TIMESTAMP}.md
        echo "**Manual review required. Use this prompt:**" >> reviews/codex_${TIMESTAMP}.md
        cat CODEX_SIMPLE_PROMPT.txt >> reviews/codex_${TIMESTAMP}.md
    fi

    echo "✅ Codex review saved to reviews/codex_${TIMESTAMP}.md"
} &
CODEX_PID=$!

# Launch Gemini review in background
echo "💎 Starting Gemini review (performance & UX focus)..."
{
    echo "# Gemini Review - Performance & UX Focus" > reviews/gemini_${TIMESTAMP}.md
    echo "" >> reviews/gemini_${TIMESTAMP}.md
    echo "**Started:** $(date)" >> reviews/gemini_${TIMESTAMP}.md
    echo "**Model:** Gemini 2.0 Flash Thinking" >> reviews/gemini_${TIMESTAMP}.md
    echo "" >> reviews/gemini_${TIMESTAMP}.md

    # Use gemini CLI
    if command -v gemini &> /dev/null; then
        cat GEMINI_REVIEW_PROMPT.txt | gemini chat >> reviews/gemini_${TIMESTAMP}.md 2>&1
    else
        echo "⚠️  Gemini CLI not found - skipping automated review" >> reviews/gemini_${TIMESTAMP}.md
        echo "" >> reviews/gemini_${TIMESTAMP}.md
        echo "**Manual review required. Use this prompt:**" >> reviews/gemini_${TIMESTAMP}.md
        cat GEMINI_REVIEW_PROMPT.txt >> reviews/gemini_${TIMESTAMP}.md
    fi

    echo "✅ Gemini review saved to reviews/gemini_${TIMESTAMP}.md"
} &
GEMINI_PID=$!

echo ""
echo "⏳ Waiting for reviews to complete (5-10 minutes)..."
echo "   Codex PID: $CODEX_PID"
echo "   Gemini PID: $GEMINI_PID"
echo ""

# Wait for both to complete
wait $CODEX_PID
wait $GEMINI_PID

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Both Reviews Complete!                                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📄 Review Reports:"
echo "   • Codex:  reviews/codex_${TIMESTAMP}.md"
echo "   • Gemini: reviews/gemini_${TIMESTAMP}.md"
echo ""
echo "📊 Combined Stats:"
wc -l reviews/codex_${TIMESTAMP}.md reviews/gemini_${TIMESTAMP}.md
echo ""
echo "🔍 To view:"
echo "   cat reviews/codex_${TIMESTAMP}.md"
echo "   cat reviews/gemini_${TIMESTAMP}.md"
echo ""
echo "   Or merge into single report:"
echo "   cat reviews/codex_${TIMESTAMP}.md reviews/gemini_${TIMESTAMP}.md > reviews/combined_${TIMESTAMP}.md"
echo ""
