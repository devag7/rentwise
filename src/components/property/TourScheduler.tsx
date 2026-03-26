'use client'

import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
    propertyId: number;
}

export default function TourScheduler({ propertyId }: Props) {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);

    const timeSlots = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"];

    const handleSchedule = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedDate || !selectedTime) {
            toast.error("Select a complete temporal coordinate to schedule.");
            return;
        }

        setIsScheduling(true);
        const processingToast = toast.loading('Syncing calendar matrix...');

        // Mock scheduling delay
        setTimeout(() => {
            toast.success('Tour Scheduled Successfully.', { id: processingToast });
            setIsScheduling(false);
            setIsScheduled(true);
        }, 1500);
    };

    if (isScheduled) {
        return (
            <div className="mb-10 bg-[#00A699]/10 border border-[#00A699]/30 p-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#00A699]/20 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00A699]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h4 className="text-white font-bold tracking-widest uppercase mb-1">Tour Confirmed</h4>
                <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase mb-4">
                    {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
                </p>
                <button
                    onClick={() => {
                        setSelectedDate('');
                        setSelectedTime('');
                        setIsScheduled(false);
                    }}
                    className="text-[#00A699] hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest"
                >
                    Reschedule
                </button>
            </div>
        );
    }

    return (
        <div className="mb-10 bg-[#0A0A0A] border border-white/5 p-6 relative overflow-hidden">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Book Guided Property Tour
            </h4>

            <form onSubmit={handleSchedule} className="space-y-6">
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Select Date</label>
                    <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]} // Cannot schedule in the past
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 bg-[#111] border border-white/20 text-white focus:outline-none focus:border-[#00A699] font-mono text-sm tracking-widest transition-colors"
                        required
                    />
                </div>

                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Select Time Window</label>
                    <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map(time => (
                            <button
                                key={time}
                                type="button"
                                onClick={() => setSelectedTime(time)}
                                className={`py-2 text-[10px] font-bold font-mono tracking-widest transition-colors ${selectedTime === time ? 'bg-[#00A699] text-white border border-[#00A699] shadow-[0_0_15px_rgba(0,166,153,0.3)]' : 'bg-[#111] text-gray-500 border border-white/10 hover:border-[#00A699]/50 hover:text-white'}`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isScheduling}
                    className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest transition-all duration-300 hover:bg-[#00A699] hover:text-white disabled:opacity-50 mt-4"
                >
                    {isScheduling ? 'Booking Protocol Syncing...' : 'Confirm Synchronization'}
                </button>
            </form>
        </div>
    );
}
