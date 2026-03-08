import { useState } from "react";

function FilterBar({ onFilterChange }) {
  const [filters, setFilters] = useState({
    area_id: "",
    property_type: "",
    min_rent: "",
    max_rent: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    onFilterChange(e);
  };

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl shadow-xl mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 p-0">
        {/* Area Selection */}
        <div className="relative">
          <i className="ri-map-pin-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <select
            name="area_id"
            value={filters.area_id}
            onChange={handleChange}
            className="bg-gray-900 text-white border border-gray-700 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          >
            <option value="">All Areas</option>
            <option value="1">Indiranagar</option>
            <option value="2">Koramangala</option>
            <option value="3">Whitefield</option>
            <option value="4">HSR Layout</option>
            <option value="5">Marathahalli</option>
            <option value="6">Bellandur</option>
            <option value="7">Jayanagar</option>
            <option value="8">BTM Layout</option>
            <option value="9">Electronic City</option>
            <option value="10">Banashankari</option>
          </select>
        </div>

        {/* Property Type Selection */}
        <div className="relative">
          <i className="ri-home-2-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <select
            name="property_type"
            value={filters.property_type}
            onChange={handleChange}
            className="bg-gray-900 text-white border border-gray-700 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
          >
            <option value="">All Types</option>
            <option value="1BHK">1BHK</option>
            <option value="2BHK">2BHK</option>
            <option value="3BHK">3BHK</option>
            <option value="1RK">1RK</option>
            <option value="PG">PG</option>
          </select>
        </div>

        {/* Min Rent Input */}
        <div className="relative">
          <i className="ri-money-dollar-circle-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            name="min_rent"
            type="number"
            value={filters.min_rent}
            onChange={handleChange}
            placeholder="Min Rent"
            className="bg-gray-900 text-white border border-gray-700 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-200 placeholder-gray-500"
          />
        </div>

        {/* Max Rent Input */}
        <div className="relative">
          <i className="ri-money-dollar-circle-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            name="max_rent"
            type="number"
            value={filters.max_rent}
            onChange={handleChange}
            placeholder="Max Rent"
            className="bg-gray-900 text-white border border-gray-700 p-3 pl-10 rounded w-full focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 placeholder-gray-500"
          />
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
