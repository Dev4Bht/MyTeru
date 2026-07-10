export interface SmsSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

/**
 * Abstraction over the SMS gateway. Bhutan Telecom and TashiCell don't
 * expose public developer APIs today, so Phase 1 wires a real third-party
 * provider (Twilio) behind this interface — a local carrier integration can
 * be dropped in later as a new implementation without touching `otp/` or
 * `auth/`, which only ever depend on this interface.
 */
export interface SmsProvider {
  send(to: string, message: string): Promise<SmsSendResult>;
}

export const SMS_PROVIDER = "SMS_PROVIDER";
