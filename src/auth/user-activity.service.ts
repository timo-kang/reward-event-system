import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { AUTH_ERRORS } from '../shared/auth';

@Injectable()
export class UserActivityService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getUserPoints(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(AUTH_ERRORS.USER_NOT_FOUND);
    }
    return user.points;
  }

  async getUserConsecutiveLogins(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(AUTH_ERRORS.USER_NOT_FOUND);
    }
    return user.consecutive_logins;
  }

  async getUserInvitedFriendsCount(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(AUTH_ERRORS.USER_NOT_FOUND);
    }
    return user.invited_friends_count;
  }

  async addPoints(userId: string, points: number): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(AUTH_ERRORS.USER_NOT_FOUND);
    }
    user.points += points;
    await user.save();
  }

  async updateConsecutiveLogins(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    const now = new Date();
    const lastLogin = user.last_login_date;

    if (lastLogin) {
      const daysSinceLastLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastLogin === 1) {
        user.consecutive_logins += 1;
      } else if (daysSinceLastLogin > 1) {
        user.consecutive_logins = 1;
      }
    } else {
      user.consecutive_logins = 1;
    }

    user.last_login_date = now;
    await user.save();
  }

  async addInvitedFriend(userId: string, invitedUserId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(invitedUserId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const [user, invitedUser] = await Promise.all([
      this.userModel.findById(userId),
      this.userModel.findById(invitedUserId),
    ]);

    if (!user || !invitedUser) {
      throw new NotFoundException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    const invitedUserObjectId = new Types.ObjectId(invitedUserId);
    if (!user.invited_friends.some(id => id.equals(invitedUserObjectId))) {
      user.invited_friends.push(invitedUserObjectId);
      user.invited_friends_count += 1;
      await user.save();
    }
  }
} 