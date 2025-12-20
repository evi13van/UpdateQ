// Simple ID generator to avoid external dependencies
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface DomainContext {
  id: string;
  description: string;
  entityTypes: string;
  stalenessRules: string;
  timestamp: number;
}

export interface Issue {
  id: string;
  description: string;
  flaggedText: string;
  reasoning: string;
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

// Mock Data Generators
const MORTGAGE_TITLES = [
  "2023 Mortgage Rates Guide - Best Lenders",
  "How to Refinance Your Home Loan",
  "First-Time Home Buyer Programs in California",
  "Current CD Rates: October 2022",
  "VA Loan Requirements and Limits",
  "FHA Loan Guidelines for 2020",
  "Jumbo Loan Rates and Requirements",
  "HELOC vs Home Equity Loan",
  "USDA Loan Map and Income Limits",
  "Closing Costs Calculator 2021"
];

const GENERIC_TITLES = [
  "Company About Page",
  "Privacy Policy",
  "Terms of Service",
  "Careers at UpdateQ",
  "Contact Support"
];

const MORTGAGE_ISSUES = [
  {
    description: "Outdated interest rate reference",
    flaggedText: "Current mortgage rates are hovering around 3.5% for a 30-year fixed loan.",
    reasoning: "Market data indicates current rates are significantly higher (approx. 6-7%) as of late 2023/2024."
  },
  {
    description: "Stale year reference",
    flaggedText: "As we move into 2022, buyers should prepare for...",
    reasoning: "Content refers to 2022 as the future/current year, indicating the page hasn't been updated in 2+ years."
  },
  {
    description: "Expired program deadline",
    flaggedText: "Applications for this grant must be submitted by December 31, 2021.",
    reasoning: "The deadline mentioned has passed, making this actionable advice invalid for current users."
  },
  {
    description: "Old regulatory limit",
    flaggedText: "The conforming loan limit for 2021 is $548,250.",
    reasoning: "Conforming loan limits have increased annually. The 2024 limit is $766,550."
  },
  {
    description: "Broken or deprecated product link",
    flaggedText: "Check out the Wells Fargo Propel American Express card.",
    reasoning: "This specific product has been discontinued and is no longer available for new applicants."
  }
];

// Service Class
class MockService {
  // User Auth
  login(email: string): User {
    const user = { id: 'user_123', email, name: email.split('@')[0] };
    
    // Special handling for demo user
    if (email === 'maria@contentmanage.com') {
      user.id = 'user_maria';
      user.name = 'Maria';
      this.seedMariaData(user.id);
    }

    localStorage.setItem('updateq_user', JSON.stringify(user));
    return user;
  }

  private seedMariaData(userId: string) {
    if (typeof window === 'undefined') return;
    
    const allRuns = this.getAllRuns();
    const mariaRuns = allRuns.filter(r => r.userId === userId);

    if (mariaRuns.length === 0) {
      // Create a sample completed run
      const sampleRun: AnalysisRun = {
        id: 'run_sample_maria',
        userId: userId,
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
        urlCount: 5,
        totalIssues: 3,
        status: 'completed',
        domainContext: {
          id: 'ctx_sample',
          description: 'Mortgage Rates and Loan Guides',
          entityTypes: 'Interest rates, loan limits, deadlines',
          stalenessRules: 'Rates older than 1 month, 2022 references',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2
        },
        results: [
          {
            url: 'https://example.com/mortgage-rates-2023',
            title: 'Current Mortgage Rates 2023',
            status: 'success',
            issueCount: 3,
            issues: [
              { id: 'i1', description: 'Outdated year', flaggedText: 'In 2023, rates are...', reasoning: 'Current year is 2024/2025' },
              { id: 'i2', description: 'Stale rate', flaggedText: '3.5% APR', reasoning: 'Current market rates are ~6-7%' },
              { id: 'i3', description: 'Old deadline', flaggedText: 'Apply by Dec 2023', reasoning: 'Date has passed' }
            ]
          },
          {
            url: 'https://example.com/first-time-buyer',
            title: 'First Time Buyer Guide',
            status: 'success',
            issueCount: 0,
            issues: []
          },
           {
            url: 'https://example.com/refinance',
            title: 'Refinance Calculator',
            status: 'success',
            issueCount: 0,
            issues: []
          },
           {
            url: 'https://example.com/va-loans',
            title: 'VA Loan Requirements',
            status: 'success',
            issueCount: 0,
            issues: []
          },
           {
            url: 'https://example.com/fha-loans',
            title: 'FHA Loan Limits',
            status: 'success',
            issueCount: 0,
            issues: []
          }
        ]
      };

      this.saveRun(sampleRun);
      
      // Seed context if not exists
      const contexts = this.getDomainContexts();
      if (!contexts.find(c => c.description === sampleRun.domainContext.description)) {
         const newContexts = [sampleRun.domainContext, ...contexts].slice(0, 5);
         localStorage.setItem('updateq_contexts', JSON.stringify(newContexts));
      }
    }
  }

