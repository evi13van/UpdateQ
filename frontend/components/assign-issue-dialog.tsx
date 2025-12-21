"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from 'lucide-react';

interface AssignIssueDialogProps {
  onAssign: (data: { writerName: string; googleDocUrl: string; dueDate: string }) => void;
  trigger?: React.ReactNode;
}

export function AssignIssueDialog({ onAssign, trigger }: AssignIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [writerName, setWriterName] = useState('');
  const [googleDocUrl, setGoogleDocUrl] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign({ writerName, googleDocUrl, dueDate });
    setOpen(false);
    // Reset form
    setWriterName('');
    setGoogleDocUrl('');
    setDueDate('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="whitespace-nowrap">
            <UserPlus className="mr-2 h-3 w-3" />
            Assign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Assign to Writer</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter assignment details to hand off this issue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="writer" className="text-slate-200">Writer Name</Label>
            <Input
              id="writer"
              value={writerName}
              onChange={(e) => setWriterName(e.target.value)}
              placeholder="e.g. Sarah Writer"
              className="col-span-3"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doc" className="text-slate-200">Google Doc URL</Label>
            <Input
              id="doc"
              value={googleDocUrl}
              onChange={(e) => setGoogleDocUrl(e.target.value)}
              placeholder="https://docs.google.com/..."
              className="col-span-3"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date" className="text-slate-200">Due Date</Label>
            <Input
              id="date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white">Assign Issue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
