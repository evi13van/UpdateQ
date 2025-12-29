from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


class DomainContext(BaseModel):
    description: str
    entity_types: str = Field(alias="entityTypes")
    staleness_rules: str = Field(alias="stalenessRules")

    class Config:
        populate_by_name = True


class SuggestedSource(BaseModel):
    url: str
    title: str
    snippet: str
    publication_date: Optional[str] = Field(None, alias="publicationDate")
    domain: Optional[str] = None
    confidence: Optional[str] = None  # 'High' or 'Medium'
    is_accepted: bool = Field(False, alias="isAccepted")

    class Config:
        populate_by_name = True


class Issue(BaseModel):
    id: str
    description: str
    flagged_text: str = Field(alias="flaggedText")
    context_excerpt: Optional[str] = Field(None, alias="contextExcerpt")
    reasoning: str
    status: Optional[str] = "open"
    assigned_to: Optional[str] = Field(None, alias="assignedTo")
    assigned_at: Optional[datetime] = Field(None, alias="assignedAt")
    completed_at: Optional[datetime] = Field(None, alias="completedAt")
    google_doc_url: Optional[str] = Field(None, alias="googleDocUrl")
    due_date: Optional[datetime] = Field(None, alias="dueDate")
    suggested_sources: List[SuggestedSource] = Field(default_factory=list, alias="suggestedSources")

    class Config:
        populate_by_name = True


class URLResult(BaseModel):
    url: str
    title: str
    meta_title: Optional[str] = Field(None, alias="metaTitle")
    meta_description: Optional[str] = Field(None, alias="metaDescription")
    h1s: List[str] = Field(default_factory=list, alias="h1s")
    h2s: List[str] = Field(default_factory=list, alias="h2s")
    h3s: List[str] = Field(default_factory=list, alias="h3s")
    h4s: List[str] = Field(default_factory=list, alias="h4s")
    status: str
    issue_count: int = Field(alias="issueCount")
    issues: List[Issue] = []

    class Config:
        populate_by_name = True


class AnalysisRunCreate(BaseModel):
    urls: List[str] = Field(..., min_length=1, max_length=20)
    domain_context: DomainContext = Field(alias="domainContext")

    class Config:
        populate_by_name = True


class AnalysisRunResponse(BaseModel):
    id: str
    user_id: str = Field(alias="userId")
    timestamp: datetime
    url_count: int = Field(alias="urlCount")
    total_issues: int = Field(alias="totalIssues")
    status: str
    domain_context: DomainContext = Field(alias="domainContext")
    results: List[URLResult] = []

    class Config:
        populate_by_name = True


class AnalysisRunSummary(BaseModel):
    id: str
    timestamp: datetime
    url_count: int = Field(alias="urlCount")
    total_issues: int = Field(alias="totalIssues")
    status: str
    domain_context: DomainContext = Field(alias="domainContext")

    class Config:
        populate_by_name = True


class AnalysisStartResponse(BaseModel):
    run_id: str = Field(alias="runId")
    status: str
    url_count: int = Field(alias="urlCount")

    class Config:
        populate_by_name = True


class IssueUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = Field(None, alias="assignedTo")
    google_doc_url: Optional[str] = Field(None, alias="googleDocUrl")
    due_date: Optional[datetime] = Field(None, alias="dueDate")

    class Config:
        populate_by_name = True


class ManualTask(BaseModel):
    title: str
    writer_name: str = Field(alias="writerName")
    google_doc_url: Optional[str] = Field(None, alias="googleDocUrl")
    due_date: Optional[datetime] = Field(None, alias="dueDate")

    class Config:
        populate_by_name = True


class IssueWithContext(BaseModel):
    run_id: str = Field(alias="runId")
    url: str
    page_title: str = Field(alias="pageTitle")
    issue: Issue

    class Config:
        populate_by_name = True