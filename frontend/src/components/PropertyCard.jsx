import { Link } from 'react-router-dom';

function PropertyCard({ property }) {
  return (
    <div className="bg-gray-800  cursor-pointer text-white rounded-lg shadow-lg hover:shadow-gray-600 overflow-hidden transform transition duration-300 hover:scale-101">
      {property.image_data ? (
        <img
          src={`data:image/jpeg;base64,${property.image_data}`}
          alt={property.address}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400">
          No Image Available
        </div>
      )}

      <div className="p-4">
        <h3 className="text-lg font-semibold">{property.address}</h3>
        <p className="text-gray-400">
          {property.area_name} - <span className="font-medium">{property.property_type}</span>
        </p>
        <p className="text-xl font-bold mt-2">
          ₹{property.rent}{' '}
          <span className={property.priceStatus === 'overpriced' ? 'text-red-500' : 'text-green-400'}>
            {property.priceStatus === 'overpriced' ? ' 🚩' : ' ✅'}
          </span>
        </p>
        <Link
          to={`/properties/${property.property_id}`}
          className="mt-3 inline-block text-blue-400 hover:text-blue-500 transition duration-200"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}

export default PropertyCard;
