import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtAuthGuard } from '@nestjs/passport'; // Import from @nestjs/passport
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from '../gateway/guards/roles.guard'; // Import from gateway guards
import { Roles } from '../auth/decorators/roles.decorator'; // Assuming you have this decorator
import { lastValueFrom } from 'rxjs';

@Controller('event')
export class EventController {
  constructor(private readonly httpService: HttpService) {}
 constructor(
 private readonly httpService: HttpService,
 private readonly configService: ConfigService,
 ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OPERATOR', 'ADMIN')
  async createEvent(@Body() createEventDto: any, @Req() req: any) {
    // Forward the request to the downstream Event server
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL') + '/event';
    try {
      const response = await lastValueFrom(
        this.httpService.post(eventServiceUrl, createEventDto, {
          headers: {
            Authorization: req.headers.authorization, // Forward the JWT
          },
        }),
      );
      return response.data;
    } catch (error) {
      // Handle errors from the downstream service
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllEvents(@Req() req: any) {
    // Forward the request to the downstream Event server
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL') + '/event';
    try {
      const response = await lastValueFrom(
        this.httpService.get(eventServiceUrl, {
          headers: {
            Authorization: req.headers.authorization, // Forward the JWT
          },
        }),
      );
      return response.data;
    } catch (error) {
      // Handle errors from the downstream service
      throw error;
    }
  }
}