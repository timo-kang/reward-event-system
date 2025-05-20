import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../shared/auth';
import { Types } from 'mongoose';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const TEST_USER_ID = '507f1f77bcf86cd799439011';
  const TEST_USERNAME = 'testuser';
  const TEST_PASSWORD = 'password123';

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    };

    it('should return the result from authService.register', async () => {
      const expectedResult = {
        message: 'User registered successfully',
        user: {
          user: {
            id: TEST_USER_ID,
            username: TEST_USERNAME,
            role: UserRole.USER,
          },
          access_token: 'test-token',
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResult.user);

      const result = await authController.register(registerDto);
      expect(result).toEqual(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    const loginDto = {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    };

    it('should return the result from authService.login', async () => {
      const expectedResult = {
        message: 'Login successful',
        user: {
          user: {
            id: TEST_USER_ID,
            username: TEST_USERNAME,
            role: UserRole.USER,
          },
          access_token: 'test-token',
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await authController.login(loginDto);
      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});