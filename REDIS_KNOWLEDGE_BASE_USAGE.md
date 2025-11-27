# Redis Knowledge Base - Quick Reference

**Status:** LIVE
**Location:** localhost:6379
**Total Keys:** 2,438
**Memory:** 1.15 GB
**Schema:** `navidocs:{branch}:{file_path}`

---

## One-Line Commands

### Get File Content
```bash
# Extract and display a file
redis-cli GET "navidocs:navidocs-cloud-coordination:package.json" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d['content'])"
```

### List Files in a Branch
```bash
# Show all files from a branch
redis-cli KEYS "navidocs:navidocs-cloud-coordination:*" | wc -l

# First 5 files
redis-cli KEYS "navidocs:navidocs-cloud-coordination:*" | head -5
```

### Search by Extension
```bash
# All Markdown files
redis-cli KEYS "navidocs:*:*.md"

# All Python files
redis-cli KEYS "navidocs:*:*.py"

# All JSON configs
redis-cli KEYS "navidocs:*:*.json"
```

### Get Metadata
```bash
# Display file author and commit date
redis-cli GET "navidocs:navidocs-cloud-coordination:SESSION_RESUME_AGGRESSIVE_2025-11-13.md" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"Author: {d['author']}\nCommit: {d['last_commit']}\nSize: {d['size_bytes']} bytes\")"
```

---

## Python API

### Initialize Connection
```python
import redis
import json

r = redis.Redis(host='localhost', port=6379, decode_responses=True)
print(f"Connected: {r.ping()}")
```

### Retrieve File
```python
def get_file(branch, filepath):
    key = f"navidocs:{branch}:{filepath}"
    data = json.loads(r.get(key))
    return {
        'content': data['content'],
        'author': data['author'],
        'last_commit': data['last_commit'],
        'size': data['size_bytes']
    }

# Usage
file_data = get_file('navidocs-cloud-coordination', 'package.json')
print(file_data['content'])
```

### List Branch Files
```python
def list_branch_files(branch, pattern="*"):
    prefix = f"navidocs:{branch}:{pattern}"
    keys = r.keys(prefix)
    files = [k.replace(f"navidocs:{branch}:", "") for k in keys]
    return sorted(files)

# Usage
files = list_branch_files('navidocs-cloud-coordination', '*.md')
print(f"Found {len(files)} markdown files")
```

### Search for Files
```python
def search_files(pattern):
    keys = r.keys(f"navidocs:*:{pattern}")
    results = {}
    for key in keys:
        branch, filepath = key.replace('navidocs:', '').split(':', 1)
        if branch not in results:
            results[branch] = []
        results[branch].append(filepath)
    return results

# Usage - find all PDFs
pdfs = search_files('*.pdf')
for branch, files in pdfs.items():
    print(f"{branch}: {len(files)} PDFs")
```

### Iterate All Files
```python
def iterate_all_files(branch=None):
    pattern = f"navidocs:{branch}:*" if branch else "navidocs:*:*"
    cursor = 0
    while True:
        cursor, keys = r.scan(cursor, match=pattern, count=100)
        for key in keys:
            data = json.loads(r.get(key))
            yield {
                'key': key,
                'filepath': key.split(':', 2)[2] if ':' in key else key,
                'author': data['author'],
                'commit': data['last_commit'],
                'size': data['size_bytes']
            }
        if cursor == 0:
            break

# Usage - process all files
for file_info in iterate_all_files('navidocs-cloud-coordination'):
    if file_info['size'] > 100000:  # > 100KB
        print(f"Large file: {file_info['filepath']}")
```

### Get Branch Statistics
```python
def branch_stats(branch):
    pattern = f"navidocs:{branch}:*"
    keys = r.keys(pattern)

    total_size = 0
    file_types = {}

    for key in keys:
        data = json.loads(r.get(key))
        total_size += data['size_bytes']

        filepath = key.split(':', 2)[2]
        ext = filepath.split('.')[-1] if '.' in filepath else 'no-ext'
        file_types[ext] = file_types.get(ext, 0) + 1

    return {
        'files': len(keys),
        'total_size_mb': total_size / (1024 * 1024),
        'file_types': file_types
    }

# Usage
stats = branch_stats('navidocs-cloud-coordination')
print(f"Files: {stats['files']}")
print(f"Size: {stats['total_size_mb']:.1f} MB")
print(f"Types: {stats['file_types']}")
```

---

## Branches Available

### Processed (3 branches)
1. **navidocs-cloud-coordination** (831 files)
   - Base: `navidocs:navidocs-cloud-coordination:`

2. **claude/navidocs-cloud-coordination-011CV53By5dfJaBfbPXZu9XY** (803 files)
   - Base: `navidocs:claude/navidocs-cloud-coordination-011CV53By5dfJaBfbPXZu9XY:`

3. **claude/session-2-completion-docs-011CV53B2oMH6VqjaePrFZgb** (804 files)
   - Base: `navidocs:claude/session-2-completion-docs-011CV53B2oMH6VqjaePrFZgb:`

### Not Processed (20 branches)
These branches couldn't be checked out (see REDIS_INGESTION_COMPLETE.md)

---

## Example Use Cases

