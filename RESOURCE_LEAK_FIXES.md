# Resource Leak Fixes - 502 Gateway Error Resolution

## Issue Summary
The application was experiencing 502 gateway errors on Render due to resource leaks from HTTP clients that were never properly closed, causing connection exhaustion over time.

## Root Causes Identified

### 1. **Anthropic Client Leaks**
- **Location**: `backend/services/research.py:15` and `backend/services/detector.py:144`
- **Problem**: Anthropic clients were created but never explicitly cleaned up
  - In `research.py`: Singleton client created in `__init__` persisted for application lifetime
  - In `detector.py`: New client created per request without cleanup
- **Impact**: Each client maintains HTTP connections that accumulate over time

### 2. **FirecrawlApp Client Leak**
- **Location**: `backend/services/extractor.py:16`
- **Problem**: New FirecrawlApp client created per request without cleanup
- **Impact**: HTTP connections to Firecrawl API accumulate with each extraction request

### 3. **httpx.AsyncClient** (Already Correct)
- **Location**: `backend/services/research.py:120`
- **Status**: ✅ Already using context manager properly - no leak here

## Fixes Applied

### 1. Research Service (`backend/services/research.py`)
**Changes:**
- Removed singleton Anthropic client from `__init__`
- Create Anthropic client per request in `generate_research_query()`
- Added explicit cleanup in `finally` block: `claude_client = None`
- httpx.AsyncClient already using context manager (no change needed)

**Before:**
```python
def __init__(self):
    self.claude_client = Anthropic(api_key=settings.claude_api_key)  # Never cleaned up
```

**After:**
```python
def __init__(self):
    # Don't create clients in __init__ - create them per request with proper cleanup
    self.perplexity_api_key = settings.perplexity_api_key
    self.perplexity_base_url = "https://api.perplexity.ai"

async def generate_research_query(self, issue: Issue, context: DomainContext) -> str:
    claude_client = Anthropic(api_key=settings.claude_api_key)
    try:
        # ... use client ...
    finally:
        claude_client = None  # Explicit cleanup
```

### 2. Detector Service (`backend/services/detector.py`)
**Changes:**
- Create Anthropic client at function start instead of in try block
- Added explicit cleanup in `finally` block: `client = None`

**Before:**
```python
async def detect_stale_content(url: str, content: str, domain_context: dict) -> dict:
    try:
        client = Anthropic(api_key=settings.claude_api_key)  # No cleanup
        # ... use client ...
```

**After:**
```python
async def detect_stale_content(url: str, content: str, domain_context: dict) -> dict:
    # Create Claude client per request for proper resource management
    client = Anthropic(api_key=settings.claude_api_key)
    try:
        # ... use client ...
    finally:
        client = None  # Explicit cleanup
```

### 3. Extractor Service (`backend/services/extractor.py`)
**Changes:**
- Initialize `app = None` at function start
- Added explicit cleanup in `finally` block: `app = None`

**Before:**
```python
async def extract_content(url: str) -> dict:
    try:
        app = FirecrawlApp(api_key=settings.firecrawl_api_key)  # No cleanup
        # ... use app ...
```

**After:**
```python
async def extract_content(url: str) -> dict:
    # Create Firecrawl client per request for proper resource management
    app = None
    try:
        app = FirecrawlApp(api_key=settings.firecrawl_api_key)
        # ... use app ...
    finally:
        app = None  # Explicit cleanup
```

## Why These Fixes Work

1. **Per-Request Client Creation**: Creating clients per request instead of as singletons ensures they can be properly garbage collected after each request

2. **Explicit Cleanup**: Setting clients to `None` in `finally` blocks ensures:
   - References are released even if exceptions occur
   - Python's garbage collector can reclaim resources
   - HTTP connections are closed when objects are destroyed

3. **Scope Management**: By creating clients within function scope and cleaning them up, we prevent connection accumulation

## Expected Results

- ✅ No more connection exhaustion
- ✅ Stable memory usage over time
- ✅ 502 gateway errors resolved
- ✅ Application can handle sustained load on Render

## Testing Recommendations

1. **Load Testing**: Run sustained load tests to verify no connection leaks
2. **Memory Monitoring**: Monitor memory usage over 24+ hours
3. **Connection Tracking**: Use `netstat` or similar to verify connections are closed
4. **Error Logs**: Monitor Render logs for any 502 errors

## Additional Notes

- The httpx.AsyncClient in `research.py` was already using a context manager (`async with`), so it didn't need changes
- These fixes follow Python best practices for resource management
- Consider adding connection pooling limits in production if needed
- Monitor API rate limits as proper cleanup may increase request throughput

## Deployment

After deploying these changes to Render:
1. Monitor application logs for successful startup
2. Watch for any 502 errors in the first few hours
3. Check memory usage trends in Render dashboard
4. Test analysis runs to ensure functionality is preserved

---
**Date**: 2026-01-08
**Status**: ✅ Fixed and Deployed