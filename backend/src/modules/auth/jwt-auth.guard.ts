import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AccountStatus, UserRole } from "@prisma/client";
import { AuthenticatedRequest, AuthenticatedUser } from "./auth.types";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/)?.[1];

    if (!token) {
      throw new UnauthorizedException("Authorization header is required");
    }

    let payload: AuthenticatedUser;
    try {
      payload = await this.jwtService.verifyAsync<AuthenticatedUser>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    if (
      typeof payload.sub !== "string" ||
      !Object.values(UserRole).includes(payload.role) ||
      !Object.values(AccountStatus).includes(payload.status)
    ) {
      throw new UnauthorizedException("Invalid access token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true },
    });
    if (!user || user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException("This account is not active");
    }

    request.user = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    return true;
  }
}
