import { Request } from "express";
import { Role } from "@druksave/database";

export interface JwtUserPayload {
  sub: string; // user id
  role: Role;
  sessionId: string;
}

export interface RequestWithUser extends Request {
  user: JwtUserPayload;
}
