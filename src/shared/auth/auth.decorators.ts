import { SetMetadata } from '@nestjs/common';
import { UserRole } from './auth.types';
import { ROLES_KEY } from './auth.constants';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const Public = () => SetMetadata('isPublic', true); 