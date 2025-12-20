# PRODUCT REQUIREMENTS DOCUMENT

## EXECUTIVE SUMMARY

**Product Name:** UpdateQ

**Product Vision:** UpdateQ surfaces pages that need updating so content managers can quickly identify pages with the most issues, review the issues, and easily output URL links with issue lists to a document for writer handoff.

**Core Purpose:** Cut through the noise to surface which pages have stale factual claims — prioritized so content managers know where to start. Writers don't work in spreadsheets, so UpdateQ delivers clean, copy-paste-ready output that content managers can hand off directly to writers in documents.

**Target Users:** Content managers and SEO professionals maintaining factual accuracy at scale across websites with dynamic content.

**Key MVP Features:**
- User Authentication (System/Configuration) - Secure account management for saving analysis runs
- URL Input with 20-Page Limit (User-Generated) - Simple batch submission with hard cap
- Domain Context Configuration (Configuration) - Guided form defining staleness rules per content type
- JS-Rendered Content Extraction (System) - Playwright-based extraction preserving table structure
- LLM-Based Factual Decay Detection (System) - Claude API contextual analysis of stale claims
- Results Table with Issue Prioritization (System Data) - Sortable queue showing pages by issue count
- CSV Export for Writer Handoff (System Data) - Clean, column-based output with one issue per column
- Crawl History (System Data) - View past analysis runs

**Platform:** Web application (responsive, accessible via browser on all devices)

**Complexity Assessment:** Moderate
- State Management: Backend (MongoDB for users, runs, results)
- External Integrations: Playwright (content extraction), Claude API (detection) - these reduce complexity
- Business Logic: Moderate (domain context interpretation, issue prioritization, output formatting)

**MVP Success Criteria:**
- Users complete full workflow: configure context → submit URLs → review prioritized results → export for writers
- LLM detection identifies stale claims with 80%+ accuracy based on user feedback
- CSV output is clean, readable, and successfully copy-pasted into documents
- Users return to run multiple analyses (validates crawl history value)
- Domain context configuration used by 90%+ of users

---

## 1. USERS & PERSONAS

**Primary Persona:**
- **Name:** "Maria the Content Manager"
- **Context:** Manages 500+ pages of mortgage rate content and home loan guides. Responsible for ensuring factual accuracy but doesn't have time to manually review every page. Works with a team of freelance writers who need clear instructions on what to update.
- **Goals:** Quickly identify which pages have the most stale information, understand what specifically needs updating, and hand off clean lists to writers without reformatting or explaining technical output.
- **Pain Points:** Current tools either miss JS-rendered content or flag everything with dates as stale (including valid historical references). Exporting results requires heavy cleanup before writers can use them. No way to prioritize which pages to tackle first.

**Secondary Persona:**
- **Name:** "David the SEO Professional"
- **Context:** Manages content freshness for multiple client sites across different industries (healthcare, finance, SaaS). Needs to demonstrate content maintenance value to clients with clear before/after reporting.
- **Goals:** Run quick audits to identify outdated claims, configure detection rules per client's content type, and export results that clients understand without technical explanation.
- **Pain Points:** Generic content audits don't understand context (e.g., "Founded in 2021" flagged as stale). Needs domain-specific rules but doesn't want to maintain complex configurations.

---

## 2. FUNCTIONAL REQUIREMENTS

### 2.1 Core MVP Features (Priority 0)

**FR-001: User Authentication**
- **Description:** Secure registration, login, logout, and session management enabling users to save analysis runs and access crawl history
- **Entity Type:** System/Configuration
- **Operations:** Register, Login, View profile, Edit profile (email/password), Logout
- **Key Rules:** JWT-based authentication, secure password storage (bcrypt), session persistence across browser sessions
- **Acceptance:** Users can register with email/password, login to access their account, view/edit profile details, and logout securely

