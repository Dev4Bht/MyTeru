"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = async () => {
    await authApi.logout();
    clearSession();
    router.push("/login");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">DrukSave</p>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kuzuzangpo, {user?.fullName || "there"}</CardTitle>
          <CardDescription>
            Your account is verified and ready. Transaction tracking, budgets, and your AI
            coach arrive in the next build phases.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Phone: {user?.phone}
          <br />
          Role: {user?.role}
        </CardContent>
      </Card>
    </main>
  );
}
