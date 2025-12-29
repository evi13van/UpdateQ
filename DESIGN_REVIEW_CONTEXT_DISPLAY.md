# Design Review: Issue Context Display Patterns

## Objective
Determine the optimal UX pattern for presenting content staleness issues to a content manager, balancing **triage efficiency**, **robustness**, and **technical complexity**.

## Options Evaluated

### 1. Three-Sentence Excerpt (Proposed)
*Display the sentence containing the error, plus one preceding and one following sentence, with the error bolded.*

*   **Pros:**
    *   **High Triage Speed:** Users can instantly make a "Fix/Ignore" decision without scanning a full page.
    *   **Searchability:** A 3-sentence snippet is unique enough to be easily found via `Ctrl+F` in a CMS, unlike short phrases.
    *   **Robustness:** LLM-generated excerpts tolerate "fuzzy" text matching better than programmatic DOM highlighting.
    *   **Low Cognitive Load:** Presents issues in bite-sized, isolated units.
*   **Cons:**
    *   **Loss of Macro-Context:** User might lose track of *where* in the article this issues sits (e.g., "Intro" vs "Conclusion").
    *   **Fragmented Reading:** Not suitable for a linear read-through of the document.

### 2. Full Document Highlighting
*Render the full article with issues highlighted in-place.*

*   **Pros:**
    *   **Perfect Context:** User sees exactly where the issue fits in the document flow.
*   **Cons:**
    *   **Technical Brittleness:** Mapping LLM-detected text back to exact DOM positions in arbitrary HTML is error-prone. A slight mismatch (e.g., extra whitespace) breaks the highlight.
    *   **High Cognitive Load:** A document with 15 detected issues can look "bloody" and overwhelming.
    *   **Performance:** Requires rendering potentially complex external HTML/CSS, which raises security and style-isolation issues.

### 3. Split-Screen / Sidebar Annotation
*Google Docs-style view with document on left, issues on right.*

*   **Pros:**
    *   **Gold Standard for Editing:** Best for active correction.
*   **Cons:**
    *   **Overkill for Detection:** This tool is an *analyzer*, not an *editor*. The user fixes content in *their* CMS, not here.
    *   **Mobile Unfriendly:** Requires significant screen real estate.

## Recommendation

**Proceed with the Three-Sentence Excerpt approach.**

### Rationale
1.  **Workflow Alignment:** The user's primary goal in this tool is **Identification & Triage**, not in-place editing. The Excerpt pattern supports rapid "Yes/No" decision-making better than scrolling through a full document.
2.  **Robustness:** LLMs are excellent at extracting semantic context (sentences). Programmatic highlighting is brittle against the chaotic reality of web HTML.
3.  **Locatability:** The 3-sentence snippet provides sufficient uniqueness for the Content Manager to locate the text in their CMS to apply the fix.

### Refined Implementation Plan
1.  **Prompt Engineering:** Instruct the LLM to generate the excerpt directly. This leverages the LLM's understanding of sentence boundaries, which is superior to regex splitting.
2.  **Markdown Support:** Use Markdown bolding (`**text**`) within the excerpt to draw the eye immediately to the problem.
3.  **Future Enhancement:** In a later iteration, we can inject "Section Header" information (e.g., "Found in: **Market Outlook 2024**") to further aid location.