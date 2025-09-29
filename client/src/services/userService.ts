import { axiosInstance } from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPath';
import type { User } from '../context/authContext';

// Define proper TypeScript interfaces for user operations
interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'user';
  profileImageURL?: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  profileImageURL?: string;
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await axiosInstance.get(API_PATHS.USERS);
    return response.data.data;
  },

  async getTeamMembers(): Promise<User[]> {
    const response = await axiosInstance.get(API_PATHS.TEAM_MEMBERS);
    return response.data.data;
  },

  async getUserById(id: number): Promise<User> {
    const response = await axiosInstance.get(API_PATHS.USER_BY_ID(id.toString()));
    return response.data.data;
  },

  async createUser(data: CreateUserData): Promise<User> {
    const response = await axiosInstance.post(API_PATHS.USERS, data);
    return response.data.data;
  },

  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const response = await axiosInstance.put(API_PATHS.USER_BY_ID(id.toString()), data);
    return response.data.data;
  },

  async deleteUser(id: number): Promise<void> {
    await axiosInstance.delete(API_PATHS.USER_BY_ID(id.toString()));
  },
};