import type { User } from '../context/authContext';

// Format date to readable string
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Get priority color class
export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'Low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Get status color class
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800';
    case 'Pending':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Check if user is admin
export const isAdmin = (user: User | null | undefined): boolean => {
  return user?.role === 'admin';
};

// Storage helpers
// IMPORTANT: These use 'auth_token' and 'user' keys consistently.
export const storage = {
  getToken: () => localStorage.getItem('auth_token'),
  setToken: (token: string) => localStorage.setItem('auth_token', token),
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  setUser: (user: User) => localStorage.setItem('user', JSON.stringify(user)),
  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }
};
