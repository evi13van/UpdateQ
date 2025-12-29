"use client";

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, Shield, ExternalLink, Calendar } from 'lucide-react';
import { SuggestedSource } from '@/lib/api';

interface ResearchDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issueDescription: string;
  sources: SuggestedSource[];
  isLoading: boolean;
  onRefineSearch: (query: string) => void;
  onSaveSources: (selectedSources: SuggestedSource[]) => void;
}

export function ResearchDrawer({
  open,
  onOpenChange,
  issueDescription,
  sources,
  isLoading,
  onRefineSearch,
  onSaveSources,
}: ResearchDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());

  const handleToggleSource = (url: string) => {
    const newSelected = new Set(selectedSources);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedSources(newSelected);
  };

  const handleSave = () => {
    const sourcesToSave = sources
      .filter(source => selectedSources.has(source.url))
      .map(source => ({ ...source, isAccepted: true }));
    
    onSaveSources(sourcesToSave);
    onOpenChange(false);
  };

  const getTrustBadgeColor = (domain?: string, confidence?: string) => {
    if (!domain) return 'bg-slate-500/20 text-slate-400';
    
    // High trust domains
    if (domain.endsWith('.gov') || domain.endsWith('.edu')) {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
    
    // Medium trust based on confidence
    if (confidence === 'High') {
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
    
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const getTrustIcon = (domain?: string) => {
    if (domain?.endsWith('.gov') || domain?.endsWith('.edu')) {
      return <Shield className="h-3 w-3" />;
    }
    return null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl bg-slate-900 border-white/10 flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-white">Suggested Sources</SheetTitle>
          <SheetDescription className="text-slate-400">
            For: {issueDescription.substring(0, 80)}
            {issueDescription.length > 80 && '...'}
          </SheetDescription>
        </SheetHeader>

        {/* Search Refinement */}
        <div className="mt-6 space-y-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Refine search query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  onRefineSearch(searchQuery);
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={() => searchQuery.trim() && onRefineSearch(searchQuery)}
              disabled={isLoading || !searchQuery.trim()}
              variant="outline"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                <p className="text-sm text-slate-400">Researching authoritative sources...</p>
              </div>
            </div>
          )}

        </div>

        {/* Sources List - Flexible height container */}
        <div className="flex-1 overflow-hidden mt-4">
          {!isLoading && sources.length > 0 && (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-4">
                {sources.map((source, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedSources.has(source.url)
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-white/10 bg-slate-950/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedSources.has(source.url)}
                        onCheckedChange={() => handleToggleSource(source.url)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        {/* Header with domain badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {source.domain && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${getTrustBadgeColor(source.domain, source.confidence)}`}
                              >
                                {getTrustIcon(source.domain)}
                                <span className="ml-1">{source.domain}</span>
                              </Badge>
                            )}
                            {source.publicationDate && (
                              <Badge variant="outline" className="text-xs text-slate-400 border-slate-500/30">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(source.publicationDate).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-white hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                        >
                          {source.title}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>

                        {/* Snippet */}
                        {source.snippet && (
                          <p className="text-sm text-slate-400 italic border-l-2 border-slate-700 pl-3">
                            &quot;{source.snippet}&quot;
                          </p>
                        )}

                        {/* URL */}
                        <p className="text-xs text-slate-500 truncate">{source.url}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Empty State */}
          {!isLoading && sources.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p>No sources found. Try refining your search query.</p>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <SheetFooter className="mt-6 flex-shrink-0 border-t border-white/10 pt-4">
          <Button
            onClick={handleSave}
            disabled={selectedSources.size === 0}
            className="w-full shadow-lg shadow-emerald-500/20"
          >
            Attach {selectedSources.size} Source{selectedSources.size !== 1 ? 's' : ''}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}