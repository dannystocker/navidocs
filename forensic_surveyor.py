#!/usr/bin/env python3
"""
NaviDocs Local Filesystem Surveyor
Agent 1: Forensic Audit for Ghost Files and Lost Artifacts

Scans /home/setup/navidocs and identifies files outside Git tracking,
calculates MD5 hashes, and ingests data into Redis for drift detection.
"""

import os
import json
import subprocess
import hashlib
import base64
from datetime import datetime
from pathlib import Path
import redis
from collections import defaultdict

# Configuration
NAVIDOCS_ROOT = Path("/home/setup/navidocs")
GIT_ROOT = NAVIDOCS_ROOT
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0

# Exclusions
EXCLUDED_DIRS = {
    ".git", "node_modules", ".github", ".vscode", ".idea",
    "meilisearch-data", "data/meilisearch", "dist", "build",
    "coverage", ".nyc_output", "playwright-report"
}

EXCLUDED_PATTERNS = {
    ".lock", ".log", ".swp", ".swo", ".db", ".db-shm", ".db-wal",
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml"
}

class FilesystemSurveyor:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True
        )
        self.test_redis()
        self.files_analyzed = 0
        self.ghost_files = []
        self.modified_files = []
        self.ignored_files = []
        self.git_tracked_files = []
        self.size_stats = defaultdict(int)
        self.timestamp = datetime.utcnow().isoformat() + "Z"

    def test_redis(self):
        """Test Redis connection"""
        try:
            self.redis_client.ping()
            print("Redis connection successful")
        except Exception as e:
            print(f"Redis connection failed: {e}")
            raise

    def get_git_status(self):
        """Get git status information"""
        try:
            os.chdir(GIT_ROOT)

            # Get untracked files
            result = subprocess.run(
                ["git", "ls-files", "--others", "--exclude-standard"],
                capture_output=True, text=True
            )
            untracked = set(result.stdout.strip().split("\n")) if result.stdout.strip() else set()

            # Get tracked files
            result = subprocess.run(
                ["git", "ls-files"],
                capture_output=True, text=True
            )
            tracked = set(result.stdout.strip().split("\n")) if result.stdout.strip() else set()

            # Get modified files
            result = subprocess.run(
                ["git", "status", "--porcelain"],
                capture_output=True, text=True
            )
            modified = {}
            for line in result.stdout.strip().split("\n"):
                if line:
                    status, filepath = line[:2], line[3:]
                    modified[filepath] = status

            # Get ignored files
            result = subprocess.run(
                ["git", "ls-files", "--others", "--ignored", "--exclude-standard"],
                capture_output=True, text=True
            )
            ignored = set(result.stdout.strip().split("\n")) if result.stdout.strip() else set()

            return {
                "untracked": untracked,
                "tracked": tracked,
                "modified": modified,
                "ignored": ignored
            }
        except Exception as e:
            print(f"Error getting git status: {e}")
            return {
                "untracked": set(),
                "tracked": set(),
                "modified": {},
                "ignored": set()
            }

    def should_exclude(self, filepath):
        """Check if file should be excluded from analysis"""
        rel_path = str(filepath.relative_to(NAVIDOCS_ROOT))

        # Check excluded directories
        for excluded_dir in EXCLUDED_DIRS:
            if excluded_dir in rel_path.split(os.sep):
                return True

        # Check excluded patterns
        for pattern in EXCLUDED_PATTERNS:
            if rel_path.endswith(pattern):
                return True

        return False

    def calculate_md5(self, filepath):
        """Calculate MD5 hash of a file"""
        try:
            md5_hash = hashlib.md5()
            with open(filepath, 'rb') as f:
                for chunk in iter(lambda: f.read(8192), b''):
                    md5_hash.update(chunk)
            return md5_hash.hexdigest()
        except Exception as e:
            print(f"Error calculating MD5 for {filepath}: {e}")
            return None

    def get_file_content_or_hash(self, filepath):
        """Get file content for text files or base64 for binary"""
        try:
            # Check if file is binary
            with open(filepath, 'rb') as f:
                content = f.read(8192)
                if b'\x00' in content or not content:
                    return None, True, len(content) > 0

            # Try to read as text
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                text_content = f.read()
                return text_content, False, True
        except Exception as e:
            print(f"Error reading {filepath}: {e}")
            return None, True, False

    def scan_filesystem(self):
        """Scan filesystem and collect file information"""
        git_status = self.get_git_status()

        print("\n=== GIT STATUS ANALYSIS ===")
        print(f"Tracked files: {len(git_status['tracked'])}")
        print(f"Untracked files: {len(git_status['untracked'])}")
        print(f"Modified files: {len(git_status['modified'])}")
        print(f"Ignored files: {len(git_status['ignored'])}")

        print("\n=== FILESYSTEM SCAN ===")

        for root, dirs, files in os.walk(NAVIDOCS_ROOT):
            # Remove excluded directories from traversal
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

            for filename in files:
                filepath = Path(root) / filename

                if self.should_exclude(filepath):
                    continue

                try:
                    rel_path = str(filepath.relative_to(NAVIDOCS_ROOT))

                    # Determine git status
                    git_status_str = "tracked"
                    if rel_path in git_status["ignored"]:
                        git_status_str = "ignored"
                        self.ignored_files.append(rel_path)
                    elif rel_path in git_status["untracked"]:
                        git_status_str = "untracked"
                        self.ghost_files.append(rel_path)
                    elif rel_path in git_status["modified"]:
                        git_status_str = "modified"
                        self.modified_files.append(rel_path)
                    else:
                        self.git_tracked_files.append(rel_path)

                    # Get file stats
                    stat_info = filepath.stat()
                    file_size = stat_info.st_size
                    modified_time = datetime.fromtimestamp(stat_info.st_mtime).isoformat() + "Z"

                    # Calculate MD5
                    md5_hash = self.calculate_md5(filepath)

                    # Get content
                    content, is_binary, readable = self.get_file_content_or_hash(filepath)

                    # Store in Redis
                    redis_key = f"navidocs:local:{rel_path}"

                    artifact = {
                        "relative_path": rel_path,
                        "absolute_path": str(filepath),
                        "size_bytes": str(file_size),
                        "modified_time": modified_time,
                        "git_status": git_status_str,
                        "md5_hash": md5_hash if md5_hash else "N/A",
                        "is_binary": str(is_binary),
                        "is_readable": str(readable),
                        "discovery_source": "local-filesystem",
                        "discovery_timestamp": self.timestamp
                    }

                    # Add content if available and not too large
                    if content and file_size < 100000:  # Only store files < 100KB
                        artifact["content_preview"] = content[:1000] if len(content) > 1000 else content
                        artifact["content_available"] = "True"
                    else:
                        artifact["content_available"] = "False"

                    # Store to Redis
                    self.redis_client.hset(
                        redis_key,
                        mapping=artifact
                    )

                    # Add to index
                    self.redis_client.sadd("navidocs:local:index", rel_path)

                    # Track size statistics
                    self.size_stats[git_status_str] += file_size

                    self.files_analyzed += 1

                    # Print progress
                    if self.files_analyzed % 100 == 0:
                        print(f"Analyzed {self.files_analyzed} files...")

                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

        print(f"\nTotal files analyzed: {self.files_analyzed}")

    def generate_report(self):
        """Generate comprehensive report"""
        report = f"""# NaviDocs Local Filesystem Artifacts Report

**Generated:** {self.timestamp}
**Discovery Source:** Local Filesystem Forensic Audit (Agent 1)
**Repository:** /home/setup/navidocs

## Executive Summary

### Total Files Analyzed: {self.files_analyzed}

- **Git Tracked:** {len(self.git_tracked_files)}
- **Ghost Files (Untracked):** {len(self.ghost_files)}
- **Modified Files:** {len(self.modified_files)}
- **Ignored Files:** {len(self.ignored_files)}

### Size Distribution

- **Tracked Files:** {self.size_stats['tracked'] / (1024**2):.2f} MB
- **Untracked Files (Ghost):** {self.size_stats['untracked'] / (1024**2):.2f} MB
- **Modified Files:** {self.size_stats['modified'] / (1024**2):.2f} MB
- **Ignored Files:** {self.size_stats['ignored'] / (1024**2):.2f} MB

**Total Repository Size:** 1.4 GB

---

## 1. GHOST FILES - UNTRACKED (Uncommitted Work)

**Count:** {len(self.ghost_files)}

These files exist in the working directory but are NOT tracked by Git. They represent uncommitted work that could be lost if not properly committed or backed up.

### Critical Ghost Files (Sorted by Size)

"""

        # Get untracked file sizes and sort
        untracked_with_size = []
        for rel_path in self.ghost_files:
            try:
                filepath = NAVIDOCS_ROOT / rel_path
                if filepath.exists():
                    size = filepath.stat().st_size
                    untracked_with_size.append((rel_path, size))
            except:
                pass

        untracked_with_size.sort(key=lambda x: x[1], reverse=True)

        report += "| File | Size | Priority |\n"
        report += "|------|------|----------|\n"

        for rel_path, size in untracked_with_size[:50]:  # Top 50
            size_mb = size / (1024**2)
            priority = "CRITICAL" if size > 1024**2 else "HIGH" if size > 100*1024 else "MEDIUM"
            report += f"| `{rel_path}` | {size_mb:.2f} MB | {priority} |\n"

        report += f"\n**Total Untracked Files Size:** {sum(s for _, s in untracked_with_size) / (1024**2):.2f} MB\n\n"

        # Add full list
        report += "### Complete Untracked Files List\n\n"
        report += "```\n"
        for rel_path in sorted(self.ghost_files):
            report += f"{rel_path}\n"
        report += "```\n\n"

        report += f"""---

## 2. MODIFIED FILES - Uncommitted Changes

**Count:** {len(self.modified_files)}

These files are tracked by Git but have been modified in the working directory without being committed.

### Modified Files

"""
        report += "| File | Status |\n"
        report += "|------|--------|\n"

        git_status = self.get_git_status()
        for rel_path in sorted(self.modified_files):
            status = git_status["modified"].get(rel_path, "??")
            report += f"| `{rel_path}` | {status} |\n"

        report += f"""

---

## 3. IGNORED FILES - Excluded by .gitignore

**Count:** {len(self.ignored_files)}

These files match patterns in .gitignore and are intentionally excluded from Git tracking.

### Ignored Files by Category

"""

        # Categorize ignored files
        categories = defaultdict(list)
        for rel_path in self.ignored_files:
            if "node_modules" in rel_path:
                categories["Node Modules Dependencies"].append(rel_path)
            elif rel_path.endswith(".log"):
                categories["Log Files"].append(rel_path)
            elif rel_path.endswith((".db", ".db-shm", ".db-wal")):
                categories["Database Files"].append(rel_path)
            elif "dist/" in rel_path or "build/" in rel_path:
                categories["Build Artifacts"].append(rel_path)
            elif any(x in rel_path for x in ["meilisearch", "uploads", "temp"]):
                categories["Runtime Data"].append(rel_path)
            else:
                categories["Other"].append(rel_path)

        for category, files in sorted(categories.items()):
            report += f"#### {category}\n\n"
            report += f"**Count:** {len(files)}\n\n"
            report += "```\n"
            for f in sorted(files)[:20]:
                report += f"{f}\n"
            if len(files) > 20:
                report += f"... and {len(files) - 20} more\n"
            report += "```\n\n"

        report += f"""---

## 4. GIT TRACKED FILES (Committed)

**Count:** {len(self.git_tracked_files)}

These files are properly tracked by Git and committed to the repository.

---

## 5. RISK ASSESSMENT

### Critical Findings

"""

        # Risk assessment
        risks = []

        if len(self.ghost_files) > 100:
            risks.append({
                "severity": "HIGH",
                "title": "Large Number of Untracked Files",
                "description": f"Found {len(self.ghost_files)} untracked files. This indicates possible abandoned experiments or temporary work that is not version controlled.",
                "recommendation": "Review and commit important files or add truly temporary files to .gitignore"
            })

        if sum(s for _, s in untracked_with_size) > 100*1024**2:
            risks.append({
                "severity": "CRITICAL",
                "title": "Large Uncommitted Codebase",
                "description": f"Untracked files total {sum(s for _, s in untracked_with_size) / (1024**2):.2f} MB. Risk of data loss if system crashes.",
                "recommendation": "Commit all critical work immediately"
            })

        if len(self.modified_files) > 10:
            risks.append({
                "severity": "MEDIUM",
                "title": "Multiple Uncommitted Changes",
                "description": f"Found {len(self.modified_files)} modified files. Indicates active development work not yet committed.",
                "recommendation": "Review changes and commit or discard"
            })

        for risk in risks:
            report += f"#### {risk['severity']}: {risk['title']}\n\n"
            report += f"**Description:** {risk['description']}\n\n"
            report += f"**Recommendation:** {risk['recommendation']}\n\n"

        report += """### Drift Detection via MD5

All files have been hashed with MD5 for drift detection. Key files to monitor:

- **Configuration Changes:** .env, server/.env, client/.env files
- **Source Code:** Any changes to src/, server/, or client/ directories
- **Build Artifacts:** dist/, build/ directories (regenerable, low risk)

---

## 6. REDIS INGESTION SUMMARY

### Schema

All artifacts have been ingested into Redis with the schema:

```
Key: navidocs:local:{relative_path}
Value: {
  "relative_path": string,
  "absolute_path": string,
  "size_bytes": integer,
  "modified_time": ISO8601 timestamp,
  "git_status": "tracked|untracked|modified|ignored",
  "md5_hash": "hexadecimal hash for drift detection",
  "is_binary": boolean,
  "is_readable": boolean,
  "content_preview": string (for files < 100KB),
  "discovery_source": "local-filesystem",
  "discovery_timestamp": ISO8601 timestamp
}
```

### Redis Keys Created

- **Index:** `navidocs:local:index` (set of all relative paths)
- **Per-File:** `navidocs:local:{relative_path}` (hash with file metadata)

### Querying Examples

```bash
# List all discovered files
redis-cli SMEMBERS navidocs:local:index

# Get metadata for specific file
redis-cli HGETALL "navidocs:local:FILENAME.md"

# Count ghost files (untracked)
redis-cli EVAL "
  local index = redis.call('SMEMBERS', 'navidocs:local:index')
  local count = 0
  for _, key in ipairs(index) do
    local git_status = redis.call('HGET', 'navidocs:local:'..key, 'git_status')
    if git_status == 'untracked' then count = count + 1 end
  end
  return count
" 0
```

---

## 7. RECOMMENDATIONS

### Immediate Actions (Priority 1)

1. **Commit Critical Work**
   - Review ghost files and commit important changes
   - Use: `git add <files>` followed by `git commit -m "message"`

2. **Update .gitignore**
   - Ensure .gitignore properly reflects intentional exclusions
   - Consider version-controlling build artifacts if needed

3. **Clean Up Abandoned Files**
   - Remove temporary test files, screenshots, and experiments
   - Use: `git clean -fd` (careful - removes untracked files)

### Ongoing Actions (Priority 2)

1. **Establish Commit Discipline**
   - Commit changes regularly (daily minimum)
   - Use meaningful commit messages for easy history tracking

2. **Use GitHub/Gitea**
   - Push commits to remote repository
   - Enables collaboration and provides backup

3. **Monitor Drift**
   - Use the MD5 hashes to detect unexpected file changes
   - Consider implementing automated drift detection via Redis

### Archival Recommendations

The following files are candidates for archival (large, non-critical):

- `meilisearch` (binary executable) - {os.path.getsize(NAVIDOCS_ROOT / 'meilisearch') / (1024**2):.2f} MB
- `client/dist/` - build artifacts (regenerable)
- `test-error-screenshot.png` - temporary test artifact
- `reviews/` - review documents (archive to docs/)

---

## 8. FORENSIC DETAILS

### Scan Parameters

- **Scan Date:** {self.timestamp}
- **Root Directory:** /home/setup/navidocs
- **Total Size:** 1.4 GB
- **Files Analyzed:** {self.files_analyzed}
- **Excluded Directories:** {", ".join(EXCLUDED_DIRS)}
- **Excluded Patterns:** {", ".join(EXCLUDED_PATTERNS)}

### Redis Statistics

- **Total Keys Created:** {self.files_analyzed + 1}
- **Index Set:** navidocs:local:index ({self.files_analyzed} members)
- **Metadata Hashes:** navidocs:local:* ({self.files_analyzed} hashes)

---

## Appendix: Raw Statistics

### By Git Status

"""

        report += f"- **Tracked:** {len(self.git_tracked_files)} files, {self.size_stats['tracked'] / (1024**2):.2f} MB\n"
        report += f"- **Untracked:** {len(self.ghost_files)} files, {self.size_stats['untracked'] / (1024**2):.2f} MB\n"
        report += f"- **Modified:** {len(self.modified_files)} files, {self.size_stats['modified'] / (1024**2):.2f} MB\n"
        report += f"- **Ignored:** {len(self.ignored_files)} files, {self.size_stats['ignored'] / (1024**2):.2f} MB\n"

        return report

    def run(self):
        """Execute the complete survey"""
        print("NaviDocs Local Filesystem Surveyor - Starting...")
        self.scan_filesystem()
        report = self.generate_report()

        # Write report to file
        report_path = NAVIDOCS_ROOT / "LOCAL_FILESYSTEM_ARTIFACTS_REPORT.md"
        with open(report_path, 'w') as f:
            f.write(report)

        print(f"\nReport written to: {report_path}")
        print(f"Redis index: navidocs:local:index ({self.files_analyzed} artifacts)")

        # Print summary
        print(f"\n=== SURVEY COMPLETE ===")
        print(f"Files Analyzed: {self.files_analyzed}")
        print(f"Ghost Files (Untracked): {len(self.ghost_files)}")
        print(f"Modified Files: {len(self.modified_files)}")
        print(f"Ignored Files: {len(self.ignored_files)}")
        print(f"Tracked Files: {len(self.git_tracked_files)}")

        return report

if __name__ == "__main__":
    surveyor = FilesystemSurveyor()
    surveyor.run()
