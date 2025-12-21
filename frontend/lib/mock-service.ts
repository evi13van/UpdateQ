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

export interface Writer {
  id: string;
  name: string;
  email: string;
}

// Mock Data Generators
const MOCK_WRITERS: Writer[] = [
  { id: 'w1', name: 'Sarah Jenkins', email: 'sarah.j@example.com' },
  { id: 'w2', name: 'Mike Chen', email: 'mike.c@example.com' },
  { id: 'w3', name: 'Jessica Alverez', email: 'jessica.a@example.com' }
];

const NURSE_TITLES = [
  "2025 Travel Nurse Salary Guide",
  "Highest Paying States for Travel Nurses",
  "Travel Nursing Specialties Pay Breakdown",
  "Understanding Travel Nurse Pay Packages",
  "ICU Travel Nurse Salary Trends",
  "ER Travel Nurse Pay Rates 2024",
  "Travel Nurse Housing Stipends Explained",
  "Tax Rules for Travel Nurses",
  "Best Agencies for High Pay",
  "Travel Nursing Outlook 2026"
];

const GENERIC_TITLES = [
  "Company About Page",
  "Privacy Policy",
  "Terms of Service",
  "Careers at UpdateQ",
  "Contact Support"
];

const NURSE_ISSUES = [
  {
    description: "Outdated salary source",
    flaggedText: "According to 2023 Bureau of Labor Statistics data, the average pay is...",
    reasoning: "Source is from 2023, which is older than the 2024 cutoff for this review."
  },
  {
    description: "Stale year reference",
    flaggedText: "Looking ahead to 2024, we expect rates to stabilize.",
    reasoning: "Content refers to 2024 as the future, but current context is late 2025."
  },
  {
    description: "Old stipend data",
    flaggedText: "The GSA housing stipend for this location is currently $1,200/month (2022 rates).",
    reasoning: "Stipend rates are from 2022 and likely inaccurate for 2025."
  },
  {
    description: "Expired contract example",
    flaggedText: "Example pay package for start date Jan 2024.",
    reasoning: "Example is nearly 2 years old and may not reflect current market conditions."
  },
  {
    description: "Deprecated certification requirement",
    flaggedText: "Requires AHA BLS certification (2020 guidelines).",
    reasoning: "Guidelines were updated in 2025, making this reference potentially obsolete."
  }
];

const WEB3_TITLES = [
  "Top Crypto Exchanges for 2022",
  "Best NFT Marketplaces for Creators",
  "Web3 Developer Tools Guide",
  "DeFi Yield Farming Strategies",
  "Solana Wallet Comparison",
  "Ethereum Gas Fee Optimization",
  "DAO Governance Tools Review",
  "Layer 2 Scaling Solutions 2021",
  "Metaverse Land Buying Guide",
  "Crypto Tax Software Reviews"
];

