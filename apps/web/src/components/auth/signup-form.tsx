"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { passwordSchema, phoneSchema } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/auth-api";
import { getDeviceId } from "@/lib/device-id";
import { OtpStep } from "./otp-step";

const signupFormSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name"),
    phone: phoneSchema,
    email: z.string().email().optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupForm({ onDone }: { onDone: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpChallenge, setOtpChallenge] = useState<{ phone: string; resendAvailableInSeconds: number } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupFormSchema) });

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const deviceId = getDeviceId();
      const challenge = await authApi.signup({
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        password: values.password,
        confirmPassword: values.confirmPassword,
        deviceId,
      });
      setOtpChallenge({ phone: challenge.phone, resendAvailableInSeconds: challenge.resendAvailableInSeconds });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (otpChallenge) {
    return (
      <OtpStep
        phone={otpChallenge.phone}
        purpose="SIGNUP"
        deviceId={getDeviceId()}
        resendAvailableInSeconds={otpChallenge.resendAvailableInSeconds}
        onVerified={onDone}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" placeholder="Tashi Dema" {...register("fullName")} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" placeholder="+97517123456" {...register("phone")} />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (optional)</Label>
        <Input id="email" type="email" placeholder="you@example.bt" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
