import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';

jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));
describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: any;

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken('User'), // 'User' is the name of the model
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken('User'));
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const createUserDto = { username: 'testuser', password: 'password123' };
      const hashedPassword = 'hashedpassword';
      const createdUser = { username: 'testuser', roles: ['USER'] };
      
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(require('bcrypt'), 'hash').mockResolvedValue(hashedPassword);
      jest.spyOn(userModel, 'create').mockResolvedValue(createdUser);

      const result = await service.register(createUserDto);

      expect(userModel.findOne).toHaveBeenCalledWith({ username: createUserDto.username });
      expect(require('bcrypt').hash).toHaveBeenCalledWith(createUserDto.password, 10); // Assuming saltRounds is 10
      expect(userModel.create).toHaveBeenCalledWith({ ...createUserDto, password: hashedPassword, roles: ['USER'] });
      expect(result).toEqual(createdUser);
    });

    it('should throw a ConflictException if username already exists', async () => {
      const createUserDto = { username: 'existinguser', password: 'password123' };
      const existingUser = { username: 'existinguser', roles: ['USER'] };

      jest.spyOn(userModel, 'findOne').mockResolvedValue(existingUser);

      await expect(service.register(createUserDto)).rejects.toThrow('Username already exists');
      expect(userModel.findOne).toHaveBeenCalledWith({ username: createUserDto.username });
      expect(userModel.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully log in a user with correct credentials', async () => {
      const loginUserDto = { username: 'testuser', password: 'password123' };
      const hashedPassword = 'hashedpassword';
      const user = { username: 'testuser', password: hashedPassword, roles: ['USER'] };
      const token = 'mocked.jwt.token';

      jest.spyOn(userModel, 'findOne').mockResolvedValue(user);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.login(loginUserDto);

      expect(userModel.findOne).toHaveBeenCalledWith({ username: loginUserDto.username });
      expect(require('bcrypt').compare).toHaveBeenCalledWith(loginUserDto.password, hashedPassword);
      expect(jwtService.sign).toHaveBeenCalledWith({ username: user.username, roles: user.roles });
      expect(result).toEqual({ access_token: token });
    });

    it('should throw an UnauthorizedException for incorrect password', async () => {
      const loginUserDto = { username: 'testuser', password: 'wrongpassword' };
      const hashedPassword = 'hashedpassword';
      const user = { username: 'testuser', password: hashedPassword, roles: ['USER'] };

      jest.spyOn(userModel, 'findOne').mockResolvedValue(user);
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);

      await expect(service.login(loginUserDto)).rejects.toThrow('Invalid credentials');
      expect(userModel.findOne).toHaveBeenCalledWith({ username: loginUserDto.username });
      expect(require('bcrypt').compare).toHaveBeenCalledWith(loginUserDto.password, hashedPassword);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw an UnauthorizedException for non-existent user', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
      await expect(service.login({ username: 'nonexistent', password: 'password' })).rejects.toThrow('Invalid credentials');
    });
  });
});