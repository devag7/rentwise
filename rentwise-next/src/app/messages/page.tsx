'use client'

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

interface Message {
    message_id: number;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export default function Messages() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialContactId = searchParams.get('user');

    const [userId, setUserId] = useState<string | null>(null);
    const [contacts, setContacts] = useState<{ id: string, name: string, lastMessage: string }[]>([]);
    const [activeContact, setActiveContact] = useState<string | null>(initialContactId);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                setUserId(session.user.id);
            }
        };
        fetchUser();
    }, [supabase, router]);

    const fetchContacts = useCallback(async () => {
        if (!userId) return;

        // Fetch all messages where user is sender or receiver
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (!error && data) {
            const contactMap = new Map<string, { id: string, name: string, lastMessage: string }>();

            if (initialContactId && !contactMap.has(initialContactId)) {
                contactMap.set(initialContactId, {
                    id: initialContactId,
                    name: `User ${initialContactId.substring(0, 6)}`,
                    lastMessage: 'Tap to send a message'
                });
            }

            data.forEach(msg => {
                const otherUser = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
                if (!contactMap.has(otherUser)) {
                    contactMap.set(otherUser, {
                        id: otherUser,
                        name: `User ${otherUser.substring(0, 6)}`,
                        lastMessage: msg.content
                    });
                }
            });

            setContacts(Array.from(contactMap.values()));
            if (!activeContact && contactMap.size > 0) {
                if (!initialContactId) setActiveContact(Array.from(contactMap.values())[0].id);
            }
        }
        setLoading(false);
    }, [supabase, userId, activeContact, initialContactId]);

    const fetchMessages = useCallback(async () => {
        if (!userId || !activeContact) return;

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${activeContact}),and(sender_id.eq.${activeContact},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setMessages(data as Message[]);
        }
    }, [supabase, userId, activeContact]);

    useEffect(() => {
        if (userId) fetchContacts();
    }, [userId, fetchContacts]);

    useEffect(() => {
        if (userId && activeContact) fetchMessages();
    }, [userId, activeContact, fetchMessages]);

    // Real-time subscription
    useEffect(() => {
        if (!userId) return;

        const subscription = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new as Message;
                    if (
                        (newMsg.sender_id === userId && newMsg.receiver_id === activeContact) ||
                        (newMsg.sender_id === activeContact && newMsg.receiver_id === userId)
                    ) {
                        setMessages(prev => [...prev, newMsg]);
                    }
                    // Refresh contacts to update last messages
                    fetchContacts();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [supabase, userId, activeContact, fetchContacts]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userId || !activeContact) return;

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: userId,
                receiver_id: activeContact,
                content: newMessage.trim(),
            });

        if (!error) {
            setNewMessage('');
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center pt-24"><div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-[#FF385C]"></div></div>;
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-8 px-4 md:px-6 selection:bg-[#FF385C] selection:text-white">
            <div className="max-w-6xl mx-auto h-[80vh] flex border border-white/10 bg-[#111] overflow-hidden rounded-none shadow-2xl">

                {/* Contacts Sidebar */}
                <div className={`w-full md:w-1/3 border-r border-white/10 flex flex-col ${activeContact ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-6 border-b border-white/10 bg-[#050505]">
                        <h2 className="text-sm font-bold tracking-widest text-[#FF385C] uppercase flex items-center gap-3">
                            <span className="w-2 h-2 bg-[#FF385C] rounded-full animate-pulse"></span>
                            Secure Comms Link
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                        {contacts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 font-mono text-xs uppercase tracking-widest">
                                No active communication protocols discovered.
                            </div>
                        ) : (
                            contacts.map(contact => (
                                <button
                                    key={contact.id}
                                    onClick={() => setActiveContact(contact.id)}
                                    className={`w-full text-left p-5 border-b border-white/5 transition-colors focus:outline-none ${activeContact === contact.id ? 'bg-white/10 border-l-[4px] border-l-[#FF385C]' : 'hover:bg-white/5 border-l-[4px] border-l-transparent'}`}
                                >
                                    <h4 className="font-bold text-sm tracking-tight mb-1 truncate">{contact.name}</h4>
                                    <p className="text-gray-500 text-xs font-mono truncate">{contact.lastMessage}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`w-full md:w-2/3 flex flex-col bg-[#0A0A0A] relative ${!activeContact ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                    {!activeContact ? (
                        <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-800 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Select a channel to transmit.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 border-b border-white/10 bg-[#050505] flex items-center justify-between z-10">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setActiveContact(null)} className="md:hidden text-gray-500 pr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <h3 className="font-bold tracking-widest uppercase text-sm">
                                        {contacts.find(c => c.id === activeContact)?.name || `User ${activeContact.substring(0, 6)}`}
                                    </h3>
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-[#00A699] rounded-full"></span>
                                    Encrypted
                                </span>
                            </div>

                            {/* Messages Scroll Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent relative z-10" id="messages-container">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 font-mono text-xs uppercase tracking-widest space-y-2 opacity-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        <p>Link Established.</p>
                                        <p>Begin transmission.</p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const isMine = msg.sender_id === userId;
                                        return (
                                            <div key={msg.message_id || index} className={`flex w-full animate-fade-in ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] md:max-w-[70%] p-4 ${isMine ? 'bg-white text-black rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-none shadow-lg' : 'bg-[#1A1A1A] border border-white/10 text-white rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none'}`}>
                                                    <p className="text-sm font-medium leading-relaxed break-words">{msg.content}</p>
                                                    <p className={`text-[10px] mt-2 font-mono uppercase tracking-widest text-right ${isMine ? 'text-gray-500' : 'text-gray-600'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-white/10 bg-[#050505] z-10 relative">
                                <form onSubmit={handleSendMessage} className="flex gap-4">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Transmit data packet..."
                                        className="flex-1 bg-transparent border-b border-white/20 px-4 py-3 focus:outline-none focus:border-[#FF385C] text-sm font-mono transition-colors text-white placeholder-gray-700"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="px-6 py-3 bg-[#FF385C] hover:bg-white hover:text-black transition-colors font-bold text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