**FR-002: URL Input with 20-Page Limit**
- **Description:** Simple textarea accepting URLs (one per line) with client-side validation and hard 20-page cap for MVP scope
- **Entity Type:** User-Generated
- **Operations:** Create (paste URLs), View (see submitted list), Edit (modify before submission), Clear (reset form)
- **Key Rules:** One URL per line, valid HTTP/HTTPS format required, hard cap of 20 URLs enforced in UI, duplicate URLs automatically removed
- **Acceptance:** Users can paste up to 20 URLs, see validation errors for invalid formats, and submit batch for analysis

**FR-003: Domain Context Configuration**
- **Description:** Guided form collecting domain-specific staleness rules through clear, non-technical questions to enable contextual LLM detection
- **Entity Type:** Configuration
- **Operations:** Create (fill form per run), View (see current configuration), Edit (modify before submission), Load (from localStorage history - last 5), Clear (reset to defaults)
- **Key Rules:** Form responses passed directly to Claude API prompt, localStorage stores last 5 configurations, no backend persistence in MVP
- **Acceptance:** Users can answer guided questions defining their content type and staleness rules, load previous configurations from localStorage, and submit context with URL batch

**FR-004: JS-Rendered Content Extraction**
- **Description:** Playwright-based extraction of content as users see it after JavaScript execution, preserving table structure and relationships
- **Entity Type:** System
- **Operations:** Extract (triggered on URL submission), View (see extraction status per URL), Retry (on failure - not in MVP)
- **Key Rules:** Headless Chromium with networkidle wait strategy, 15-second timeout per page, extract meta tags + headings + body text + tables with header-value relationships intact, strip scripts/styles/nav/footer, mark failed URLs and continue processing
- **Acceptance:** System extracts JS-rendered content including tables with preserved structure, handles failures gracefully by marking URL as "Failed - Unable to Access" and continuing batch

**FR-005: LLM-Based Factual Decay Detection**
- **Description:** Claude API (claude-3-haiku) analyzes extracted content using domain context to identify stale factual claims, distinguishing outdated information from valid historical references
- **Entity Type:** System
- **Operations:** Analyze (triggered after extraction), View (see detection results), Flag (domain context mismatch - pauses process for user confirmation)
- **Key Rules:** Single API call per page, prompt includes domain context + current date + extracted content, returns JSON array with flagged sentences + reasoning, detects context mismatch (e.g., mortgage content but page is about car loans) and pauses for user confirmation
- **Acceptance:** System identifies stale claims with context awareness (e.g., flags "2021 salary data" but not "Founded in 2021"), pauses processing if domain context doesn't match actual content topics, returns plain-text issue descriptions free of markup

**FR-006: Results Table with Issue Prioritization**
- **Description:** Sortable table displaying analyzed pages with issue counts, top issues preview, and expandable rows for full details - the core "queue" for prioritization
- **Entity Type:** System Data
- **Operations:** View (see all results), Sort (by URL, title, issue count), Filter (by issue count range), Expand (see full issue details per URL), Export (to CSV)
- **Key Rules:** Default sort by issue count descending, expandable rows show all issues with plain-text descriptions, no HTML/markdown/JSON artifacts visible, failed URLs marked clearly with reason
- **Acceptance:** Users can quickly identify pages with most issues, sort/filter results, expand rows to see full issue context, and understand what needs updating without technical knowledge

**FR-007: CSV Export for Writer Handoff**
- **Description:** Export results to CSV with clean, column-based format where each issue gets its own column with all needed information free of markup language code noise
- **Entity Type:** System Data
- **Operations:** Export (download CSV file), View (preview export format - not in MVP)
- **Key Rules:** UTF-8 encoding, columns for URL + Title + Issue Count + Issue 1 + Issue 2 + Issue 3 (etc.), each issue column contains plain-text description + flagged text + reasoning, proper escaping for spreadsheet compatibility, no HTML/markdown/JSON artifacts
- **Acceptance:** Users can export results to CSV, open in Excel/Google Sheets, and copy/paste individual URL blocks with issues into documents for writer handoff without reformatting

