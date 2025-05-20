import { Controller, Get, Post, Body, Param, UseGuards, HttpException, HttpStatus, Put, Request } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, catchError, map } from 'rxjs';
import { AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '../shared/auth';
import { UserRole } from '../shared/auth';
import { CreateEventDto } from '../event/dto/create-event.dto';
import { CreateRewardDto } from '../event/dto/create-reward.dto';
import { CreateRewardRequestDto } from '../event/dto/create-reward-request.dto';
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
  createEvent(@Body() createEventDto: CreateEventDto, @Request() req): Observable<any> {
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL');
    return this.httpService
      .post(`${eventServiceUrl}/events`, createEventDto, {
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

  @Post(':id/rewards')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createReward(
    @Param('id') eventId: string,
    @Body() createRewardDto: CreateRewardDto,
    @Request() req,
  ): Observable<any> {
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL');
    return this.httpService
      .post(`${eventServiceUrl}/events/${eventId}/rewards`, createRewardDto, {
        headers: {
          Authorization: req.headers.authorization,
        },
      })
      .pipe(
        map(response => response.data),
        catchError((error: AxiosError) => {
          if (error.response?.data) {
            const errorData = error.response.data as { message?: string } | string;
            const errorMessage = typeof errorData === 'string' ? errorData : errorData.message || 'Unknown error';
            throw new HttpException(
              { message: errorMessage },
              error.response.status,
            );
          }
          throw new HttpException(
            { message: 'Failed to create reward' },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      );
  }

  @Get(':id/rewards')
  @Public()
  getRewardsByEvent(@Param('id') eventId: string): Observable<any> {
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL');
    return this.httpService
      .get(`${eventServiceUrl}/events/${eventId}/rewards`)
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

  @Post(':id/reward-requests')
  @UseGuards(JwtAuthGuard)
  createRewardRequest(
    @Param('id') eventId: string,
    @Body() createRewardRequestDto: CreateRewardRequestDto,
    @Request() req,
  ): Observable<any> {
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL');
    return this.httpService
      .post(`${eventServiceUrl}/events/${eventId}/reward-requests`, createRewardRequestDto, {
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

  @Get(':id/requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getRewardRequestsByEvent(@Param('id') eventId: string, @Request() req): Observable<any> {
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL');
    return this.httpService
      .get(`${eventServiceUrl}/events/${eventId}/requests`, {
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

  @Put(':id/requests/:requestId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateRewardRequestStatus(
    @Param('id') eventId: string,
    @Param('requestId') requestId: string,
    @Body('status') status: string,
    @Request() req,
  ): Observable<any> {
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL');
    return this.httpService
      .put(`${eventServiceUrl}/events/${eventId}/requests/${requestId}/status`, { status }, {
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