import { OtpPurpose } from "@druksave/database";

export const OTP_MESSAGE_BY_PURPOSE: Record<
  OtpPurpose,
  (code: string, ttlMinutes: number) => string
> = {
  SIGNUP: (code, ttl) =>
    `Your DrukSave verification code is ${code}. It expires in ${ttl} minutes. Do not share this code with anyone.`,
  LOGIN: (code, ttl) =>
    `Your DrukSave login code is ${code}. It expires in ${ttl} minutes. Do not share this code with anyone.`,
  PASSWORD_RESET: (code, ttl) =>
    `Your DrukSave password reset code is ${code}. It expires in ${ttl} minutes. If you didn't request this, ignore this message.`,
  CHANGE_PHONE: (code, ttl) =>
    `Your DrukSave phone verification code is ${code}. It expires in ${ttl} minutes. Do not share this code with anyone.`,
};
