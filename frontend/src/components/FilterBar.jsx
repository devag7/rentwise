function FilterBar({ onFilterChange }) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <select name="area_id" onChange={onFilterChange} className="border p-2 rounded">
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
          <select name="property_type" onChange={onFilterChange} className="border p-2 rounded">
            <option value="">All Types</option>
            <option value="1BHK">1BHK</option>
            <option value="2BHK">2BHK</option>
            <option value="3BHK">3BHK</option>
            <option value="1RK">1RK</option>
            <option value="PG">PG</option>
          </select>
          <input name="min_rent" type="number" placeholder="Min Rent" onChange={onFilterChange} className="border p-2 rounded" />
          <input name="max_rent" type="number" placeholder="Max Rent" onChange={onFilterChange} className="border p-2 rounded" />
        </div>
      </div>
    );
  }
  
  export default FilterBar;