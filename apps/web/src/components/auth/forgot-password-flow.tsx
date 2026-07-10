"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { otpCodeSchema, passwordSchema, phoneSchema } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/auth-api";

const requestSchema = z.object({ phone: phoneSchema });
type RequestValues = z.infer<typeof requestSchema>;

const resetSchema = z
  .object({
    code: otpCodeSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type ResetValues = z.infer<typeof resetSchema>;

export function ForgotPasswordFlow({ onDone }: { onDone: () => void }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const requestForm = useForm<RequestValues>({ resolver: zodResolver(requestSchema) });
  const resetForm = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  const onRequestSubmit = async (values: RequestValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ phone: values.phone });
      setPhone(values.phone);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResetSubmit = async (values: ResetValues) => {
    if (!phone) return;
    setServerError(null);
    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ phone, ...values });
      setSuccess(true);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Could not reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm">Your password has been reset. You can now log in with your new password.</p>
        <Button className="w-full" onClick={onDone}>
          Back to log in
        </Button>
      </div>
    );
  }

  if (phone) {
    return (
      <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter the code sent to <span className="font-medium text-foreground">{phone}</span> and choose a new password.
        </p>

        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input id="code" inputMode="numeric" maxLength={6} {...resetForm.register("code")} />
          {resetForm.formState.errors.code && (
            <p className="text-sm text-destructive">{resetForm.formState.errors.code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" type="password" {...resetForm.register("newPassword")} />
          {resetForm.formState.errors.newPassword && (
            <p className="text-sm text-destructive">{resetForm.formState.errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input id="confirmPassword" type="password" {...resetForm.register("confirmPassword")} />
          {resetForm.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Resetting..." : "Reset password"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter your registered phone number and we&apos;ll send you a code to reset your password.
      </p>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" placeholder="+97517123456" {...requestForm.register("phone")} />
        {requestForm.formState.errors.phone && (
          <p className="text-sm text-destructive">{requestForm.formState.errors.phone.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send reset code"}
      </Button>
    </form>
  );
}
