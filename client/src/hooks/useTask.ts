import { useState, useEffect } from 'react';
import type { Task, CreateTaskData, DashboardStats } from '../types';
import { taskService } from '../services/taskService';
import { getErrorMessage } from '../utils/errorHandler';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch tasks'));
    } finally {
      setLoading(false);
    }
  };

  const cleanPayload = (payload: Partial<CreateTaskData>): Partial<CreateTaskData> => {
    const filtered = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ) as Partial<CreateTaskData>;
    return filtered;
  };


    const createTask = async (taskData: CreateTaskData): Promise<Task> => {
    setError(null);
    try {
      const cleanedData = cleanPayload(taskData) as CreateTaskData;
      const newTask = await taskService.createTask(cleanedData);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create task'));
      throw err;
    }
  };

  const updateTask = async (id: number, data: Partial<CreateTaskData>): Promise<Task> => {
    setError(null);
    try {
      const cleanedData = cleanPayload(data);
      const updatedTask = await taskService.updateTask(id, cleanedData);
      setTasks(prev => prev.map(t => (t.id === id ? updatedTask : t)));
      return updatedTask;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update task'));
      throw err;
    }
  };


  const updateTaskChecklist = async (id: number, todoChecklist: { id?: number; text: string; completed: boolean }[]): Promise<Task> => {
    setError(null);
    try {
      const updatedTask = await taskService.updateTaskChecklist(id, todoChecklist);
      setTasks(prev => prev.map(t => (t.id === id ? updatedTask : t)));
      return updatedTask;
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update task checklist'));
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskChecklist,
  };
};

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getDashboardData();
      setStats(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch dashboard data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};