**FR-008: Crawl History**
- **Description:** View past analysis runs with date, URL count, total issues found, and ability to view archived results
- **Entity Type:** System Data
- **Operations:** View (list all past runs), View Details (see full results from past run), Delete (remove run from history)
- **Key Rules:** Runs stored in MongoDB with timestamp, URL list, domain context used, and results, sorted by date descending, delete removes run and all associated results
- **Acceptance:** Users can view list of past analysis runs, click to see full results from any previous run, and delete old runs to manage storage

**FR-009: Domain Context Form Persistence**
- **Description:** localStorage-based persistence of last 5 domain context configurations for quick reuse without backend storage
- **Entity Type:** Configuration
- **Operations:** Save (automatically on submission), Load (select from dropdown), View (see saved configurations), Delete (remove from localStorage)
- **Key Rules:** Store last 5 configurations in localStorage with timestamp and label (auto-generated from domain description), dropdown shows configurations sorted by most recent, selecting loads all form fields
- **Acceptance:** Users can select from last 5 domain configurations without re-typing, see when each was created, and quickly reuse settings for similar content batches

**FR-010: Processing Progress Indicator**
- **Description:** Simple status display showing analysis is in progress, flagging domain context mismatches for user confirmation, and notifying when results are ready
- **Entity Type:** System
- **Operations:** View (see current status), Confirm (respond to context mismatch), Cancel (stop processing - not in MVP)
- **Key Rules:** Three states: "Processing..." (with spinner), "Context Mismatch Detected" (with pause and user prompt), "Analysis Complete" (with link to results), no detailed per-URL progress in MVP
- **Acceptance:** Users see clear indication that analysis is running, are prompted if domain context doesn't match actual content, and are notified when results are ready to review

---

## 3. USER WORKFLOWS

### 3.1 Primary Workflow: Analyze Content Batch and Export for Writers

**Trigger:** Content manager needs to identify stale pages and hand off updates to writers
**Outcome:** Clean list of URLs with issues exported to CSV and ready for writer handoff

**Steps:**
1. User logs in and navigates to URL input form
2. User pastes up to 20 URLs (one per line) and fills out Domain Context Configuration form (or loads saved configuration from localStorage)
3. User submits batch - system validates URLs and begins processing with "Processing..." indicator
4. System extracts JS-rendered content per URL (15s timeout each), then sends to Claude API with domain context for analysis
5. If domain context mismatch detected, system pauses and prompts user: "Content appears to be about [detected topic] but your context is for [configured topic]. Continue anyway?" User confirms or cancels
6. System completes analysis and displays "Analysis Complete" notification with link to results table
7. User reviews results table sorted by issue count (descending), expands rows to see full issue details for top pages
8. User clicks "Export to CSV" and downloads file with clean, column-based format (one issue per column)
9. User opens CSV in Excel/Google Sheets, copies URL blocks with issues, and pastes into Google Doc for writer handoff

### 3.2 Key Supporting Workflows

**Register/Login:** User navigates to login page → clicks "Sign Up" → enters email/password → submits → receives confirmation → logs in with credentials

**Load Saved Domain Context:** User opens URL input form → clicks "Load Previous Configuration" dropdown → selects from last 5 saved contexts → form fields populate automatically

**View Crawl History:** User navigates to History page → sees list of past runs with date/URL count/issue count → clicks run to view full results → can export again or delete run

**Sort/Filter Results:** User views results table → clicks column header to sort by URL/title/issue count → applies issue count filter (e.g., "5+ issues") → sees filtered/sorted results

**Expand Issue Details:** User clicks expand icon on table row → sees full list of issues with plain-text descriptions, flagged text, and reasoning → can copy individual issues for quick reference

**Edit Profile:** User navigates to Settings → clicks "Edit Profile" → updates email or password → saves → sees confirmation

**Logout:** User clicks user menu → selects "Logout" → session ends → redirected to login page

---

## 4. BUSINESS RULES

### 4.1 Entity Lifecycle Rules

