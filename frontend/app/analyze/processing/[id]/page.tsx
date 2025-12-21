"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiService } from '@/lib/api';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

interface AnalysisRun {
  id: string;
  status: string;
  urlCount: number;
  totalIssues: number;
  results?: any[];
}

export default function ProcessingPage() {
  const router = useRouter();
  const params = useParams();
  const runId = params.id as string;
  const [status, setStatus] = useState<'processing' | 'completed' | 'error'>('processing');
  const [run, setRun] = useState<AnalysisRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!apiService.isAuthenticated()) {
      toast.error('Please log in to continue');
      router.push('/login');
      return;
    }

    // Poll for status
    const pollStatus = async () => {
      try {
        const currentRun = await apiService.getAnalysisRun(runId);
        setRun(currentRun);
        
        if (currentRun.status === 'completed') {
          setStatus('completed');
        } else if (currentRun.status === 'failed') {
          setStatus('error');
          setError('Analysis failed. Please try again.');
        }
      } catch (err) {
        console.error('Error fetching analysis run:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to fetch analysis status');
      }
    };

    // Initial fetch
    pollStatus();

    // Poll every 2 seconds
    const interval = setInterval(pollStatus, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [runId, router]);

  const handleViewResults = () => {
    router.push(`/results/${runId}`);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" />

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        {status === 'processing' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Analyzing Content...</h2>
              <p className="text-slate-400">
                Extracting content, checking against domain context, and identifying stale claims.
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <Card className="border-red-500/20 bg-red-500/5 animate-in slide-in-from-bottom-5">
            <CardContent className="pt-6 space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
                <p className="text-slate-300 text-sm">
                  {error || 'An error occurred during analysis. Please try again.'}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => router.push('/analyze')}>
                  Start New Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {status === 'completed' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="mx-auto w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Analysis Complete</h2>
              <p className="text-slate-400 mb-6">
                We found {run?.totalIssues || 0} potential issues across {run?.urlCount || 0} pages.
              </p>
              <Button size="lg" onClick={handleViewResults} className="shadow-lg shadow-emerald-500/20">
                View Results
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

