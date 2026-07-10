import { z } from "zod";
import { BHUTAN_PHONE_REGEX } from "../constants/phone";

export const phoneSchema = z
  .string()
  .regex(BHUTAN_PHONE_REGEX, "Enter a valid Bhutanese mobile number, e.g. +97517123456");

/** Min 8 chars, at least one letter and one number. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const otpCodeSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

export const otpPurposeSchema = z.enum([
  "SIGNUP",
  "LOGIN",
  "PASSWORD_RESET",
  "CHANGE_PHONE",
]);

export const signupRequestSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    phone: phoneSchema,
    email: z.string().email().optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
    deviceId: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type SignupRequestDto = z.infer<typeof signupRequestSchema>;

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema,
  purpose: otpPurposeSchema,
  deviceId: z.string().min(1),
});
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;

export const resendOtpSchema = z.object({
  phone: phoneSchema,
  purpose: otpPurposeSchema,
  deviceId: z.string().min(1),
});
export type ResendOtpDto = z.infer<typeof resendOtpSchema>;

export const loginRequestSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1),
  deviceId: z.string().min(1),
});
export type LoginRequestDto = z.infer<typeof loginRequestSchema>;

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenRequestDto = z.infer<typeof refreshTokenRequestSchema>;

export const forgotPasswordRequestSchema = z.object({
  phone: phoneSchema,
});
export type ForgotPasswordRequestDto = z.infer<typeof forgotPasswordRequestSchema>;

export const resetPasswordRequestSchema = z
  .object({
    phone: phoneSchema,
    code: otpCodeSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordRequestDto = z.infer<typeof resetPasswordRequestSchema>;

export const changePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ChangePasswordRequestDto = z.infer<typeof changePasswordRequestSchema>;

export const changePhoneRequestSchema = z.object({
  newPhone: phoneSchema,
});
export type ChangePhoneRequestDto = z.infer<typeof changePhoneRequestSchema>;

export const changePhoneConfirmSchema = z.object({
  newPhone: phoneSchema,
  code: otpCodeSchema,
});
export type ChangePhoneConfirmDto = z.infer<typeof changePhoneConfirmSchema>;
