// API Service - Real backend integration
// All mock data removed - using real API calls only

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface DomainContext {
  id?: string;
  description: string;
  entityTypes: string;
  stalenessRules: string;
  timestamp?: number;
}

export interface SuggestedSource {
  url: string;
  title: string;
  snippet: string;
  publicationDate?: string;
  domain?: string;
  confidence?: string;
  isAccepted: boolean;
}

export interface Issue {
  id: string;
  description: string;
  flaggedText: string;
  contextExcerpt?: string;
  reasoning: string;
  status?: string;
  assignedTo?: string;
  assignedAt?: number;
  completedAt?: number;
  googleDocUrl?: string;
  dueDate?: number;
  suggestedSources?: SuggestedSource[];
}

export interface DetectionResult {
  url: string;
  title: string;
  status: 'success' | 'failed';
  issues: Issue[];
  issueCount: number;
}

export interface AnalysisRun {
  id: string;
  userId: string;
  timestamp: number;
  urlCount: number;
  totalIssues: number;
  status: 'processing' | 'completed' | 'failed';
  domainContext: DomainContext;
  results: DetectionResult[];
}

export interface Writer {
  id: string;
  name: string;
  email: string;
}

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('updateq_token');
}

// Helper function to set auth token
function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('updateq_token', token);
}

// Helper function to remove auth token
function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('updateq_token');
  localStorage.removeItem('updateq_user');
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized - token expired or revoked
      if (response.status === 401) {
        removeAuthToken();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Handle network errors specifically
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please ensure the backend is running on port 8000.');
    }
    throw error;
  }
}

// API Service Class
class ApiService {
  // Authentication
  async register(data: { email: string; password: string }): Promise<User> {
    const response = await apiCall<{ id: string; email: string; name: string }>(
      '/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    const user: User = {
      id: response.id,
      email: response.email,
      name: response.name,
    };

    // Store user info
    if (typeof window !== 'undefined') {
      localStorage.setItem('updateq_user', JSON.stringify(user));
    }

    return user;
  }

