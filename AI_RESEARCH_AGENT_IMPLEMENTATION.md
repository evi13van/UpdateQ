# AI Research Agent - Implementation Documentation

## Overview
The AI Research Agent is a new feature that enables content managers to automatically find reliable, high-authority external sources to resolve factual inaccuracies or citation gaps identified during content reviews.

## Implementation Date
December 28, 2024

## Architecture

### Backend Components

#### 1. Data Models (`backend/models/analysis.py`)
**New Models:**
- `SuggestedSource`: Represents a research source with metadata
  - `url`: Source URL
  - `title`: Page title
  - `snippet`: Relevant text excerpt
  - `publicationDate`: Publication date (optional)
  - `domain`: Domain name (optional)
  - `confidence`: Trust level (High/Medium)
  - `isAccepted`: User selection state

**Updated Models:**
- `Issue`: Extended with `suggested_sources` field to store research results

#### 2. Research Service (`backend/services/research.py`)
**Class: `ResearchService`**

**Methods:**
- `generate_research_query(issue, context)`: Uses Claude to create optimized search queries
- `perform_research(query)`: Calls Perplexity API to find authoritative sources
- `research_issue(issue, context)`: Complete workflow combining query generation and search

**Key Features:**
- Two-step AI process: Claude for query optimization, Perplexity for search
- Filters for high-trust domains (.gov, .edu, industry leaders)
- Returns structured source data with confidence scores

#### 3. API Endpoints (`backend/routers/analysis.py`)
**New Endpoints:**

1. `POST /api/v1/analysis/runs/{run_id}/issues/{issue_id}/research`
   - Triggers AI research for a specific issue
   - Returns list of suggested sources
   - Response: `{ sources: SuggestedSource[] }`

2. `POST /api/v1/analysis/runs/{run_id}/issues/{issue_id}/sources`
   - Saves user-selected sources to an issue
   - Request: `{ sources: SuggestedSource[] }`
   - Response: `{ message: string, count: number }`

#### 4. CSV Export Enhancement (`backend/utils/text_processing.py`)
**Updated Function: `format_issue_with_reason_for_csv`**
- Now includes accepted sources in the CSV export
- Format:
  ```
  [ISSUE DESCRIPTION]
  ...
  
  SUGGESTED SOURCES:
  1. Title (Date)
     "Snippet"
     URL
  ```

### Frontend Components

#### 1. Type Definitions (`frontend/lib/api.ts`)
**New Types:**
- `SuggestedSource`: TypeScript interface matching backend model
- Updated `Issue` interface with optional `suggestedSources` field

**New API Methods:**
- `researchIssue(runId, issueId)`: Triggers research
- `saveIssueSources(runId, issueId, sources)`: Saves selected sources

#### 2. Research Drawer Component (`frontend/components/research-drawer.tsx`)
**Features:**
- Side panel UI using Sheet component
- Search query refinement input
- Source cards with:
  - Trust badges (green for .gov/.edu)
  - Publication dates
  - Relevant snippets
  - Selection checkboxes
- Loading states
- "Attach Sources" action button

**Props:**
- `open`: Drawer visibility state
- `issueDescription`: Context for the research
- `sources`: Array of suggested sources
- `isLoading`: Research in progress state
- `onRefineSearch`: Callback for query refinement
- `onSaveSources`: Callback to save selected sources

#### 3. Results Page Integration (`frontend/app/results/[id]/page.tsx`)
**New Features:**
- "Find Sources" button with Sparkles icon on each issue
- Badge showing count of attached sources
- Research drawer integration
- State management for:
  - Current issue being researched
  - Research sources
  - Loading states

**User Flow:**
1. User clicks "Find Sources" on an issue
2. System triggers AI research (Claude + Perplexity)
3. Drawer opens showing suggested sources
4. User reviews and selects trusted sources
5. User clicks "Attach Sources"
6. Sources are saved and displayed in issue details
7. Sources are included in CSV export

## Configuration

### Environment Variables
**Backend (`backend/.env`):**
```env
PERPLEXITY_API_KEY=your-perplexity-api-key
CLAUDE_API_KEY=your-claude-api-key
```

**Backend Example (`backend/.env.example`):**
```env
PERPLEXITY_API_KEY=your-perplexity-api-key
```

## API Integration Details

### Perplexity API
- **Model**: `sonar` (search-optimized)
- **Endpoint**: `https://api.perplexity.ai/chat/completions`
- **Features Used**:
  - Real-time web search
  - Citation extraction
  - Structured JSON responses

