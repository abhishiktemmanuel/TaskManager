export const API_PATHS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  
  // Tasks
  TASKS: '/tasks',
  TASK_BY_ID: (id: string) => `/tasks/${id}`,
  TASK_STATUS: (id: string) => `/tasks/${id}/status`,
  TASK_CHECKLIST: (id: string) => `/tasks/${id}/todo`,
  DASHBOARD_DATA: '/tasks/dashboard-data',
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
  TEAM_MEMBERS: '/users/team',
  
  // Reports
  EXPORT_TASKS: '/reports/tasks/export',
  EXPORT_USERS: '/reports/users/export',
  TEAM_PERFORMANCE: '/reports/team-performance',
};