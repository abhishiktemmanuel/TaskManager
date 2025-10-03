import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input'; 
import { getErrorMessage } from '../../utils/errorHandler';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminInviteToken, setAdminInviteToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const { register } = useAuth();
  const navigate = useNavigate();

  // Auto-fill token from URL when component mounts
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setAdminInviteToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(name, email, password, adminInviteToken || undefined);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {adminInviteToken ? 'Join Team' : 'Create an account'}
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            {adminInviteToken 
              ? 'You\'ve been invited to join a team!' 
              : 'Join the team and get your tasks done efficiently.'
            }
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 sm:p-10">
          {adminInviteToken && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-green-700 text-sm font-medium">
                  Team invitation detected! You'll automatically join the team after registration.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center"
                role="alert"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <Input
              id="name"
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
            <Input
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
            <Input
              id="adminToken"
              label="Team invitation token"
              type="text"
              value={adminInviteToken}
              onChange={(e) => setAdminInviteToken(e.target.value)}
              placeholder="Auto-filled from invitation link"
              helperText={adminInviteToken 
                ? "This token will add you to the team automatically" 
                : "Only required if you have a team invitation token"
              }
              disabled={!!searchParams.get('token')} // Disable if token came from URL
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                  {adminInviteToken ? 'Joining team...' : 'Creating account...'}
                </div>
              ) : (
                adminInviteToken ? 'Join Team' : 'Create account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;