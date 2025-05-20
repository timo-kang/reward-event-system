import { Test, TestingModule } from "@nestjs/testing";
import { UserRole } from "../shared/auth";
import { UserActivityService } from "./user-activity.service";
import { getModelToken } from "@nestjs/mongoose";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { Types } from "mongoose";

describe("UserActivityService", () => {
  // Test user IDs
  const TEST_USER_ID = "507f1f77bcf86cd799439011";
  const TEST_INVITED_USER_ID = "507f1f77bcf86cd799439012";
  const TEST_NONEXISTENT_USER_ID = "507f1f77bcf86cd799439013";

  let service: UserActivityService;
  let userModel: any;

  const mockUser = {
    _id: new Types.ObjectId(TEST_USER_ID),
    username: "testuser",
    password: "hashedpassword",
    role: UserRole.USER,
    points: 0,
    consecutive_logins: 0,
    last_login_date: null as Date | null,
    invited_friends_count: 0,
    invited_friends: [] as Types.ObjectId[],
    created_at: new Date(),
    updated_at: new Date(),
    save: jest.fn().mockResolvedValue(true),
  };

  const mockUserModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserActivityService,
        {
          provide: getModelToken("User"),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserActivityService>(UserActivityService);
    userModel = module.get(getModelToken("User"));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe("getUserPoints", () => {
    it("should return user points", async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      const points = await service.getUserPoints(TEST_USER_ID);
      expect(points).toBe(mockUser.points);
      expect(mockUserModel.findById).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it("should throw NotFoundException when user not found", async () => {
      mockUserModel.findById.mockResolvedValue(null);
      await expect(service.getUserPoints(TEST_NONEXISTENT_USER_ID)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("getUserConsecutiveLogins", () => {
    it("should return user consecutive logins", async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      const count = await service.getUserConsecutiveLogins(TEST_USER_ID);
      expect(count).toBe(mockUser.consecutive_logins);
      expect(mockUserModel.findById).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it("should throw NotFoundException when user not found", async () => {
      mockUserModel.findById.mockResolvedValue(null);
      await expect(service.getUserConsecutiveLogins(TEST_NONEXISTENT_USER_ID)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("getUserInvitedFriendsCount", () => {
    it("should return user invited friends count", async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      const count = await service.getUserInvitedFriendsCount(TEST_USER_ID);
      expect(count).toBe(mockUser.invited_friends_count);
      expect(mockUserModel.findById).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it("should throw NotFoundException when user not found", async () => {
      mockUserModel.findById.mockResolvedValue(null);
      await expect(service.getUserInvitedFriendsCount(TEST_NONEXISTENT_USER_ID)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("addPoints", () => {
    it("should add points to user", async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      await service.addPoints(TEST_USER_ID, 100);
      expect(mockUser.points).toBe(100);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException when user not found", async () => {
      mockUserModel.findById.mockResolvedValue(null);
      await expect(service.addPoints(TEST_NONEXISTENT_USER_ID, 100)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("updateConsecutiveLogins", () => {
    it("should set consecutive logins to 1 for first login", async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      await service.updateConsecutiveLogins(TEST_USER_ID);
      expect(mockUser.consecutive_logins).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should increment consecutive logins for consecutive days", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      mockUser.last_login_date = yesterday;
      mockUser.consecutive_logins = 1;
      mockUserModel.findById.mockResolvedValue(mockUser);

      await service.updateConsecutiveLogins(TEST_USER_ID);
      expect(mockUser.consecutive_logins).toBe(2);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should reset consecutive logins for non-consecutive days", async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      mockUser.last_login_date = twoDaysAgo;
      mockUser.consecutive_logins = 5;
      mockUserModel.findById.mockResolvedValue(mockUser);

      await service.updateConsecutiveLogins(TEST_USER_ID);
      expect(mockUser.consecutive_logins).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException when user not found", async () => {
      mockUserModel.findById.mockResolvedValue(null);
      await expect(service.updateConsecutiveLogins(TEST_NONEXISTENT_USER_ID)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("addInvitedFriend", () => {

    it("should add invited friend", async () => {
      mockUserModel.findById.mockImplementation((id) => {
        if (id === TEST_USER_ID) return Promise.resolve(mockUser);
        if (id === TEST_INVITED_USER_ID) return Promise.resolve({ _id: new Types.ObjectId(TEST_INVITED_USER_ID) });
        return Promise.resolve(null);
      });

      await service.addInvitedFriend(TEST_USER_ID, TEST_INVITED_USER_ID);
      expect(mockUser.invited_friends).toContainEqual(new Types.ObjectId(TEST_INVITED_USER_ID));
      expect(mockUser.invited_friends_count).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should not add duplicate invited friend", async () => {
      mockUser.invited_friends = [new Types.ObjectId(TEST_INVITED_USER_ID)];
      mockUser.invited_friends_count = 1;
      mockUser.save.mockClear();

      mockUserModel.findById.mockImplementation((id) => {
        if (id === TEST_USER_ID) return Promise.resolve(mockUser);
        if (id === TEST_INVITED_USER_ID) return Promise.resolve({ _id: new Types.ObjectId(TEST_INVITED_USER_ID) });
        return Promise.resolve(null);
      });

      await service.addInvitedFriend(TEST_USER_ID, TEST_INVITED_USER_ID);
      
      // Verify the state remains unchanged
      expect(mockUser.invited_friends).toHaveLength(1);
      expect(mockUser.invited_friends_count).toBe(1);
      expect(mockUser.save).not.toHaveBeenCalled();
      expect(mockUserModel.findById).toHaveBeenCalledTimes(2); // Called for both user and invited user
    });

    it("should throw NotFoundException when user not found", async () => {
      mockUserModel.findById.mockResolvedValue(null);
      await expect(service.addInvitedFriend(TEST_USER_ID, TEST_INVITED_USER_ID)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw NotFoundException when invited user not found", async () => {
      mockUserModel.findById.mockImplementation((id) => {
        if (id === TEST_USER_ID) return Promise.resolve(mockUser);
        return Promise.resolve(null);
      });

      await expect(service.addInvitedFriend(TEST_USER_ID, TEST_INVITED_USER_ID)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException for invalid user ID format", async () => {
      await expect(service.addInvitedFriend("invalid-id", TEST_INVITED_USER_ID)).rejects.toThrow(
        BadRequestException
      );
      expect(mockUserModel.findById).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException for invalid invited user ID format", async () => {
      await expect(service.addInvitedFriend(TEST_USER_ID, "invalid-id")).rejects.toThrow(
        BadRequestException
      );
      expect(mockUserModel.findById).not.toHaveBeenCalled();
    });
  });
});