import re


def strip_markdown(text: str) -> str:
    """
    Strip common markdown formatting from text to make it clean for CSV export.
    Removes: bold, italic, links, code blocks, headers, etc.
    """
    if not text:
        return ""
    
    # Remove code blocks (```code```)
    text = re.sub(r'```[\s\S]*?```', '', text)
    
    # Remove inline code (`code`)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    
    # Remove links but keep the text [text](url) -> text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    
    # Remove images ![alt](url)
    text = re.sub(r'!\[([^\]]*)\]\([^\)]+\)', r'\1', text)
    
    # Remove bold/italic (**text** or __text__ or *text* or _text_)
    text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'\*([^\*]+)\*', r'\1', text)
    text = re.sub(r'_([^_]+)_', r'\1', text)
    
    # Remove headers (# Header)
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    
    # Remove horizontal rules (---, ***, ___)
    text = re.sub(r'^[\-\*_]{3,}$', '', text, flags=re.MULTILINE)
    
    # Remove blockquotes (> quote)
    text = re.sub(r'^>\s+', '', text, flags=re.MULTILINE)
    
    # Clean up multiple spaces and newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    
    return text.strip()


def format_issue_with_reason_for_csv(issue: dict) -> str:
    """
    Format a single issue with its description, flagged text, reasoning,
    and suggested sources all together in one column.
    Returns a formatted string for one issue column.
    """
    if not issue:
        return ""
    
    # Strip markdown from each field
    desc = strip_markdown(issue.get('description', ''))
    flagged = strip_markdown(issue.get('flaggedText', issue.get('flagged_text', '')))
    reason = strip_markdown(issue.get('reasoning', ''))
    
    # Start with basic issue info
    result = f"{desc}\nFlagged: \"{flagged}\"\n\nReason: {reason}"
    
    # Add suggested sources if they exist
    sources = issue.get('suggestedSources', [])
    if sources:
        # Filter for accepted sources only
        accepted_sources = [s for s in sources if s.get('isAccepted', False)]
        
        if accepted_sources:
            result += "\n\nSUGGESTED SOURCES:"
            for idx, source in enumerate(accepted_sources, 1):
                title = strip_markdown(source.get('title', 'Source'))
                url = source.get('url', '')
                snippet = strip_markdown(source.get('snippet', ''))
                pub_date = source.get('publicationDate', '')
                
                result += f"\n{idx}. {title}"
                if pub_date:
                    result += f" ({pub_date})"
                if snippet:
                    result += f"\n   \"{snippet}\""
                result += f"\n   {url}"
    
    return result