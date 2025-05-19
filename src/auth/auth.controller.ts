import { Controller, Post, Body, Get, UseGuards, Req, Param, Put, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { AuthService } from './auth.service'; // Assuming AuthService methods return Promise<UserDocument> or similar for user objects
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor) // Automatically exclude fields marked with @Exclude() in DTOs/entities
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<any> { // Use a more specific return type if possible
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{ access_token: string }> {
    // AuthService.login now throws exceptions, no need to check for null
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  // Assuming JwtAuthGuard attaches the user object (excluding password) to the request
  getProfile(@Req() req): any { // Use a more specific type for req.user
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  // Assuming AuthService.updateRoles returns the updated user object (excluding password)
  @Roles('ADMIN')
  @Put('users/:id/roles')
  async updateRoles(@Param('id') id: string, @Body('roles') roles: string[]) {
    return this.authService.updateRoles(id, roles);
  }
}

