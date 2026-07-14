"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function LoginPage() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to DrukSave</CardTitle>
        <CardDescription>Sign in with Google to see where your money went.</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleSignInButton onDone={() => router.push("/dashboard")} />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          New here? Signing in with Google creates your account automatically.
        </p>
      </CardContent>
    </Card>
  );
}
