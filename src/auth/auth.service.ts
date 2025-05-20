import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload, AuthResponse, UserRole } from '../shared/auth';
import { AUTH_ERRORS } from '../shared/auth';
import { UserActivityService } from './user-activity.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private userActivityService: UserActivityService,
  ) {}

  private validateRegisterPolicy( username: string, password: string ) {
    if( username.length < 6 || password.length < 6) {
      throw new BadRequestException(AUTH_ERRORS.INVALID_CREDENTIALS)
    }
    else if (username === password) {
      throw new Error('too simple password');
    }
    // add more registration input policies
    return;
  }

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const { username, password } = createUserDto;
    this.validateRegisterPolicy(username, password);
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) {
      throw new Error(AUTH_ERRORS.USERNAME_EXISTS);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await this.userModel.create({
      username,
      password: hashedPassword,
      role: UserRole.USER,
      points: 0,
      consecutive_logins: 0,
      last_login_date: null,
      invited_friends_count: 0,
      invited_friends: [],
    });

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
    };
  }

  async login(loginUserDto: LoginUserDto): Promise<AuthResponse> {
    const { username, password } = loginUserDto;

    // Validate input
    this.validateRegisterPolicy(username, password);
    // Find user
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    // Update consecutive logins
    await this.userActivityService.updateConsecutiveLogins(user._id.toString());

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: "1h" });

    return {
      access_token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
    };
  }

  async validateUser(payload: JwtPayload): Promise<UserDocument> {
    const user = await this.userModel.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.USER_NOT_FOUND);
    }
    return user;
  }
}
