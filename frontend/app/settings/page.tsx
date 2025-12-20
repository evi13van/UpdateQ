"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockService, User } from '@/lib/mock-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = mockService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    mockService.logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-emerald-400" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Manage your account details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Email Address</label>
              <Input value={user.email} disabled className="bg-slate-950/50" />
              <p className="text-xs text-slate-500">Email cannot be changed in this demo.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Display Name</label>
              <Input value={user.name} disabled className="bg-slate-950/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your password and session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button 
              variant="destructive" 
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

