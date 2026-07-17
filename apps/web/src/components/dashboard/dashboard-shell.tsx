"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { formatNu } from "@druksave/shared";
import { Home, ArrowLeftRight, Tags, Repeat, PiggyBank, Target, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";
import { useTransactionSummary } from "@/lib/queries/use-transactions";
import { JewelMark } from "@/components/brand/jewel-mark";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/budget", label: "Plan", icon: PiggyBank },
  { href: "/dashboard/goals", label: "Goals", icon: Target },
  { href: "/dashboard/recurring", label: "Recurring", icon: Repeat },
] as const;

const SECONDARY_LINKS = [{ href: "/dashboard/categories", label: "Categories", icon: Tags }] as const;

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-soft">
        <JewelMark className="h-4 w-4 text-primary-foreground" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight">DrukSave</span>
      )}
    </Link>
  );
}

/**
 * The one canonical "how much money do I actually have" figure — same
 * totalIncome - totalExpense computation the Overview page's hero card
 * uses, surfaced here so it's visible from every screen, not just Overview.
 */
function TotalMoneyReadout({ variant }: { variant: "sidebar" | "topbar" }) {
  const { data: summary } = useTransactionSummary();
  const isNegative = summary !== undefined && Number(summary.balanceNu) < 0;

  if (variant === "topbar") {
    return (
      <div className="flex flex-col items-center leading-tight">
        <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
          Total money
        </span>
        <span className={cn("font-tnum text-sm font-semibold", isNegative && "text-destructive")}>
          {summary ? formatNu(summary.balanceNu) : "—"}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 px-3.5 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total money</p>
      <p className={cn("font-tnum text-xl font-semibold tracking-tight", isNegative && "text-destructive")}>
        {summary ? formatNu(summary.balanceNu) : "—"}
      </p>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = async () => {
    await authApi.logout();
    clearSession();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card px-5 py-6 md:flex">
        <Logo />
        <div className="mt-6">
          <TotalMoneyReadout variant="sidebar" />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {link.label}
              </Link>
            );
          })}

          <div className="my-2 border-t border-border" />

          {SECONDARY_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-3.5 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.fullName || "Account"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="safe-top flex items-center justify-between gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur md:hidden">
          <Logo compact />
          <TotalMoneyReadout variant="topbar" />
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-secondary"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </header>

        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-10 lg:px-10 lg:pt-8">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
      </div>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur md:hidden">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium active:scale-[0.96]"
            >
              <Icon
                className={cn("h-[22px] w-[22px]", isActive ? "text-primary" : "text-muted-foreground")}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span className={isActive ? "text-primary" : "text-muted-foreground"}>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
