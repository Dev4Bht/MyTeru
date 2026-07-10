import { Request } from "express";
import { RequestContext } from "../../modules/auth/auth.service";

export function getRequestContext(req: Request): RequestContext {
  return {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };
}
