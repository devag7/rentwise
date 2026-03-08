import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  document.title = 'RentWise - Login';

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Already logged in, check role and redirect
      axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        if (res.data.role === 'landlord') {
          navigate('/dashboard');
        } else {
          navigate('/properties');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      
      // Store token then fetch user info
      localStorage.setItem('token', response.data.token);
      
      // Get user details to determine where to redirect
      try {
        const userResponse = await axios.get('http://localhost:3000/api/auth/me', {
          headers: { Authorization: `Bearer ${response.data.token}` },
        });
        
        // Redirect based on role
        if (userResponse.data.role === 'landlord') {
          navigate('/properties'); // Navigate to properties first
          setTimeout(() => {
            navigate('/dashboard'); // Then redirect to dashboard
          }, 100);
        } else {
          navigate('/properties');
        }
      } catch (userError) {
        console.error("Failed to get user details:", userError);
        navigate('/properties'); // Default redirect
      }
    } catch (error) {
      setIsLoading(false);
      setError('Login failed: ' + (error.response?.data?.error || 'Invalid credentials'));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212] text-white">
      <div className="relative w-full max-w-md bg-[#1E1E1E] bg-opacity-80 backdrop-blur-md rounded-xl shadow-lg p-8 border border-gray-700">
        
        {/* Glowing Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 opacity-20 blur-xl rounded-xl"></div>
        
        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-cyan-400 mb-6">Welcome Back 👋</h2>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-500 text-white p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}
        
        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-white bg-[#252525] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
              required
              disabled={isLoading}
            />
          </div>
          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-white bg-[#252525] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-cyan-500 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-400 transition duration-300 disabled:bg-cyan-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </div>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center text-gray-400 mt-4">
          Don't have an account? 
          <a href="/register" className="text-cyan-400 hover:underline"> Register</a>
        </p>
      </div>
    </div>
  );
}

export default Login;