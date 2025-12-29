"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowRight } from 'lucide-react';

interface WriterWorkload {
  id: string;
  name: string;
  email: string;
  activeTasks: number;
  completedTasks: number;
}

interface TeamWorkloadProps {
  writers: WriterWorkload[];
}

export function TeamWorkload({ writers }: TeamWorkloadProps) {
  const totalActiveTasks = writers.reduce((sum, w) => sum + w.activeTasks, 0);
  const sortedWriters = [...writers].sort((a, b) => b.activeTasks - a.activeTasks);
  const topWriters = sortedWriters.slice(0, 5);

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            Team Workload
          </div>
          <Badge variant="outline" className="text-slate-400">
            {totalActiveTasks} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topWriters.length > 0 ? (
          <>
            <div className="space-y-2">
              {topWriters.map((writer) => (
                <div
                  key={writer.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {writer.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {writer.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-400">
                        {writer.activeTasks}
                      </div>
                      <div className="text-xs text-slate-400">active</div>
                    </div>
                    {writer.completedTasks > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-400">
                          {writer.completedTasks}
                        </div>
                        <div className="text-xs text-slate-500">done</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Link href="/settings" className="block">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-400 hover:text-emerald-400"
              >
                Manage Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-4">No writers added yet</p>
            <Link href="/settings">
              <Button size="sm" variant="outline">
                Add Writers
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}