import { useState, useEffect } from 'react';
import axios from 'axios';
import PropertyCard from '../components/PropertyCard';
import FilterBar from '../components/FilterBar';

function Properties() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    axios.get('http://localhost:3000/api/properties', { params: filters })
      .then(res => setProperties(res.data))
      .catch(err => console.error(err));
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Available Properties</h2>
      <FilterBar onFilterChange={handleFilterChange} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {properties.map(p => <PropertyCard key={p.property_id} property={p} />)}
      </div>
    </div>
  );
}

export default Properties;