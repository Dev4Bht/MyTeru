"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/categories", label: "Categories" },
  { href: "/dashboard/recurring", label: "Recurring" },
];

export function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = async () => {
    await authApi.logout();
    clearSession();
    router.push("/login");
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-6">
        <Link href="/dashboard" className="text-sm font-medium uppercase tracking-widest text-accent">
          DrukSave
        </Link>
        <nav className="flex gap-4 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-muted-foreground transition-colors hover:text-foreground",
                pathname === link.href && "font-medium text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  );
}
