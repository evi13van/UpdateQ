"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit2 } from 'lucide-react';
import { apiService } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface EditWriterDialogProps {
  writer: {
    id: string;
    name: string;
    email: string;
  };
  onWriterUpdated?: () => void;
  trigger?: React.ReactNode;
}

export function EditWriterDialog({ writer, onWriterUpdated, trigger }: EditWriterDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(writer.name);
  const [email, setEmail] = useState(writer.email);

  // Reset form when dialog opens or writer changes
  useEffect(() => {
    if (open) {
      setName(writer.name);
      setEmail(writer.email);
    }
  }, [open, writer]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Check if anything changed
    if (name === writer.name && email === writer.email) {
      toast.error('No changes to save');
      return;
    }

    try {
      await apiService.updateWriter(writer.id, { name, email });
      toast.success('Writer updated successfully');
      setOpen(false);
      if (onWriterUpdated) onWriterUpdated();
    } catch (error) {
      toast.error('Failed to update writer');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Edit Writer</DialogTitle>
          <DialogDescription className="text-slate-400">
            Update writer information for your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name" className="text-slate-200">Full Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Smith"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-email" className="text-slate-200">Email Address</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}