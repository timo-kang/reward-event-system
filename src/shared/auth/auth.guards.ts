import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { AUTH_ERRORS, ROLES_KEY } from "./auth.constants";
import { Reflector } from "@nestjs/core";
import { UserRole } from "./auth.types";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }
    return user;
  }
}

// @Injectable()
// export class RolesGuard {
//   constructor(private readonly allowedRoles: string[]) {}

//   canActivate(context: ExecutionContext): boolean {
//     const request = context.switchToHttp().getRequest();
//     const user = request.user;

//     if (!user) {
//       throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
//     }

//     return this.allowedRoles.includes(user.role);
//   }
// } 


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}