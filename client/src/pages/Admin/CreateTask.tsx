// src/pages/Admin/CreateTask.tsx (Updated version)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../hooks/useTask';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { getErrorMessage } from '../../utils/errorHandler';
import { Calendar, User, Flag, Plus, X } from 'lucide-react';
import type { Priority, Status } from '../../types/enums';

interface UserSummary {
  id: number;
  name: string;
  email?: string;
}

const CreateTask: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [todos, setTodos] = useState<string[]>([]);
  const [currentTodo, setCurrentTodo] = useState('');
  const [team, setTeam] = useState<UserSummary[]>([]);
  const [assignedToId, setAssignedToId] = useState<number | undefined>();
  const [isFetchingTeam, setIsFetchingTeam] = useState(false);

  const { createTask, loading } = useTasks();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  // Fetch team members on mount (admin only)
  useEffect(() => {
    if (isAdmin && user) {
      setIsFetchingTeam(true);
      userService.getTeamMembers()
        .then((teamList: UserSummary[]) => {
          const withSelf = [
            { id: user.id, name: `${user.name} (Me)`, email: user.email },
            ...(teamList || [])
          ];
          setTeam(withSelf);
          setAssignedToId(user.id);
        })
        .catch(() => setError('Failed to fetch team members'))
        .finally(() => setIsFetchingTeam(false));
    }
  }, [isAdmin, user]);

  const addTodo = () => {
    if (currentTodo.trim()) {
      setTodos([...todos, currentTodo.trim()]);
      setCurrentTodo('');
    }
  };

  const removeTodo = (index: number) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (isAdmin && !assignedToId) {
      setError('Please choose an assignee');
      return;
    }

    // Build payload - only include what backend expects
    const payload: any = {
      title,
      description,
      priority,
      status: 'Pending' as Status,
      dueDate, // Keep as YYYY-MM-DD string
    };

    // Only add optional fields if they have values
    if (isAdmin && assignedToId) {
      payload.assignedToId = assignedToId;
    }
    
    if (todos.length > 0) {
      payload.todos = todos;
    }

    try {
      await createTask(payload);
      navigate(isAdmin ? '/admin/tasks' : '/user/tasks');
    } catch (err: unknown) {
      console.error('Create task error:', err);
      setError(getErrorMessage(err, 'Failed to create task'));
    }
  };

  const getPriorityColors = (p: Priority, isSelected: boolean) => {
    const colors = {
      Low: isSelected 
        ? 'bg-green-500 text-white border-green-500' 
        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      Medium: isSelected 
        ? 'bg-yellow-500 text-white border-yellow-500' 
        : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
      High: isSelected 
        ? 'bg-red-500 text-white border-red-500' 
        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    };
    return colors[p];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-6">
            
            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm text-left px-4 font-semibold text-gray-900">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter a clear, concise task title"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm text-left px-4 font-semibold text-gray-900">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Provide detailed information about what needs to be done..."
                required
              />
            </div>

            {/* Priority and Due Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority Pill Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  <Flag className="inline w-4 h-4 mr-1" />
                  Priority
                </label>
                <div className="flex gap-2">
                  {(['Low', 'Medium', 'High'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-200 ${getPriorityColors(p, priority === p)}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Assign To (Admin only) */}
            {isAdmin && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  <User className="inline w-4 h-4 mr-1" />
                  Assign To
                </label>
                <div className="relative">
                  <select
                    value={assignedToId || ''}
                    onChange={(e) => setAssignedToId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white cursor-pointer"
                    disabled={isFetchingTeam}
                  >
                    <option value="">Select team member (optional)</option>
                    {team.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.email && `• ${member.email}`}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  Leave empty to assign to yourself
                </p>
              </div>
            )}

            {/* Todo Items */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-900">
                Todo
              </label>
              
              {/* Add Todo Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTodo}
                  onChange={(e) => setCurrentTodo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTodo();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Add a todo item..."
                />
                <button
                  type="button"
                  onClick={addTodo}
                  disabled={!currentTodo.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>

              {/* Todo List */}
              {todos.length > 0 && (
                <div className="space-y-2">
                  {todos.map((todo, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="flex-1 text-gray-700">{todo}</span>
                      <button
                        type="button"
                        onClick={() => removeTodo(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              onClick={() => navigate(isAdmin ? '/admin/tasks' : '/user/tasks')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;