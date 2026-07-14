import { Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";

export interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

/** Verifies the ID token Google Identity Services hands back to the frontend. */
@Injectable()
export class GoogleAuthService {
  private readonly client: OAuth2Client;
  private readonly clientId?: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>("google.clientId");
    this.client = new OAuth2Client(this.clientId);
  }

  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    if (!this.clientId) {
      throw new ServiceUnavailableException(
        "Google sign-in is not configured on this server (missing GOOGLE_CLIENT_ID)",
      );
    }

    let payload;
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException("Invalid Google sign-in token");
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException("Google sign-in token is missing required profile fields");
    }
    if (!payload.email_verified) {
      throw new UnauthorizedException("Google account email is not verified");
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name ?? payload.email.split("@")[0] ?? payload.email,
      avatarUrl: payload.picture,
    };
  }
}
