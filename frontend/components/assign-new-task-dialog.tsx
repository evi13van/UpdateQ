"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from 'lucide-react';
import { mockService, Writer } from '@/lib/mock-service';
import { toast } from 'react-hot-toast';

interface AssignNewTaskDialogProps {
  onAssign?: () => void;
  trigger?: React.ReactNode;
}

export function AssignNewTaskDialog({ onAssign, trigger }: AssignNewTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [selectedWriterId, setSelectedWriterId] = useState('');
  const [googleDocUrl, setGoogleDocUrl] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (open) {
      const loadedWriters = mockService.getWriters();
      setWriters(loadedWriters);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const writer = writers.find(w => w.id === selectedWriterId);
    if (!writer) {
      toast.error('Please select a writer');
      return;
    }

    // Simulate sending email
    console.log(`
      To: ${writer.email}
      Subject: New Assignment: ${taskTitle}
      
      Salutation ${writer.name},

      I am assigning this update to you. This is due ${dueDate}.

      The link to Google doc with issues list: ${googleDocUrl}

      Thanks,
      Maria
    `);
    
    // Create the task in the mock service
    mockService.createManualTask({
      title: taskTitle,
      writerId: writer.id,
      writerName: writer.name,
      googleDocUrl: googleDocUrl,
      dueDate: new Date(dueDate).getTime()
    });
    
    toast.success(`Task assigned to ${writer.name}`);
    setOpen(false);
    
    // Reset form
    setSelectedWriterId('');
    setGoogleDocUrl('');
    setTaskTitle('');
    setDueDate('');
    
    if (onAssign) onAssign();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-4 w-4" />
            Assign New Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Assign New Task</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new assignment for a writer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-slate-200">Task Title</Label>
            <Input
              id="title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Update Q1 Mortgage Rates"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="writer" className="text-slate-200">Assign To</Label>
            <select
              id="writer"
              value={selectedWriterId}
              onChange={(e) => setSelectedWriterId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm transition-all"
              required
            >
              <option value="" disabled>Select a writer...</option>
              {writers.map((writer) => (
                <option key={writer.id} value={writer.id}>
                  {writer.name} ({writer.email})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doc" className="text-slate-200">Google Doc URL</Label>
            <Input
              id="doc"
              value={googleDocUrl}
              onChange={(e) => setGoogleDocUrl(e.target.value)}
              placeholder="https://docs.google.com/..."
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date" className="text-slate-200">Due Date</Label>
            <Input
              id="date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white">Assign Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

