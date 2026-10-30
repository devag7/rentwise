'use client'

interface Props {
    google_maps_link: string | null;
}

// Honest media links only. The previous "3D tour" played a hardcoded
// Matterport demo on every listing — removed until real per-property
// tours exist (landlord upload, future phase).
export default function InteractiveMediaLinks({ google_maps_link }: Props) {
    if (!google_maps_link) return null;

    return (
        <div>
            <a
                href={google_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Open in Google Maps
                <span className="sr-only">(opens in a new tab)</span>
            </a>
        </div>
    );
}
