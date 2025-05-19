import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

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
    it('should call authService.register with the correct data', async () => {
      const registerDto = { username: 'testuser', password: 'password123' };
      await authController.register(registerDto);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should return the result from authService.register', async () => {
      const registerDto = { username: 'testuser', password: 'password123' };
      const expectedResult = { message: 'User registered successfully' };
      mockAuthService.register.mockResolvedValue(expectedResult);
      const result = await authController.register(registerDto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login with the correct data', async () => {
      const loginDto = { username: 'testuser', password: 'password123' };
      await authController.login(loginDto);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should return the result from authService.login (JWT token)', async () => {
      const loginDto = { username: 'testuser', password: 'password123' };
      const expectedResult = { access_token: 'mock_jwt_token' };
      mockAuthService.login.mockResolvedValue(expectedResult);
      const result = await authController.login(loginDto);
      expect(result).toBe(expectedResult);
    });
  });
});