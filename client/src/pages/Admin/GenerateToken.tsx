import React, { useState } from 'react';
import { axiosInstance } from '../../utils/axiosInstance';
import { getErrorMessage } from '../../utils/errorHandler';


const GenerateToken: React.FC = () => {
  const [generatedToken, setGeneratedToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateToken = async () => {
    setLoading(true);
    setError('');
    try {
      // This endpoint needs to be created in your backend
      const response = await axiosInstance.post('/auth/admin/generate-token');
      setGeneratedToken(response.data.token);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to generate token'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedToken);
    alert('Token copied to clipboard!');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Generate Admin Token</h1>
        <p className="text-gray-600 mt-2">Create invitation tokens for new admin users</p>
      </div>

      <div className="max-w-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Token</h2>
          <p className="text-gray-600 mb-4">
            This token can be used during registration to create a new admin account. 
            Tokens expire after 24 hours.
          </p>
          
          <button
            onClick={generateToken}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Token'}
          </button>
        </div>

        {generatedToken && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">Token Generated Successfully!</h3>
            <div className="flex items-center space-x-3 mb-4">
              <code className="flex-1 bg-green-100 px-4 py-3 rounded-lg text-green-800 font-mono break-all">
                {generatedToken}
              </code>
              <button
                onClick={copyToClipboard}
                className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-green-700">
              Share this token with the person you want to invite as an admin. 
              They need to use it during registration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateToken;