import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}
interface Task {
  id: number;
  title: string;
  priority: string;
  status: string;
  dueDate: string;
  progress: number;
  todos: Todo[];
  description: string;
}

const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white border rounded-lg p-5 shadow-sm cursor-pointer hover:ring"
      onClick={() => navigate(`/user/tasks/${task.id}`)}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">{task.title}</h2>
        <span className={`px-2 py-1 text-xs rounded ${
          task.status === 'Completed'
            ? 'bg-green-100 text-green-700'
            : task.status === 'In Progress'
            ? 'bg-yellow-100 text-yellow-600'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {task.status}
        </span>
      </div>
      <p className="text-gray-600 mt-2 mb-1">{task.description}</p>
      <div className="flex gap-6">
        <span className={`text-xs rounded-full px-3 py-1 ${
          task.priority === 'Low' ? 'bg-green-50 text-green-700'
          : task.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700'
          : 'bg-red-50 text-red-700'
        }`}>
          Priority: {task.priority}
        </span>
        <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-3 py-1">
          Progress: {task.progress}%
        </span>
      </div>
      <div className="text-xs text-gray-400 mt-1">Due: {task.dueDate}</div>
    </div>
  );
};

export default TaskCard;
