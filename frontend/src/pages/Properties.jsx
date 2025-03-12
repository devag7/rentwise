import { useState, useEffect } from 'react';
import axios from 'axios';
import PropertyCard from '../components/PropertyCard';
import FilterBar from '../components/FilterBar';

function Properties() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  document.title = 'RentWise - Properties';

  useEffect(() => {
    setIsLoading(true);
    axios.get('http://localhost:3000/api/properties', { params: filters })
      .then(res => {
        // The response will now include landlord_phone and google_maps_link fields
        setProperties(res.data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full p-6 bg-gray-800 text-white min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-center">Available Properties</h2>
      <FilterBar onFilterChange={handleFilterChange} />
      {isLoading ? (
        <p className="mt-6 text-center text-gray-200">Loading properties...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6 w-full">
          {properties.map(p => (
            <PropertyCard key={p.property_id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Properties;