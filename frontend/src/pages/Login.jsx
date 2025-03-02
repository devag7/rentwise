import React, { useState } from 'react';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  document.title = 'RentWise - Login';

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      alert('✅ Login Successful!');
      window.location.href = '/dashboard';
    } catch (error) {
      alert('❌ Login Failed: ' + (error.response?.data?.error || 'Something went wrong'));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212] text-white">
      <div className="relative w-full max-w-md bg-[#1E1E1E] bg-opacity-80 backdrop-blur-md rounded-xl shadow-lg p-8 border border-gray-700">
        
        {/* Glowing Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 opacity-20 blur-xl rounded-xl"></div>
        
        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-cyan-400 mb-6">Welcome Back 👋</h2>
        
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
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-cyan-500 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-400 transition duration-300"
          >
            Login
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
