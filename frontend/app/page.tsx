"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, FileText, ShieldCheck, Zap } from 'lucide-react';
import { mockService, AnalysisRun } from '@/lib/mock-service';
import { formatDistanceToNow } from 'date-fns';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [recentRuns, setRecentRuns] = useState<AnalysisRun[]>([]);

  useEffect(() => {
    const user = mockService.getCurrentUser();
    if (user) {
      setIsLoggedIn(true);
      const runs = mockService.getAllRuns();
      setRecentRuns(runs.slice(0, 3)); // Get top 3
    }
  }, []);

  if (isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">Welcome back. Ready to check your content freshness?</p>
          </div>
          <Link href="/analyze">
            <Button size="lg" className="shadow-lg shadow-emerald-500/20">
              <Zap className="mr-2 h-4 w-4" />
              Start New Analysis
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Analyses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{recentRuns.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Pages Scanned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {recentRuns.reduce((acc, run) => acc + run.urlCount, 0)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Issues Found</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">
                {recentRuns.reduce((acc, run) => acc + run.totalIssues, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <Link href="/history">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          {recentRuns.length > 0 ? (
            <div className="grid gap-4">
              {recentRuns.map((run) => (
                <Link key={run.id} href={`/results/${run.id}`}>
                  <Card className="hover:bg-white/5 transition-colors cursor-pointer group border-white/5">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            {run.domainContext.description || "Untitled Analysis"}
                          </h3>
                          <Badge variant={run.status === 'completed' ? 'default' : 'secondary'}>
                            {run.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">
                          {run.urlCount} URLs • {run.totalIssues} Issues Found
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-slate-400">
                        <span className="text-sm flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(run.timestamp, { addSuffix: true })}
                        </span>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-white/10 bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No analyses yet</h3>
                <p className="text-slate-400 mb-6 max-w-sm">
                  Start your first content freshness analysis to see results here.
                </p>
                <Link href="/analyze">
                  <Button>Start Analysis</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Landing Page View
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="px-4 py-1.5 text-sm border-emerald-500/30 text-emerald-400 bg-emerald-500/10 backdrop-blur-md">
              NEW: AI-powered content reviews
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
              Find what&apos;s outdated. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-500">
                Fix what matters.
              </span>
            </h1>
            
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Content goes out of date. UpdateQ finds where. You tell it what to watch for — that could be rates, statistics, source citations, recommendations, or anything specific to your content — and it scans your pages for information that may no longer be accurate. You get a prioritized list of what needs attention first.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg shadow-xl shadow-emerald-500/20">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg">
                  Live Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-900/50 backdrop-blur-sm border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <CardTitle>Factual Decay Detection</CardTitle>
                <CardDescription className="text-slate-400">
                  AI analyzes your content against current facts to identify outdated statistics, rates, and claims.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle>Smart Prioritization</CardTitle>
                <CardDescription className="text-slate-400">
                  Don&apos;t guess what to update. See exactly which pages have the most issues and start there.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-purple-400" />
                </div>
                <CardTitle>Writer-Ready Exports</CardTitle>
                <CardDescription className="text-slate-400">
                  Export clean, actionable issue lists directly to CSV for immediate handoff to your content team.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}




