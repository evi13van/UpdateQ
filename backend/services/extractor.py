from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from config import settings
import re


async def extract_content(url: str) -> dict:
    """
    Extract JS-rendered content from URL using Playwright
    Returns dict with status, title, content, or error
    """
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Navigate with timeout
            await page.goto(url, wait_until="networkidle", timeout=settings.playwright_timeout)
            
            # Extract title
            title = await page.title()
            
            # Extract main content (remove scripts, styles, nav, footer)
            content = await page.evaluate("""
                () => {
                    // Remove unwanted elements
                    const unwanted = document.querySelectorAll('script, style, nav, footer, header, .nav, .footer, .header');
                    unwanted.forEach(el => el.remove());
                    
                    // Get body text
                    const body = document.body;
                    return body ? body.innerText : '';
                }
            """)
            
            # Extract tables with structure
            tables = await page.evaluate("""
                () => {
                    const tables = document.querySelectorAll('table');
                    return Array.from(tables).map(table => {
                        const rows = Array.from(table.querySelectorAll('tr'));
                        return rows.map(row => {
                            const cells = Array.from(row.querySelectorAll('th, td'));
                            return cells.map(cell => cell.innerText.trim());
                        });
                    });
                }
            """)
            
            await browser.close()
            
            # Clean content
            content = re.sub(r'\n\s*\n', '\n\n', content.strip())
            
            return {
                "status": "success",
                "title": title,
                "content": content,
                "tables": tables
            }
            
    except PlaywrightTimeout:
        return {
            "status": "failed",
            "error": "Page load timeout - unable to access"
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": f"Failed - Unable to Access: {str(e)}"
        }