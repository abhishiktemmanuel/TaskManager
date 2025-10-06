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
  USER_TEAMS: '/users/teams', // Add this if you create the endpoint
  
  // Admin
  GENERATE_INVITE_TOKEN: '/auth/team/generate-invite-token',
  GET_INVITE_TOKENS: '/auth/team/invite-tokens',
  REVOKE_INVITE_TOKEN: '/auth/team/revoke-invite-token',
  SYSTEM_STATS: '/admin/system-stats',
  
  // Reports
  EXPORT_TASKS: '/reports/tasks/export',
  EXPORT_USERS: '/reports/users/export',
  TEAM_PERFORMANCE: '/reports/team-performance',
};