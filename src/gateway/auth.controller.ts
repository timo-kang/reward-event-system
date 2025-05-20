import { Controller, Post, Body, HttpCode, HttpStatus, HttpException, Get, Request, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, catchError, map } from 'rxjs';
import { AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AUTH_ROUTES, AUTH_ERRORS, AUTH_SERVICE_URL, JwtAuthGuard } from '../shared/auth';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() createUserDto: CreateUserDto): Observable<any> {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || AUTH_SERVICE_URL;
    return this.httpService
      .post(`${authServiceUrl}/auth/register`, createUserDto)
      .pipe(
        map(response => response.data),
        catchError((error: AxiosError) => {
          if (error.response?.data) {
            throw new HttpException(
              error.response.data as Record<string, any>,
              error.response.status,
            );
          }
          throw new HttpException(
            { message: AUTH_ERRORS.UNAUTHORIZED },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginUserDto: LoginUserDto): Observable<any> {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || AUTH_SERVICE_URL;
    return this.httpService
      .post(`${authServiceUrl}/auth/login`, loginUserDto)
      .pipe(
        map(response => response.data),
        catchError((error: AxiosError) => {
          if (error.response?.data) {
            throw new HttpException(
              error.response.data as Record<string, any>,
              error.response.status,
            );
          }
          throw new HttpException(
            { message: AUTH_ERRORS.UNAUTHORIZED },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req): Observable<any> {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || AUTH_SERVICE_URL;
    return this.httpService
      .get(`${authServiceUrl}/auth/profile`, {
        headers: {
          Authorization: req.headers.authorization,
        },
      })
      .pipe(
        map(response => response.data),
        catchError((error: AxiosError) => {
          if (error.response?.data) {
            throw new HttpException(
              error.response.data as Record<string, any>,
              error.response.status,
            );
          }
          throw new HttpException(
            { message: AUTH_ERRORS.UNAUTHORIZED },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      );
  }
}