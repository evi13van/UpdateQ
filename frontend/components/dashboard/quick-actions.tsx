"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, UserPlus, PlusCircle, FileText } from 'lucide-react';
import { AssignNewTaskDialog } from '@/components/assign-new-task-dialog';

export function QuickActions() {
  const actions = [
    {
      label: 'New Review',
      description: 'Start content analysis',
      icon: Zap,
      href: '/analyze',
      variant: 'default' as const,
      className: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
    },
    {
      label: 'View History',
      description: 'Browse past analyses',
      icon: FileText,
      href: '/history',
      variant: 'outline' as const,
    },
    {
      label: 'Manage Team',
      description: 'Add or edit writers',
      icon: PlusCircle,
      href: '/settings',
      variant: 'outline' as const,
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            const content = (
              <Button
                variant={action.variant}
                className={`w-full h-auto flex flex-col items-center justify-center p-4 ${action.className || ''}`}
              >
                <Icon className="h-6 w-6 mb-2" />
                <span className="font-medium text-sm">{action.label}</span>
                <span className="text-xs opacity-70 mt-1">
                  {action.description}
                </span>
              </Button>
            );

            if (action.href) {
              return (
                <Link key={action.label} href={action.href}>
                  {content}
                </Link>
              );
            }

            return <div key={action.label}>{content}</div>;
          })}
          
          {/* Assign Task with Dialog */}
          <AssignNewTaskDialog
            trigger={
              <Button
                variant="outline"
                className="w-full h-auto flex flex-col items-center justify-center p-4"
              >
                <UserPlus className="h-6 w-6 mb-2" />
                <span className="font-medium text-sm">Assign Task</span>
                <span className="text-xs opacity-70 mt-1">
                  Create manual assignment
                </span>
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}