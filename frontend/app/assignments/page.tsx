"use client";

import React, { useEffect, useState } from 'react';
import { mockService, Issue } from '@/lib/mock-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Clock, Filter, Search, User, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface ExtendedIssue {
  runId: string;
  url: string;
  pageTitle: string;
  issue: Issue;
}

export default function AssignmentsPage() {
  const [issues, setIssues] = useState<ExtendedIssue[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'completed'>('assigned');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = () => {
    const allIssues = mockService.getAllIssues();
    // Filter to show only assigned or completed issues (exclude 'open' ones from this view usually, or show all)
    // For this view, let's show assigned and completed primarily, as "Assignments" implies handoff has happened.
    const trackedIssues = allIssues.filter(i => i.issue.status && i.issue.status !== 'open');
    setIssues(trackedIssues);
  };

  const handleStatusUpdate = (runId: string, url: string, issueId: string, newStatus: 'completed' | 'assigned') => {
    mockService.updateIssue(runId, url, issueId, { status: newStatus });
    loadIssues();
    toast.success(`Issue marked as ${newStatus}`);
  };

  const filteredIssues = issues.filter(item => {
    const matchesStatus = filterStatus === 'all' ? true : item.issue.status === filterStatus;
    const matchesSearch = 
      item.pageTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.issue.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Writer Assignments</h1>
          <p className="text-slate-400">Track progress of content updates handed off to your team.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={filterStatus === 'assigned' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('assigned')}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            In Progress
          </Button>
          <Button 
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('completed')}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Completed
          </Button>
          <Button 
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
          >
            All
          </Button>
        </div>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input 
          placeholder="Search by title, writer, or issue..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredIssues.length === 0 ? (
        <Card className="border-dashed border-white/10 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <ClipboardListIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No assignments found</h3>
            <p className="text-slate-400 mb-6 max-w-sm">
              Assign issues to writers from the Analysis Results page to track them here.
            </p>
            <Link href="/history">
              <Button variant="outline">Go to History</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredIssues.map((item) => (
            <Card key={item.issue.id} className="bg-slate-900/50 border-white/10 hover:bg-white/5 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-white mb-1">{item.pageTitle}</h3>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1">
                          {item.url} <ArrowRight className="h-3 w-3" />
                        </a>
                      </div>
                      <Badge variant={item.issue.status === 'completed' ? 'default' : 'warning'}>
                        {item.issue.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-lg border border-white/5">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-400 mb-1">{item.issue.description}</p>
                          <p className="text-sm text-slate-300 mb-2">"{item.issue.flaggedText}"</p>
                          <p className="text-xs text-slate-500">Reasoning: {item.issue.reasoning}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between min-w-[200px] border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <User className="h-4 w-4 text-emerald-400" />
                        <span className="font-medium">{item.issue.assignedTo || 'Unassigned'}</span>
                      </div>
                      {item.issue.assignedAt && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          Assigned {formatDistanceToNow(item.issue.assignedAt, { addSuffix: true })}
                        </div>
                      )}
                    </div>

                    {item.issue.status !== 'completed' && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleStatusUpdate(item.runId, item.url, item.issue.id, 'completed')}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Complete
                      </Button>
                    )}
                    
                    {item.issue.status === 'completed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full text-slate-400"
                        onClick={() => handleStatusUpdate(item.runId, item.url, item.issue.id, 'assigned')}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
      <path d="M9 8h6" />
    </svg>
  )
}

