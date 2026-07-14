"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hydrateSession, useAuthStore } from "@/lib/auth-store";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { JewelMark } from "@/components/brand/jewel-mark";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === "idle") {
      hydrateSession();
    }
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <span className="flex h-11 w-11 animate-pulse items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
          <JewelMark className="h-5 w-5 text-primary-foreground" />
        </span>
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
