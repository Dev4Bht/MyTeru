import { Controller, Delete, Get, HttpCode, HttpStatus, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtUserPayload } from "../../common/interfaces/request-with-user.interface";
import { SessionsService } from "./sessions.service";

@ApiTags("sessions")
@ApiBearerAuth()
@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: "List active sessions for the current user" })
  list(@CurrentUser() user: JwtUserPayload) {
    return this.sessionsService.list(user.sub);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke a single session (remote logout of one device)" })
  revoke(@CurrentUser() user: JwtUserPayload, @Param("id") id: string) {
    return this.sessionsService.revoke(user.sub, id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke all sessions (log out everywhere)" })
  revokeAll(@CurrentUser() user: JwtUserPayload) {
    return this.sessionsService.revokeAll(user.sub);
  }
}
