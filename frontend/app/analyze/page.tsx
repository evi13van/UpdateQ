"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiService, DomainContext, AnalysisRun } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ArrowRight, Loader2, History, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnalysisHistorySidebar } from '@/components/analysis-history-sidebar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyzePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Core form state
  const [urls, setUrls] = useState('');
  const [description, setDescription] = useState('');
  const [entityTypes, setEntityTypes] = useState('');
  const [stalenessRules, setStalenessRules] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [contextSource, setContextSource] = useState<string>(''); // Tracks which profile/run was loaded
  const [isModified, setIsModified] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  
  // Data
  const [savedContexts, setSavedContexts] = useState<DomainContext[]>([]);
  const [historyRuns, setHistoryRuns] = useState<AnalysisRun[]>([]);
  
  // Smart Combobox state
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    // Check authentication
    if (!apiService.isAuthenticated()) {
      toast.error('Please log in to continue');
      router.push('/login');
      return;
    }

    // Load saved contexts
    const contexts = apiService.getDomainContexts();
    setSavedContexts(contexts);

    // Load history
    loadHistoryRuns();

    // Only auto-load if coming from a specific source (e.g., history sidebar)
    const sourceId = searchParams.get('source_id');
    if (sourceId) {
      hydrateFromHistory(sourceId);
    }
    // Otherwise, leave context fields blank for new review
  }, [router, searchParams]);

  const loadHistoryRuns = async () => {
    setIsLoadingHistory(true);
    try {
      const runs = await apiService.getAllAnalysisRuns();
      setHistoryRuns(runs);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const hydrateFromHistory = async (runId: string) => {
    try {
      const run = await apiService.getAnalysisRun(runId);
      
      // Flash effect for visual feedback
      setFlashEffect(true);
      setTimeout(() => setFlashEffect(false), 600);
      
      // Load URLs
      const urlString = run.results.map((r: any) => r.url).join('\n');
      setUrls(urlString);
      
      // Load context
      setDescription(run.domainContext.description);
      setEntityTypes(run.domainContext.entityTypes);
      setStalenessRules(run.domainContext.stalenessRules);
      setContextSource(`From run: ${new Date(run.timestamp).toLocaleDateString()}`);
      setIsModified(false);
      
      toast.success('Configuration loaded from history');
    } catch (error) {
      toast.error('Failed to load previous analysis');
      console.error(error);
    }
  };

  const handleReuseFromSidebar = (run: AnalysisRun) => {
    hydrateFromHistory(run.id);
  };

  const handleDeleteRun = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this analysis run?')) {
      try {
        await apiService.deleteAnalysisRun(id);
        await loadHistoryRuns();
        toast.success('Analysis deleted');
      } catch (error) {
        toast.error('Failed to delete analysis');
        console.error(error);
      }
    }
  };

  const handleContextSelect = (contextId: string) => {
    const context = savedContexts.find(c => c.id === contextId);
    if (context) {
      setDescription(context.description);
      setEntityTypes(context.entityTypes);
      setStalenessRules(context.stalenessRules);
      setContextSource(`Saved: ${context.description}`);
      setIsModified(false);
      setOpen(false);
      toast.success('Profile loaded');
    }
  };

  const handleFieldChange = (field: 'description' | 'entityTypes' | 'stalenessRules', value: string) => {
    if (field === 'description') setDescription(value);
    if (field === 'entityTypes') setEntityTypes(value);
    if (field === 'stalenessRules') setStalenessRules(value);
    
    // Mark as modified if there was a source
    if (contextSource && !isModified) {
      setIsModified(true);
    }
  };

  const handleSubmit = async () => {
    // Validation
    const urlList = urls.split('\n').filter(u => u.trim().length > 0);
    if (urlList.length === 0) {
      toast.error('Please enter at least one URL');
      return;
    }
    if (urlList.length > 20) {
      toast.error('Maximum 20 URLs allowed');
      return;
    }
    if (!description || !entityTypes || !stalenessRules) {
      toast.error('Please complete the analysis configuration');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save context
      apiService.saveDomainContext({
        description,
        entityTypes,
        stalenessRules
      });

      // Start analysis
      const response = await apiService.startAnalysis(urlList, {
        description,
        entityTypes,
        stalenessRules
      });
      
      toast.success('Analysis started!');
      router.push(`/analyze/processing/${response.runId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start analysis');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const urlCount = urls.split('\n').filter(u => u.trim()).length;
  const isValid = urlCount > 0 && urlCount <= 20 && description && entityTypes && stalenessRules;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">New Analysis</h1>
        <p className="text-slate-400">
          Enter your content URLs and configure how we should analyze them.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stage - Left Column (70%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Target Content (The Subject) - PROMOTED TO TOP */}
          <Card className={cn(
            "border-emerald-500/20 transition-all duration-300",
            flashEffect && "ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20"
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0">1</Badge>
                Target Content
              </CardTitle>
              <CardDescription>
                Enter the URLs you want to analyze (one per line, max 20)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="https://example.com/page-1&#10;https://example.com/page-2&#10;https://example.com/page-3"
                className="min-h-[200px] font-mono text-sm"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center text-xs">
                <span className={cn(
                  "text-slate-500",
                  urlCount > 20 && "text-red-400 font-medium"
                )}>
                  {urlCount} / 20 URLs
                </span>
                <span className="text-slate-500">One URL per line</span>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Analysis Configuration (The Lens) */}
          <Card className={cn(
            "transition-all duration-300",
            flashEffect && "ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20"
          )}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center p-0">2</Badge>
                <CardTitle>Analysis Configuration</CardTitle>
              </div>
              <CardDescription>
                Define how content should be analyzed for staleness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Smart Combobox for Profile Selection */}
              <div className="space-y-2">
                <Label htmlFor="profile-select" className="flex items-center gap-2">
                  Load Saved Profile
                  {contextSource && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {isModified ? `Modified from: ${contextSource}` : contextSource}
                    </Badge>
                  )}
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      <span className="truncate">
                        {contextSource || "Select a saved profile..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search profiles..." 
                        value={searchValue}
                        onValueChange={setSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>No saved profiles found.</CommandEmpty>
                        <CommandGroup heading="Saved Profiles">
                          {savedContexts.map((ctx) => (
                            <CommandItem
                              key={ctx.id}
                              value={ctx.description}
                              onSelect={() => handleContextSelect(ctx.id || '')}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  contextSource === `Saved: ${ctx.description}` ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{ctx.description}</div>
                                <div className="text-xs text-slate-400 truncate">
                                  {ctx.entityTypes}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Editable Configuration Fields */}
              <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-white/5">
                <div className="space-y-2">
                  <Label htmlFor="description">What is this content about?</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Mortgage rates and home loan guides for US borrowers"
                    value={description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entityTypes">What specific entities should we check?</Label>
                  <Input
                    id="entityTypes"
                    placeholder="e.g., Interest rates, loan limits, tax deadlines, product names"
                    value={entityTypes}
                    onChange={(e) => handleFieldChange('entityTypes', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stalenessRules">What makes information stale?</Label>
                  <span className="text-xs text-muted-foreground">Use natural language rules (e.g., 'older than 5 years')</span>
                  <Textarea
                    id="stalenessRules"
                    placeholder="Example: Content older than 6 months, or references to pre-2024 data."
                    value={stalenessRules}
                    onChange={(e) => handleFieldChange('stalenessRules', e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>
              </div>

              {isModified && (
                <Alert className="border-amber-500/20 bg-amber-500/10">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <AlertDescription className="text-slate-300">
                    Configuration modified. It will be saved as a new profile when you start the analysis.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="w-full md:w-auto shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  Start Analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Recent Activity Sidebar - Right Column (30%) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <AnalysisHistorySidebar
              runs={historyRuns}
              isLoading={isLoadingHistory}
              onReuse={handleReuseFromSidebar}
              onDelete={handleDeleteRun}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
