import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Twilio } from "twilio";
import { SmsProvider, SmsSendResult } from "../sms-provider.interface";

@Injectable()
export class TwilioSmsProvider implements SmsProvider {
  private readonly logger = new Logger(TwilioSmsProvider.name);
  private readonly client: Twilio;
  private readonly fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>("sms.twilio.accountSid");
    const authToken = this.configService.get<string>("sms.twilio.authToken");
    this.fromNumber = this.configService.get<string>("sms.twilio.fromNumber") ?? "";
    this.client = new Twilio(accountSid, authToken);
  }

  async send(to: string, message: string): Promise<SmsSendResult> {
    try {
      const result = await this.client.messages.create({
        to,
        from: this.fromNumber,
        body: message,
      });
      return { success: true, providerMessageId: result.sid };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}`, error instanceof Error ? error.stack : String(error));
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown SMS provider error",
      };
    }
  }
}
