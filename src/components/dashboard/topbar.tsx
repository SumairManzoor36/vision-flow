"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Search, Settings, User as UserIcon, Camera, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";

type Props = {
  user: { name?: string | null; email?: string | null; image?: string | null; role: string };
};

export function Topbar({ user }: Props) {
  const initials = (user.name || user.email || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search audits, products, locations…"
            className="pl-10 h-9 bg-card/50"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground md:inline-block">
            ⌘K
          </kbd>
        </div>
      </div>

      <Button asChild variant="gradient" size="sm" className="hidden sm:inline-flex">
        <Link href="/audits/new">
          <Camera className="h-4 w-4" /> New AI Scan
        </Link>
      </Button>

      <Button asChild variant="outline" size="icon" className="sm:hidden">
        <Link href="/audits/new">
          <Plus className="h-4 w-4" />
        </Link>
      </Button>

      <ThemeToggle />

      <NotificationsBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-accent transition-colors">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left md:block">
              <div className="text-xs font-medium leading-tight">{user.name || "User"}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {user.role}
              </div>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm">{user.name || user.email}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
              <Badge variant="info" className="mt-2 w-fit text-[10px]">
                {user.role}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile"><UserIcon className="h-4 w-4" /> Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/admin/settings"><Settings className="h-4 w-4" /> Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
