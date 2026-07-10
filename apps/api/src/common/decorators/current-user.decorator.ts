import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtUserPayload, RequestWithUser } from "../interfaces/request-with-user.interface";

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return data ? request.user?.[data] : request.user;
  },
);