  register(email: string): User {
    return this.login(email);
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('updateq_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  logout() {
    localStorage.removeItem('updateq_user');
  }

  // Domain Context History
  saveDomainContext(context: Omit<DomainContext, 'id' | 'timestamp'>) {
    const contexts = this.getDomainContexts();
    const newContext = {
      ...context,
      id: generateId(),
      timestamp: Date.now()
    };
    
    // Keep last 5
    const updated = [newContext, ...contexts].slice(0, 5);
    localStorage.setItem('updateq_contexts', JSON.stringify(updated));
    return newContext;
  }

  getDomainContexts(): DomainContext[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem('updateq_contexts');
    return str ? JSON.parse(str) : [];
  }

  // Analysis Runs
  async startAnalysis(urls: string[], context: DomainContext): Promise<string> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("User not authenticated");

    const runId = generateId();
    
    // Create initial run entry
    const newRun: AnalysisRun = {
      id: runId,
      userId: user.id,
      timestamp: Date.now(),
      urlCount: urls.length,
      totalIssues: 0,
      status: 'processing',
      domainContext: context,
      results: []
    };

    this.saveRun(newRun);

    // Simulate async processing
    this.simulateProcessing(runId, urls);

    return runId;
  }

  private async simulateProcessing(runId: string, urls: string[]) {
    // Wait a bit to simulate network/processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    const results: DetectionResult[] = urls.map((url, index) => {
      // Randomly decide if page has issues
      const hasIssues = Math.random() > 0.3;
      const isFailed = Math.random() > 0.95; // 5% failure rate

      if (isFailed) {
        return {
          url,
          title: "Error: Unable to access page",
          status: 'failed',
          issues: [],
          issueCount: 0
        };
      }

      const numIssues = hasIssues ? Math.floor(Math.random() * 4) + 1 : 0;
      const pageIssues: Issue[] = [];

      for (let i = 0; i < numIssues; i++) {
        const randomIssue = MORTGAGE_ISSUES[Math.floor(Math.random() * MORTGAGE_ISSUES.length)];
        pageIssues.push({
          id: generateId(),
          ...randomIssue
        });
      }

      // Select title based on URL if possible, or random mortgage title
      let title = MORTGAGE_TITLES[index % MORTGAGE_TITLES.length];
      if (url.includes('about')) title = GENERIC_TITLES[0];
      if (url.includes('privacy')) title = GENERIC_TITLES[1];

      return {
        url,
        title: title || "Untitled Page",
        status: 'success',
        issues: pageIssues,
        issueCount: pageIssues.length
      };
    });

    const totalIssues = results.reduce((acc, curr) => acc + curr.issueCount, 0);

    const run = this.getRun(runId);
    if (run) {
      const completedRun: AnalysisRun = {
        ...run,
        status: 'completed',
        results,
        totalIssues
      };
      this.saveRun(completedRun);
    }
  }

  getRun(id: string): AnalysisRun | null {
    const runs = this.getAllRuns();
    return runs.find(r => r.id === id) || null;
  }

  getAllRuns(): AnalysisRun[] {
    if (typeof window === 'undefined') return [];
    const str = localStorage.getItem('updateq_runs');
    return str ? JSON.parse(str) : [];
  }

  saveRun(run: AnalysisRun) {
    const runs = this.getAllRuns();
    const index = runs.findIndex(r => r.id === run.id);
    
    let updatedRuns;
    if (index >= 0) {
      updatedRuns = [...runs];
      updatedRuns[index] = run;
    } else {
      updatedRuns = [run, ...runs];
    }
    
    localStorage.setItem('updateq_runs', JSON.stringify(updatedRuns));
  }

  deleteRun(id: string) {
    const runs = this.getAllRuns().filter(r => r.id !== id);
    localStorage.setItem('updateq_runs', JSON.stringify(runs));
  }
}

export const mockService = new MockService();

