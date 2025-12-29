"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ExternalLink, TrendingUp, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ResearchedIssue {
  runId: string;
  issueId: string;
  url: string;
  pageTitle: string;
  description: string;
  sourceCount: number;
  timestamp: number;
  confidence?: string;
}

interface RecentResearchPulseProps {
  researchedIssues: ResearchedIssue[];
}

export function RecentResearchPulse({ researchedIssues }: RecentResearchPulseProps) {
  const topIssues = researchedIssues.slice(0, 5);

  const getConfidenceBadge = (confidence?: string) => {
    if (!confidence) return null;
    
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
      high: { variant: 'default', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      medium: { variant: 'secondary', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      low: { variant: 'outline', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    };

    const config = variants[confidence.toLowerCase()] || variants.medium;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {confidence} confidence
      </Badge>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Recent Research Pulse
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topIssues.length > 0 ? (
          <div className="space-y-3">
            {topIssues.map((issue) => (
              <Link
                key={`${issue.runId}-${issue.issueId}`}
                href={`/results/${issue.runId}?highlight=${issue.issueId}`}
              >
                <div className="group p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all border border-white/5 hover:border-purple-500/30 cursor-pointer">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white group-hover:text-purple-400 transition-colors truncate mb-1">
                        {issue.description}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{issue.pageTitle}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 mt-3">
                    <div className="flex items-center gap-2">
                      {getConfidenceBadge(issue.confidence)}
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {issue.sourceCount} sources
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(issue.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            
            <Link href="/history" className="block">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-400 hover:text-purple-400"
              >
                View All Research
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-2">No research completed yet</p>
            <p className="text-xs text-slate-500">
              AI research will appear here once you analyze issues
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}