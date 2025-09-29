import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTasks } from '../../hooks/useTask';
import { ArrowLeft, Calendar, Flag, CheckCircle2, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { Task, Todo } from '../../types/index';

const ViewTaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { updateTask, updateTaskChecklist } = useTasks();
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

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

  // Check if user can delete this task
  const canDelete = task && user && (
    isAdmin || task.createdBy?.id === user.id
  );

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    setLoading(true);
    setError('');

    import('../../services/taskService').then(({ taskService }) => {
      taskService.getTaskById(+id)
        .then(task => {
          if (mounted) {
            setTask(task);
            setProgress(task.progress || 0);
            setTodos(task.todos || []);
          }
        })
        .catch(() => mounted && setError('Failed to load task details'))
        .finally(() => mounted && setLoading(false));
    });

    return () => {
      mounted = false;
    };
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
      const updated = await updateTask(task.id, updatePayload);
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
      
      const updatedTaskWithTodos = await updateTaskChecklist(task.id, checklistPayload);
      
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
      const { taskService } = await import('../../services/taskService');
      await taskService.deleteTask(task.id);
      navigate(isAdmin ? '/admin/tasks' : '/user/tasks');
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError('Failed to delete task. You may not have permission.');
      setDeleting(false);
      setShowDeleteModal(false);
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
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
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
      <div className="max-w-3xl mx-auto">
        {/* Header with Back and Delete */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Show delete button if user is admin OR created the task */}
          {canDelete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Delete</span>
            </button>
          )}
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

          {/* Metadata Section */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
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

              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
            </div>
          </div>

          {/* Progress Section - Single Interactive Bar */}
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

          {/* Checklist Section */}
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

export default ViewTaskDetails;