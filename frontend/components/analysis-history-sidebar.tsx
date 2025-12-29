"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalysisRun } from '@/lib/api';
import { Calendar, FileText, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface AnalysisHistorySidebarProps {
  runs: AnalysisRun[];
  isLoading: boolean;
  onReuse: (run: AnalysisRun) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function AnalysisHistorySidebar({ 
  runs, 
  isLoading, 
  onReuse, 
  onDelete 
}: AnalysisHistorySidebarProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Loading history...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (runs.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your analysis history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">
              No history yet. Your past runs will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Click to reuse configuration</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-3">
            {runs.slice(0, 10).map((run) => (
              <div
                key={run.id}
                className="group relative p-3 rounded-lg border border-white/5 hover:bg-white/5 hover:border-emerald-500/30 transition-all cursor-pointer"
                onClick={() => onReuse(run)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm text-white line-clamp-2 flex-1">
                      {run.domainContext.description || "Untitled Analysis"}
                    </h4>
                    <Badge 
                      variant={run.status === 'completed' ? 'default' : 'secondary'}
                      className="flex-shrink-0 text-xs"
                    >
                      {run.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(run.timestamp, { addSuffix: true })}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {run.urlCount} URLs
                    </span>
                    <span className="text-emerald-400 font-medium">
                      {run.totalIssues} Issues
                    </span>
                  </div>
                </div>

                {/* Action buttons - shown on hover */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Link href={`/results/${run.id}`} onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                      title="View results"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-emerald-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReuse(run);
                    }}
                    title="Reuse configuration"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(run.id, e);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}