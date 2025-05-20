import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { of, throwError } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosResponse } from 'axios';

describe('AuthController', () => {
  let controller: AuthController;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock config service
    mockConfigService.get.mockReturnValue('http://localhost:3001');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('should successfully register a user', (done) => {
      const mockResponse: AxiosResponse = {
        data: { message: 'User registered successfully' },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      controller.register(createUserDto).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse.data);
          expect(mockHttpService.post).toHaveBeenCalledWith(
            'http://localhost:3001/auth/register',
            createUserDto,
          );
          done();
        },
        error: (error) => done(error),
      });
    });

    it('should handle registration error', (done) => {
      const errorResponse = {
        response: {
          data: { message: 'Username already exists' },
          status: 400,
        },
      };

      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      controller.register(createUserDto).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (error) => {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(400);
          expect(error.getResponse()).toEqual({ message: 'Username already exists' });
          done();
        },
      });
    });
  });

  describe('login', () => {
    const loginUserDto: LoginUserDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('should successfully login a user', (done) => {
      const mockResponse: AxiosResponse = {
        data: { access_token: 'mock-token' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      controller.login(loginUserDto).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse.data);
          expect(mockHttpService.post).toHaveBeenCalledWith(
            'http://localhost:3001/auth/login',
            loginUserDto,
          );
          done();
        },
        error: (error) => done(error),
      });
    });

    it('should handle login error', (done) => {
      const errorResponse = {
        response: {
          data: { message: 'Invalid credentials' },
          status: 401,
        },
      };

      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      controller.login(loginUserDto).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (error) => {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(401);
          expect(error.getResponse()).toEqual({ message: 'Invalid credentials' });
          done();
        },
      });
    });
  });
}); 