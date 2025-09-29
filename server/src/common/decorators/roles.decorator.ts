import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/interfaces/user-role.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
// This decorator is used to specify the roles required to access a particular route or controller.
