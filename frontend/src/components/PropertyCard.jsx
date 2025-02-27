import { Link } from 'react-router-dom';

function PropertyCard({ property }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {property.image_data ? (
        <img src={`data:image/jpeg;base64,${property.image_data}`} alt={property.address} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">No Image</div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{property.address}</h3>
        <p className="text-gray-600">{property.area_name} - {property.property_type}</p>
        <p className="text-xl font-bold">
          ₹{property.rent}{' '}
          <span className={property.priceStatus === 'overpriced' ? 'text-red-500' : 'text-green-500'}>
            {property.priceStatus === 'overpriced' ? ' 🚩' : ' ✅'}
          </span>
        </p>
        <Link to={`/properties/${property.property_id}`} className="mt-2 inline-block text-blue-600 hover:underline">
          View Details
        </Link>
      </div>
    </div>
  );
}

export default PropertyCard;