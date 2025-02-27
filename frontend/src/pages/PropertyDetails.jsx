import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:3000/api/properties/${id}`)
      .then(res => setProperty(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!property) return <div className="text-center p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {property.image_data ? (
          <img src={`data:image/jpeg;base64,${property.image_data}`} alt={property.address} className="w-full h-64 object-cover rounded-lg mb-4" />
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg mb-4">No Image</div>
        )}
        <h2 className="text-2xl font-bold mb-2">{property.address}</h2>
        <p className="text-gray-600 mb-2">{property.area_name} - {property.property_type}</p>
        <p className="text-xl font-bold mb-2">
          ₹{property.rent}{' '}
          <span className={property.priceStatus === 'overpriced' ? 'text-red-500' : 'text-green-500'}>
            {property.priceStatus === 'overpriced' ? ' 🚩 Overpriced' : ' ✅ Fair Deal'}
          </span>
        </p>
        <p><strong>Size:</strong> {property.size} sq ft</p>
        <p><strong>Preferences:</strong> {property.preferences || 'None'}</p>
      </div>
    </div>
  );
}

export default PropertyDetails;