| Entity | Type | Who Creates | Who Edits | Who Deletes | Delete Action |
|--------|------|-------------|-----------|-------------|---------------|
| User | System/Config | Self (registration) | Self | Self | Hard delete (account + all runs) |
| URL Batch | User-Generated | User | User (before submit) | User | Soft delete (archived in history) |
| Domain Context | Configuration | User | User (before submit) | User | Remove from localStorage |
| Analysis Run | System Data | System | None | User | Hard delete (run + results) |
| Extraction Result | System Data | System | None | System (on re-run) | Overwrite on re-analysis |
| Detection Result | System Data | System | None | System (on re-run) | Overwrite on re-analysis |

### 4.2 Data Validation Rules

| Entity | Required Fields | Key Constraints |
|--------|-----------------|-----------------|
| User | email, password | Email valid format, password min 8 chars |
| URL Batch | urls (array) | 1-20 URLs, valid HTTP/HTTPS format, no duplicates |
| Domain Context | domain_description, entity_types, staleness_rules | At least 1 entity type, staleness rule per entity |
| Analysis Run | user_id, url_batch, domain_context, timestamp | Valid user, non-empty URL batch |
| Extraction Result | url, status, content OR error_message | Status = success/failed, content if success |
| Detection Result | url, issues (array), issue_count | Issues array can be empty (0 issues found) |

### 4.3 Access & Process Rules

**Access Control:**
- Users can only view/edit/delete their own analysis runs and profile
- No sharing or collaboration in MVP (single-user accounts)
- Authentication required for all features except login/register

**Processing Rules:**
- Hard 20-URL limit per batch enforced in UI and backend
- 15-second timeout per URL extraction (mark as failed and continue)
- Single Claude API call per page (no retries in MVP)
- Failed URLs marked as "Failed - Unable to Access" in results
- Domain context mismatch pauses processing for user confirmation

**Data Retention:**
- Analysis runs stored indefinitely until user deletes
- localStorage domain contexts limited to last 5 (FIFO)
- User account deletion removes all associated runs and results

**Export Rules:**
- CSV export includes all URLs from run (including failed)
- Failed URLs show "Failed - Unable to Access" in Issue 1 column
- Each issue gets its own column (Issue 1, Issue 2, Issue 3, etc.)
- Maximum columns determined by page with most issues in batch

---

## 5. DATA REQUIREMENTS

### 5.1 Core Entities

**User**
- **Type:** System/Configuration | **Storage:** MongoDB
- **Key Fields:** id, email, passwordHash, createdAt, updatedAt
- **Relationships:** has many AnalysisRuns
- **Lifecycle:** Full CRUD with account deletion (hard delete cascades to all runs)

**AnalysisRun**
- **Type:** System Data | **Storage:** MongoDB
- **Key Fields:** id, userId, urlBatch (array), domainContext (object), status, totalUrls, totalIssues, createdAt
- **Relationships:** belongs to User, has many ExtractionResults, has many DetectionResults
- **Lifecycle:** Create (on submission), View (in history), Delete (user-initiated hard delete)

**DomainContext**
- **Type:** Configuration | **Storage:** localStorage (last 5) + embedded in AnalysisRun (MongoDB)
- **Key Fields:** domainDescription, entityTypes (array), stalenessRules (object), freshnessConcerns, keyTerms (array), timestamp
- **Relationships:** embedded in AnalysisRun (not standalone entity)
- **Lifecycle:** Create (per run), Load (from localStorage), Delete (from localStorage only)

**ExtractionResult**
- **Type:** System Data | **Storage:** MongoDB
- **Key Fields:** id, runId, url, status (success/failed), pageTitle, metaTags (object), content (text), tables (array), errorMessage, extractedAt
- **Relationships:** belongs to AnalysisRun
- **Lifecycle:** Create (during extraction), View (in results), Overwrite (on re-analysis)

**DetectionResult**
- **Type:** System Data | **Storage:** MongoDB
- **Key Fields:** id, runId, url, issues (array of {description, flaggedText, reasoning}), issueCount, analyzedAt
- **Relationships:** belongs to AnalysisRun
- **Lifecycle:** Create (during detection), View (in results), Overwrite (on re-analysis)

