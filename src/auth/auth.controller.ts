import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../shared/auth';
import { UserRole, JwtPayload, AuthResponse } from '../shared/auth';
import { AUTH_ERRORS } from '../shared/auth';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: JwtPayload;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto): Promise<{ user: { id: string; username: string; role: UserRole } }> {
    try {
      const result = await this.authService.register(createUserDto);
      return {
        user: {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role,
        },
      };
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error(AUTH_ERRORS.USERNAME_EXISTS);
      }
      throw error;
    }
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto) {
    try {
      const result = await this.authService.login(loginUserDto);
      return result;
    } catch (error) {
      throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: RequestWithUser): Promise<{ role: UserRole }> {
    const user = await this.authService.validateUser(req.user);
    return {
      role: user.role,
    };
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminRoute() {
    return {
      message: 'This is an admin-only route',
    };
  }
}

