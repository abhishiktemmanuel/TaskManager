import { UserRole } from '../interfaces/user-role.enum';

export class UserResponseDto {
  id: number;
  name: string;
  email: string;
  profileImageURL: string;
  role: UserRole;
  invitedByAdminId: number;
  createdAt: Date;
  updatedAt: Date;
}
// This DTO is used to structure the user data sent in responses, excluding sensitive information like password.