### 1. Find All Configuration Files
```python
patterns = ['*.json', '*.yaml', '*.yml', '*.env', '*.config']
for pattern in patterns:
    keys = r.keys(f"navidocs:*:{pattern}")
    print(f"{pattern}: {len(keys)} files")
```

### 2. Extract README Files
```python
readmes = r.keys("navidocs:*:**/README.md")
for key in readmes:
    data = json.loads(r.get(key))
    print(f"\n=== {key} ===")
    print(data['content'][:500])
```

### 3. Find Recent Changes
```python
from datetime import datetime, timedelta

recent = datetime.now() - timedelta(days=7)

for file_info in iterate_all_files():
    commit_date = datetime.fromisoformat(file_info['commit'])
    if commit_date > recent:
        print(f"Updated: {file_info['filepath']} by {file_info['author']}")
```

### 4. Identify Large Files
```python
large_files = []

for file_info in iterate_all_files():
    if file_info['size'] > 1_000_000:  # > 1MB
        large_files.append((file_info['filepath'], file_info['size']))

for filepath, size in sorted(large_files, key=lambda x: x[1], reverse=True)[:10]:
    print(f"{filepath}: {size / (1024*1024):.1f} MB")
```

### 5. Decode Base64 PDFs
```python
import base64

def extract_pdf(branch, pdf_path):
    key = f"navidocs:{branch}:{pdf_path}"
    data = json.loads(r.get(key))

    if data['is_binary']:
        pdf_bytes = base64.b64decode(data['content'])
        return pdf_bytes
    else:
        return None

# Usage
pdf_data = extract_pdf('navidocs-cloud-coordination', 'uploads/somefile.pdf')
if pdf_data:
    with open('output.pdf', 'wb') as f:
        f.write(pdf_data)
```

---

## Maintenance

### Check Health
```bash
# Ping server
redis-cli ping
# Output: PONG

# Memory stats
redis-cli INFO memory | grep -E "used_memory|peak_memory|fragmentation"

# Check navidocs keys
redis-cli KEYS "navidocs:*" | wc -l
# Output: 2438
```

### Monitor Commands
```bash
# Watch real-time commands
redis-cli MONITOR

# Find slowest commands
redis-cli SLOWLOG GET 10

# Clear slow log
redis-cli SLOWLOG RESET
```

### Backup
```bash
# Trigger snapshot
redis-cli BGSAVE

# Check backup
ls -lh /var/lib/redis/dump.rdb

# AOF rewrite (if enabled)
redis-cli BGREWRITEAOF
```

---

## Integration Examples

### Flask API Wrapper
```python
from flask import Flask, jsonify
import redis
import json

app = Flask(__name__)
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

@app.route('/api/navidocs/<branch>/<path:filepath>')
def get_file(branch, filepath):
    key = f"navidocs:{branch}:{filepath}"
    data = r.get(key)

    if not data:
        return {'error': 'File not found'}, 404

    parsed = json.loads(data)
    return {
        'filepath': filepath,
        'branch': branch,
        'author': parsed['author'],
        'last_commit': parsed['last_commit'],
        'content': parsed['content'][:1000],  # First 1000 chars
        'size_bytes': parsed['size_bytes']
    }

@app.route('/api/navidocs/<branch>/files')
def list_files(branch):
    pattern = f"navidocs:{branch}:*"
    keys = r.keys(pattern)
    files = [k.replace(f"navidocs:{branch}:", "") for k in keys]
    return {'branch': branch, 'files': sorted(files)[:100]}
```

### Automation Script
```bash
#!/bin/bash
# Sync Redis knowledge base hourly

while true; do
    echo "Checking for updates..."
    cd /home/setup/navidocs

    # Fetch latest
    git fetch origin

    # Re-ingest if changes detected
    if git status --porcelain | grep -q .; then
        echo "Changes detected, re-ingesting..."
        python3 redis_ingest.py
    fi

    # Wait 1 hour
    sleep 3600
done
```

---

## Troubleshooting

### Connection Issues
```bash
# Test connection
redis-cli ping

# Check if running
ps aux | grep redis-server

# Restart if needed
redis-server /etc/redis/redis.conf
```

### Data Inconsistencies
```bash
# Count keys
redis-cli DBSIZE

# Verify index
redis-cli SCARD navidocs:index

# Should match (2,756 for all keys, 2,438 for index)
```

### Large Memory Usage
```bash
# Find biggest keys
redis-cli --bigkeys

# Profile memory
redis-cli --mem-stats

# Consider compression or archival
```

---

## Performance Tips

1. **Use Pipelines** for multiple operations:
   ```python
   pipe = r.pipeline()
   for key in keys:
       pipe.get(key)
   results = pipe.execute()
   ```

2. **Batch Scanning** to avoid blocking:
   ```python
   cursor, keys = r.scan(cursor, match=pattern, count=1000)
   ```

3. **Cache Frequently Accessed** files in application memory

4. **Use KEYS Sparingly** - prefers SCAN for large datasets

5. **Monitor Slow Queries**:
   ```bash
   redis-cli SLOWLOG GET 10
   redis-cli CONFIG SET slowlog-log-slower-than 10000
   ```

---

**Last Updated:** 2025-11-27
**Ready for Production:** YES
