import React, { useEffect, useState } from 'react';
import { axiosInstance } from '../lib/axios';

const DebugPage = () => {
  const [apiTest, setApiTest] = useState({ status: 'loading', data: null, error: null });
  const [envVars, setEnvVars] = useState({});

  useEffect(() => {
    // Test environment variables
    setEnvVars({
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE,
      PROD: import.meta.env.PROD,
      DEV: import.meta.env.DEV,
      VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
      VITE_BACKEND_LOCAL: import.meta.env.VITE_BACKEND_LOCAL,
      VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      baseURL: axiosInstance.defaults.baseURL
    });

    // Test API connection
    const testAPI = async () => {
      try {
        setApiTest({ status: 'loading', data: null, error: null });
        
        // Try a simple GET request to test connectivity
        const response = await fetch(`${axiosInstance.defaults.baseURL.replace('/api', '')}/`, {
          method: 'GET',
          credentials: 'include',
        });
        
        const text = await response.text();
        
        setApiTest({ 
          status: 'success', 
          data: {
            status: response.status,
            statusText: response.statusText,
            body: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
            headers: Object.fromEntries([...response.headers.entries()])
          }, 
          error: null 
        });
      } catch (error) {
        setApiTest({ 
          status: 'error', 
          data: null, 
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack
          }
        });
      }
    };

    testAPI();
  }, []);

  const testFriendRequests = async () => {
    try {
      const response = await axiosInstance.get('/friends/requests/incoming');
      console.log('🔍 Friend requests API response:', response);
      alert(`Friend requests API call successful. Check console for details.`);
    } catch (error) {
      console.error('❌ Friend requests API error:', error);
      alert(`Friend requests API error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">🔧 Talkora Debug Page</h1>
        
        {/* Environment Variables */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title">🌍 Environment Variables</h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Variable</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(envVars).map(([key, value]) => (
                    <tr key={key}>
                      <td className="font-mono">{key}</td>
                      <td className="font-mono text-sm">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* API Test */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title">🌐 API Connection Test</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Status:</span>
                </label>
                <div className={`badge ${
                  apiTest.status === 'loading' ? 'badge-info' :
                  apiTest.status === 'success' ? 'badge-success' : 'badge-error'
                }`}>
                  {apiTest.status}
                </div>
              </div>
              
              {apiTest.data && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Response:</span>
                  </label>
                  <textarea 
                    className="textarea textarea-bordered h-32 font-mono text-xs" 
                    value={JSON.stringify(apiTest.data, null, 2)} 
                    readOnly 
                  />
                </div>
              )}
              
              {apiTest.error && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Error:</span>
                  </label>
                  <textarea 
                    className="textarea textarea-bordered textarea-error h-32 font-mono text-xs" 
                    value={JSON.stringify(apiTest.error, null, 2)} 
                    readOnly 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">🧪 Test Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button 
                className="btn btn-primary" 
                onClick={testFriendRequests}
              >
                Test Friend Requests API
              </button>
              
              <button 
                className="btn btn-secondary" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
              
              <button 
                className="btn btn-accent" 
                onClick={() => console.clear()}
              >
                Clear Console
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="alert alert-info mt-8">
          <div>
            <h3 className="font-bold">Instructions:</h3>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Check environment variables are correctly set</li>
              <li>Verify API connection is working</li>
              <li>Test friend requests API to debug the 473 error</li>
              <li>Open browser console for detailed logs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
