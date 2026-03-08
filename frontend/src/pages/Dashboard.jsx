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
    landlord_phone: '',
    google_maps_link: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hard-coded areas
  const areas = [
    { area_id: "1", area_name: "Indiranagar" },
    { area_id: "2", area_name: "Koramangala" },
    { area_id: "3", area_name: "Whitefield" },
    { area_id: "4", area_name: "HSR Layout" },
    { area_id: "5", area_name: "Marathahalli" },
    { area_id: "6", area_name: "Bellandur" },
    { area_id: "7", area_name: "Jayanagar" },
    { area_id: "8", area_name: "BTM Layout" },
    { area_id: "9", area_name: "Electronic City" },
    { area_id: "10", area_name: "Banashankari" }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert('Image size must be less than 500KB');
        e.target.value = '';
        return;
      }
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        alert('Only JPG/PNG images are allowed');
        e.target.value = '';
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setIsLoading(true);
    
    // Create FormData object for multipart/form-data submission
    const data = new FormData();
    
    // Add all form fields to FormData
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    
    // Add image file if selected
    if (imageFile) {
      data.append('image', imageFile);
    }
    
    try {
      await axios.post('http://localhost:3000/api/properties', data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });
      alert('Property added successfully!');
      // Reset form
      setFormData({ 
        area_id: '', 
        address: '', 
        property_type: '1BHK', 
        size: '', 
        rent: '', 
        preferences: '',
        landlord_phone: '',
        google_maps_link: ''
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      alert('Failed to add property: ' + (err.response?.data?.error || 'Something went wrong'));
    } finally {
      setIsLoading(false);
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
            <select
              name="area_id"
              value={formData.area_id}
              onChange={handleChange}
              className="bg-gray-700 text-white border border-gray-600 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Area</option>
              {areas.map(area => (
                <option key={area.area_id} value={area.area_id}>
                  {area.area_name}
                </option>
              ))}
            </select>
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

          <div className="relative">
            <i className="ri-phone-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              name="landlord_phone"
              value={formData.landlord_phone}
              onChange={handleChange}
              placeholder="Landlord Phone Number"
              className="bg-gray-700 text-white border border-gray-600 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="relative">
            <i className="ri-map-2-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              name="google_maps_link"
              value={formData.google_maps_link}
              onChange={handleChange}
              placeholder="Google Maps Link"
              className="bg-gray-700 text-white border border-gray-600 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Property Image (JPG/PNG, max 500KB)
            </label>
            
            <div className="flex items-center">
              <label className="cursor-pointer flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all">
                <i className="ri-upload-2-line mr-2"></i>
                Choose Image
                <input
                  type="file"
                  accept="image/jpeg, image/png"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <span className="ml-3 text-sm text-gray-400">
                {imageFile ? imageFile.name : "No file chosen"}
              </span>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-3">
                <p className="text-sm text-gray-400 mb-2">Preview:</p>
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-600">
                  <img 
                    src={imagePreview} 
                    alt="Property Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 transition text-white font-bold py-3 rounded-lg shadow-md flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding Property...
              </>
            ) : (
              "Add Property"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Dashboard;