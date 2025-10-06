import { Priority, Status } from './enums';

export interface User {
  id: number;
  name: string;
  email: string;
  profileImageURL: string | null;
  role: 'admin' | 'user';
  invitedByAdminId: number | null;
  createdAt: string;
  updatedAt: string;
  assignedTasks?: Task[];
  teams?: Team[];
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  owner: User;
  members: User[];
  createdAt: string;
  updatedAt: string;
}
export interface Task {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate: string;
  assignedTo: User;
  createdBy: User;
  team?: Team | null;
  progress: number;
  todos: Todo[];
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export interface CreateTaskData {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  assignedToId?: number;
  teamId?: number;
  todos?: string[];
  progress: number;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  teamSize?: number;
}

// Add these to your existing types

export interface TeamInviteToken {
  token: string;
  expiresAt: string;
  purpose?: string;
}

export interface GenerateTokenData {
  teamId?: number;
  purpose?: string;
}

export interface AdminStats {
  totalUsers: number;
  adminCount: number;
  userCount: number;
  recentSignups: User[];
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalTeams: number;
  activeUsers: number;
}

export interface TeamPerformance {
  teamId: number;
  teamName: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  memberCount: number;
}