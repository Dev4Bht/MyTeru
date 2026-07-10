"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { phoneSchema } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, isSessionResponse } from "@/lib/auth-api";
import { getDeviceId } from "@/lib/device-id";
import { useAuthStore } from "@/lib/auth-store";
import { OtpStep } from "./otp-step";

const loginFormSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Enter your password"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm({ onDone }: { onDone: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpChallenge, setOtpChallenge] = useState<{ phone: string; resendAvailableInSeconds: number } | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const deviceId = getDeviceId();
      const result = await authApi.login({ phone: values.phone, password: values.password, deviceId });

      if (isSessionResponse(result)) {
        setSession(result.user, result.accessToken);
        onDone();
      } else {
        setOtpChallenge({ phone: result.phone, resendAvailableInSeconds: result.resendAvailableInSeconds });
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (otpChallenge) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          This is a new device, so we need to verify it&apos;s really you.
        </p>
        <OtpStep
          phone={otpChallenge.phone}
          purpose="LOGIN"
          deviceId={getDeviceId()}
          resendAvailableInSeconds={otpChallenge.resendAvailableInSeconds}
          onVerified={onDone}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" placeholder="+97517123456" {...register("phone")} />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
}
