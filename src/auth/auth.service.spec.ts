import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { Types } from 'mongoose';
import { AUTH_ERRORS, UserRole } from "../shared/auth";

jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const TEST_USERNAME = "testuser";
const TEST_PASSWORD = "password123";

describe('AuthService', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockJwtService: any;
  let mockUserActivityService: any;

  const mockUser = {
    _id: new Types.ObjectId(TEST_USER_ID),
    username: TEST_USERNAME,
    password: "hashedpassword",
    role: UserRole.USER,
    points: 0,
    consecutive_logins: 0,
    last_login_date: new Date(),
    invited_friends_count: 0,
    invited_friends: [] as Types.ObjectId[],
    created_at: new Date(),
    updated_at: new Date(),
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn().mockReturnValue(new Types.ObjectId(TEST_USER_ID)),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue("test-token"),
    };

    mockUserActivityService = {
      updateConsecutiveLogins: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken("User"),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserActivityService,
          useValue: mockUserActivityService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const createUserDto = {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    };

    it('should successfully register a user', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      require('bcrypt').hash.mockResolvedValue('hashedpassword');

      const result = await service.register(createUserDto);

      expect(result).toEqual({
        user: {
          id: TEST_USER_ID,
          username: TEST_USERNAME,
          role: UserRole.USER,
        },
        access_token: "test-token",
      });

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: createUserDto.username });
      expect(mockUserModel.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedpassword',
        role: UserRole.USER,
        points: 0,
        consecutive_logins: 0,
        last_login_date: null,
        invited_friends_count: 0,
        invited_friends: [],
      });
    });

    it('should throw an error if username already exists', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.register(createUserDto)).rejects.toThrow(Error(AUTH_ERRORS.USERNAME_EXISTS));
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: createUserDto.username });
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for short username', async () => {
      const shortUsernameDto = { username: "te", password: TEST_PASSWORD };
      
      await expect(service.register(shortUsernameDto)).rejects.toThrow(BadRequestException);
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for short password', async () => {
      const shortPasswordDto = { username: TEST_USERNAME, password: "pass" };
      
      await expect(service.register(shortPasswordDto)).rejects.toThrow(BadRequestException);
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginUserDto = {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
    };

    it('should successfully log in a user with correct credentials', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(true);

      const result = await service.login(loginUserDto);

      expect(result).toEqual({
        user: {
          id: TEST_USER_ID,
          username: TEST_USERNAME,
          role: UserRole.USER,
        },
        access_token: "test-token",
      });

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: loginUserDto.username });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          username: mockUser.username,
          sub: TEST_USER_ID,
          role: mockUser.role,
        },
        { expiresIn: "1h" }
      );
    });

    it('should throw an UnauthorizedException for non-existent user', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should update consecutive logins on successful login', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(true);

      await service.login(loginUserDto);

      expect(mockUserActivityService.updateConsecutiveLogins).toHaveBeenCalledWith(TEST_USER_ID);
    });
    it('should throw an UnauthorizedException for incorrect password', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(false);

      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw a BadRequestException for short username', async () => {
      const shortUsernameDto = { username: "te", password: TEST_PASSWORD };

      await expect(service.login(shortUsernameDto)).rejects.toThrow(BadRequestException);
    });
    it('should include expiration in JWT token', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(require("bcrypt"), "compare").mockResolvedValue(true);

      await service.login(loginUserDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          username: mockUser.username,
          sub: TEST_USER_ID,
          role: mockUser.role,
        },
        { expiresIn: "1h" }
      );
    });
  });
});