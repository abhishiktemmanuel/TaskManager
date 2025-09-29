import { axiosInstance } from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPath';
import type { Task, CreateTaskData, DashboardStats } from '../types';

interface TodoChecklistItem {
  id?: number;
  text: string;
  completed: boolean;
}

export const taskService = {
  async getTasks(): Promise<Task[]> {
    const response = await axiosInstance.get(API_PATHS.TASKS);
    return response.data.data;
  },

  async getTaskById(id: number): Promise<Task> {
    const response = await axiosInstance.get(API_PATHS.TASK_BY_ID(id.toString()));
    return response.data.data;
  },

  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await axiosInstance.post(API_PATHS.TASKS, data);
    return response.data.data;
  },

  async updateTask(id: number, data: Partial<CreateTaskData>): Promise<Task> {
    const response = await axiosInstance.put(API_PATHS.TASK_BY_ID(id.toString()), data);
    return response.data.data;
  },

  async deleteTask(id: number): Promise<void> {
    await axiosInstance.delete(API_PATHS.TASK_BY_ID(id.toString()));
  },

  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const response = await axiosInstance.put(API_PATHS.TASK_STATUS(id.toString()), { status });
    return response.data.data;
  },

  async updateTaskChecklist(id: number, todoChecklist: TodoChecklistItem[]): Promise<Task> {
    const response = await axiosInstance.put(API_PATHS.TASK_CHECKLIST(id.toString()), { todoChecklist });
    return response.data.data;
  },

  async getDashboardData(): Promise<DashboardStats> {
    const response = await axiosInstance.get(API_PATHS.DASHBOARD_DATA);
    return response.data.data;
  },
};
