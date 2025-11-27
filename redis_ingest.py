#!/usr/bin/env python3
"""
NaviDocs Redis Knowledge Base Ingestion Script
Ingests entire codebase across all branches into Redis
"""

import redis
import json
import os
import subprocess
import time
import base64
from pathlib import Path
from datetime import datetime
import sys

# Configuration
REDIS_HOST = 'localhost'
REDIS_PORT = 6379
REPO_PATH = '/home/setup/navidocs'
EXCLUDE_DIRS = {'.git', 'node_modules', '__pycache__', '.venv', 'venv', '.pytest_cache', 'dist', 'build'}
EXCLUDE_EXTENSIONS = {'.pyc', '.pyo', '.exe', '.so', '.dll', '.dylib', '.o', '.a'}
BINARY_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.pdf', '.bin', '.zip', '.tar', '.gz'}

# Track statistics
stats = {
    'total_branches': 0,
    'total_keys_created': 0,
    'total_files_processed': 0,
    'total_files_skipped': 0,
    'branch_details': {},
    'largest_files': [],
    'start_time': time.time(),
    'errors': []
}

def connect_redis():
    """Connect to Redis"""
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        r.ping()
        print(f"✓ Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
        return r
    except Exception as e:
        print(f"✗ Failed to connect to Redis: {e}")
        sys.exit(1)

def flush_navidocs_keys(r):
    """Flush all existing navidocs:* keys"""
    try:
        pattern = 'navidocs:*'
        cursor = 0
        deleted = 0
        while True:
            cursor, keys = r.scan(cursor, match=pattern, count=1000)
            if keys:
                deleted += r.delete(*keys)
            if cursor == 0:
                break
        print(f"✓ Flushed {deleted} existing navidocs:* keys")
    except Exception as e:
        stats['errors'].append(f"Flush error: {e}")
        print(f"⚠ Warning during flush: {e}")

def get_git_log_info(file_path, branch_name):
    """Get last commit info for a file"""
    try:
        result = subprocess.run(
            f'git log -1 --format="%aI|%an" -- "{file_path}"',
            cwd=REPO_PATH,
            shell=True,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            parts = result.stdout.strip().split('|')
            if len(parts) == 2:
                return parts[0], parts[1]
        return datetime.now().isoformat(), 'unknown'
    except Exception as e:
        return datetime.now().isoformat(), 'unknown'

def is_binary_file(file_path):
    """Check if file is binary"""
    ext = Path(file_path).suffix.lower()
    if ext in BINARY_EXTENSIONS:
        return True
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(512)
            return b'\x00' in chunk
    except:
        return True

def read_file_content(file_path):
    """Read file content, handling binary files"""
    try:
        if is_binary_file(file_path):
            with open(file_path, 'rb') as f:
                content = f.read()
                return base64.b64encode(content).decode('utf-8'), True
        else:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read(), False
    except Exception as e:
        raise

def should_skip_file(file_path):
    """Check if file should be skipped"""
    path = Path(file_path)

    # Skip if in excluded directories
    for excluded in EXCLUDE_DIRS:
        if excluded in path.parts:
            return True

    # Skip if excluded extension
    if path.suffix.lower() in EXCLUDE_EXTENSIONS:
        return True

    return False

def ingest_branch(r, branch_name):
    """Ingest all files from a branch into Redis"""
    try:
        # Checkout branch
        checkout_result = subprocess.run(
            f'git checkout "{branch_name}" --quiet',
            cwd=REPO_PATH,
            shell=True,
            capture_output=True,
            timeout=30
        )

        if checkout_result.returncode != 0:
            error_msg = f"Failed to checkout {branch_name}"
            stats['errors'].append(error_msg)
            return 0

        print(f"\n⚡ Processing branch: {branch_name}")

        # Get all files in current branch
        result = subprocess.run(
            'git ls-files',
            cwd=REPO_PATH,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            error_msg = f"Failed to list files in {branch_name}"
            stats['errors'].append(error_msg)
            return 0

        files = result.stdout.strip().split('\n')
        files = [f for f in files if f and not should_skip_file(f)]

        # Use pipeline for batch operations
        pipe = r.pipeline(transaction=False)
        branch_files_processed = 0
        branch_total_size = 0

        for file_path in files:
            full_path = os.path.join(REPO_PATH, file_path)

            try:
                # Check file size
                if not os.path.exists(full_path):
                    continue

                file_size = os.path.getsize(full_path)
                if file_size > 50_000_000:  # Skip files > 50MB
                    stats['total_files_skipped'] += 1
                    continue

                # Read content
                content, is_binary = read_file_content(full_path)

                # Get git metadata
                last_commit, author = get_git_log_info(file_path, branch_name)

                # Create key and value
                key = f"navidocs:{branch_name}:{file_path}"
                value = json.dumps({
                    'content': content,
                    'last_commit': last_commit,
                    'author': author,
                    'is_binary': is_binary,
                    'size_bytes': file_size
                })

                # Add to pipeline
                pipe.set(key, value)
                pipe.sadd('navidocs:index', key)

                branch_files_processed += 1
                branch_total_size += file_size
                stats['total_files_processed'] += 1

                # Track largest files
                file_size_kb = file_size / 1024
                stats['largest_files'].append({
                    'path': f"{branch_name}:{file_path}",
                    'size_kb': round(file_size_kb, 2)
                })

                # Execute pipeline every 100 files
                if branch_files_processed % 100 == 0:
                    pipe.execute()
                    print(f"  → {branch_files_processed} files processed for {branch_name}")
                    pipe = r.pipeline(transaction=False)

            except Exception as e:
                stats['errors'].append(f"{branch_name}:{file_path}: {str(e)}")
                stats['total_files_skipped'] += 1
                continue

        # Execute remaining pipeline
        if branch_files_processed > 0:
            pipe.execute()

        stats['branch_details'][branch_name] = {
            'files': branch_files_processed,
            'total_size_mb': round(branch_total_size / (1024 * 1024), 2)
        }

        stats['total_keys_created'] += branch_files_processed
        print(f"✓ {branch_name}: {branch_files_processed} files ({stats['branch_details'][branch_name]['total_size_mb']}MB)")

        return branch_files_processed

    except Exception as e:
        error_msg = f"Error processing branch {branch_name}: {str(e)}"
        stats['errors'].append(error_msg)
        print(f"✗ {error_msg}")
        return 0

def get_redis_memory(r):
    """Get Redis memory usage"""
    try:
        info = r.info('memory')
        return round(info['used_memory'] / (1024 * 1024), 2)
    except:
        return 0

def get_all_branches():
    """Get all branches from repo"""
    try:
        result = subprocess.run(
            'git branch -r | grep -v HEAD',
            cwd=REPO_PATH,
            shell=True,
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode == 0:
            branches = result.stdout.strip().split('\n')
            branches = [b.strip() for b in branches if b.strip()]
            # Convert remote-tracking branches to simple names
            branches = [b.replace('origin/', '').replace('local-gitea/', '').replace('remote-gitea/', '')
                       for b in branches]
            return sorted(set(branches))  # Remove duplicates
        return []
    except Exception as e:
        print(f"Error getting branches: {e}")
        return []

def main():
    print("=" * 70)
    print("NaviDocs Redis Knowledge Base Ingestion")
    print("=" * 70)

    # Connect to Redis
    r = connect_redis()

    # Flush existing keys
    flush_navidocs_keys(r)

    # Get all branches
    branches = get_all_branches()
    stats['total_branches'] = len(branches)

    print(f"\n📦 Found {len(branches)} branches to process")
    print(f"Branches: {', '.join(branches[:5])}{'...' if len(branches) > 5 else ''}\n")

    # Process each branch
    for branch_name in branches:
        ingest_branch(r, branch_name)

    # Calculate stats
    completion_time = time.time() - stats['start_time']
    redis_memory = get_redis_memory(r)

    # Sort largest files
    stats['largest_files'].sort(key=lambda x: x['size_kb'], reverse=True)
    stats['largest_files'] = stats['largest_files'][:20]  # Top 20

    # Generate report
    report = {
        'total_branches': stats['total_branches'],
        'total_keys_created': stats['total_keys_created'],
        'total_files_processed': stats['total_files_processed'],
        'total_files_skipped': stats['total_files_skipped'],
        'redis_memory_mb': redis_memory,
        'completion_time_seconds': round(completion_time, 2),
        'branch_details': stats['branch_details'],
        'largest_files': stats['largest_files'][:10],
        'errors': stats['errors'][:20] if stats['errors'] else []
    }

    # Print summary
    print("\n" + "=" * 70)
    print("INGESTION SUMMARY")
    print("=" * 70)
    print(f"Total Branches:        {report['total_branches']}")
    print(f"Total Keys Created:    {report['total_keys_created']}")
    print(f"Total Files Processed: {report['total_files_processed']}")
    print(f"Total Files Skipped:   {report['total_files_skipped']}")
    print(f"Redis Memory Usage:    {report['redis_memory_mb']} MB")
    print(f"Completion Time:       {report['completion_time_seconds']} seconds")

    print("\nTop 10 Largest Files:")
    for i, file_info in enumerate(report['largest_files'], 1):
        print(f"  {i}. {file_info['path']} ({file_info['size_kb']} KB)")

    if report['errors']:
        print(f"\n⚠ Errors ({len(report['errors'])}):")
        for error in report['errors'][:5]:
            print(f"  - {error}")

    # Save report
    report_path = '/home/setup/navidocs/REDIS_INGESTION_REPORT.json'
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"\n✓ Report saved to {report_path}")

    print("\n" + "=" * 70)

    return report

if __name__ == '__main__':
    main()
