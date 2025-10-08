import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminServices';
import { ArrowLeft, Calendar, Flag, CheckCircle2, Trash2, User, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { Task, Todo } from '../../types';

const AdminTaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [manualProgressChange, setManualProgressChange] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [savingProgress, setSavingProgress] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError('');

    adminService.getTaskById(+id)
      .then(taskData => {
        setTask(taskData);
        setProgress(taskData.progress || 0);
        setTodos(taskData.todos || []);
      })
      .catch(() => setError('Failed to load task details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleProgressSave = async () => {
    if (!task) return;

    const newStatus: Task['status'] =
      progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Pending';

    const updatePayload: any = {
      progress: Number(progress),
    };
    
    if (newStatus !== task.status) {
      updatePayload.status = newStatus;
    }

    setSavingProgress(true);
    setError('');
    try {
      const updated = await adminService.updateTask(task.id, updatePayload);
      setTask(updated);
      setProgress(updated.progress || 0);
      setManualProgressChange(false);
    } catch (err: any) {
      console.error('Update task failed:', err.response?.data || err);
      setError('Failed to update progress');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleTodoToggle = async (index: number) => {
    if (!task) return;

    const updatedTodos = todos.map((todo, idx) =>
      idx === index ? { ...todo, completed: !todo.completed } : todo
    );

    setTodos(updatedTodos);

    setError('');
    try {
      const checklistPayload = updatedTodos.map(todo => ({
        id: todo.id,
        text: todo.text,
        completed: todo.completed
      }));
      
      // You'll need to add this method to your adminService
      const updatedTaskWithTodos = await adminService.updateTaskChecklist(task.id, checklistPayload);
      
      setTask({ ...task, ...updatedTaskWithTodos });
      setTodos(updatedTaskWithTodos.todos || updatedTodos);
      setProgress(updatedTaskWithTodos.progress || 0);
      setManualProgressChange(false);
      
    } catch (err: any) {
      console.error('Failed to update todo:', err.response?.data || err);
      setError('Failed to update checklist');
      setTodos(task.todos || []);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setDeleting(true);
    setError('');
    try {
      await adminService.deleteTask(task.id);
      navigate('/admin/tasks');
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError('Failed to delete task.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;

    try {
      const updatedTask = await adminService.updateTaskStatus(task.id, newStatus);
      setTask(updatedTask);
      // Update progress based on status change
      const newProgress = newStatus === 'Completed' ? 100 : newStatus === 'In Progress' ? 50 : 0;
      setProgress(newProgress);
    } catch (err: any) {
      console.error('Status update failed:', err);
      setError('Failed to update task status');
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = Math.round((x / rect.width) * 100);
    setProgress(Math.max(0, Math.min(100, newProgress)));
    setManualProgressChange(true);
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      Low: 'bg-green-100 text-green-700 border-green-200',
      Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      High: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[priority as keyof typeof colors] || colors.Medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Completed: 'bg-green-100 text-green-700',
      'In Progress': 'bg-blue-100 text-blue-700',
      Pending: 'bg-gray-100 text-gray-700',
    };
    return colors[status as keyof typeof colors] || colors.Pending;
  };

  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(date);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-gray-500 text-lg">Loading task details...</span>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin/tasks')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <span className="text-red-600 text-lg">Task not found.</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/admin/tasks')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Tasks</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">Delete Task</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Task Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{task.title}</h1>
            <p className="text-gray-600 text-base leading-relaxed">{task.description}</p>
          </div>

          {/* Admin Info Section */}
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assigned User */}
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">Assigned To</p>
                  <p className="text-blue-700">
                    {task.assignedTo?.name || 'Unassigned'}
                    {task.assignedTo?.email && (
                      <span className="text-blue-600 text-sm ml-2">({task.assignedTo.email})</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Team Info */}
              {task.team && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium">Team</p>
                    <p className="text-blue-700">{task.team.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  <span className="font-medium">Due:</span> {formatDate(task.dueDate)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-gray-400" />
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                  {task.priority} Priority
                </span>
              </div>

              {/* Status with dropdown for admin */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Status:</span>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(task.status)} focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Progress Section - Interactive Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-900">
                Task Progress
              </label>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-blue-600">{progress}%</span>
                {manualProgressChange && (
                  <button
                    onClick={handleProgressSave}
                    disabled={savingProgress}
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    {savingProgress && (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {savingProgress ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Interactive Progress Bar */}
            <div className="relative">
              <div 
                className="w-full bg-gray-200 rounded-full h-8 overflow-hidden cursor-pointer relative group"
                onClick={handleProgressBarClick}
                onMouseEnter={() => setIsDragging(true)}
                onMouseLeave={() => setIsDragging(false)}
              >
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                </div>
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium pointer-events-none">
                    Click to set progress
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Click on the progress bar to update manually, or complete checklist items below</p>
            </div>
          </div>

          {/* Checklist Section - Interactive */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-gray-400" />
                Checklist
                {todos.length > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    ({todos.filter(t => t.completed).length}/{todos.length})
                  </span>
                )}
              </h2>
              {todos.length === 0 && (
                <span className="text-sm text-gray-400">No items</span>
              )}
            </div>

            {todos.length > 0 ? (
              <ul className="space-y-2">
                {todos.map((todo, i) => (
                  <li
                    key={todo.id || i}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                      todo.completed
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleTodoToggle(i)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        todo.completed
                          ? 'line-through text-gray-400'
                          : 'text-gray-700'
                      }`}
                    >
                      {todo.text}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No checklist items yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<span className="font-medium">{task.title}</span>"? 
              This will permanently remove the task and all its checklist items.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                {deleting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {deleting ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTaskDetails;