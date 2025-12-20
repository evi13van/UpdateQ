"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { mockService, AnalysisRun } from '@/lib/mock-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Calendar, FileText, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function HistoryPage() {
  const [runs, setRuns] = useState<AnalysisRun[]>([]);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = () => {
    const allRuns = mockService.getAllRuns();
    setRuns(allRuns);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this analysis run?')) {
      mockService.deleteRun(id);
      loadRuns();
      toast.success('Analysis deleted');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Analysis History</h1>
          <p className="text-slate-400">View and manage your past content audits.</p>
        </div>
      </div>

      {runs.length === 0 ? (
        <Card className="border-dashed border-white/10 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <History className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No history yet</h3>
            <p className="text-slate-400 mb-6 max-w-sm">
              Your past analysis runs will appear here. Start your first scan to get started.
            </p>
            <Link href="/analyze">
              <Button>New Review</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {runs.map((run) => (
            <Link key={run.id} href={`/results/${run.id}`}>
              <Card className="hover:bg-white/5 transition-colors cursor-pointer group border-white/5">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-white group-hover:text-emerald-400 transition-colors">
                          {run.domainContext.description || "Untitled Analysis"}
                        </h3>
                        <Badge variant={run.status === 'completed' ? 'default' : 'secondary'}>
                          {run.status}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(run.timestamp, { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {run.urlCount} URLs
                        </span>
                        <span className="text-emerald-400 font-medium">
                          {run.totalIssues} Issues Found
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        onClick={(e) => handleDelete(run.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}





