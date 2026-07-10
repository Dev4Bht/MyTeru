import { Body, Controller, HttpCode, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtUserPayload } from "../../common/interfaces/request-with-user.interface";
import { getRequestContext } from "../../common/utils/request-context.util";
import { AuthService } from "./auth.service";
import {
  ChangePasswordDto,
  ChangePhoneConfirmDto,
  ChangePhoneDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResendOtpDto,
  ResetPasswordDto,
  SignupDto,
  VerifyOtpDto,
} from "./dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("signup")
  @ApiOperation({ summary: "Start signup: creates an unverified account and sends an OTP" })
  signup(@Body() dto: SignupDto, @Req() req: Request) {
    return this.authService.signup(dto, getRequestContext(req));
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("otp/verify")
  @ApiOperation({ summary: "Verify a SIGNUP or LOGIN OTP and receive tokens" })
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    return this.authService.verifyOtpAndAuthenticate(dto, getRequestContext(req));
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post("otp/resend")
  @ApiOperation({ summary: "Resend an OTP for any purpose (rate-limited)" })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  @ApiOperation({
    summary:
      "Log in with phone + password. Returns tokens directly for a known device, or an OTP challenge for a new device",
  })
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

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post("password/forgot")
  @ApiOperation({ summary: "Request a password reset OTP" })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("password/reset")
  @ApiOperation({ summary: "Reset password using the OTP sent to the registered phone" })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(dto, getRequestContext(req));
  }

  @ApiBearerAuth()
  @Post("password/change")
  @ApiOperation({ summary: "Change password while authenticated" })
  changePassword(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.changePassword(user.sub, dto, getRequestContext(req));
  }

  @ApiBearerAuth()
  @Post("phone/change")
  @ApiOperation({ summary: "Request an OTP to verify a new phone number" })
  changePhone(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: ChangePhoneDto,
    @Req() req: Request,
  ) {
    return this.authService.changePhone(user.sub, dto, getRequestContext(req));
  }

  @ApiBearerAuth()
  @Post("phone/change/confirm")
  @ApiOperation({ summary: "Confirm the new phone number with its OTP" })
  changePhoneConfirm(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: ChangePhoneConfirmDto,
    @Req() req: Request,
  ) {
    return this.authService.changePhoneConfirm(user.sub, dto, getRequestContext(req));
  }
}
