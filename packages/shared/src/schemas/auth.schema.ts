import { z } from "zod";

export const googleLoginRequestSchema = z.object({
  idToken: z.string().min(1),
  deviceId: z.string().min(1),
});
export type GoogleLoginRequestDto = z.infer<typeof googleLoginRequestSchema>;

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenRequestDto = z.infer<typeof refreshTokenRequestSchema>;
