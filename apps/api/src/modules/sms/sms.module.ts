import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SMS_PROVIDER } from "./sms-provider.interface";
import { TwilioSmsProvider } from "./providers/twilio-sms.provider";
import { ConsoleSmsProvider } from "./providers/console-sms.provider";

@Module({
  providers: [
    TwilioSmsProvider,
    ConsoleSmsProvider,
    {
      provide: SMS_PROVIDER,
      inject: [ConfigService, TwilioSmsProvider, ConsoleSmsProvider],
      useFactory: (
        configService: ConfigService,
        twilioProvider: TwilioSmsProvider,
        consoleProvider: ConsoleSmsProvider,
      ) => {
        const devMode = configService.get<boolean>("sms.devMode");
        return devMode ? consoleProvider : twilioProvider;
      },
    },
  ],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
