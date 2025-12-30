from firecrawl import FirecrawlApp
from config import settings
import re
import asyncio


async def extract_content(url: str) -> dict:
    """
    Extract JS-rendered content from URL using Firecrawl
    Returns dict with status, title, content, or error
    """
    try:
        print(f"\n[EXTRACTOR] Starting extraction for URL: {url}")
        
        # Initialize Firecrawl client
        app = FirecrawlApp(api_key=settings.firecrawl_api_key)
        print(f"[EXTRACTOR] Firecrawl client initialized")
        
        # Scrape the page with Firecrawl (run in executor since SDK may be sync)
        # Firecrawl handles JS-rendered content automatically
        loop = asyncio.get_event_loop()
        print(f"[EXTRACTOR] Calling Firecrawl API for {url}...")
        result = await loop.run_in_executor(
            None,
            lambda: app.scrape(
                url,
                formats=["markdown", "html"],
                include_tags=["title", "h1", "h2", "h3", "h4", "h5", "h6", "p", "table", "td", "th", "li", "ul", "ol"],
                exclude_tags=["script", "style", "nav", "footer", "header"]
            )
        )
        print(f"[EXTRACTOR] Firecrawl API call completed for {url}")
        print(f"[EXTRACTOR] Result type: {type(result)}")
        print(f"[EXTRACTOR] Result attributes: {dir(result) if hasattr(result, '__dict__') else 'N/A'}")
        
        # Handle new Document object format (Firecrawl v2)
        if hasattr(result, 'markdown') or hasattr(result, 'html'):
            # New Document object format
            print(f"[EXTRACTOR] Using Document object format")
            markdown_content = getattr(result, 'markdown', '')
            html_content = getattr(result, 'html', '')
            metadata = getattr(result, 'metadata', {})
            
            # Check if there's an error attribute
            if hasattr(result, 'error') and result.error:
                error_detail = str(result.error)
                print(f"[EXTRACTOR ERROR] Firecrawl returned error: {error_detail}")
                return {
                    "status": "failed",
                    "error": f"Failed - Unable to Access: {error_detail}"
                }
        elif isinstance(result, dict):
            # Old dict format (fallback)
            print(f"[EXTRACTOR] Using dict format")
            # Check for error in response
            if result.get('error'):
                error_detail = result.get('error', 'Unknown error')
                print(f"[EXTRACTOR ERROR] Firecrawl returned error: {error_detail}")
                return {
                    "status": "failed",
                    "error": f"Failed - Unable to Access: {error_detail}"
                }
            
            # Extract data from Firecrawl response
            data = result.get('data', result)
            if not data:
                return {
                    "status": "failed",
                    "error": "Failed - Unable to Access: No data returned"
                }
            
            # Handle both nested data and direct data formats
            if isinstance(data, dict) and 'markdown' in data:
                markdown_content = data.get('markdown', '')
                html_content = data.get('html', '')
                metadata = data.get('metadata', {})
            else:
                markdown_content = result.get('markdown', '')
                html_content = result.get('html', '')
                metadata = result.get('metadata', {})
        else:
            print(f"[EXTRACTOR ERROR] Unknown response format: {type(result)}")
            return {
                "status": "failed",
                "error": "Failed - Unable to Access: Invalid response format"
            }
        
        # Get title and meta description from metadata or markdown
        title = metadata.get('title', '') if isinstance(metadata, dict) else ''
        meta_description = metadata.get('description', '') if isinstance(metadata, dict) else ''
        
        if not title and markdown_content:
            # Try to extract title from markdown (first h1)
            title_match = re.search(r'^#\s+(.+)$', markdown_content, re.MULTILINE)
            if title_match:
                title = title_match.group(1).strip()
        
        if not title:
            title = "Untitled Page"
        
        # Extract H1-H4 headers from markdown
        headers = {
            "h1": [],
            "h2": [],
            "h3": [],
            "h4": []
        }
        
        if markdown_content:
            # Extract all headers using regex
            headers["h1"] = re.findall(r'^#\s+(.+)$', markdown_content, re.MULTILINE)
            headers["h2"] = re.findall(r'^##\s+(.+)$', markdown_content, re.MULTILINE)
            headers["h3"] = re.findall(r'^###\s+(.+)$', markdown_content, re.MULTILINE)
            headers["h4"] = re.findall(r'^####\s+(.+)$', markdown_content, re.MULTILINE)
        
        # Use markdown content for LLM analysis (preserves structure better than plain text)
        content = markdown_content if markdown_content else html_content
        
        # Debug logging
        print(f"[DEBUG] Extracted content for {url}:")
        print(f"[DEBUG] Title: {title}")
        print(f"[DEBUG] Content length: {len(content)}")
        print(f"[DEBUG] Content preview (first 500 chars): {content[:500]}")
        
        # Extract tables from markdown if present
        tables = []
        if markdown_content:
            # Extract table data from markdown format
            table_pattern = r'\|(.+?)\|\n\|[-\s|:]+\|\n((?:\|.+\|\n?)+)'
            table_matches = re.finditer(table_pattern, markdown_content, re.MULTILINE)
            for match in table_matches:
                header_row = match.group(1)
                data_rows = match.group(2)
                
                # Parse header
                table_headers = [cell.strip() for cell in header_row.split('|') if cell.strip()]
                
                # Parse data rows
                rows = []
                for row in data_rows.strip().split('\n'):
                    cells = [cell.strip() for cell in row.split('|') if cell.strip()]
                    if cells:
                        rows.append(cells)
                
                if table_headers and rows:
                    tables.append([table_headers] + rows)
        
        # Clean content - normalize whitespace but keep structure
        content = re.sub(r'\n{3,}', '\n\n', content.strip())
        
        return {
            "status": "success",
            "title": title,
            "meta_title": title,  # Meta title is typically the same as page title
            "meta_description": meta_description,
            "headers": headers,
            "content": content,
            "tables": tables
        }
            
    except Exception as e:
        error_msg = str(e)
        print(f"\n[EXTRACTOR EXCEPTION] Error extracting {url}")
        print(f"[EXTRACTOR EXCEPTION] Exception type: {type(e).__name__}")
        print(f"[EXTRACTOR EXCEPTION] Exception message: {error_msg}")
        import traceback
        print(f"[EXTRACTOR EXCEPTION] Traceback:\n{traceback.format_exc()}")
        
        # Handle specific Firecrawl errors
        if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
            return {
                "status": "failed",
                "error": "Page load timeout - unable to access"
            }
        elif "403" in error_msg or "forbidden" in error_msg.lower():
            return {
                "status": "failed",
                "error": "Failed - Unable to Access: Access forbidden"
            }
        elif "404" in error_msg or "not found" in error_msg.lower():
            return {
                "status": "failed",
                "error": "Failed - Unable to Access: Page not found"
            }
        elif "rate limit" in error_msg.lower() or "429" in error_msg:
            return {
                "status": "failed",
                "error": "Failed - Unable to Access: Rate limit exceeded"
            }
        else:
            return {
                "status": "failed",
                "error": f"Failed - Unable to Access: {error_msg}"
            }