**Issue**
- **Type:** System Data | **Storage:** Embedded in DetectionResult
- **Key Fields:** description (plain text), flaggedText (plain text), reasoning (plain text)
- **Relationships:** embedded in DetectionResult (not standalone entity)
- **Lifecycle:** Create (during detection), View (in results), no edit/delete

### 5.2 Data Storage Strategy

**Primary Storage:** MongoDB for users, analysis runs, extraction results, detection results
**Secondary Storage:** localStorage for last 5 domain context configurations (client-side only)
**Capacity:** MongoDB handles unlimited runs per user (user manages via deletion), localStorage ~5-10MB sufficient for 5 domain contexts
**Persistence:** MongoDB data persists indefinitely until user deletes, localStorage persists across sessions until browser cache cleared
**Audit Fields:** All MongoDB entities include createdAt, updatedAt (where applicable), userId for ownership tracking

**Data Relationships:**
```
User (1) ──→ (many) AnalysisRun
AnalysisRun (1) ──→ (many) ExtractionResult
AnalysisRun (1) ──→ (many) DetectionResult
AnalysisRun (1) ──→ (1 embedded) DomainContext
DetectionResult (1) ──→ (many embedded) Issue
```

---

## 6. INTEGRATION REQUIREMENTS

**Playwright (Content Extraction):**
- **Purpose:** Extract JS-rendered content as users see it, preserving table structure and relationships
- **Type:** Backend library (not external API)
- **Data Exchange:** Sends URL → Receives HTML content + meta tags + tables with structure
- **Trigger:** On URL batch submission, processes each URL sequentially
- **Error Handling:** 15-second timeout per page, mark as "Failed - Unable to Access" and continue batch

**Claude API (Factual Decay Detection):**
- **Purpose:** Analyze extracted content using domain context to identify stale factual claims
- **Type:** Frontend API calls (claude-3-haiku model)
- **Data Exchange:** Sends prompt (domain context + current date + extracted content) → Receives JSON array of issues
- **Trigger:** After successful content extraction per URL
- **Error Handling:** On API failure, mark URL as "Analysis Failed" with error message and continue batch

---

## 7. VIEWS & NAVIGATION

### 7.1 Primary Views

**Login/Register** (`/login`, `/register`) - Email/password authentication forms with validation, "Forgot Password" link (not functional in MVP), redirect to Dashboard on success

**Dashboard** (`/`) - Welcome message, "New Analysis" button (leads to URL input), recent analysis runs (last 5) with quick stats (date, URL count, issue count), link to full History

**URL Input & Domain Context** (`/analyze`) - Textarea for URLs (1-20), Domain Context Configuration form with guided questions, "Load Previous Configuration" dropdown (last 5 from localStorage), "Submit Analysis" button, validation errors displayed inline

**Processing Status** (`/analyze/processing/:runId`) - Simple "Processing..." indicator with spinner, domain context mismatch prompt (if triggered) with "Continue" and "Cancel" buttons, "Analysis Complete" notification with "View Results" button

**Results Table** (`/results/:runId`) - Sortable table with columns (URL, Title, Issue Count, Top 3 Issues), default sort by issue count descending, expandable rows for full issue details, "Export to CSV" button, "Back to History" link

**Crawl History** (`/history`) - List of all past analysis runs with date, URL count, total issues, "View Results" and "Delete" actions per run, sorted by date descending

**User Settings** (`/settings`) - View/edit profile (email, password), "Delete Account" button with confirmation, "Logout" button

### 7.2 Navigation Structure

**Main Nav:** Dashboard | New Analysis | History | Settings | User Menu (profile, logout)
**Default Landing:** Dashboard (after login)
**Mobile:** Hamburger menu, responsive layout with stacked forms and full-width tables

---

## 8. MVP SCOPE & CONSTRAINTS

### 8.1 MVP Success Definition

