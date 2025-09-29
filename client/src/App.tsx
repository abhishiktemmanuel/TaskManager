import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import PrivateRoute from './routes/PrivateRoute';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import MainLayout from './components/layout/MainLayout';
import GenerateToken from './pages/Admin/GenerateToken';

// Admin Pages
import Dashboard from './pages/Admin/Dashboard';
import ManageTasks from './pages/Admin/ManageTasks';
import CreateTask from './pages/Admin/CreateTask';
import ManageUsers from './pages/Admin/ManageUsers';

// User Pages
import UserDashboard from './pages/User/UserDashboard';
import MyTasks from './pages/User/MyTasks';
import ViewTaskDetails from './pages/User/ViewTaskDetails';


import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected Routes with Layout */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route element={<MainLayout />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/tasks" element={<ManageTasks />} />
              <Route path="/admin/create-task" element={<CreateTask />} />
              <Route path="/admin/users" element={<ManageUsers />} />
              <Route path="/admin/generate-token" element={<GenerateToken />} />
            </Route>
          </Route>

          <Route element={<PrivateRoute allowedRoles={['user']} />}>
            <Route element={<MainLayout />}>
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/tasks" element={<MyTasks />} />
              <Route path="/user/task/:id" element={<ViewTaskDetails />} />
              <Route path="/user/tasks-details/:id" element={<ViewTaskDetails />} />
              <Route path="/user/create-task" element={<CreateTask />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;