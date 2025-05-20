import { Controller, Get, Post, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, catchError, map } from 'rxjs';
import { AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '../shared/auth';
import { UserRole } from '../shared/auth';
import { CreateEventDto } from '../event/dto/create-event.dto';
import { AUTH_ERRORS } from '../shared/auth';

@Controller('events')
export class EventController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createEvent(@Body() createEventDto: CreateEventDto): Observable<any> {
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL');
    return this.httpService
      .post(`${eventServiceUrl}/events`, createEventDto)
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

  @Get()
  @Public()
  getAllEvents(): Observable<any> {
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL');
    return this.httpService
      .get(`${eventServiceUrl}/events`)
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

  @Get(':id')
  @Public()
  getEventById(@Param('id') id: string): Observable<any> {
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL');
    return this.httpService
      .get(`${eventServiceUrl}/events/${id}`)
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