const WEB3_ISSUES = [
  {
    description: "Dangerous recommendation",
    flaggedText: "We highly recommend FTX for its low fees and high security.",
    reasoning: "FTX collapsed in late 2022 and is no longer a functioning or safe exchange."
  },
  {
    description: "Deprecated network reference",
    flaggedText: "Deploy your contract to the Ropsten testnet first.",
    reasoning: "Ropsten testnet was deprecated in late 2022. Use Sepolia or Goerli instead."
  },
  {
    description: "Outdated gas fee data",
    flaggedText: "Expect to pay around 100-200 gwei for a simple transfer.",
    reasoning: "Current gas fees are significantly lower (10-30 gwei) due to market conditions and L2 adoption."
  },
  {
    description: "Stale project status",
    flaggedText: "Anchor Protocol offers stable 20% APY on UST.",
    reasoning: "Terra/Luna ecosystem collapsed in May 2022; this protocol is defunct."
  },
  {
    description: "Old roadmap reference",
    flaggedText: "Ethereum 2.0 merge is expected in late 2022.",
    reasoning: "The Merge successfully happened in Sept 2022; terminology 'Eth2' is also deprecated."
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
    
    // 1. Ensure Mortgage Run exists
    if (!allRuns.find(r => r.id === 'run_sample_maria_1')) {
      const mortgageRun: AnalysisRun = {
        id: 'run_sample_maria_1',
        userId: userId,
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
        urlCount: 5,
        totalIssues: 3,
        status: 'completed',
        domainContext: {
          id: 'ctx_sample_1',
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
              { 
                id: 'i1', 
                description: 'Outdated year', 
                flaggedText: 'In 2023, rates are...', 
                reasoning: 'Current year is 2024/2025', 
                status: 'in_progress',
                assignedTo: 'Sarah Jenkins',
                assignedAt: Date.now() - 86400000 * 2, // 2 days ago
                dueDate: Date.now() + 86400000 * 3, // due in 3 days
                googleDocUrl: 'https://docs.google.com/document/d/123456789'
              },
              { 
                id: 'i2', 
                description: 'Stale rate', 
                flaggedText: '3.5% APR', 
                reasoning: 'Current market rates are ~6-7%', 
                status: 'open' 
              },
              { 
                id: 'i3', 
                description: 'Old deadline', 
                flaggedText: 'Apply by Dec 2023', 
                reasoning: 'Date has passed', 
                status: 'completed',
                assignedTo: 'Mike Chen',
                assignedAt: Date.now() - 86400000 * 5,
                completedAt: Date.now() - 86400000 * 1,
                dueDate: Date.now() - 86400000 * 2,
                googleDocUrl: 'https://docs.google.com/document/d/987654321'
              }
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
      this.saveRun(mortgageRun);
    }

    // 2. Ensure Web3 Run exists
    if (!allRuns.find(r => r.id === 'run_sample_maria_2')) {
      const web3Run: AnalysisRun = {
        id: 'run_sample_maria_2',
        userId: userId,
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
        urlCount: 4,
        totalIssues: 5,
        status: 'completed',
        domainContext: {
          id: 'ctx_sample_2',
          description: 'Web3 SaaS Recommendations',
          entityTypes: 'Exchanges, wallets, protocols, testnets',
          stalenessRules: 'Defunct projects (FTX, Luna), deprecated networks, old fees',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5
        },
        results: [
          {
            url: 'https://example.com/best-crypto-exchanges',
            title: 'Top Crypto Exchanges for 2022',
            status: 'success',
            issueCount: 2,
            issues: [
              { 
                id: 'w1', 
                description: 'Dangerous recommendation', 
                flaggedText: 'We highly recommend FTX...', 
                reasoning: 'FTX collapsed in late 2022.', 
                status: 'in_progress',
                assignedTo: 'Jessica Alverez',
                assignedAt: Date.now() - 86400000,
                dueDate: Date.now() + 86400000 * 5,
                googleDocUrl: 'https://docs.google.com/document/d/abcdef123'
              },
              { id: 'w2', description: 'Stale year', flaggedText: 'Best of 2022', reasoning: 'Content is 3+ years old.', status: 'open' }
            ]
          },
          {
            url: 'https://example.com/developer-tools',
            title: 'Web3 Developer Tools Guide',
            status: 'success',
            issueCount: 1,
            issues: [
              { id: 'w3', description: 'Deprecated network', flaggedText: 'Use Ropsten testnet', reasoning: 'Ropsten is deprecated.', status: 'open' }
            ]
          },
          {
            url: 'https://example.com/defi-yields',
            title: 'DeFi Yield Farming Strategies',
            status: 'success',
            issueCount: 2,
            issues: [
              { id: 'w4', description: 'Stale project', flaggedText: 'Anchor Protocol on Terra', reasoning: 'Project collapsed.', status: 'open' },
              { id: 'w5', description: 'Outdated APY', flaggedText: '20% stable APY', reasoning: 'Rates are no longer sustainable/available.', status: 'open' }
            ]
          },
          {
            url: 'https://example.com/wallet-guide',
            title: 'Solana Wallet Comparison',
            status: 'success',
            issueCount: 0,
            issues: []
          }
        ]
      };
      this.saveRun(web3Run);
    }
      
    // Seed contexts if not exists
    const contexts = this.getDomainContexts();
    const mortgageCtx = {
      id: 'ctx_sample_1',
      description: 'Mortgage Rates and Loan Guides',
      entityTypes: 'Interest rates, loan limits, deadlines',
      stalenessRules: 'Rates older than 1 month, 2022 references',
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2
    };
    const web3Ctx = {
      id: 'ctx_sample_2',
      description: 'Web3 SaaS Recommendations',
      entityTypes: 'Exchanges, wallets, protocols, testnets',
      stalenessRules: 'Defunct projects (FTX, Luna), deprecated networks, old fees',
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5
    };

    let newContexts = [...contexts];
    if (!contexts.find(c => c.id === 'ctx_sample_1')) newContexts.push(mortgageCtx);
    if (!contexts.find(c => c.id === 'ctx_sample_2')) newContexts.push(web3Ctx);
    
    if (newContexts.length > contexts.length) {
       localStorage.setItem('updateq_contexts', JSON.stringify(newContexts.slice(0, 5)));
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

  // Writers
  getWriters(): Writer[] {
    if (typeof window === 'undefined') return MOCK_WRITERS;
    const stored = localStorage.getItem('updateq_writers');
    if (!stored) {
      localStorage.setItem('updateq_writers', JSON.stringify(MOCK_WRITERS));
      return MOCK_WRITERS;
    }
    return JSON.parse(stored);
  }

  addWriter(name: string, email: string): Writer {
    const writers = this.getWriters();
    const newWriter = { id: generateId(), name, email };
    const updated = [...writers, newWriter];
    localStorage.setItem('updateq_writers', JSON.stringify(updated));
    return newWriter;
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
        const randomIssue = NURSE_ISSUES[Math.floor(Math.random() * NURSE_ISSUES.length)];
        pageIssues.push({
          id: generateId(),
          ...randomIssue,
          status: 'open'
        });
      }

      // Select title based on URL if possible, or random mortgage title
      let title = NURSE_TITLES[index % NURSE_TITLES.length];
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

  updateIssue(runId: string, url: string, issueId: string, updates: Partial<Issue>) {
    const runs = this.getAllRuns();
    const runIndex = runs.findIndex(r => r.id === runId);
    if (runIndex === -1) return;

    const run = runs[runIndex];
    const resultIndex = run.results.findIndex(r => r.url === url);
    if (resultIndex === -1) return;

    const result = run.results[resultIndex];
    const issueIndex = result.issues.findIndex(i => i.id === issueId);
    if (issueIndex === -1) return;

    const issue = result.issues[issueIndex];
    const updatedIssue = { ...issue, ...updates };
    
    // Update timestamps based on status changes
    if (updates.status === 'assigned' && issue.status !== 'assigned') {
      updatedIssue.assignedAt = Date.now();
    }
    if (updates.status === 'completed' && issue.status !== 'completed') {
      updatedIssue.completedAt = Date.now();
    }

    result.issues[issueIndex] = updatedIssue;
    run.results[resultIndex] = result;
    runs[runIndex] = run;

    localStorage.setItem('updateq_runs', JSON.stringify(runs));
    return updatedIssue;
  }

  getAllIssues() {
    const runs = this.getAllRuns();
    const allIssues: { runId: string; url: string; pageTitle: string; issue: Issue }[] = [];
    
    runs.forEach(run => {
      run.results.forEach(result => {
        result.issues.forEach(issue => {
          allIssues.push({
            runId: run.id,
            url: result.url,
            pageTitle: result.title,
            issue
          });
        });
      });
    });
    
    return allIssues;
  }

  createManualTask(data: { title: string, writerId: string, writerName: string, googleDocUrl: string, dueDate: number }) {
    const runs = this.getAllRuns();
    let manualRun = runs.find(r => r.id === 'manual_assignments_run');
    
    if (!manualRun) {
      manualRun = {
        id: 'manual_assignments_run',
        userId: this.getCurrentUser()?.id || 'unknown',
        timestamp: Date.now(),
        urlCount: 0,
        totalIssues: 0,
        status: 'completed',
        domainContext: {
          id: 'ctx_manual',
          description: 'Manual Assignments',
          entityTypes: 'Manual',
          stalenessRules: 'Manual',
          timestamp: Date.now()
        },
        results: []
      };
      runs.unshift(manualRun);
    }

    const newIssue: Issue = {
      id: generateId(),
      description: 'Manual Task Assignment',
      flaggedText: data.title,
      reasoning: 'Manually assigned task',
      status: 'in_progress',
      assignedTo: data.writerName,
      assignedAt: Date.now(),
      googleDocUrl: data.googleDocUrl,
      dueDate: data.dueDate
    };

    const newResult: DetectionResult = {
      url: data.googleDocUrl || '#',
      title: data.title,
      status: 'success',
      issues: [newIssue],
      issueCount: 1
    };

    manualRun.results.unshift(newResult);
    manualRun.urlCount += 1;
    manualRun.totalIssues += 1;
    
    // Update the run in the array if it was found, otherwise it was already unshifted
    const index = runs.findIndex(r => r.id === 'manual_assignments_run');
    if (index !== -1) {
        runs[index] = manualRun;
    }

    localStorage.setItem('updateq_runs', JSON.stringify(runs));
    return newIssue;
  }
}

export const mockService = new MockService();










