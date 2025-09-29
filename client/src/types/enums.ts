export const Priority = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
} as const;

export const Status = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
} as const;

export type Priority = typeof Priority[keyof typeof Priority];
export type Status = typeof Status[keyof typeof Status];
