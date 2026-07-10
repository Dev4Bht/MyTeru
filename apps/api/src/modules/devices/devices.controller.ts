import { Controller, Delete, Get, HttpCode, HttpStatus, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtUserPayload } from "../../common/interfaces/request-with-user.interface";
import { DevicesService } from "./devices.service";

@ApiTags("devices")
@ApiBearerAuth()
@Controller("devices")
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: "List devices registered to the current user" })
  list(@CurrentUser() user: JwtUserPayload) {
    return this.devicesService.list(user.sub);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke a device (and its active sessions)" })
  revoke(@CurrentUser() user: JwtUserPayload, @Param("id") id: string) {
    return this.devicesService.revoke(user.sub, id);
  }
}
