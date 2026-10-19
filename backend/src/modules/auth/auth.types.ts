import { Request } from "express";
import { AccountStatus, UserRole } from "@prisma/client";

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
