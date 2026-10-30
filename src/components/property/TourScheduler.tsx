'use client'

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import { useAppContext } from '@/components/providers/AppContext';

interface Props {
    propertyId: number;
    /** Owner of an owner-listed flat; they get the request as a message. */
    landlordId?: string | null;
    address?: string;
}

/** "09:00 AM" → "09:00" (24h) */
function to24h(slot: string): string {
    const [, h, m, ap] = slot.match(/^(\d{2}):(\d{2}) (AM|PM)$/) ?? [];
    let hour = Number(h) % 12;
    if (ap === 'PM') hour += 12;
    return `${String(hour).padStart(2, '0')}:${m}`;
}

export default function TourScheduler({ propertyId, landlordId, address }: Props) {
    const { user, role } = useAppContext();
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);

    const timeSlots = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"];

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedDate || !selectedTime) {
            toast.error("Pick a date and a time for the visit.");
            return;
        }

        if (!user || role !== 'tenant') {
            toast.error('Sign in as a tenant to request a visit.');
            return;
        }

        setIsScheduling(true);
        const supabase = createClient();
        // Slots are Bangalore time.
        const requested = `${selectedDate}T${to24h(selectedTime)}:00+05:30`;
        const { error } = await supabase.from('tours').insert({
            property_id: propertyId,
            tenant_id: user.id,
            requested_date: requested,
            notes: `Requested slot: ${selectedTime}`,
        });
        if (error) {
            setIsScheduling(false);
            toast.error('Could not send the request. Please try again.');
            return;
        }
        // Owners see requests in Messages; a failed message doesn't undo the request.
        if (landlordId && landlordId !== user.id) {
            const when = new Date(requested).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
            await supabase.from('messages').insert({
                sender_id: user.id,
                receiver_id: landlordId,
                property_id: propertyId,
                content: `Visit request${address ? ` for ${address}` : ''}: ${when}. Does that work for you?`,
            });
        }
        setIsScheduling(false);
        setIsScheduled(true);
        toast.success('Visit requested.');
    };

    if (isScheduled) {
        return (
            <section className="card pop-in flex flex-col items-center p-6 text-center" aria-live="polite">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-good/12 text-good">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-headline">Visit requested</h2>
                <p className="mt-1 text-callout text-label-2 num">
                    {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {selectedTime}
                </p>
                <p className="mt-1 text-footnote text-label-2">The owner will confirm in <Link href="/messages" className="link">Messages</Link>.</p>
                <button
                    onClick={() => {
                        setSelectedDate('');
                        setSelectedTime('');
                        setIsScheduled(false);
                    }}
                    className="link mt-3 text-callout"
                >
                    Request another time
                </button>
            </section>
        );
    }

    return (
        <section className="card p-6" aria-labelledby={`tour-heading-${propertyId}`}>
            <h2 id={`tour-heading-${propertyId}`} className="text-headline">Visit this flat</h2>

            <form onSubmit={handleSchedule} className="mt-4 space-y-5">
                <div>
                    <label htmlFor={`tour-date-${propertyId}`} className="field-label">Date</label>
                    <input
                        id={`tour-date-${propertyId}`}
                        type="date"
                        min={new Date().toISOString().split('T')[0]} // Cannot schedule in the past
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="field num"
                        required
                    />
                </div>

                <fieldset>
                    <legend className="field-label">Time</legend>
                    <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map(time => (
                            <button
                                key={time}
                                type="button"
                                onClick={() => setSelectedTime(time)}
                                aria-pressed={selectedTime === time}
                                className={`min-h-[36px] rounded-full px-2 text-footnote num transition-colors duration-200 ${selectedTime === time ? 'bg-accent font-semibold text-on-accent' : 'bg-fill text-label hover:bg-fill-strong'}`}
                            >
                                {time.replace(/^0/, '')}
                            </button>
                        ))}
                    </div>
                </fieldset>

                <button type="submit" disabled={isScheduling} className="btn btn-secondary w-full">
                    {isScheduling ? 'Sending…' : 'Request a visit'}
                </button>
                {(!user || role !== 'tenant') && (
                    <p className="text-center text-footnote text-label-2">
                        <Link href="/login/tenant" className="link">Sign in as a tenant</Link> to request a visit.
                    </p>
                )}
            </form>
        </section>
    );
}
