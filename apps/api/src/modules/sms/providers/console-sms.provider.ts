import { Injectable, Logger } from "@nestjs/common";
import { SmsProvider, SmsSendResult } from "../sms-provider.interface";

/**
 * Local-dev provider: logs the message instead of sending a real SMS, so
 * signup/login/OTP flows can be exercised end-to-end without a Twilio
 * account. Enabled via SMS_DEV_MODE=true.
 */
@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger("SMS(dev)");

  async send(to: string, message: string): Promise<SmsSendResult> {
    this.logger.log(`→ ${to}: ${message}`);
    return { success: true, providerMessageId: `dev-${Date.now()}` };
  }
}