The MVP is successful when:
- ✅ Users complete full workflow: configure context → submit URLs → review results → export CSV
- ✅ LLM detection identifies stale claims with 80%+ accuracy based on user feedback
- ✅ CSV output is clean, readable, and successfully copy-pasted into documents for writer handoff
- ✅ Users return to run multiple analyses (validates crawl history value)
- ✅ Domain context configuration used by 90%+ of users (validates necessity)
- ✅ Responsive design functions properly on mobile/tablet/desktop
- ✅ Data persists across sessions (MongoDB + localStorage)
- ✅ Basic error handling present (failed URLs, API errors)

### 8.2 In Scope for MVP

Core features included:
- FR-001: User Authentication (register, login, profile, logout)
- FR-002: URL Input with 20-Page Limit (paste, validate, submit)
- FR-003: Domain Context Configuration (guided form, localStorage persistence)
- FR-004: JS-Rendered Content Extraction (Playwright with table structure preservation)
- FR-005: LLM-Based Factual Decay Detection (Claude API with context awareness)
- FR-006: Results Table with Issue Prioritization (sortable, expandable, plain-text output)
- FR-007: CSV Export for Writer Handoff (clean, column-based format)
- FR-008: Crawl History (view past runs, view results, delete runs)
- FR-009: Domain Context Form Persistence (last 5 in localStorage)
- FR-010: Processing Progress Indicator (simple status, context mismatch prompt)

### 8.3 Technical Constraints

**Data Storage:** MongoDB for users and analysis runs, localStorage for last 5 domain contexts (5-10MB limit)
**Concurrent Users:** Expected 10-50 users in MVP phase
**Performance:** Page loads <2s, analysis processing ~15s per URL (5 minutes for 20-URL batch), instant table sorting/filtering
**Browser Support:** Chrome, Firefox, Safari, Edge (last 2 versions)
**Mobile:** Responsive design, iOS/Android browser support, touch-friendly interactions
**Offline:** Not supported (requires backend for extraction and detection)
**API Rate Limits:** Claude API rate limits apply (handle gracefully with error messages)
**Processing Limits:** Hard 20-URL cap per batch, 15-second timeout per URL extraction

### 8.4 Known Limitations

**For MVP:**
- **20-URL batch limit:** Validates concept before investing in bulk processing infrastructure
- **No saved domain profiles in backend:** localStorage-only persistence (last 5) sufficient for MVP validation
- **No detailed progress tracking:** Simple status indicator only (no per-URL progress)
- **No retry logic:** Failed URLs marked and skipped (no automatic retries)
- **No Google Docs integration:** CSV export only (copy/paste workflow validates need for direct integration)
- **No team collaboration:** Single-user accounts only (no sharing or permissions)
- **No scheduled recurring crawls:** Manual runs only (validates workflow before automation)
- **No advanced analytics:** Basic issue counts only (no trend analysis or aggregation)

**Future Enhancements:**
- V2 adds Google Docs API integration for direct writer handoff (eliminates copy/paste step)
- V2 adds saved domain profiles with backend CRUD (eliminates localStorage limit)
- V2 adds bulk processing (100+ URLs) with queue management and background jobs
- V2 adds detailed progress tracking with per-URL status updates
- V2 adds retry logic for failed extractions and API calls
- V2 adds team collaboration with sharing and permissions
- V2 adds scheduled recurring crawls with email notifications
- V2 adds advanced analytics dashboard with trend analysis

---

## 9. ASSUMPTIONS & DECISIONS

### 9.1 Platform Decisions

- **Type:** Web application (full-stack with frontend + backend)
- **Storage:** MongoDB for users and analysis runs, localStorage for domain context history
- **Auth:** JWT-based email/password authentication (no OAuth in MVP)
- **Content Extraction:** Backend Playwright integration (not client-side due to browser limitations)
- **LLM Detection:** Backend Claude API calls (not client-side due to API key security)

### 9.2 Entity Lifecycle Decisions

