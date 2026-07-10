"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordFlow } from "@/components/auth/forgot-password-flow";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>We&apos;ll text you a code to verify it&apos;s you.</CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordFlow onDone={() => router.push("/login")} />
      </CardContent>
    </Card>
  );
}
