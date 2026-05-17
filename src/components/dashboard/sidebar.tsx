"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Camera,
  Package,
  MapPin,
  BarChart3,
  Sparkles,
  Users,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { Wordmark, LogoMark } from "@/components/icons/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: Role[];
};

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/audits", label: "Audits", icon: ClipboardCheck },
      { href: "/audits/new", label: "New AI Scan", icon: Camera, badge: "AI" },
    ],
  },
  {
    section: "Inventory",
    items: [
      { href: "/inventory", label: "Products", icon: Package },
      { href: "/locations", label: "Locations", icon: MapPin },
    ],
  },
  {
    section: "Intelligence",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/insights", label: "AI Insights", icon: Sparkles, badge: "NEW" },
    ],
  },
  {
    section: "Administration",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN"] },
      { href: "/admin/activity", label: "Activity Log", icon: Bell, roles: ["ADMIN", "MANAGER"] },
      { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-card/50 transition-all duration-200 md:flex",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center overflow-hidden">
          {collapsed ? <LogoMark size={28} /> : <Wordmark />}
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2 scrollbar-thin">
        {NAV.map((group) => {
          const items = group.items.filter(
            (i) => !i.roles || i.roles.includes(role)
          );
          if (items.length === 0) return null;
          return (
            <div key={group.section}>
              {!collapsed && (
                <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.section}
                </div>
              )}
              <ul className="space-y-1">
                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active && "text-primary"
                          )}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
