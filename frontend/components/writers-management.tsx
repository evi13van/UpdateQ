"use client";

import React, { useEffect, useState } from 'react';
import { apiService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { User, Mail, Search, Trash2, UserPlus, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AddWriterDialog } from '@/components/add-writer-dialog';
import { EditWriterDialog } from '@/components/edit-writer-dialog';

interface Writer {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export function WritersManagement() {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWriters();
  }, []);

  const loadWriters = async () => {
    setIsLoading(true);
    try {
      const loadedWriters = await apiService.getWriters();
      setWriters(loadedWriters);
    } catch (error) {
      toast.error('Failed to load writers');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWriters = writers.filter(writer =>
    writer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    writer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Writers</h2>
          <p className="text-slate-400">Manage your content writing team</p>
        </div>
        <AddWriterDialog onWriterAdded={loadWriters} />
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input 
          placeholder="Search writers by name or email..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Card className="border-dashed border-white/10 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-slate-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Loading writers...</h3>
          </CardContent>
        </Card>
      ) : filteredWriters.length === 0 ? (
        <Card className="border-dashed border-white/10 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              {searchTerm ? 'No writers found' : 'No writers yet'}
            </h3>
            <p className="text-slate-400 mb-6 max-w-sm">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Add writers to your team to start assigning content updates'
              }
            </p>
            {!searchTerm && <AddWriterDialog onWriterAdded={loadWriters} />}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWriters.map((writer) => (
            <Card key={writer.id} className="bg-slate-900/50 border-white/10 hover:bg-white/5 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">{writer.name}</CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditWriterDialog writer={writer} onWriterUpdated={loadWriters} />
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{writer.email}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredWriters.length > 0 && (
        <div className="text-center text-sm text-slate-500">
          Showing {filteredWriters.length} of {writers.length} writer{writers.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}