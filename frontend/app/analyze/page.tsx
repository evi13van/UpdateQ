"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { mockService, DomainContext } from '@/lib/mock-service';
import { toast } from 'react-hot-toast';
import { ArrowRight, History, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AnalyzePage() {
  const router = useRouter();
  const [urls, setUrls] = useState('');
  const [savedContexts, setSavedContexts] = useState<DomainContext[]>([]);
  
  // Form State
  const [description, setDescription] = useState('');
  const [entityTypes, setEntityTypes] = useState('');
  const [stalenessRules, setStalenessRules] = useState('');

  useEffect(() => {
    // Load saved contexts
    const contexts = mockService.getDomainContexts();
    setSavedContexts(contexts);
  }, []);

  const handleLoadContext = (context: DomainContext) => {
    setDescription(context.description);
    setEntityTypes(context.entityTypes);
    setStalenessRules(context.stalenessRules);
    toast.success('Configuration loaded');
  };

  const handleSubmit = async () => {
    // Validation
    const urlList = urls.split('\n').filter(u => u.trim().length > 0);
    if (urlList.length === 0) {
      toast.error('Please enter at least one URL');
      return;
    }
    if (urlList.length > 20) {
      toast.error('Maximum 20 URLs allowed for MVP');
      return;
    }
    if (!description || !entityTypes || !stalenessRules) {
      toast.error('Please complete the domain context configuration');
      return;
    }

    try {
      // Save context
      const context = mockService.saveDomainContext({
        description,
        entityTypes,
        stalenessRules
      });

      // Start Analysis
      const runId = await mockService.startAnalysis(urlList, context);
      
      // Redirect to processing
      router.push(`/analyze/processing/${runId}`);
    } catch (error) {
      toast.error('Failed to start analysis');
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">New Analysis</h1>
        <p className="text-slate-400">Configure your scan settings and submit URLs for freshness checking.</p>
      </div>

      <div className="grid gap-8">
        {/* Step 1: URLs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0">1</Badge>
              Target URLs
            </CardTitle>
            <CardDescription>
              Enter up to 20 URLs to analyze (one per line).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="https://example.com/page-1&#10;https://example.com/page-2"
              className="min-h-[200px] font-mono text-sm"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
            />
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>{urls.split('\n').filter(u => u.trim()).length} / 20 URLs</span>
              <span>One URL per line</span>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Context */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0">2</Badge>
                Domain Context
              </CardTitle>
              <CardDescription>
                Help the AI understand what &quot;stale&quot; means for your content.
              </CardDescription>
            </div>
            
            {savedContexts.length > 0 && (
              <div className="relative group">
                <Button variant="outline" size="sm" className="gap-2">
                  <History className="h-4 w-4" />
                  Load Saved
                </Button>
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-white/10 rounded-lg shadow-xl p-2 hidden group-hover:block z-50">
                  <p className="text-xs text-slate-500 px-2 py-1 mb-1">Recent Configurations</p>
                  {savedContexts.map((ctx) => (
                    <button
                      key={ctx.id}
                      onClick={() => handleLoadContext(ctx)}
                      className="w-full text-left px-2 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-md truncate transition-colors"
                    >
                      {ctx.description}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                What is this content about?
              </label>
              <Input 
                placeholder="e.g., Mortgage rates and home loan guides for US borrowers"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                What specific entities should we check?
              </label>
              <Input 
                placeholder="e.g., Interest rates, loan limits, tax deadlines, product names"
                value={entityTypes}
                onChange={(e) => setEntityTypes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                What makes information stale in this context?
              </label>
              <Textarea 
                placeholder="e.g., Rates older than 1 month, references to 2022 or earlier, expired deadlines"
                value={stalenessRules}
                onChange={(e) => setStalenessRules(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-slate-900/50 border-t border-white/5 p-6">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Save className="h-4 w-4" />
              Configuration will be saved automatically
            </div>
          </CardFooter>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleSubmit} className="w-full md:w-auto shadow-lg shadow-emerald-500/20">
            Start Analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

