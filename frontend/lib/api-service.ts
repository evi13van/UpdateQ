const API_URL = typeof window !== 'undefined'
  ? (window as any).ENV?.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  : 'http://localhost:8000/api/v1';

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('updateq_token');
  }
  return null;
};

// Helper to set auth token
const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('updateq_token', token);
  }
};

// Helper to remove auth token
const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('updateq_token');
    localStorage.removeItem('updateq_user');
  }
};

// Helper for authenticated requests
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  
  return response;
};

// Auth API
export const authAPI = {
  signup: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }
    
    return response.json();
  },
  
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    
    const data = await response.json();
    setAuthToken(data.access_token);
    return data;
  },
  
  logout: async () => {
    try {
      await authFetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } finally {
      removeAuthToken();
    }
  },
  
  getMe: async () => {
    const response = await authFetch(`${API_URL}/auth/me`);
    
    if (!response.ok) {
      throw new Error('Failed to get user');
    }
    
    return response.json();
  },
};

// Analysis API
export const analysisAPI = {
  startAnalysis: async (urls: string[], domainContext: any) => {
    const response = await authFetch(`${API_URL}/analysis/start`, {
      method: 'POST',
      body: JSON.stringify({ urls, domainContext }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start analysis');
    }
    
    return response.json();
  },
  
  getAnalysisRun: async (runId: string) => {
    const response = await authFetch(`${API_URL}/analysis/runs/${runId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get analysis run');
    }
    
    return response.json();
  },
  
  listAnalysisRuns: async () => {
    const response = await authFetch(`${API_URL}/analysis/runs`);
    
    if (!response.ok) {
      throw new Error('Failed to list analysis runs');
    }
    
    return response.json();
  },
  
  deleteAnalysisRun: async (runId: string) => {
    const response = await authFetch(`${API_URL}/analysis/runs/${runId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete analysis run');
    }
    
    return response.json();
  },
  
  exportCSV: async (runId: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/analysis/runs/${runId}/export`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_${runId}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  
  updateIssue: async (runId: string, issueId: string, update: any) => {
    const response = await authFetch(`${API_URL}/analysis/runs/${runId}/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update issue');
    }
    
    return response.json();
  },
  
  getAllIssues: async (status?: string) => {
    const url = status 
      ? `${API_URL}/analysis/issues?status=${status}`
      : `${API_URL}/analysis/issues`;
    
    const response = await authFetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to get issues');
    }
    
    return response.json();
  },
  
  createManualTask: async (task: any) => {
    const response = await authFetch(`${API_URL}/analysis/manual-task`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create manual task');
    }
    
    return response.json();
  },
};

// Writers API
export const writersAPI = {
  getWriters: async () => {
    const response = await authFetch(`${API_URL}/writers`);
    
    if (!response.ok) {
      throw new Error('Failed to get writers');
    }
    
    return response.json();
  },
  
  addWriter: async (name: string, email: string) => {
    const response = await authFetch(`${API_URL}/writers`, {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add writer');
    }
    
    return response.json();
  },
};

export { setAuthToken, getAuthToken, removeAuthToken };