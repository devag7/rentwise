'use client'

import { useState } from 'react';

interface Props {
    google_maps_link: string | null;
}

export default function InteractiveMediaLinks({ google_maps_link }: Props) {
    const [isTourOpen, setIsTourOpen] = useState(false);

    return (
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
            {/* 3D Virtual Tour Button */}
            <button
                onClick={() => setIsTourOpen(true)}
                className="inline-flex justify-center items-center px-6 py-3 bg-[#00A699]/10 text-[#00A699] hover:bg-[#00A699] hover:text-white border border-[#00A699]/30 font-bold text-xs uppercase tracking-widest transition-colors duration-300 group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-.553.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="group-hover:tracking-[0.1em] transition-all duration-300">Initialize 3D Tour</span>
            </button>

            {/* Location Link */}
            {google_maps_link && (
                <a
                    href={google_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center items-center px-6 py-3 bg-white/5 text-white hover:text-[#FF385C] border border-white/10 hover:border-[#FF385C]/30 font-bold text-xs uppercase tracking-widest transition-colors duration-300 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span className="group-hover:tracking-[0.1em] transition-all duration-300">Map Coordinates</span>
                </a>
            )}

            {/* Matterport Modal */}
            {isTourOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
                    <div className="w-full max-w-6xl h-[80vh] bg-[#050505] border border-white/20 relative shadow-2xl flex flex-col">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#111]">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
                                <span className="w-2 h-2 bg-[#00A699] rounded-full animate-pulse"></span>
                                Matterport 3D Showcase Matrix
                            </h2>
                            <button
                                onClick={() => setIsTourOpen(false)}
                                className="text-gray-500 hover:text-[#FF385C] transition-colors flex items-center gap-2 group"
                            >
                                <span className="text-[10px] uppercase font-bold tracking-widest group-hover:underline">Terminate Link</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Iframe */}
                        <div className="w-full flex-1 bg-black relative">
                            {/* Loading state behind iframe */}
                            <div className="absolute inset-0 flex flex-col justify-center items-center text-[#00A699]">
                                <div className="animate-spin rounded-none h-12 w-12 border-t-2 border-b-2 border-[#00A699] mb-4"></div>
                                <p className="text-[10px] font-mono uppercase tracking-widest animate-pulse">Establishing Neural Link to 3D Space...</p>
                            </div>

                            <iframe
                                src="https://my.matterport.com/show/?m=SRxWuxy7D6Q&play=1&qs=1"
                                className="absolute inset-0 w-full h-full border-none z-10"
                                allowFullScreen
                                allow="xr-spatial-tracking"
                            />
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
