#!/bin/bash
# NaviDocs Repository Reorganization Script
# Cleans up index sprawl by moving files to appropriate docs/ subfolders

set -e  # Exit on error

echo "🧹 Starting NaviDocs repository reorganization..."

# Create new folder structure
echo "📁 Creating folder structure..."
mkdir -p docs/deployment
mkdir -p docs/guides
mkdir -p docs/development
mkdir -p docs/handover

# Move architecture files
echo "📦 Moving architecture docs..."
git mv ARCHITECTURE-SUMMARY.md docs/architecture/ 2>/dev/null || mv ARCHITECTURE-SUMMARY.md docs/architecture/

# Move deployment/StackCP files
echo "🚀 Moving deployment docs..."
git mv STACKCP_EVALUATION_REPORT.md docs/deployment/ 2>/dev/null || mv STACKCP_EVALUATION_REPORT.md docs/deployment/
git mv STACKCP_VERIFICATION_SUMMARY.md docs/deployment/ 2>/dev/null || mv STACKCP_VERIFICATION_SUMMARY.md docs/deployment/
git mv STACKCP_ARCHITECTURE_ANALYSIS.md docs/deployment/ 2>/dev/null || mv STACKCP_ARCHITECTURE_ANALYSIS.md docs/deployment/
git mv STACKCP_DEBATE_BRIEF.md docs/deployment/ 2>/dev/null || mv STACKCP_DEBATE_BRIEF.md docs/deployment/
git mv STACKCP_QUICK_REFERENCE.md docs/deployment/ 2>/dev/null || mv STACKCP_QUICK_REFERENCE.md docs/deployment/
git mv docs/DEPLOYMENT_STACKCP.md docs/deployment/ 2>/dev/null || mv docs/DEPLOYMENT_STACKCP.md docs/deployment/
git mv docs/STACKCP_QUICKSTART.md docs/deployment/ 2>/dev/null || mv docs/STACKCP_QUICKSTART.md docs/deployment/

# Move OCR/guides files
echo "📚 Moving guide docs..."
git mv OCR_PIPELINE_SETUP.md docs/guides/ 2>/dev/null || mv OCR_PIPELINE_SETUP.md docs/guides/
git mv OCR_FINAL_RECOMMENDATION.md docs/guides/ 2>/dev/null || mv OCR_FINAL_RECOMMENDATION.md docs/guides/
git mv GOOGLE_DRIVE_OCR_QUICKSTART.md docs/guides/ 2>/dev/null || mv GOOGLE_DRIVE_OCR_QUICKSTART.md docs/guides/
git mv docs/OCR_OPTIONS.md docs/guides/ 2>/dev/null || mv docs/OCR_OPTIONS.md docs/guides/
git mv docs/GOOGLE_OCR_COMPARISON.md docs/guides/ 2>/dev/null || mv docs/GOOGLE_OCR_COMPARISON.md docs/guides/

# Move development files
echo "🔧 Moving development docs..."
git mv DEVELOPMENT.md docs/development/ 2>/dev/null || mv DEVELOPMENT.md docs/development/
git mv PORT_ALLOCATION.md docs/development/ 2>/dev/null || mv PORT_ALLOCATION.md docs/development/
git mv PORT_MIGRATION_SUMMARY.md docs/development/ 2>/dev/null || mv PORT_MIGRATION_SUMMARY.md docs/development/
git mv BUILD_COMPLETE.md docs/development/ 2>/dev/null || mv BUILD_COMPLETE.md docs/development/
git mv IMPLEMENTATION_COMPLETE.md docs/development/ 2>/dev/null || mv IMPLEMENTATION_COMPLETE.md docs/development/
git mv TEST_RESULTS.md docs/development/ 2>/dev/null || mv TEST_RESULTS.md docs/development/

# Move handover/session files
echo "📋 Moving handover docs..."
git mv NAVIDOCS_HANDOVER.md docs/handover/ 2>/dev/null || mv NAVIDOCS_HANDOVER.md docs/handover/
git mv SESSION_STATUS.md docs/handover/ 2>/dev/null || mv SESSION_STATUS.md docs/handover/
git mv SERVICES_STATUS.md docs/handover/ 2>/dev/null || mv SERVICES_STATUS.md docs/handover/
git mv GITEA_ACCESS.md docs/handover/ 2>/dev/null || mv GITEA_ACCESS.md docs/handover/
git mv ANALYSIS_INDEX.md docs/handover/ 2>/dev/null || mv ANALYSIS_INDEX.md docs/handover/

# Remove duplicate branding brief from root (already in docs/creative/)
echo "🗑️  Removing duplicate files..."
git rm BRANDING_CREATIVE_BRIEF.md 2>/dev/null || rm -f BRANDING_CREATIVE_BRIEF.md

echo "✅ Reorganization complete!"
echo ""
echo "New structure:"
echo "  docs/architecture/    - System architecture docs"
echo "  docs/deployment/      - StackCP deployment guides"
echo "  docs/guides/          - OCR and feature guides"
echo "  docs/development/     - Dev setup and port allocation"
echo "  docs/handover/        - Session notes and handover docs"
echo "  docs/creative/        - Branding and design"
echo "  docs/debates/         - Feature debates"
echo "  docs/roadmap/         - Product roadmap"
echo ""
echo "Root directory now contains:"
echo "  README.md             - Main project overview"
echo "  QUICKSTART.md         - Quick start guide"
echo "  client/               - Frontend code"
echo "  server/               - Backend code"
echo "  docs/                 - All documentation"
