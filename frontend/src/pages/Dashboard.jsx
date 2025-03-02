import { useState } from 'react';
import axios from 'axios';

function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [formData, setFormData] = useState({
    area_id: '',
    address: '',
    property_type: '1BHK',
    size: '',
    rent: '',
    preferences: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:3000/api/properties', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Property added successfully!');
      setFormData({ area_id: '', address: '', property_type: '1BHK', size: '', rent: '', preferences: '' }); // Reset form
    } catch (err) {
      alert('Failed to add property: ' + (err.response?.data?.error || 'Something went wrong'));
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen text-white text-5xl bg-gray-800">
        <p>Please log in to access the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 p-6">
      <div className="w-full max-w-lg bg-gray-900 text-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">Dashboard</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <i className="ri-map-pin-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              name="area_id"
              value={formData.area_id}
              onChange={handleChange}
              placeholder="Area ID (e.g., 1-10)"
              className="bg-gray-700 text-white border border-gray-600 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="relative">
            <i className="ri-home-2-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              className="bg-gray-700 text-white border border-gray-600 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="relative">
            <i className="ri-building-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <select
              name="property_type"
              value={formData.property_type}
              onChange={handleChange}
              className="bg-gray-700 text-white border border-gray-600 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="1BHK">1BHK</option>
              <option value="2BHK">2BHK</option>
              <option value="3BHK">3BHK</option>
              <option value="1RK">1RK</option>
              <option value="PG">PG</option>
            </select>
          </div>

          <div className="relative">
            <i className="ri-ruler-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              name="size"
              type="number"
              value={formData.size}
              onChange={handleChange}
              placeholder="Size (sq ft)"
              className="bg-gray-700 text-white border border-gray-600 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div className="relative">
            <i className="ri-money-dollar-circle-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              name="rent"
              type="number"
              value={formData.rent}
              onChange={handleChange}
              placeholder="Rent (₹)"
              className="bg-gray-700 text-white border border-gray-600 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div className="relative">
            <i className="ri-settings-3-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              name="preferences"
              value={formData.preferences}
              onChange={handleChange}
              placeholder="Preferences (e.g., No pets)"
              className="bg-gray-700 text-white border border-gray-600 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 transition text-white font-bold py-3 rounded-lg shadow-md"
          >
            Add Property
          </button>
        </form>
      </div>
    </div>
  );
}

export default Dashboard;
