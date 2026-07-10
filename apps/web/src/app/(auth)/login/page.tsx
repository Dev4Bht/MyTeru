"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Log in to see where your money went.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm onDone={() => router.push("/dashboard")} />
        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Link href="/forgot-password" className="hover:underline">
            Forgot your password?
          </Link>
          <p>
            New to DrukSave?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
