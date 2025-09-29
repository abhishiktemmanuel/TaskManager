import { axiosInstance } from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPath';

// Define proper TypeScript interfaces for team performance data
interface TeamPerformanceUser {
  userId: number;
  userName: string;
  userEmail: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

interface TeamPerformanceResponse {
  data: TeamPerformanceUser[];
}

export const reportService = {
  async exportTasksReport(): Promise<Blob> {
    const response = await axiosInstance.get(API_PATHS.EXPORT_TASKS, {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportUsersReport(): Promise<Blob> {
    const response = await axiosInstance.get(API_PATHS.EXPORT_USERS, {
      responseType: 'blob',
    });
    return response.data;
  },

  async getTeamPerformance(): Promise<TeamPerformanceUser[]> {
    const response = await axiosInstance.get<TeamPerformanceResponse>(API_PATHS.TEAM_PERFORMANCE);
    return response.data.data;
  },
};