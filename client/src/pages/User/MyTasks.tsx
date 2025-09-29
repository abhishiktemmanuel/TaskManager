import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { useNavigate } from 'react-router-dom';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
  progress: number;
  todos: Todo[];
  createdAt: string;
  completedAt?: string; // Optional completion date
}

const PRIORITY_ORDER: Record<Task['priority'], number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

const MyTasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    userService.getUserById(user.id)
      .then(userData => {
        setTasks(userData.assignedTasks || []);
      })
      .catch(() => setError('Failed to load tasks.'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleTaskClick = (taskId: number) => {
    navigate(`/user/task/${taskId}`);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      High: 'bg-red-500',
      Medium: 'bg-amber-500',
      Low: 'bg-emerald-500'
    };
    return colors[priority];
  };

  const getStatusColor = (status: Task['status']) => {
    const colors = {
      'Completed': 'text-emerald-600 bg-emerald-50',
      'In Progress': 'text-amber-600 bg-amber-50',
      'Pending': 'text-slate-500 bg-slate-50'
    };
    return colors[status];
  };

  const formatDateInfo = (task: Task) => {
    if (task.status === 'Completed') {
      // Show completion information for completed tasks
      if (task.completedAt) {
        const completedDate = new Date(task.completedAt);
        const now = new Date();
        const diffTime = now.getTime() - completedDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return { text: 'Completed today', isOverdue: false };
        if (diffDays === 1) return { text: 'Completed yesterday', isOverdue: false };
        return { text: `Completed ${diffDays} days ago`, isOverdue: false };
      }
      return { text: 'Completed', isOverdue: false };
    }
    
    // Show due date information for pending/in-progress tasks
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: 'Due today', isOverdue: false };
    if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false };
    if (diffDays === -1) return { text: '1 day overdue', isOverdue: true };
    if (diffDays > 0) return { text: `Due in ${diffDays} days`, isOverdue: false };
    return { text: `${Math.abs(diffDays)} days overdue`, isOverdue: true };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-slate-900 font-medium mb-2">Something went wrong</h3>
          <p className="text-slate-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-1">Tasks</h1>
              <p className="text-slate-500 text-sm">{sortedTasks.length} tasks assigned</p>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-slate-600">High</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-slate-600">Medium</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-slate-600">Low</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-medium mb-1">No tasks yet</h3>
            <p className="text-slate-500 text-sm">Tasks will appear here once assigned</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedTasks.map(task => {
              const dateInfo = formatDateInfo(task);
              
              return (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task.id)}
                  className="group bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-slate-300 hover:-translate-y-1"
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') handleTaskClick(task.id); }}
                >
                  {/* Priority indicator */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>

                  {/* Task title and description */}
                  <div className="mb-4">
                    <h3 className="text-slate-900 font-semibold text-lg leading-tight mb-2 group-hover:text-slate-700 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* Progress bar - only show for non-completed tasks or show 100% for completed */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-500">Progress</span>
                      <span className="text-xs font-medium text-slate-700">
                        {task.status === 'Completed' ? '100' : task.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          task.status === 'Completed' 
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}
                        style={{ width: `${task.status === 'Completed' ? 100 : task.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Date information - shows completion info for completed tasks, due date for others */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {task.status === 'Completed' ? 'Status' : 'Due'}
                    </span>
                    <span className={`font-medium ${
                      task.status === 'Completed' 
                        ? 'text-emerald-600' 
                        : dateInfo.isOverdue 
                          ? 'text-red-600' 
                          : 'text-slate-700'
                    }`}>
                      {dateInfo.text}
                    </span>
                  </div>

                  {/* Todos indicator */}
                  {task.todos?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Checklist</span>
                        <span className="text-slate-700 font-medium">
                          {task.todos.filter(todo => todo.completed).length}/{task.todos.length}
                        </span>
                      </div>
                      <div className="flex space-x-1 mt-2">
                        {task.todos.slice(0, 5).map(todo => (
                          <div
                            key={todo.id}
                            className={`w-2 h-2 rounded-full ${
                              todo.completed ? 'bg-emerald-400' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                        {task.todos.length > 5 && (
                          <span className="text-slate-400 text-xs ml-1">+{task.todos.length - 5}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;
