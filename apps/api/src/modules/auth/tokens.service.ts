import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@druksave/database";
import { JwtUserPayload } from "../../common/interfaces/request-with-user.interface";
import { parseDurationMs } from "../../common/utils/duration.util";

@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(params: { userId: string; phone: string; role: Role; sessionId: string }): {
    accessToken: string;
    expiresAt: Date;
  } {
    const payload: JwtUserPayload = {
      sub: params.userId,
      phone: params.phone,
      role: params.role,
      sessionId: params.sessionId,
    };

    const ttl = this.configService.get<string>("jwt.accessTtl")!;
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("jwt.accessSecret"),
      expiresIn: ttl,
    });

    return { accessToken, expiresAt: new Date(Date.now() + parseDurationMs(ttl)) };
  }
}
