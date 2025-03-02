import React, { useState } from 'react';
import axios from 'axios';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tenant');

  document.title = 'RentWise - Register';

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/auth/register', { username, email, password, role });
      alert('✅ Registration Successful!');
      window.location.href = '/login';
    } catch (error) {
      alert('❌ Registration Failed: ' + (error.response?.data?.error || 'Something went wrong'));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212] text-white">
      <div className="relative w-full max-w-md bg-[#1E1E1E] bg-opacity-80 backdrop-blur-md rounded-xl shadow-lg p-8 border border-gray-700">
        
        {/* Glowing Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 opacity-20 blur-xl rounded-xl"></div>
        
        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-purple-400 mb-6">Join RentWise 🎉</h2>
        
        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-5 relative z-10">
          <input
            type="text" 
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 text-white bg-[#252525] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 text-white bg-[#252525] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 text-white bg-[#252525] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 text-white bg-[#252525] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
          >
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
          </select>
          <button
            type="submit"
            className="w-full py-3 bg-purple-500 text-white font-semibold rounded-lg shadow-md hover:bg-purple-400 transition duration-300"
          >
            Register
          </button>
        </form>

        {/* Login Redirect */}
        <p className="text-center text-gray-400 mt-4">
          Already have an account? 
          <a href="/login" className="text-purple-400 hover:underline"> Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
