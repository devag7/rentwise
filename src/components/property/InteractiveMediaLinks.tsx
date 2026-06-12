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
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <a
                href={google_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center items-center px-6 py-3 bg-white/5 text-white hover:text-[#FF385C] border border-white/10 hover:border-[#FF385C]/30 font-bold text-xs uppercase tracking-widest transition-colors duration-300 group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="group-hover:tracking-[0.1em] transition-all duration-300">Open in Google Maps</span>
            </a>
        </div>
    );
}
