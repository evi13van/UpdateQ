"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockService, AnalysisRun } from '@/lib/mock-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ChevronDown, ChevronUp, Download, Filter, Search, CheckCircle2, UserPlus, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'issueCount' | 'url', direction: 'asc' | 'desc' }>({ key: 'issueCount', direction: 'desc' });

  useEffect(() => {
    const data = mockService.getRun(runId);
    if (data) {
      setRun(data);
    } else {
      toast.error('Analysis run not found');
      router.push('/history');
    }
  }, [runId, router]);

  const toggleRow = (url: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(url)) {
      newExpanded.delete(url);
    } else {
      newExpanded.add(url);
    }
    setExpandedRows(newExpanded);
  };

  const handleAssign = (url: string, issueId: string) => {
    const writerName = prompt("Enter writer's name to assign this issue:");
    if (writerName) {
      mockService.updateIssue(runId, url, issueId, { 
        status: 'assigned', 
        assignedTo: writerName 
      });
      // Refresh local state
      const updatedRun = mockService.getRun(runId);
      if (updatedRun) setRun(updatedRun);
      toast.success(`Assigned to ${writerName}`);
    }
  };

  const handleExportCSV = () => {
    if (!run) return;

    // Generate CSV content with proper escaping for Google Sheets/Excel
    const headers = ['URL', 'Page Title', 'Issue Count', 'Issue Description', 'Flagged Text', 'Reasoning'];
    
    // Flatten the data structure: one row per issue
    const rows: string[] = [];
    
    run.results.forEach(result => {
      if (result.issues.length === 0) {
        // Add a row even if no issues, just to show the page was checked
        const row = [
          result.url,
          result.title,
          '0',
          'No issues found',
          '',
          ''
        ];
        rows.push(row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','));
      } else {
        result.issues.forEach(issue => {
          const row = [
            result.url,
            result.title,
            result.issueCount.toString(),
            issue.description,
            issue.flaggedText,
            issue.reasoning
          ];
          rows.push(row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','));
        });
      }
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `updateq_review_${run.domainContext.description.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  if (!run) return null;

  // Filter and Sort
  const filteredResults = run.results
    .filter(r => r.url.toLowerCase().includes(filterText.toLowerCase()) || r.title.toLowerCase().includes(filterText.toLowerCase()))
    .sort((a, b) => {
      if (sortConfig.key === 'issueCount') {
        return sortConfig.direction === 'asc' ? a.issueCount - b.issueCount : b.issueCount - a.issueCount;
      } else {
        return sortConfig.direction === 'asc' ? a.url.localeCompare(b.url) : b.url.localeCompare(a.url);
      }
    });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/history')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Analysis Results</h1>
            <p className="text-slate-400 text-sm">
              {run.domainContext.description} • {run.urlCount} URLs • {run.totalIssues} Issues
            </p>
          </div>
        </div>
        <Button onClick={handleExportCSV} className="shadow-lg shadow-emerald-500/20">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Filter by URL or Title..." 
            className="pl-10"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setSortConfig({ key: 'issueCount', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
        >
          <Filter className="mr-2 h-4 w-4" />
          Sort by Issues {sortConfig.key === 'issueCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
        </Button>
      </div>

      {/* Results Table */}
      <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-sm font-medium text-slate-300">
          <div className="col-span-6 md:col-span-5">Page</div>
          <div className="col-span-2 md:col-span-2 text-center">Status</div>
          <div className="col-span-2 md:col-span-2 text-center">Issues</div>
          <div className="col-span-2 md:col-span-3 text-right">Actions</div>
        </div>

        <div className="divide-y divide-white/5">
          {filteredResults.map((result) => (
            <div key={result.url} className="group transition-colors hover:bg-white/5">
              {/* Main Row */}
              <div 
                className="grid grid-cols-12 gap-4 p-4 items-center cursor-pointer"
                onClick={() => toggleRow(result.url)}
              >
                <div className="col-span-6 md:col-span-5 overflow-hidden">
                  <div className="font-medium text-white truncate" title={result.title}>{result.title}</div>
                  <div className="text-xs text-slate-500 truncate" title={result.url}>{result.url}</div>
                </div>
                
                <div className="col-span-2 md:col-span-2 text-center">
                  {result.status === 'failed' ? (
                    <Badge variant="destructive">Failed</Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                      Analyzed
                    </Badge>
                  )}
                </div>

                <div className="col-span-2 md:col-span-2 text-center">
                  <Badge variant={result.issueCount > 0 ? 'warning' : 'secondary'}>
                    {result.issueCount} Issues
                  </Badge>
                </div>

                <div className="col-span-2 md:col-span-3 flex justify-end items-center gap-2">
                  {expandedRows.has(result.url) ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRows.has(result.url) && (
                <div className="bg-slate-950/50 p-4 md:p-6 border-t border-white/5 animate-in slide-in-from-top-2">
                  {result.status === 'failed' ? (
                    <div className="text-red-400 text-sm">
                      Unable to access this page. Please check the URL and try again.
                    </div>
                  ) : result.issues.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Detected Issues</h4>
                      <div className="grid gap-4">
                        {result.issues.map((issue, idx) => (
                          <div key={idx} className="bg-slate-900 border border-white/10 rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${issue.status === 'completed' ? 'bg-emerald-500' : issue.status === 'assigned' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                <div className="space-y-2 w-full">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-amber-400">{issue.description}</p>
                                    {issue.status !== 'open' && (
                                      <Badge variant="outline" className="text-xs">
                                        {issue.status === 'assigned' ? `Assigned to ${issue.assignedTo}` : 'Completed'}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="bg-slate-950 p-3 rounded border border-white/5 text-sm text-slate-300 font-mono">
                                    &quot;{issue.flaggedText}&quot;
                                  </div>
                                  <p className="text-sm text-slate-400">
                                    <span className="font-medium text-slate-500">Reasoning:</span> {issue.reasoning}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-start">
                                {issue.status === 'open' ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="whitespace-nowrap"
                                    onClick={() => handleAssign(result.url, issue.id)}
                                  >
                                    <UserPlus className="mr-2 h-3 w-3" />
                                    Assign
                                  </Button>
                                ) : issue.status === 'assigned' ? (
                                  <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-950 px-3 py-1.5 rounded-md border border-white/5">
                                    <User className="h-3 w-3" />
                                    {issue.assignedTo}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Resolved
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      No freshness issues detected based on current context.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




