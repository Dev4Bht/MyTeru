"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to DrukSave</CardTitle>
        <CardDescription>Log in or create an account to see where your money went.</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm onDone={() => router.push("/dashboard")} />
      </CardContent>
    </Card>
  );
}
