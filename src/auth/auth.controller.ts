import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../shared/auth';
import { UserRole, JwtPayload } from '../shared/auth';
import { AUTH_ERRORS } from '../shared/auth';
import { UserDocument } from './schemas/user.schema';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      const result = await this.authService.register(createUserDto);
      return {
        message: 'User registered successfully',
        user: result,
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

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Request() req: RequestWithUser) {
    return {
      user: req.user,
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

