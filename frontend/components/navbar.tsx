"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, PlusCircle, History, Settings, LogOut, Menu, X, ClipboardList } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check for auth state using token
  useEffect(() => {
    const token = localStorage.getItem('updateq_token');
    setIsLoggedIn(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('updateq_user');
    router.push('/login');
  };

  if (pathname === '/login' || pathname === '/register') return null;

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'New Review', href: '/analyze', icon: PlusCircle },
    { name: 'Assignments', href: '/assignments', icon: ClipboardList },
    { name: 'History', href: '/history', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden sm:inline-block">
                UpdateQ
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {isLoggedIn ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-emerald-400",
                      pathname === item.href ? "text-emerald-400" : "text-slate-400"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
                <div className="h-6 w-px bg-white/10 mx-2" />
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-red-400">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex gap-4">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950 p-4 space-y-4 animate-in slide-in-from-top-5">
          {isLoggedIn ? (
            <>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href 
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : "text-slate-400 hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Login</Button>
              </Link>
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;