### Claude API
- **Model**: `claude-3-haiku-20240307`
- **Purpose**: Query optimization
- **Prompt Strategy**: Focuses on finding primary sources and official data

## Data Flow

```
1. User Action
   └─> Click "Find Sources" button

2. Frontend
   └─> Call apiService.researchIssue(runId, issueId)

3. Backend API
   └─> POST /analysis/runs/{run_id}/issues/{issue_id}/research

4. Research Service
   ├─> Generate query with Claude
   └─> Search with Perplexity

5. Response
   └─> Return SuggestedSource[]

6. User Selection
   └─> Select sources in drawer

7. Save Sources
   ├─> Call apiService.saveIssueSources()
   └─> Update MongoDB document

8. CSV Export
   └─> Include sources in formatted output
```

## Database Schema

### MongoDB Document Structure
```javascript
{
  "_id": ObjectId,
  "results": [
    {
      "issues": [
        {
          "id": "issue_abc123",
          "description": "...",
          "suggestedSources": [
            {
              "url": "https://example.gov/data",
              "title": "Official Statistics",
              "snippet": "Current data shows...",
              "publicationDate": "2024-01-15",
              "domain": "example.gov",
              "confidence": "High",
              "isAccepted": true
            }
          ]
        }
      ]
    }
  ]
}
```

## UI/UX Design

### Visual Elements
1. **Find Sources Button**
   - Icon: Sparkles (✨)
   - Position: Next to issue assignment controls
   - Style: Outline variant

2. **Sources Badge**
   - Shows count of attached sources
   - Color: Emerald (success state)
   - Format: "N Source(s) Attached"

3. **Research Drawer**
   - Width: Full width on mobile, max 2xl on desktop
   - Background: Dark slate with blur
   - Sections:
     - Header with issue context
     - Search refinement input
     - Scrollable source list
     - Footer with attach button

4. **Source Cards**
   - Trust indicators:
     - Green badge with shield icon for .gov/.edu
     - Blue badge for high confidence
     - Gray badge for medium confidence
   - Publication date with calendar icon
   - Clickable title with external link icon
   - Quoted snippet in italic
   - Checkbox for selection

## Testing Checklist

### Backend Tests
- [ ] Research service generates valid queries
- [ ] Perplexity API integration works
- [ ] Sources are correctly parsed and stored
- [ ] CSV export includes sources
- [ ] API endpoints return correct data

### Frontend Tests
- [ ] "Find Sources" button triggers research
- [ ] Drawer opens and displays sources
- [ ] Source selection works correctly
- [ ] Sources are saved to backend
- [ ] Badge displays correct count
- [ ] Loading states display properly

### Integration Tests
- [ ] End-to-end research workflow
- [ ] CSV export with sources
- [ ] Multiple issues with different sources
- [ ] Error handling for API failures

## Known Limitations

1. **Search Refinement**: Currently re-runs the same query (query parameter not yet passed to backend)
2. **Rate Limits**: Subject to Perplexity API rate limits
3. **Source Validation**: No automatic verification of source credibility beyond domain filtering
4. **Offline Mode**: Requires active internet connection for research

## Future Enhancements

1. **Advanced Search**
   - Pass custom queries to backend
   - Save search history
   - Suggest related queries

2. **Source Management**
   - Edit source metadata
   - Add manual sources
   - Rate source quality

3. **Analytics**
   - Track most used sources
   - Source effectiveness metrics
   - Domain trust scoring

4. **Batch Operations**
   - Research multiple issues at once
   - Bulk source attachment
   - Automated research on detection

## Troubleshooting

### Common Issues

**Issue**: Research returns no sources
- **Cause**: Perplexity API key invalid or rate limited
- **Solution**: Check API key in `.env`, verify account status

**Issue**: Sources not saving
- **Cause**: MongoDB connection issue or validation error
- **Solution**: Check backend logs, verify data structure

**Issue**: Drawer not opening
- **Cause**: Frontend state management issue
- **Solution**: Check browser console for errors, verify API response

## Support

For issues or questions:
1. Check backend logs: `cd backend && tail -f logs/app.log`
2. Check frontend console: Browser DevTools
3. Verify API keys are correctly set
4. Review this documentation

## Version History

- **v1.0.0** (2024-12-28): Initial implementation
  - Basic research functionality
  - Perplexity integration
  - CSV export with sources
  - Research drawer UI