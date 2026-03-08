'use client'

import { useState, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property } from '@/components/PropertyCard';
import Link from 'next/link';

interface Props {
    properties: Property[];
}

// Fixed coordinates for Bangalore areas to avoid live Geocoding API costs
const areaCoordinates: Record<string, [number, number]> = {
    'Indiranagar': [77.6411, 12.9783],
    'Koramangala': [77.6271, 12.9279],
    'Whitefield': [77.7499, 12.9698],
    'HSR Layout': [77.6387, 12.9121],
    'Marathahalli': [77.6974, 12.9569],
    'Bellandur': [77.6688, 12.9304],
    'Jayanagar': [77.5806, 12.9298],
    'BTM Layout': [77.6101, 12.9165],
    'Electronic City': [77.6662, 12.8399],
    'Banashankari': [77.5670, 12.9152],
};

export default function MapboxCluster({ properties }: Props) {
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    // Map properties to scatter them slightly if they are in the same area
    const mapData = useMemo(() => {
        return properties.map(p => {
            const baseCoords = areaCoordinates[p.area_name] || [77.5946, 12.9716]; // Default to Bangalore center
            // Add a tiny random offset to prevent perfect stacking
            const offsetLon = (Math.random() - 0.5) * 0.01;
            const offsetLat = (Math.random() - 0.5) * 0.01;

            return {
                ...p,
                longitude: baseCoords[0] + offsetLon,
                latitude: baseCoords[1] + offsetLat
            };
        });
    }, [properties]);

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
        return (
            <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#111] border border-white/10 p-8 text-center ring-1 ring-inset ring-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#00A699] mb-4 opacity-50 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h3 className="text-xl font-bold text-white tracking-widest uppercase mb-2">Mapbox Matrix Offline</h3>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest max-w-md mx-auto">
                    A valid Next Public Mapbox Token is required to render the geographical cluster. The system defaults back to standard Grid parameters.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-[600px] border border-white/10 relative shadow-2xl overflow-hidden">
            <Map
                mapboxAccessToken={mapboxToken}
                initialViewState={{
                    longitude: 77.6411,
                    latitude: 12.9783,
                    zoom: 11
                }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                attributionControl={false}
            >
                <NavigationControl position="bottom-right" />

                {mapData.map(p => (
                    <Marker
                        key={`marker-${p.property_id}`}
                        longitude={p.longitude}
                        latitude={p.latitude}
                        anchor="bottom"
                        onClick={(e: any) => {
                            e.originalEvent.stopPropagation();
                            setSelectedProperty(p);
                        }}
                    >
                        <div className="group cursor-pointer flex flex-col items-center">
                            <div className="bg-[#FF385C] text-white px-2 py-1 text-[10px] font-bold tracking-widest shadow-lg transform transition-transform group-hover:scale-110 group-hover:bg-white group-hover:text-black">
                                ₹{p.rent.toLocaleString('en-IN')}
                            </div>
                            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#FF385C] group-hover:border-t-white transition-colors mt-[1px]"></div>
                        </div>
                    </Marker>
                ))}

                {selectedProperty && (
                    <Popup
                        longitude={selectedProperty.longitude!}
                        latitude={selectedProperty.latitude!}
                        anchor="top"
                        onClose={() => setSelectedProperty(null)}
                        closeOnClick={false}
                        className="dark-map-popup z-50"
                        maxWidth="300px"
                    >
                        <div className="bg-[#111] border border-white/10 p-0 rounded-none shadow-2xl overflow-hidden">
                            {selectedProperty.image_data && (
                                <img
                                    src={`data:image/jpeg;base64,${selectedProperty.image_data}`}
                                    alt="Property Thumbnail"
                                    className="w-full h-32 object-cover"
                                />
                            )}
                            <div className="p-4">
                                <h4 className="text-white font-bold text-sm truncate mb-1">{selectedProperty.address}</h4>
                                <p className="text-[#00A699] text-xs font-bold tracking-widest uppercase mb-3 text-left">
                                    {selectedProperty.property_type} • {selectedProperty.area_name}
                                </p>
                                <Link
                                    href={`/properties/${selectedProperty.property_id}`}
                                    className="block w-full text-center bg-white text-black py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#FF385C] hover:text-white transition-colors"
                                >
                                    View Coordinates
                                </Link>
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            {/* Dark mode override for Popup borders generated by Mapbox */}
            <style jsx global>{`
                .mapboxgl-popup-content {
                    background: transparent !important;
                    padding: 0 !important;
                    border-radius: 0 !important;
                    box-shadow: none !important;
                }
                .mapboxgl-popup-tip {
                    display: none !important;
                }
                .mapboxgl-popup-close-button {
                    background: rgba(0,0,0,0.5);
                    color: white;
                    padding: 4px;
                    right: 8px;
                    top: 8px;
                    border-radius: 100%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .mapboxgl-popup-close-button:hover {
                    background: #FF385C;
                    color: white;
                }
            `}</style>
        </div>
    );
}
