import { Body, Controller, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { getRequestContext } from "../../common/utils/request-context.util";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshTokenDto, SignupDto } from "./dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("signup")
  @ApiOperation({ summary: "Create an account and receive tokens" })
  signup(@Body() dto: SignupDto, @Req() req: Request) {
    return this.authService.signup(dto, getRequestContext(req));
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login")
  @ApiOperation({ summary: "Log in with email + password" })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, getRequestContext(req));
  }

  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Rotate a refresh token for a new access/refresh token pair" })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  @ApiOperation({ summary: "Log out of the current device by revoking its refresh token" })
  logout(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.logout(dto.refreshToken, getRequestContext(req));
  }
}
