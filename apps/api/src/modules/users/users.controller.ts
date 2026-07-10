import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtUserPayload } from "../../common/interfaces/request-with-user.interface";
import { UsersService } from "./users.service";
import { toAuthenticatedUser } from "./users.mapper";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get the current authenticated user's profile" })
  async me(@CurrentUser() user: JwtUserPayload) {
    const record = await this.usersService.findByIdOrThrow(user.sub);
    return toAuthenticatedUser(record);
  }
}