  async login(data: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const response = await apiCall<{
      access_token: string;
      token_type: string;
      user: { id: string; email: string; name: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const user: User = {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
    };

    // Store token and user
    setAuthToken(response.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('updateq_user', JSON.stringify(user));
    }

    return { user, token: response.access_token };
  }

  async logout(): Promise<void> {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeAuthToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiCall<{ id: string; email: string; name: string }>('/auth/me');
      
      const user: User = {
        id: response.id,
        email: response.email,
        name: response.name,
      };

      // Update stored user
      if (typeof window !== 'undefined') {
        localStorage.setItem('updateq_user', JSON.stringify(user));
      }

      return user;
    } catch (error) {
      removeAuthToken();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return getAuthToken() !== null;
  }

  // Health Check
  async checkBackendHealth(): Promise<{ status: string; database: string }> {
    const response = await fetch('http://localhost:8000/healthz');
    if (!response.ok) {
      throw new Error('Backend health check failed');
    }
    return response.json();
  }

  // Analysis
  async startAnalysis(
    urls: string[],
    domainContext: Omit<DomainContext, 'id' | 'timestamp'>
  ): Promise<{ runId: string; status: string; urlCount: number }> {
    const response = await apiCall<{
      runId: string;
      status: string;
      urlCount: number;
    }>('/analysis/start', {
      method: 'POST',
      body: JSON.stringify({
        urls,
        domainContext: {
          description: domainContext.description,
          entityTypes: domainContext.entityTypes,
          stalenessRules: domainContext.stalenessRules,
        },
      }),
    });

    return {
      runId: response.runId,
      status: response.status,
      urlCount: response.urlCount,
    };
  }

  async getAnalysisRun(runId: string): Promise<AnalysisRun> {
    const response = await apiCall<{
      id: string;
      userId: string;
      timestamp: string;
      urlCount: number;
      totalIssues: number;
      status: string;
      domainContext: {
        description: string;
        entityTypes: string;
        stalenessRules: string;
      };
      results: Array<{
        url: string;
        title: string;
        status: string;
        issueCount: number;
        issues: Array<{
          id: string;
          description: string;
          flaggedText: string;
          contextExcerpt?: string;
          reasoning: string;
          status?: string;
          assignedTo?: string;
          assignedAt?: string;
          completedAt?: string;
          googleDocUrl?: string;
          dueDate?: string;
        }>;
      }>;
    }>(`/analysis/runs/${runId}`);

    // Convert to AnalysisRun format
    return {
      id: response.id,
      userId: response.userId,
      timestamp: new Date(response.timestamp).getTime(),
      urlCount: response.urlCount,
      totalIssues: response.totalIssues,
      status: response.status as 'processing' | 'completed' | 'failed',
      domainContext: {
        description: response.domainContext.description,
        entityTypes: response.domainContext.entityTypes,
        stalenessRules: response.domainContext.stalenessRules,
      },
      results: response.results.map((result) => ({
        url: result.url,
        title: result.title,
        status: result.status as 'success' | 'failed',
        issueCount: result.issueCount,
        issues: result.issues.map((issue) => ({
          id: issue.id,
          description: issue.description,
          flaggedText: issue.flaggedText,
          contextExcerpt: issue.contextExcerpt,
          reasoning: issue.reasoning,
          status: issue.status,
          assignedTo: issue.assignedTo,
          assignedAt: issue.assignedAt ? new Date(issue.assignedAt).getTime() : undefined,
          completedAt: issue.completedAt ? new Date(issue.completedAt).getTime() : undefined,
          googleDocUrl: issue.googleDocUrl,
          dueDate: issue.dueDate ? new Date(issue.dueDate).getTime() : undefined,
        })),
      })),
    };
  }

  async getAllAnalysisRuns(): Promise<AnalysisRun[]> {
    const response = await apiCall<{
      runs: Array<{
        id: string;
        timestamp: string;
        urlCount: number;
        totalIssues: number;
        status: string;
        domainContext: {
          description: string;
        };
      }>;
    }>('/analysis/runs');

    // For list view, we need minimal data. If full data needed, fetch individually
    return response.runs.map((run) => ({
      id: run.id,
      userId: '', // Not included in list
      timestamp: new Date(run.timestamp).getTime(),
      urlCount: run.urlCount,
      totalIssues: run.totalIssues,
      status: run.status as 'processing' | 'completed' | 'failed',
      domainContext: {
        description: run.domainContext.description,
        entityTypes: '',
        stalenessRules: '',
      },
      results: [],
    }));
  }

  async deleteAnalysisRun(runId: string): Promise<void> {
    await apiCall(`/analysis/runs/${runId}`, { method: 'DELETE' });
  }

  async exportAnalysisCSV(runId: string): Promise<Blob> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/analysis/runs/${runId}/export`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }

    return response.blob();
  }

  async updateIssue(
    runId: string,
    issueId: string,
    updates: {
      status?: string;
      assignedTo?: string;
      googleDocUrl?: string;
      dueDate?: string;
    }
  ): Promise<Issue> {
    const response = await apiCall<{
      id: string;
      description: string;
      flaggedText: string;
      contextExcerpt?: string;
      reasoning: string;
      status?: string;
      assignedTo?: string;
      assignedAt?: string;
      completedAt?: string;
      googleDocUrl?: string;
      dueDate?: string;
    }>(`/analysis/runs/${runId}/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    return {
      id: response.id,
      description: response.description,
      flaggedText: response.flaggedText,
      contextExcerpt: response.contextExcerpt,
      reasoning: response.reasoning,
      status: response.status,
      assignedTo: response.assignedTo,
      assignedAt: response.assignedAt ? new Date(response.assignedAt).getTime() : undefined,
      completedAt: response.completedAt ? new Date(response.completedAt).getTime() : undefined,
      googleDocUrl: response.googleDocUrl,
      dueDate: response.dueDate ? new Date(response.dueDate).getTime() : undefined,
    };
  }

  async getAllIssues(status?: string): Promise<Array<{
    runId: string;
    url: string;
    pageTitle: string;
    issue: Issue;
  }>> {
    const endpoint = status ? `/analysis/issues?status=${status}` : '/analysis/issues';
    const response = await apiCall<{
      issues: Array<{
        runId: string;
        url: string;
        pageTitle: string;
        issue: {
          id: string;
          description: string;
          flaggedText: string;
          contextExcerpt?: string;
          reasoning: string;
          status?: string;
          assignedTo?: string;
          assignedAt?: string;
          completedAt?: string;
          googleDocUrl?: string;
          dueDate?: string;
        };
      }>;
    }>(endpoint);

    return response.issues.map((item) => ({
      runId: item.runId,
      url: item.url,
      pageTitle: item.pageTitle,
      issue: {
        id: item.issue.id,
        description: item.issue.description,
        flaggedText: item.issue.flaggedText,
        contextExcerpt: item.issue.contextExcerpt,
        reasoning: item.issue.reasoning,
        status: item.issue.status,
        assignedTo: item.issue.assignedTo,
        assignedAt: item.issue.assignedAt ? new Date(item.issue.assignedAt).getTime() : undefined,
        completedAt: item.issue.completedAt ? new Date(item.issue.completedAt).getTime() : undefined,
        googleDocUrl: item.issue.googleDocUrl,
        dueDate: item.issue.dueDate ? new Date(item.issue.dueDate).getTime() : undefined,
      },
    }));
  }

  async createManualTask(data: {
    title: string;
    writerName: string;
    googleDocUrl?: string;
    dueDate?: string;
  }): Promise<Issue> {
    const response = await apiCall<{
      id: string;
      title: string;
      status: string;
      assignedTo: string;
      googleDocUrl?: string;
      dueDate?: string;
    }>('/analysis/manual-task', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Convert to Issue format
    return {
      id: response.id,
      description: data.title,
      flaggedText: data.title,
      reasoning: 'Manual task assignment',
      status: response.status,
      assignedTo: response.assignedTo,
      googleDocUrl: response.googleDocUrl,
      dueDate: response.dueDate ? new Date(response.dueDate).getTime() : undefined,
    };
  }

  // Writers
  async getWriters(): Promise<Writer[]> {
    const response = await apiCall<{
      writers: Array<{ id: string; name: string; email: string }>;
    }>('/writers');

    return response.writers;
  }

  async addWriter(data: { name: string; email: string }): Promise<Writer> {
    const response = await apiCall<{
      id: string;
      name: string;
      email: string;
    }>('/writers', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return {
      id: response.id,
      name: response.name,
      email: response.email,
    };
  }

  async updateWriter(writerId: string, data: { name?: string; email?: string }): Promise<Writer> {
    const response = await apiCall<{
      id: string;
      name: string;
      email: string;
    }>(`/writers/${writerId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    return {
      id: response.id,
      name: response.name,
      email: response.email,
    };
  }

  // Research
  async researchIssue(runId: string, issueId: string): Promise<SuggestedSource[]> {
    const response = await apiCall<{
      sources: Array<{
        url: string;
        title: string;
        snippet: string;
        publicationDate?: string;
        domain?: string;
        confidence?: string;
        isAccepted: boolean;
      }>;
    }>(`/analysis/runs/${runId}/issues/${issueId}/research`, {
      method: 'POST',
    });

    return response.sources;
  }

  async saveIssueSources(
    runId: string,
    issueId: string,
    sources: SuggestedSource[]
  ): Promise<{ message: string; count: number }> {
    const response = await apiCall<{ message: string; count: number }>(
      `/analysis/runs/${runId}/issues/${issueId}/sources`,
      {
        method: 'POST',
        body: JSON.stringify({ sources }),
      }
    );

    return response;
  }

  // Domain Context (localStorage only - as per PRD)
  saveDomainContext(context: Omit<DomainContext, 'id' | 'timestamp'>): DomainContext {
    if (typeof window === 'undefined') {
      return { ...context, id: '', timestamp: 0 };
    }

    const contexts = this.getDomainContexts();
    const newContext: DomainContext = {
      ...context,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    // Keep last 5
    const updated = [newContext, ...contexts].slice(0, 5);
    localStorage.setItem('domain_contexts', JSON.stringify(updated));

    return newContext;
  }

  getDomainContexts(): DomainContext[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem('domain_contexts');
    return str ? JSON.parse(str) : [];
  }
}

export const apiService = new ApiService();