**User:** Full CRUD with account deletion
- **Reason:** System/Configuration entity requiring full user control over account

**AnalysisRun:** Create + View + Delete (no edit)
- **Reason:** System Data entity representing immutable analysis results (re-run creates new entry)

**DomainContext:** Create + Load + Delete (localStorage only)
- **Reason:** Configuration entity with temporary persistence for convenience (backend CRUD deferred to V2)

**ExtractionResult:** Create + View (no edit/delete)
- **Reason:** System Data entity representing immutable extraction output (overwritten on re-analysis)

**DetectionResult:** Create + View (no edit/delete)
- **Reason:** System Data entity representing immutable detection output (overwritten on re-analysis)

**Issue:** Create + View (embedded, no standalone operations)
- **Reason:** System Data embedded in DetectionResult (not standalone entity)

### 9.3 Key Assumptions

1. **Content managers will use CSV export as primary writer handoff method**
   - Reasoning: User confirmed CSV is primary step, with Google Docs integration planned for post-MVP. Copy/paste workflow validates need before investing in API integration.

2. **20-URL batch limit is sufficient for MVP validation**
   - Reasoning: Validates core workflow and detection accuracy without requiring bulk processing infrastructure. Users can run multiple batches if needed.

3. **Domain context mismatch detection is critical for accuracy**
   - Reasoning: User confirmed need to flag when actual content topics don't match configured context (e.g., mortgage context but page is about car loans). Prevents false positives and wasted analysis.

4. **localStorage persistence (last 5 contexts) is sufficient for MVP**
   - Reasoning: User confirmed localStorage approach for MVP. Eliminates backend CRUD complexity while providing convenience for repeat users. Backend saved profiles deferred to V2.

5. **Simple progress indicator is sufficient for 20-URL batches**
   - Reasoning: User confirmed content managers won't watch progress for small batches. Focus on context mismatch detection and completion notification. Detailed progress deferred to V2 for bulk processing.

6. **Failed URLs should not block batch processing**
   - Reasoning: User confirmed mark as failed and continue. Maximizes successful results per batch. Detailed failure reasons deferred to V2.

7. **One issue per CSV column is optimal for writer handoff**
   - Reasoning: User confirmed this format. Enables easy copy/paste of individual URL blocks into documents. Each issue fully self-contained with description + flagged text + reasoning.

8. **Plain-text output is critical for non-technical users**
   - Reasoning: User emphasized writers and content managers don't understand markup. All output must be clean, readable sentences without HTML/markdown/JSON artifacts.

### 9.4 Clarification Q&A Summary

**Q:** Should the UI include a specific "Document View" or "Copy Mode" for easy copying, or is CSV export the primary method?
**A:** CSV export is primary, but output must be clean with one issue per column and all needed information free of markup language code noise.
**Decision:** CSV export with column-based format (Issue 1, Issue 2, etc.) where each column contains plain-text description + flagged text + reasoning. No special "Copy Mode" in UI for MVP.

**Q:** Should Domain Context form reset on reload, or use localStorage to remember last inputs?
**A:** Use localStorage to remember last 5 domain profiles created.
**Decision:** localStorage stores last 5 domain contexts with timestamp and auto-generated label. Dropdown allows quick loading. Backend saved profiles deferred to V2.

**Q:** How detailed should the progress indicator be given 15-second processing time per page?
**A:** Content managers won't watch progress for 20 URLs. Just show in-progress status, flag domain context mismatch to ask user, and notify when complete.
**Decision:** Simple three-state indicator: "Processing..." (spinner), "Context Mismatch Detected" (pause with user prompt), "Analysis Complete" (link to results). No per-URL progress in MVP.

**Q:** If one URL fails, should system pause or continue processing?
**A:** Mark URL as failed unable to access and continue processing. Future will ask more detail on failure reason.
**Decision:** Failed URLs marked as "Failed - Unable to Access" in results table and CSV. System continues processing remaining URLs. Detailed failure reasons deferred to V2.

---

**PRD Complete - Ready for Development**