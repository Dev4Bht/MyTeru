import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { DevicesModule } from "../devices/devices.module";
import { SessionsModule } from "../sessions/sessions.module";
import { AuditModule } from "../audit/audit.module";
import { OtpModule } from "../otp/otp.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { TokensService } from "./tokens.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("jwt.accessSecret"),
        signOptions: { expiresIn: configService.get<string>("jwt.accessTtl") },
      }),
    }),
    UsersModule,
    DevicesModule,
    SessionsModule,
    AuditModule,
    OtpModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokensService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
