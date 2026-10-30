'use client'

import { useState, useMemo, useSyncExternalStore } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property } from '@/components/PropertyCard';
import Link from 'next/link';
import { formatINR } from '@/utils/market';

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

// Map style follows the OS light/dark setting, like the rest of the site.
const DARK_QUERY = '(prefers-color-scheme: dark)';
const subscribeScheme = (cb: () => void) => {
    const mq = window.matchMedia(DARK_QUERY);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
};
const getScheme = () => window.matchMedia(DARK_QUERY).matches;

export default function MapboxCluster({ properties }: Props) {
    const [selectedProperty, setSelectedProperty] = useState<(Property & { exact?: boolean }) | null>(null);

    // Prefer real scraped coordinates; fall back to area-center with a
    // deterministic offset only when a listing has no lat/lng.
    const mapData = useMemo(() => {
        return properties.map((p, idx) => {
            if (p.latitude && p.longitude) {
                return { ...p, exact: true };
            }
            const baseCoords = areaCoordinates[p.area_name] || [77.5946, 12.9716]; // Default to Bangalore center
            const seed = (p.property_id ?? idx) * 2654435761 % 1000;
            const offsetLon = ((seed % 100) / 100 - 0.5) * 0.01;
            const offsetLat = ((Math.floor(seed / 100) % 100) / 100 - 0.5) * 0.01;

            return {
                ...p,
                exact: false,
                longitude: baseCoords[0] + offsetLon,
                latitude: baseCoords[1] + offsetLat
            };
        });
    }, [properties]);

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const dark = useSyncExternalStore(subscribeScheme, getScheme, () => false);

    if (!mapboxToken) {
        return (
            <div className="flex min-h-[500px] w-full flex-col items-center justify-center rounded-[var(--radius-panel)] bg-surface-2 p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-10 w-10 text-label-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h3 className="text-title-3">The map isn&apos;t available right now</h3>
                <p className="mt-2 max-w-md text-label-2">
                    Switch back to the grid to see every flat in these results.
                </p>
            </div>
        );
    }

    return (
        <div className="rw-map relative h-[600px] w-full overflow-hidden rounded-[var(--radius-card)] shadow-card">
            <Map
                mapboxAccessToken={mapboxToken}
                initialViewState={{
                    longitude: 77.6411,
                    latitude: 12.9783,
                    zoom: 11
                }}
                mapStyle={dark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'}
                attributionControl={false}
            >
                <NavigationControl position="bottom-right" />

                {mapData.map(p => {
                    const selected = selectedProperty?.property_id === p.property_id;
                    return (
                        <Marker
                            key={`marker-${p.property_id}`}
                            longitude={p.longitude!}
                            latitude={p.latitude!}
                            anchor="bottom"
                            onClick={(e: { originalEvent: MouseEvent }) => {
                                e.originalEvent.stopPropagation();
                                setSelectedProperty(p);
                            }}
                        >
                            <div
                                className={`cursor-pointer rounded-full px-2.5 py-1 text-caption font-semibold num shadow-card transition-[transform,background-color,color] duration-200 ease-[var(--ease-out)] hover:scale-105 ${
                                    selected ? 'bg-accent text-on-accent' : 'bg-surface-3 text-label'
                                }`}
                            >
                                {formatINR(p.rent)}
                            </div>
                        </Marker>
                    );
                })}

                {selectedProperty && (
                    <Popup
                        longitude={selectedProperty.longitude!}
                        latitude={selectedProperty.latitude!}
                        anchor="top"
                        offset={8}
                        onClose={() => setSelectedProperty(null)}
                        closeOnClick={false}
                        className="rw-map-popup z-50"
                        maxWidth="280px"
                    >
                        <div className="overflow-hidden">
                            {(selectedProperty.image_url || selectedProperty.image_data) && (
                                <img
                                    src={
                                        selectedProperty.image_url
                                            ? selectedProperty.image_url.split(',')[0].trim()
                                            : `data:image/jpeg;base64,${selectedProperty.image_data}`
                                    }
                                    alt={`${selectedProperty.property_type} in ${selectedProperty.area_name}`}
                                    className="h-32 w-full bg-fill object-cover"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            )}
                            <div className="p-4">
                                <p className="text-headline num">
                                    {formatINR(selectedProperty.rent)}<span className="text-footnote font-normal text-label-2">/mo</span>
                                </p>
                                <h4 className="mt-0.5 truncate text-callout text-label">{selectedProperty.address}</h4>
                                <p className="text-footnote text-label-2">
                                    {selectedProperty.property_type} · {selectedProperty.area_name}
                                </p>
                                <p className="mt-1 text-caption text-label-2">
                                    {selectedProperty.exact ? 'Exact location' : 'Approximate location (area only)'}
                                </p>
                                <Link
                                    href={`/properties/${selectedProperty.property_id}`}
                                    className="btn btn-primary btn-sm mt-3 w-full"
                                >
                                    View flat
                                </Link>
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            {/* Restyle Mapbox's own popup and controls with the design tokens. */}
            <style jsx global>{`
                .rw-map-popup .mapboxgl-popup-content {
                    background: var(--surface-3) !important;
                    color: var(--label);
                    padding: 0 !important;
                    border-radius: var(--radius-card) !important;
                    box-shadow: var(--shadow-raised) !important;
                    overflow: hidden;
                    font-family: var(--font-sans);
                }
                .rw-map-popup .mapboxgl-popup-tip {
                    display: none !important;
                }
                .rw-map-popup .mapboxgl-popup-close-button {
                    background: var(--material);
                    -webkit-backdrop-filter: saturate(180%) blur(20px);
                    backdrop-filter: saturate(180%) blur(20px);
                    color: var(--label);
                    right: 8px;
                    top: 8px;
                    width: 28px;
                    height: 28px;
                    border-radius: 9999px;
                    font-size: 18px;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .rw-map .mapboxgl-ctrl-group {
                    background: var(--surface-3);
                    border-radius: var(--radius-control);
                    box-shadow: var(--shadow-card);
                    overflow: hidden;
                }
                .rw-map .mapboxgl-ctrl-group button + button {
                    border-top-color: var(--separator);
                }
            `}</style>
        </div>
    );
}
