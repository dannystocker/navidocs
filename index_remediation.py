#!/usr/bin/env python3
"""
Redis Golden Index Consolidation Script
=========================================
Indexes the remediated NaviDocs codebase into a new Redis namespace.

Namespace: navidocs:remediated_2025:*
Source: /home/setup/navidocs/ (clean state from fix/production-sync-2025 branch)

This creates a "golden index" of all remediated files with metadata for
verification and tracking.
"""

import os
import redis
import json
import hashlib
import base64
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
import sys

# Configuration
REDIS_HOST = 'localhost'
REDIS_PORT = 6379
REDIS_DB = 0
SOURCE_DIR = "/home/setup/navidocs/"
NAMESPACE = "navidocs:remediated_2025"
GIT_COMMIT = "841c9ac"  # Latest commit on fix/production-sync-2025
TIMESTAMP = datetime.utcnow().isoformat()

# Files/directories to exclude
EXCLUDE_DIRS = {'.git', 'node_modules', '.github', '.next', 'dist', 'build'}
EXCLUDE_EXTENSIONS = {'.log', '.tmp', '.cache'}
EXCLUDE_FILES = {'.DS_Store', '.env', 'credentials.json', 'secrets.json'}

# Priority files (for highlighting and verification)
PRIORITY_FILES = [
    "restore_chaos.sh",
    "server/config/db_connect.js",
    "public/js/doc-viewer.js",
    "server/routes/api_search.js",
    "server/index.js",
    "Dockerfile",
    "server/.env.example",
    "test_search_wiring.sh",
    "docs/ROADMAP_V2_RECOVERED.md",
    "PHASE_2_DELTA_REPORT.md",
    "GLOBAL_VISION_REPORT.md",
    "COMPREHENSIVE_AUDIT_REPORT.md"
]

# Binary file extensions
BINARY_EXTENSIONS = {
    '.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', '.tar', '.gz',
    '.bin', '.exe', '.so', '.dylib', '.class', '.pyc', '.node'
}


