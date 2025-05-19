import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { getModelToken } from '@nestjs/mongoose';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let userModel; // Mocked Mongoose User model

  beforeEach(async () => {
    // Mock the Mongoose User model
    const userModelMock = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getModelToken('User'), // Provide mock for the User model
          useValue: userModelMock,
            // Mock the method used by JwtStrategy's validate method
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    userModel = module.get(getModelToken('User')); // Get the mocked User model
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return the user if the payload is valid', async () => {
      const user = { userId: '123', username: 'testuser', roles: ['USER'] };
      const payload = { sub: '123', username: 'testuser' }; // Example JWT payload

      // Configure the mock to return the user
      jest.spyOn(userModel, 'findById').mockResolvedValue(user);

      const result = await jwtStrategy.validate(payload);
      expect(result).toEqual(user);
      expect(userModel.findById).toHaveBeenCalledWith(payload.sub);
    });

    it('should throw an UnauthorizedException if the user is not found based on the payload', async () => {
      const payload = { sub: '123', username: 'testuser' }; // Example JWT payload

      // Configure the mock to return null or undefined, indicating user not found
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      await expect(jwtStrategy.validate(payload)).rejects.toThrow();
      expect(userModel.findById).toHaveBeenCalledWith(payload.sub);

    });

    // Add more test cases for invalid payload structures or expired tokens if your strategy handles them
  });
});