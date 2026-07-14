"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { passwordSchema } from "@druksave/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/auth-api";
import { getDeviceId } from "@/lib/device-id";
import { useAuthStore } from "@/lib/auth-store";

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type SignupValues = z.infer<typeof signupSchema>;

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type LoginValues = z.infer<typeof loginSchema>;

export function AuthForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  const onLogin = async (values: LoginValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await authApi.login({ ...values, deviceId: getDeviceId() });
      setSession(result.user, result.accessToken);
      onDone();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignup = async (values: SignupValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await authApi.signup({ ...values, deviceId: getDeviceId() });
      setSession(result.user, result.accessToken);
      onDone();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "signup") {
    return (
      <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" placeholder="Tashi Dema" {...signupForm.register("fullName")} />
          {signupForm.formState.errors.fullName && (
            <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input id="signup-email" type="email" placeholder="you@example.com" {...signupForm.register("email")} />
          {signupForm.formState.errors.email && (
            <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input id="signup-password" type="password" {...signupForm.register("password")} />
          {signupForm.formState.errors.password && (
            <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" {...signupForm.register("confirmPassword")} />
          {signupForm.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => {
              setServerError(null);
              setMode("login");
            }}
          >
            Log in
          </button>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...loginForm.register("email")} />
        {loginForm.formState.errors.email && (
          <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...loginForm.register("password")} />
        {loginForm.formState.errors.password && (
          <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to DrukSave?{" "}
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => {
            setServerError(null);
            setMode("signup");
          }}
        >
          Create an account
        </button>
      </p>
    </form>
  );
}
