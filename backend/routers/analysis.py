from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from models.analysis import (
    AnalysisRunCreate, AnalysisRunResponse, AnalysisStartResponse,
    AnalysisRunSummary, IssueUpdate, ManualTask, IssueWithContext,
    SuggestedSource
)
from auth.dependencies import get_current_user
from database import get_database
from services.extractor import extract_content
from services.detector import detect_stale_content
from services.research import research_service
from bson import ObjectId
from datetime import datetime
from typing import List
from pydantic import BaseModel
import csv
import io

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])


async def process_analysis(run_id: str, urls: list, domain_context: dict):
    """Background task to process URL analysis"""
    db = get_database()
    results = []
    total_issues = 0
    
    for url in urls:
        # Extract content
        extraction = await extract_content(url)
        
        if extraction["status"] == "failed":
            # Mark as failed and continue
            results.append({
                "url": url,
                "title": "Failed to Access",
                "metaTitle": "",
                "metaDescription": "",
                "h1s": [],
                "h2s": [],
                "h3s": [],
                "h4s": [],
                "status": "failed",
                "issueCount": 0,
                "issues": []
            })
            continue
        
        # Detect stale content
        print(f"[DEBUG] Starting detection for {url}")
        detection = await detect_stale_content(
            url,
            extraction["content"],
            domain_context
        )
        print(f"[DEBUG] Detection complete for {url}: {detection.get('issue_count', 0)} issues found")
        
        issue_count = detection.get("issue_count", 0)
        total_issues += issue_count
        
        # Extract headers from the extraction result
        headers = extraction.get("headers", {})
        
        results.append({
            "url": url,
            "title": extraction["title"],
            "metaTitle": extraction.get("meta_title", ""),
            "metaDescription": extraction.get("meta_description", ""),
            "h1s": headers.get("h1", []),
            "h2s": headers.get("h2", []),
            "h3s": headers.get("h3", []),
            "h4s": headers.get("h4", []),
            "status": "success",
            "issueCount": issue_count,
            "issues": detection.get("issues", [])
        })
    
    # Update run with results
    await db.analysis_runs.update_one(
        {"_id": ObjectId(run_id)},
        {
            "$set": {
                "status": "completed",
                "total_issues": total_issues,
                "results": results
            }
        }
    )


@router.post("/start", response_model=AnalysisStartResponse, status_code=status.HTTP_201_CREATED)
async def start_analysis(
    data: AnalysisRunCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Submit URL batch for analysis"""
    db = get_database()
    
    # Validate URLs
    if len(data.urls) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 20 URLs allowed per batch"
        )
    
    # Remove duplicates
    unique_urls = list(dict.fromkeys(data.urls))
    
    # Create analysis run
    run_doc = {
        "user_id": ObjectId(current_user["id"]),
        "timestamp": datetime.utcnow(),
        "url_count": len(unique_urls),
        "total_issues": 0,
        "status": "processing",
        "domain_context": {
            "description": data.domain_context.description,
            "entityTypes": data.domain_context.entity_types,
            "stalenessRules": data.domain_context.staleness_rules
        },
        "results": []
    }
    
    result = await db.analysis_runs.insert_one(run_doc)
    run_id = str(result.inserted_id)
    
    # Start background processing
    background_tasks.add_task(
        process_analysis,
        run_id,
        unique_urls,
        run_doc["domain_context"]
    )
    
    return AnalysisStartResponse(
        runId=run_id,
        status="processing",
        urlCount=len(unique_urls)
    )


@router.get("/runs/{run_id}", response_model=AnalysisRunResponse)
async def get_analysis_run(
    run_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get analysis run details and results"""
    db = get_database()
    
    try:
        run = await db.analysis_runs.find_one({
            "_id": ObjectId(run_id),
            "user_id": ObjectId(current_user["id"])
        })
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis run not found"
        )
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis run not found"
        )
    
    return AnalysisRunResponse(
        id=str(run["_id"]),
        userId=str(run["user_id"]),
        timestamp=run["timestamp"],
        urlCount=run["url_count"],
        totalIssues=run["total_issues"],
        status=run["status"],
        domainContext=run["domain_context"],
        results=run.get("results", [])
    )


