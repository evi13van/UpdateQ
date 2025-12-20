"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { mockService, AnalysisRun } from '@/lib/mock-service';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ProcessingPage() {
  const router = useRouter();
  const params = useParams();
  const runId = params.id as string;
  const [status, setStatus] = useState<'processing' | 'mismatch' | 'completed'>('processing');
  const [run, setRun] = useState<AnalysisRun | null>(null);

  useEffect(() => {
    // Poll for status
    const interval = setInterval(() => {
      const currentRun = mockService.getRun(runId);
      if (currentRun) {
        setRun(currentRun);
        
        if (currentRun.status === 'completed') {
          setStatus('completed');
          clearInterval(interval);
        }
      }
    }, 1000);

    // Simulate a "Context Mismatch" event randomly for demo purposes
    // In a real app, this would come from the backend state
    const mismatchTimer = setTimeout(() => {
      if (Math.random() > 0.7) { // 30% chance of mismatch simulation
        setStatus('mismatch');
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(mismatchTimer);
    };
  }, [runId]);

  const handleContinue = () => {
    setStatus('processing');
    // In real app, would send API call to resume
  };

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

        {status === 'mismatch' && (
          <Card className="border-amber-500/20 bg-amber-500/5 animate-in slide-in-from-bottom-5">
            <CardContent className="pt-6 space-y-4">
              <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Context Mismatch Detected</h2>
                <p className="text-slate-300 text-sm">
                  Some pages appear to be about "Automotive Loans" but your context is configured for "Mortgages".
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => router.push('/analyze')}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black" onClick={handleContinue}>
                  Continue Anyway
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
                We found {run?.totalIssues} potential issues across {run?.urlCount} pages.
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
