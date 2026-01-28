'use client';

import { signOutFormAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, MessageSquare, LogOut, Upload } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface DashboardNavProps {
  user: User;
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Documents', icon: FileText },
    { href: '/dashboard/upload', label: 'Upload', icon: Upload },
    { href: '/dashboard/chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <nav className="border-b bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">AuditLens</span>
          </Link>
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarFallback>
              {user.email?.[0].toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <form action={signOutFormAction}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </nav>
  );
}