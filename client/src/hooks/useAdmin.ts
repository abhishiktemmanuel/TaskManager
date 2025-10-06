import { useState, useCallback } from 'react';
import { adminService } from '../services/adminServices';
import type { TeamInviteToken, GenerateTokenData, AdminStats, TeamPerformance, Task } from '../types';
import { getErrorMessage } from '../utils/errorHandler';

export const useAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TeamInviteToken[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // Task management methods
  const fetchAdminTasks = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const adminTasks = await adminService.getAdminTasks();
      setTasks(adminTasks);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to fetch admin tasks');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdminTeams = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const adminTeams = await adminService.getAdminTeams();
      setTeams(adminTeams);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to fetch admin teams');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: number, status: string): Promise<Task> => {
    setLoading(true);
    setError(null);
    try {
      const updatedTask = await adminService.updateTaskStatus(taskId, status);
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      return updatedTask;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to update task status');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await adminService.deleteTask(taskId);
      // Remove from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete task');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateInviteToken = useCallback(async (data: GenerateTokenData): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const token = await adminService.generateTeamInviteToken(data);
      await fetchInviteTokens(); // Refresh the tokens list
      return token;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to generate invite token');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInviteTokens = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const tokenList = await adminService.getTeamInviteTokens();
      setTokens(tokenList);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to fetch invite tokens');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const revokeInviteToken = useCallback(async (token: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await adminService.revokeTeamInviteToken(token);
      await fetchInviteTokens(); // Refresh the tokens list
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to revoke invite token');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInviteTokens]);

  const fetchAdminStats = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // You might want to combine multiple API calls here
      const [userStats, systemStats] = await Promise.all([
        adminService.getUserStats(),
        adminService.getSystemStats(),
      ]);
      
      setStats({
        ...userStats,
        ...systemStats,
      });
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to fetch admin stats');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportData = useCallback(async (type: 'tasks' | 'users', format: 'csv' | 'pdf' = 'csv'): Promise<Blob> => {
    setLoading(true);
    setError(null);
    try {
      let blob: Blob;
      if (type === 'tasks') {
        blob = await adminService.exportTasks(format);
      } else {
        blob = await adminService.exportUsers(format);
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return blob;
    } catch (err: unknown) {
      const message = getErrorMessage(err, `Failed to export ${type}`);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
     loading,
    error,
    tokens,
    stats,
    tasks,
    teams,

    // Task management
    fetchAdminTasks,
    fetchAdminTeams,
    updateTaskStatus,
    deleteTask,
    
    // Token management
    generateInviteToken,
    fetchInviteTokens,
    revokeInviteToken,
    
    // Stats and data
    fetchAdminStats,
    exportData,
    
    // User management (you can add more methods as needed)
    createUser: adminService.createUser,
    updateUser: adminService.updateUser,
    deleteUser: adminService.deleteUser,
    getTeamMembers: adminService.getTeamMembers,
    getTeamPerformance: adminService.getTeamPerformance,
  };
};