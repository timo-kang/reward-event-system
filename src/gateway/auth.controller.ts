import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(private readonly httpService: HttpService, private configService: ConfigService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() createUserDto: any): Observable<AxiosResponse<any>> {
    // Forward the registration request to the Auth server
    return this.httpService.post(`${this.configService.get('AUTH_SERVICE_URL')}/auth/register`, createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginUserDto: any): Observable<AxiosResponse<any>> {
    // Forward the login request to the Auth server
    return this.httpService.post('http://auth-server:3001/auth/login', loginUserDto);
  }
}