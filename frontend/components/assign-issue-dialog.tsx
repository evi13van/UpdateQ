import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from 'lucide-react';
import { mockService, Writer } from '@/lib/mock-service';
import { toast } from 'react-hot-toast';

interface AssignIssueDialogProps {
  onAssign: (data: { writerName: string; googleDocUrl: string; dueDate: string }) => void;
  trigger?: React.ReactNode;
  defaultValues?: {
    writerName?: string;
    googleDocUrl?: string;
    dueDate?: number;
  };
  title?: string;
  confirmLabel?: string;
}

export function AssignIssueDialog({ onAssign, trigger, defaultValues, title = "Assign to Writer", confirmLabel = "Assign Issue" }: AssignIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [selectedWriterId, setSelectedWriterId] = useState('');
  const [googleDocUrl, setGoogleDocUrl] = useState(defaultValues?.googleDocUrl || '');
  
  // Convert timestamp to YYYY-MM-DD for date input
  const formatDateForInput = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState(formatDateForInput(defaultValues?.dueDate));

  useEffect(() => {
    if (open) {
      const loadedWriters = mockService.getWriters();
      setWriters(loadedWriters);
      
      // If editing, try to find the writer ID by name (since we stored name previously)
      // In a real app, we'd store ID. For now, we match by name or default to empty.
      if (defaultValues?.writerName) {
        const writer = loadedWriters.find(w => w.name === defaultValues.writerName);
        if (writer) setSelectedWriterId(writer.id);
      }
    }
  }, [open, defaultValues]);

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
      Subject: Assignment: Content Update Required
      
      Salutation ${writer.name},

      I am assigning this update to you. This is due ${dueDate}.

      The link to Google doc with issues list: ${googleDocUrl}

      Thanks,
      Maria
    `);
    toast.success(`Email sent to ${writer.email}`);

    onAssign({ writerName: writer.name, googleDocUrl, dueDate });
    setOpen(false);
    
    if (!defaultValues) {
      setSelectedWriterId('');
      setGoogleDocUrl('');
      setDueDate('');
    }
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {defaultValues ? 'Update assignment details.' : 'Enter assignment details to hand off this issue.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
              className="col-span-3"
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
              className="col-span-3"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white">{confirmLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



