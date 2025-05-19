import { UserRole } from '../enums/user-role.enum';

export class UserDto {
  id: string;
  username: string;
  roles: UserRole[];
}

export {}