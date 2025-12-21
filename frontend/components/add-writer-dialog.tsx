"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from 'lucide-react';
import { mockService } from '@/lib/mock-service';
import { toast } from 'react-hot-toast';

interface AddWriterDialogProps {
  onWriterAdded?: () => void;
  trigger?: React.ReactNode;
}

export function AddWriterDialog({ onWriterAdded, trigger }: AddWriterDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Please fill in all fields');
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    mockService.addWriter(name, email);
    toast.success('Writer added successfully');
    setOpen(false);
    setName('');
    setEmail('');
    if (onWriterAdded) onWriterAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 shadow-lg shadow-emerald-500/20">
            <UserPlus className="h-4 w-4" />
            Add Writer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Add New Writer</DialogTitle>
          <DialogDescription className="text-slate-400">
            Add a writer to your team to assign them content updates.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-slate-200">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Smith"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-slate-200">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white">Save Writer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
