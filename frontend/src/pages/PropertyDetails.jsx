import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:3000/api/properties/${id}`)
      .then(res => {
        setProperty(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121212] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-cyan-500"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center p-6 text-white bg-[#121212] min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-xl">❌ Property Not Found!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800 text-white flex justify-center items-center p-6">
      <div className="relative max-w-3xl w-full bg-[#1E1E1E] bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-8 border border-gray-800">
        
        {/* Property Image */}
        <div className="relative w-full h-72 rounded-xl overflow-hidden">
          {property.image_data ? (
            <img
              src={`data:image/jpeg;base64,${property.image_data}`}
              alt={property.address}
              className="w-full h-full object-cover rounded-xl transition-transform transform hover:scale-105 duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-xl text-gray-400">
              No Image Available
            </div>
          )}
        </div>

        {/* Property Info */}
        <div className="mt-6">
          <h2 className="text-3xl font-bold text-cyan-400 mb-2">{property.address}</h2>
          <p className="text-gray-400 text-lg">
            {property.area_name} - <span className="font-medium text-white">{property.property_type}</span>
          </p>

          {/* Price & Status */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-2xl font-bold text-white">
              ₹{property.rent}{' '}
              <span className={property.priceStatus === 'overpriced' ? 'text-red-500' : 'text-green-400'}>
                {property.priceStatus === 'overpriced' ? ' 🚩 Overpriced' : ' ✅ Fair Deal'}
              </span>
            </p>
            
            {/* Contact button now uses the phone number if available */}
            {property.landlord_phone ? (
              <a 
                href={`tel:${property.landlord_phone}`}
                className="px-4 py-2 text-sm font-semibold bg-cyan-500 text-white rounded-lg shadow-md hover:bg-cyan-400 transition duration-300 flex items-center"
              >
                <i className="ri-phone-line mr-2"></i>
                Call Owner
              </a>
            ) : (
              <button className="px-4 cursor-pointer py-2 text-sm font-semibold bg-cyan-500 text-white rounded-lg shadow-md hover:bg-cyan-400 transition duration-300">
                Contact Owner
              </button>
            )}
          </div>

          {/* Other Details */}
          <div className="mt-6 space-y-3">
            <p className="text-gray-300 text-lg">
              <span className="font-semibold text-cyan-400">Size:</span> {property.size} sq ft
            </p>
            <p className="text-gray-300 text-lg">
              <span className="font-semibold text-cyan-400">Preferences:</span> {property.preferences || 'None'}
            </p>
            
            {/* New: Phone number display */}
            {property.landlord_phone && (
              <p className="text-gray-300 text-lg">
                <span className="font-semibold text-cyan-400">Phone:</span>{' '}
                <a href={`tel:${property.landlord_phone}`} className="text-white hover:text-cyan-300 transition">
                  {property.landlord_phone}
                </a>
              </p>
            )}
          </div>
          
          {/* New: Google Maps section */}
          {property.google_maps_link && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">Location</h3>
              <a 
                href={property.google_maps_link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition duration-300"
              >
                <i className="ri-map-pin-line mr-2 text-xl"></i>
                View on Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PropertyDetails;