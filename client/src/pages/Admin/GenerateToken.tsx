import React, { useState } from 'react';
import { axiosInstance } from '../../utils/axiosInstance';
import { getErrorMessage } from '../../utils/errorHandler';

const GenerateToken: React.FC = () => {
  const [generatedToken, setGeneratedToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [purpose, setPurpose] = useState('');

  const generateToken = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/auth/team/generate-invite-token', {
        purpose: purpose || 'Team invitation'
      });
      const token = response.data.data.token; 
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      setGeneratedToken(token);
      setPurpose(''); // Clear purpose after generation
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to generate token. Make sure you are logged in as an admin.'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Generate invitation link
  const generateInvitationLink = () => {
    const baseUrl = window.location.origin; // Gets your app's base URL
    return `${baseUrl}/signup?token=${generatedToken}`;
  };

  // Generate invitation message with link
  const generateInvitationMessage = () => {
    const link = generateInvitationLink();
    return `You've been invited to join our team! Use this link to register: ${link}`;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Generate Team Invitation</h1>
        <p className="text-gray-600 mt-2">Create invitation links for new team members</p>
      </div>

      <div className="max-w-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Invitation</h2>
          <p className="text-gray-600 mb-4">
            Create an invitation that new team members can use to automatically join your team.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose (optional)
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Marketing team recruitment"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={generateToken}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Invitation'}
          </button>
        </div>

        {generatedToken && (
          <div className="space-y-6">
            {/* Invitation Link Section */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Invitation Link Generated!</h3>
              <p className="text-green-700 mb-4">
                Share this link with team members for easy registration.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-800 mb-2">
                    Invitation Link:
                  </label>
                  <div className="flex items-center space-x-3">
                    <code className="flex-1 bg-green-100 px-4 py-3 rounded-lg text-green-800 font-mono break-all text-sm">
                      {generateInvitationLink()}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generateInvitationLink())}
                      className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-800 mb-2">
                    Ready-to-send message:
                  </label>
                  <div className="flex items-center space-x-3">
                    <code className="flex-1 bg-green-100 px-4 py-3 rounded-lg text-green-800 font-mono break-all text-sm">
                      {generateInvitationMessage()}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generateInvitationMessage())}
                      className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      Copy Message
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw Token Section (for backup) */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Raw Token (Advanced)</h3>
              <p className="text-blue-700 mb-4 text-sm">
                Use this token if you need to manually share it:
              </p>
              <div className="flex items-center space-x-3">
                <code className="flex-1 bg-blue-100 px-4 py-3 rounded-lg text-blue-800 font-mono break-all text-sm">
                  {generatedToken}
                </code>
                <button
                  onClick={() => copyToClipboard(generatedToken)}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy Token
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateToken;