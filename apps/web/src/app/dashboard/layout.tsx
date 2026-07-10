"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hydrateSession, useAuthStore } from "@/lib/auth-store";

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
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading your dashboard...
      </div>
    );
  }

  return <>{children}</>;
}