@router.get("/runs")
async def list_analysis_runs(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """List all analysis runs for user with pagination"""
    db = get_database()
    
    cursor = db.analysis_runs.find(
        {"user_id": ObjectId(current_user["id"])}
    ).sort("timestamp", -1).skip(skip).limit(limit)
    
    runs = []
    async for run in cursor:
        runs.append({
            "id": str(run["_id"]),
            "timestamp": run["timestamp"],
            "urlCount": run["url_count"],
            "totalIssues": run["total_issues"],
            "status": run["status"],
            "domainContext": {
                "description": run["domain_context"].get("description", "")
            }
        })
    
    # Also get total count for pagination purposes
    total_runs = await db.analysis_runs.count_documents(
        {"user_id": ObjectId(current_user["id"])}
    )
    
    return {"runs": runs, "total": total_runs}


@router.delete("/runs/{run_id}")
async def delete_analysis_run(
    run_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete analysis run"""
    db = get_database()
    
    result = await db.analysis_runs.delete_one({
        "_id": ObjectId(run_id),
        "user_id": ObjectId(current_user["id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis run not found"
        )
    
    return {"message": "Analysis run deleted"}


@router.get("/runs/{run_id}/export")
async def export_analysis_csv(
    run_id: str,
    urls: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Export analysis results as CSV with one column per issue (issue + reason combined)
    
    Args:
        run_id: The analysis run ID
        urls: Optional comma-separated list of URLs to filter by
        current_user: Authenticated user
    """
    from utils.text_processing import format_issue_with_reason_for_csv
    
    db = get_database()
    
    run = await db.analysis_runs.find_one({
        "_id": ObjectId(run_id),
        "user_id": ObjectId(current_user["id"])
    })
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis run not found"
        )
        
    async def csv_generator():
        # Filter results by selected URLs if provided
        results = run.get("results", [])
        if urls:
            selected_urls = [url.strip() for url in urls.split(",")]
            results = [result for result in results if result["url"] in selected_urls]
        
        # Determine max number of issues across filtered results
        max_issues = 0
        for result in results:
            issue_count = len(result.get("issues", []))
            if issue_count > max_issues:
                max_issues = issue_count
        
        # Use an in-memory stream to build CSV rows
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        headers = ["URL", "Page Title", "Meta Title", "Meta Description", "H1", "H2", "H3", "H4", "Status", "Issue Count"]
        for i in range(1, max_issues + 1):
            headers.append(f"Issue {i}")
        writer.writerow(headers)
        
        # Yield header row
        output.seek(0)
        yield output.read()
        output.truncate(0)
        output.seek(0)
        
        # Write and yield data rows
        for result in results:
            issues = result.get("issues", [])
            
            h1_text = " | ".join(result.get("h1s", []))
            h2_text = " | ".join(result.get("h2s", []))
            h3_text = " | ".join(result.get("h3s", []))
            h4_text = " | ".join(result.get("h4s", []))
            
            row = [
                result["url"],
                result["title"],
                result.get("metaTitle", ""),
                result.get("metaDescription", ""),
                h1_text,
                h2_text,
                h3_text,
                h4_text,
                result["status"],
                result["issueCount"]
            ]
            
            for i in range(max_issues):
                if i < len(issues):
                    row.append(format_issue_with_reason_for_csv(issues[i]))
                else:
                    row.append("")
            
            writer.writerow(row)
            
            # Yield the row
            output.seek(0)
            yield output.read()
            output.truncate(0)
            output.seek(0)

    return StreamingResponse(
        csv_generator(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=analysis_{run_id}.csv"
        }
    )


@router.patch("/runs/{run_id}/issues/{issue_id}")
async def update_issue(
    run_id: str,
    issue_id: str,
    update_data: IssueUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update issue status and assignment"""
    db = get_database()
    
    run = await db.analysis_runs.find_one({
        "_id": ObjectId(run_id),
        "user_id": ObjectId(current_user["id"])
    })
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis run not found"
        )
    
    # Find and update the issue
    updated = False
    for result in run.get("results", []):
        for issue in result.get("issues", []):
            if issue["id"] == issue_id:
                if update_data.status:
                    issue["status"] = update_data.status
                if update_data.assigned_to:
                    issue["assignedTo"] = update_data.assigned_to
                    # Only set assignedAt if it's not already set (first assignment)
                    if "assignedAt" not in issue or issue["assignedAt"] is None:
                        issue["assignedAt"] = datetime.utcnow()
                if update_data.google_doc_url:
                    issue["googleDocUrl"] = update_data.google_doc_url
                if update_data.due_date:
                    issue["dueDate"] = update_data.due_date
                updated = True
                break
        if updated:
            break
    
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    # Save updated run
    await db.analysis_runs.update_one(
        {"_id": ObjectId(run_id)},
        {"$set": {"results": run["results"]}}
    )
    
    # Return updated issue
    for result in run["results"]:
        for issue in result.get("issues", []):
            if issue["id"] == issue_id:
                return issue
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Issue not found"
    )


@router.get("/issues")
async def get_all_issues(
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """Get all issues across all runs with pagination"""
    db = get_database()
    
    pipeline = [
        {"$match": {"user_id": ObjectId(current_user["id"])}},
        {"$unwind": "$results"},
        {"$unwind": "$results.issues"},
        {"$addFields": {
            "issue_obj": {
                "runId": {"$toString": "$_id"},
                "url": "$results.url",
                "pageTitle": "$results.title",
                "issue": "$results.issues"
            }
        }},
        {"$replaceRoot": {"newRoot": "$issue_obj"}}
    ]
    
    if status:
        pipeline.append({"$match": {"issue.status": status}})
        
    # Pipeline for counting
    count_pipeline = pipeline.copy()
    count_pipeline.append({"$count": "total"})
    
    # Pipeline for data
    data_pipeline = pipeline.copy()
    data_pipeline.append({"$skip": skip})
    data_pipeline.append({"$limit": limit})
    
    # Execute pipelines
    issues_cursor = db.analysis_runs.aggregate(data_pipeline)
    total_cursor = db.analysis_runs.aggregate(count_pipeline)
    
    all_issues = await issues_cursor.to_list(length=limit)
    
    total_result = await total_cursor.to_list(length=1)
    total = total_result["total"] if total_result else 0
    
    return {"issues": all_issues, "total": total}


@router.post("/manual-task", status_code=status.HTTP_201_CREATED)
async def create_manual_task(
    task_data: ManualTask,
    current_user: dict = Depends(get_current_user)
):
    """Create manual task assignment"""
    # For MVP, we'll store this as a special analysis run
    db = get_database()
    
    task_doc = {
        "user_id": ObjectId(current_user["id"]),
        "timestamp": datetime.utcnow(),
        "url_count": 0,
        "total_issues": 1,
        "status": "completed",
        "domain_context": {
            "description": "Manual Task",
            "entityTypes": "",
            "stalenessRules": ""
        },
        "results": [{
            "url": "",
            "title": task_data.title,
            "status": "success",
            "issueCount": 1,
            "issues": [{
                "id": f"task_manual_{ObjectId()}",
                "description": task_data.title,
                "flaggedText": "",
                "reasoning": "Manual task assignment",
                "status": "in_progress",
                "assignedTo": task_data.writer_name,
                "assignedAt": datetime.utcnow(),
                "googleDocUrl": task_data.google_doc_url,
                "dueDate": task_data.due_date
            }]
        }]
    }
    
    result = await db.analysis_runs.insert_one(task_doc)
    
    return {
        "id": task_doc["results"][0]["issues"][0]["id"],
        "title": task_data.title,
        "status": "in_progress",
        "assignedTo": task_data.writer_name,
        "googleDocUrl": task_data.google_doc_url,
        "dueDate": task_data.due_date
    }


class SaveSourcesRequest(BaseModel):
    sources: List[SuggestedSource]


@router.post("/runs/{run_id}/issues/{issue_id}/research")
async def research_issue(
    run_id: str,
    issue_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Trigger AI research to find authoritative sources for an issue"""
    db = get_database()
    
    # Get the run and find the issue
    run = await db.analysis_runs.find_one({
        "_id": ObjectId(run_id),
        "user_id": ObjectId(current_user["id"])
    })
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis run not found"
        )
    
    # Find the issue
    issue_data = None
    for result in run.get("results", []):
        for issue in result.get("issues", []):
            if issue["id"] == issue_id:
                issue_data = issue
                break
        if issue_data:
            break
    
    if not issue_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    # Convert to Issue model
    from models.analysis import Issue, DomainContext
    issue_obj = Issue(
        id=issue_data["id"],
        description=issue_data["description"],
        flaggedText=issue_data["flaggedText"],
        reasoning=issue_data["reasoning"],
        status=issue_data.get("status", "open")
    )
    
    context_obj = DomainContext(
        description=run["domain_context"]["description"],
        entityTypes=run["domain_context"]["entityTypes"],
        stalenessRules=run["domain_context"]["stalenessRules"]
    )
    
    # Perform research
    sources = await research_service.research_issue(issue_obj, context_obj)
    
    return {
        "sources": [source.dict(by_alias=True) for source in sources]
    }


@router.post("/runs/{run_id}/issues/{issue_id}/sources")
async def save_issue_sources(
    run_id: str,
    issue_id: str,
    request: SaveSourcesRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save selected sources to an issue"""
    db = get_database()
    
    run = await db.analysis_runs.find_one({
        "_id": ObjectId(run_id),
        "user_id": ObjectId(current_user["id"])
    })
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis run not found"
        )
    
    # Find and update the issue
    updated = False
    for result in run.get("results", []):
        for issue in result.get("issues", []):
            if issue["id"] == issue_id:
                # Convert sources to dict format for storage
                issue["suggestedSources"] = [
                    source.dict(by_alias=True) for source in request.sources
                ]
                updated = True
                break
        if updated:
            break
    
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    # Save updated run
    await db.analysis_runs.update_one(
        {"_id": ObjectId(run_id)},
        {"$set": {"results": run["results"]}}
    )
    
    return {"message": "Sources saved successfully", "count": len(request.sources)}