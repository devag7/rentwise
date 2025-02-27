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
    return <div className="text-center p-6">Please log in to access the dashboard.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <input
          name="area_id"
          value={formData.area_id}
          onChange={handleChange}
          placeholder="Area ID (e.g., 1-10)"
          className="border p-2 w-full rounded"
          required
        />
        <input
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Address"
          className="border p-2 w-full rounded"
          required
        />
        <select
          name="property_type"
          value={formData.property_type}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          required
        >
          <option value="1BHK">1BHK</option>
          <option value="2BHK">2BHK</option>
          <option value="3BHK">3BHK</option>
          <option value="1RK">1RK</option>
          <option value="PG">PG</option>
        </select>
        <input
          name="size"
          type="number"
          value={formData.size}
          onChange={handleChange}
          placeholder="Size (sq ft)"
          className="border p-2 w-full rounded"
          required
        />
        <input
          name="rent"
          type="number"
          value={formData.rent}
          onChange={handleChange}
          placeholder="Rent (₹)"
          className="border p-2 w-full rounded"
          required
        />
        <input
          name="preferences"
          value={formData.preferences}
          onChange={handleChange}
          placeholder="Preferences (e.g., No pets)"
          className="border p-2 w-full rounded"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Add Property
        </button>
      </form>
    </div>
  );
}

export default Dashboard;