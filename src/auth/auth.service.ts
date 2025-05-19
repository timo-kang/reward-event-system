import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto, LoginUserDto } from './dto/user.dto'; // Assuming you have defined DTOs
import { UserDocument } from './schemas/user.schema'; // Assuming you have defined UserDocument in your schema file
import * as bcrypt from 'bcrypt'; 
import { JwtService } from '@nestjs/jwt';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { username, password } = createUserDto;
    const existingUser = await this.userModel.findOne({ username }).exec();
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new this.userModel({ username, password: hashedPassword, roles: [UserRole.USER] }); // Default role
    return newUser.save();
  }

  async login(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    const { username, password } = loginUserDto;
    const user = await this.userModel.findOne({ username }).select('+password').exec(); // Select password for comparison
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If password is valid, generate JWT
    const payload = { username: user.username, sub: user._id, roles: user.roles };
    // Remove password from user object before returning
    user.password = undefined;
    return {
      access_token: this.jwtService.sign(payload)
    };
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).select('-password').exec();
  }

  async updateRoles(userId: string, roles: UserRole[]): Promise<UserDocument | null> {
    // Find the user first to ensure they exist before updating
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.roles = roles;
    await user.save();
    return this.userModel.findById(userId).select('-password').exec(); // Return the updated user without password
  }

  async getUserPoints(userId: string): Promise<number> {
    // Placeholder logic: return a mock number of points
    console.log(`Fetching points for user: ${userId}`);
    return 150; 
  }

  async getUserLoginHistory(userId: string): Promise<Date[]> {
    // Placeholder logic: return a mock login history (last 5 days)
    console.log(`Fetching login history for user: ${userId}`);
    const today = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      return date;
    });
  }

  async getUserInvitedFriendsCount(userId: string): Promise<number> {
    // Placeholder logic: return a mock number of invited friends
    console.log(`Fetching invited friends count for user: ${userId}`);
    return 3; 
  }
}
