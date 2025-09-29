import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../../hooks/useTask';
import { useAuth } from '../../hooks/useAuth';

// Define proper TypeScript interfaces for the component props
interface StatCardProps {
  title: string;
  value: number;
  color: string;
  icon: string;
}

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
}

const Dashboard: React.FC = () => {
  const { stats, loading } = useDashboard();
  const { user } = useAuth();

  const StatCard: React.FC<StatCardProps> = ({ title, value, color, icon }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const QuickAction: React.FC<QuickActionProps> = ({ title, description, href, icon, color }) => (
    <Link
      to={href}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-500 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your team today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks || 0}
          color="bg-blue-100 text-blue-600"
          icon="📋"
        />
        <StatCard
          title="Pending Tasks"
          value={stats?.pendingTasks || 0}
          color="bg-yellow-100 text-yellow-600"
          icon="⏳"
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgressTasks || 0}
          color="bg-purple-100 text-purple-600"
          icon="🚀"
        />
        <StatCard
          title="Completed"
          value={stats?.completedTasks || 0}
          color="bg-green-100 text-green-600"
          icon="✅"
        />
      </div>

      {/* Team Size if available */}
      {stats?.teamSize && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Team Members</h2>
              <p className="text-blue-100 mt-1">You're managing {stats.teamSize} people</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickAction
            title="Create Task"
            description="Assign a new task to your team"
            href="/admin/create-task"
            icon="➕"
            color="bg-blue-100 text-blue-600"
          />
          <QuickAction
            title="Manage Team"
            description="View and manage team members"
            href="/admin/users"
            icon="👥"
            color="bg-green-100 text-green-600"
          />
          <QuickAction
            title="Generate Token"
            description="Create admin invitation tokens"
            href="/admin/generate-token"
            icon="🔑"
            color="bg-purple-100 text-purple-600"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">📊</div>
            <p>Activity feed will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;