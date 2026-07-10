"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { otpCodeSchema } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, isSessionResponse } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";

const otpFormSchema = z.object({ code: otpCodeSchema });
type OtpFormValues = z.infer<typeof otpFormSchema>;

interface OtpStepProps {
  phone: string;
  purpose: "SIGNUP" | "LOGIN";
  deviceId: string;
  resendAvailableInSeconds: number;
  onVerified: () => void;
}

export function OtpStep({ phone, purpose, deviceId, resendAvailableInSeconds, onVerified }: OtpStepProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(resendAvailableInSeconds);
  const setSession = useAuthStore((state) => state.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({ resolver: zodResolver(otpFormSchema) });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (values: OtpFormValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await authApi.verifyOtp({ phone, code: values.code, purpose, deviceId });
      if (isSessionResponse(result)) {
        setSession(result.user, result.accessToken);
        onVerified();
      } else {
        setServerError("Verification is incomplete. Please try again.");
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setServerError(null);
    setIsResending(true);
    try {
      const challenge = await authApi.resendOtp({ phone, purpose, deviceId });
      setCooldown(challenge.resendAvailableInSeconds);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Could not resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code sent to <span className="font-medium text-foreground">{phone}</span>.
      </p>

      <div className="space-y-2">
        <Label htmlFor="code">Verification code</Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          {...register("code")}
        />
        {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Verifying..." : "Verify"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={cooldown > 0 || isResending}
        onClick={handleResend}
      >
        {cooldown > 0 ? `Resend code in ${cooldown}s` : isResending ? "Resending..." : "Resend code"}
      </Button>
    </form>
  );
}
