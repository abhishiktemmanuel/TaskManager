import { axiosInstance } from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPath';
import type { Task } from '../types';

export interface TeamInviteToken {
  token: string;
  expiresAt: string;
  purpose?: string;
}

export interface GenerateTokenData {
  teamId?: number;
  purpose?: string;
}

export interface RevokeTokenData {
  token: string;
}

export const adminService = {
  /**
   * Generate a team invitation token
   */
  async generateTeamInviteToken(data: GenerateTokenData): Promise<string> {
    const response = await axiosInstance.post('/auth/team/generate-invite-token', data);
    return response.data.token;
  },

  /**
   * Get all team invitation tokens for the current admin
   */
  async getTeamInviteTokens(): Promise<TeamInviteToken[]> {
    const response = await axiosInstance.get('/auth/team/invite-tokens');
    return response.data.tokens;
  },

  /**
   * Revoke a team invitation token
   */
  async revokeTeamInviteToken(token: string): Promise<void> {
    await axiosInstance.post('/auth/team/revoke-invite-token', { token });
  },

  /**
   * Get team members (users in admin's teams)
   */
  async getTeamMembers(): Promise<any[]> {
    const response = await axiosInstance.get('/users/team');
    return response.data.data;
  },

  /**
   * Get all teams owned by the admin
   */
  async getAdminTeams(): Promise<any[]> {
    // You might need to create this endpoint in your backend
    // For now, let's use the teams from team members
    try {
      const response = await axiosInstance.get('/users/teams');
      return response.data.data;
    } catch (error) {
      console.warn('Teams endpoint not available, falling back to team members data');
      const teamMembers = await this.getTeamMembers();
      // Extract unique teams from team members
      const teamsMap = new Map();
      teamMembers.forEach(member => {
        if (member.teams) {
          member.teams.forEach(team => {
            if (!teamsMap.has(team.id)) {
              teamsMap.set(team.id, team);
            }
          });
        }
      });
      return Array.from(teamsMap.values());
    }
  },

  /**
   * Get all tasks for admin (tasks from all their teams)
   */
  async getAdminTasks(): Promise<Task[]> {
    const response = await axiosInstance.get('/tasks');
    return response.data.data;
  },

  /**
   * Get tasks for a specific team
   */
  async getTeamTasks(teamId: number): Promise<Task[]> {
    const response = await axiosInstance.get(`/tasks/team/${teamId}`);
    return response.data.data;
  },

  /**
   * Get team performance statistics
   */
  async getTeamPerformance(): Promise<any> {
    const response = await axiosInstance.get('/reports/team-performance');
    return response.data.data;
  },

  /**
   * Export tasks data
   */
  async exportTasks(format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await axiosInstance.get('/reports/tasks/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Export users data
   */
  async exportUsers(format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await axiosInstance.get('/reports/users/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Create a new user (admin only)
   */
  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    profileImageURL?: string;
  }): Promise<any> {
    const response = await axiosInstance.post('/users', userData);
    return response.data.data;
  },

  /**
   * Update user information (admin only)
   */
  async updateUser(id: number, userData: Partial<{
    name: string;
    email: string;
    password: string;
    role: string;
    profileImageURL: string;
  }>): Promise<any> {
    const response = await axiosInstance.put(`/users/${id}`, userData);
    return response.data.data;
  },

  /**
   * Delete a user (admin only)
   */
  async deleteUser(id: number): Promise<void> {
    await axiosInstance.delete(`/users/${id}`);
  },

  /**
   * Get user statistics for admin dashboard
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    adminCount: number;
    userCount: number;
    recentSignups: any[];
  }> {
    const response = await axiosInstance.get('/users/stats');
    return response.data.data;
  },

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalTeams: number;
    activeUsers: number;
  }> {
    try {
      const response = await axiosInstance.get('/admin/system-stats');
      return response.data.data;
    } catch (error) {
      console.warn('System stats endpoint not available');
      // Return default stats
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        totalTeams: 0,
        activeUsers: 0,
      };
    }
  },

  /**
   * Update task status (admin override)
   */
  async updateTaskStatus(taskId: number, status: string): Promise<Task> {
    const response = await axiosInstance.put(`/tasks/${taskId}/status`, { status });
    return response.data.data;
  },

  async getTaskById(id: number): Promise<Task> {
    const response = await axiosInstance.get(`/tasks/${id}`);
    return response.data.data;
},

  /**
   * Delete any task (admin override)
   */
  async deleteTask(taskId: number): Promise<void> {
    await axiosInstance.delete(`/tasks/${taskId}`);
  }
};