class RedisGoldenIndexer:
    """Manages Redis golden index creation and file indexing."""

    def __init__(self):
        """Initialize Redis connection and counters."""
        try:
            self.redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                decode_responses=False
            )
            self.redis_client.ping()
            print("✓ Redis connection established")
        except Exception as e:
            print(f"✗ Redis connection failed: {e}")
            sys.exit(1)

        self.file_count = 0
        self.total_size = 0
        self.indexed_files = []
        self.priority_files_found = []
        self.errors = []

    def should_index_file(self, file_path: str, relative_path: str) -> bool:
        """Check if a file should be indexed."""
        # Check if in excluded directory
        for part in Path(relative_path).parts:
            if part in EXCLUDE_DIRS:
                return False

        # Check if excluded extension
        if any(relative_path.endswith(ext) for ext in EXCLUDE_EXTENSIONS):
            return False

        # Check if excluded filename
        if os.path.basename(file_path) in EXCLUDE_FILES:
            return False

        # Check if it's a file
        if not os.path.isfile(file_path):
            return False

        return True

    def is_binary_file(self, file_path: str) -> bool:
        """Determine if file is binary."""
        _, ext = os.path.splitext(file_path)
        if ext.lower() in BINARY_EXTENSIONS:
            return True

        # Try to read as text
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                f.read(512)
            return False
        except (UnicodeDecodeError, OSError):
            return True

    def read_file_content(self, file_path: str, is_binary: bool) -> str:
        """Read file content, handling both text and binary files."""
        try:
            if is_binary:
                with open(file_path, 'rb') as f:
                    content = f.read()
                    # For binary files, store as base64
                    return base64.b64encode(content).decode('utf-8')
            else:
                with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                    return f.read()
        except Exception as e:
            self.errors.append(f"Error reading {file_path}: {e}")
            return None

    def compute_md5(self, file_path: str) -> str:
        """Compute MD5 hash of file."""
        try:
            md5_hash = hashlib.md5()
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b''):
                    md5_hash.update(chunk)
            return md5_hash.hexdigest()
        except Exception as e:
            self.errors.append(f"Error computing hash for {file_path}: {e}")
            return "unknown"

    def index_file(self, file_path: str, relative_path: str) -> bool:
        """Index a single file to Redis."""
        try:
            is_binary = self.is_binary_file(file_path)
            file_size = os.path.getsize(file_path)
            md5_hash = self.compute_md5(file_path)
            content = self.read_file_content(file_path, is_binary)

            if content is None:
                return False

            # Create metadata
            metadata = {
                "path": relative_path,
                "status": "REMEDIATED",
                "source": "fix/production-sync-2025",
                "timestamp": TIMESTAMP,
                "git_commit": GIT_COMMIT,
                "md5_hash": md5_hash,
                "size_bytes": file_size,
                "is_binary": is_binary,
                "content_length": len(content)
            }

            # Store in Redis with namespace
            key = f"{NAMESPACE}:file:{relative_path}"

            # Store metadata as JSON
            metadata_key = f"{NAMESPACE}:meta:{relative_path}"
            self.redis_client.set(
                metadata_key,
                json.dumps(metadata, default=str),
                ex=None  # No expiration
            )

            # Store content (with size limit for very large files)
            if file_size > 10_000_000:  # 10MB limit
                content = content[:10_000_000] + "\n... [TRUNCATED - FILE TOO LARGE] ..."

            self.redis_client.set(key, content, ex=None)

            # Add to index set
            self.redis_client.sadd(f"{NAMESPACE}:index", relative_path)

            # Track priority files
            if relative_path in PRIORITY_FILES:
                self.priority_files_found.append(relative_path)
                self.redis_client.sadd(f"{NAMESPACE}:priority", relative_path)

            self.file_count += 1
            self.total_size += file_size
            self.indexed_files.append({
                "path": relative_path,
                "size": file_size,
                "md5": md5_hash,
                "binary": is_binary
            })

            return True

        except Exception as e:
            self.errors.append(f"Error indexing {relative_path}: {e}")
            return False

    def index_directory(self):
        """Recursively index all files in SOURCE_DIR."""
        print(f"\n⧗ Indexing files from: {SOURCE_DIR}")

        for root, dirs, files in os.walk(SOURCE_DIR):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for filename in files:
                file_path = os.path.join(root, filename)
                relative_path = os.path.relpath(file_path, SOURCE_DIR)

                if self.should_index_file(file_path, relative_path):
                    if self.index_file(file_path, relative_path):
                        if self.file_count % 50 == 0:
                            print(f"  Indexed {self.file_count} files...")

        print(f"✓ Indexing complete: {self.file_count} files indexed")

    def create_index_metadata(self):
        """Create overall index metadata."""
        index_meta = {
            "namespace": NAMESPACE,
            "created": TIMESTAMP,
            "source_branch": "fix/production-sync-2025",
            "git_commit": GIT_COMMIT,
            "total_files": self.file_count,
            "total_size_bytes": self.total_size,
            "source_directory": SOURCE_DIR,
            "priority_files_found": len(self.priority_files_found),
            "priority_files": self.priority_files_found,
            "errors": len(self.errors)
        }

        meta_key = f"{NAMESPACE}:metadata"
        self.redis_client.set(
            meta_key,
            json.dumps(index_meta, default=str, indent=2)
        )

        return index_meta

    def get_redis_memory_usage(self) -> Dict[str, Any]:
        """Get Redis memory usage information."""
        try:
            info = self.redis_client.info('memory')
            return {
                'used_memory': info.get('used_memory', 0),
                'used_memory_human': info.get('used_memory_human', 'unknown'),
                'used_memory_peak': info.get('used_memory_peak', 0),
                'used_memory_peak_human': info.get('used_memory_peak_human', 'unknown'),
                'maxmemory': info.get('maxmemory', 0),
                'maxmemory_human': info.get('maxmemory_human', 'unlimited')
            }
        except Exception as e:
            return {'error': str(e)}

    def get_namespace_key_count(self) -> int:
        """Count all keys in the golden index namespace."""
        try:
            cursor = 0
            count = 0
            while True:
                cursor, keys = self.redis_client.scan(
                    cursor,
                    match=f"{NAMESPACE}:*",
                    count=1000
                )
                count += len(keys)
                if cursor == 0:
                    break
            return count
        except Exception as e:
            print(f"Error counting keys: {e}")
            return 0

    def print_sample_files(self, limit: int = 5):
        """Print sample indexed files."""
        print(f"\n📄 Sample Indexed Files (first {limit}):")
        for i, file_info in enumerate(self.indexed_files[:limit]):
            size_kb = file_info['size'] / 1024
            print(f"  {i+1}. {file_info['path']}")
            print(f"     Size: {size_kb:.1f} KB, MD5: {file_info['md5'][:8]}...")

    def print_priority_files(self):
        """Print found priority files."""
        if self.priority_files_found:
            print(f"\n⭐ Priority Files Found ({len(self.priority_files_found)}):")
            for pf in self.priority_files_found:
                print(f"  ✓ {pf}")
        else:
            print(f"\n⚠ No priority files found (searched for {len(PRIORITY_FILES)} files)")

    def print_summary(self):
        """Print indexing summary."""
        print("\n" + "="*70)
        print("GOLDEN INDEX CONSOLIDATION SUMMARY")
        print("="*70)

        index_meta = self.create_index_metadata()

        print(f"\nNamespace:              {NAMESPACE}")
        print(f"Source Directory:       {SOURCE_DIR}")
        print(f"Git Commit:             {GIT_COMMIT}")
        print(f"Created:                {TIMESTAMP}")

        print(f"\n📊 Index Statistics:")
        print(f"  Total Files:          {self.file_count}")
        print(f"  Total Size:           {self.total_size / (1024*1024):.2f} MB")
        print(f"  Priority Files:       {len(self.priority_files_found)}/{len(PRIORITY_FILES)}")
        print(f"  Indexing Errors:      {len(self.errors)}")

        redis_mem = self.get_redis_memory_usage()
        print(f"\n💾 Redis Memory Usage:")
        if 'error' not in redis_mem:
            print(f"  Used Memory:          {redis_mem.get('used_memory_human', 'unknown')}")
            print(f"  Peak Memory:          {redis_mem.get('used_memory_peak_human', 'unknown')}")
            print(f"  Max Memory:           {redis_mem.get('maxmemory_human', 'unlimited')}")

        namespace_keys = self.get_namespace_key_count()
        print(f"\n🔑 Redis Keys Created:")
        print(f"  Total Keys:           {namespace_keys}")
        print(f"  Index Set Size:       {self.redis_client.scard(f'{NAMESPACE}:index')}")
        print(f"  Priority Set Size:    {self.redis_client.scard(f'{NAMESPACE}:priority')}")

        self.print_sample_files()
        self.print_priority_files()

        if self.errors:
            print(f"\n⚠ Errors ({len(self.errors)}):")
            for error in self.errors[:5]:
                print(f"  • {error}")
            if len(self.errors) > 5:
                print(f"  ... and {len(self.errors) - 5} more")

        print("\n" + "="*70)
        print("VERIFICATION COMMANDS:")
        print("="*70)
        print(f"# Count index set")
        print(f"redis-cli SCARD '{NAMESPACE}:index'")
        print(f"\n# List all files")
        print(f"redis-cli SMEMBERS '{NAMESPACE}:index' | head -20")
        print(f"\n# View namespace metadata")
        print(f"redis-cli GET '{NAMESPACE}:metadata'")
        print(f"\n# Check specific file")
        print(f"redis-cli GET '{NAMESPACE}:file:restore_chaos.sh' | head -20")
        print(f"\n# Check file metadata")
        print(f"redis-cli GET '{NAMESPACE}:meta:restore_chaos.sh'")
        print("="*70 + "\n")

    def run(self):
        """Execute the complete indexing process."""
        try:
            self.index_directory()
            self.print_summary()
            return True
        except Exception as e:
            print(f"\n✗ Fatal error: {e}")
            return False


def main():
    """Main entry point."""
    print("Redis Golden Index Consolidation")
    print("=" * 70)

    indexer = RedisGoldenIndexer()
    success = indexer.run()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
