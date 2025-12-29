"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, UserPlus } from 'lucide-react';

interface IssueStats {
  unassigned: number;
  assigned: number;
  researched: number;
  resolved: number;
  total: number;
}

interface IssueTriageStatusProps {
  stats: IssueStats;
}

export function IssueTriageStatus({ stats }: IssueTriageStatusProps) {
  const segments = [
    {
      label: 'Unassigned',
      count: stats.unassigned,
      color: 'bg-red-500',
      icon: AlertCircle,
      href: '/assignments?filter=unassigned',
    },
    {
      label: 'Assigned',
      count: stats.assigned,
      color: 'bg-yellow-500',
      icon: UserPlus,
      href: '/assignments?filter=assigned',
    },
    {
      label: 'Researched',
      count: stats.researched,
      color: 'bg-blue-500',
      icon: Clock,
      href: '/assignments?filter=researched',
    },
    {
      label: 'Resolved',
      count: stats.resolved,
      color: 'bg-emerald-500',
      icon: CheckCircle2,
      href: '/assignments?filter=resolved',
    },
  ];

  const getPercentage = (count: number) => {
    return stats.total > 0 ? (count / stats.total) * 100 : 0;
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center justify-between">
          Issue Triage Status
          <Badge variant="outline" className="text-slate-400">
            {stats.total} Total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
          {segments.map((segment, index) => {
            const percentage = getPercentage(segment.count);
            if (percentage === 0) return null;
            return (
              <div
                key={segment.label}
                className={`${segment.color} transition-all duration-300 hover:opacity-80`}
                style={{ width: `${percentage}%` }}
                title={`${segment.label}: ${segment.count}`}
              />
            );
          })}
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          {segments.map((segment) => {
            const Icon = segment.icon;
            const percentage = getPercentage(segment.count);
            
            return (
              <Link key={segment.label} href={segment.href}>
                <div className="group p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer border border-white/5 hover:border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-4 w-4 ${segment.color.replace('bg-', 'text-')}`} />
                    <span className="text-xs text-slate-400">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {segment.count}
                  </div>
                  <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                    {segment.label}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}