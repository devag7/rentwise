'use client'

import { useState, useEffect, useCallback, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/ui/Container';

interface Message {
    message_id: number;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

function MessagesContent() {
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
        if (!userId) return;
        // Defer to a microtask so state updates happen asynchronously
        // (avoids cascading renders from sync setState in effects)
        void Promise.resolve().then(fetchContacts);
    }, [userId, fetchContacts]);

    useEffect(() => {
        if (!userId || !activeContact) return;
        void Promise.resolve().then(fetchMessages);
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
        return <LoadingScreen />;
    }

    const activeName = activeContact
        ? contacts.find(c => c.id === activeContact)?.name || `User ${activeContact.substring(0, 6)}`
        : '';

    return (
        <div className="bg-surface-2 pb-10 pt-28 sm:pt-32">
            <Container>
                <h1 className={`text-title-1 ${activeContact ? 'hidden md:block' : ''}`}>Messages</h1>

                <div className="card mt-6 flex h-[calc(100dvh-12rem)] min-h-[28rem] overflow-hidden sm:h-[calc(100dvh-15rem)]">

                    {/* Conversation list */}
                    <div className={`w-full flex-col border-separator md:flex md:w-80 md:shrink-0 md:border-r ${activeContact ? 'hidden md:flex' : 'flex'}`}>
                        <div className="border-b border-separator px-5 py-4">
                            <h2 className="text-headline">Conversations</h2>
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden">
                            {contacts.length === 0 ? (
                                <div className="px-6 py-14 text-center">
                                    <p className="text-title-3">No conversations yet</p>
                                    <p className="mt-2 text-callout text-label-2">Message a landlord from any listing to start one.</p>
                                    <Link href="/properties" className="btn btn-primary btn-sm mt-6">Browse flats</Link>
                                </div>
                            ) : (
                                <ul className="divide-y divide-separator">
                                    {contacts.map(contact => {
                                        const selected = activeContact === contact.id;
                                        return (
                                            <li key={contact.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveContact(contact.id)}
                                                    aria-current={selected ? 'true' : undefined}
                                                    className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors ${selected ? 'bg-fill' : 'hover:bg-fill'}`}
                                                >
                                                    <Avatar />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-headline">{contact.name}</span>
                                                        <span className="block truncate text-footnote text-label-2">{contact.lastMessage}</span>
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Thread */}
                    <div className={`min-w-0 flex-1 flex-col ${!activeContact ? 'hidden items-center justify-center md:flex' : 'flex'}`}>
                        {!activeContact ? (
                            <div className="px-6 text-center">
                                <p className="text-title-3">Choose a conversation</p>
                                <p className="mt-2 text-callout text-label-2">Pick someone on the left to see your messages.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 border-b border-separator px-3 py-3 md:px-5">
                                    <button
                                        type="button"
                                        onClick={() => setActiveContact(null)}
                                        className="flex h-9 w-9 items-center justify-center rounded-full text-accent transition-colors hover:bg-fill md:hidden"
                                        aria-label="Back to conversations"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <Avatar small />
                                    <h2 className="truncate text-headline">{activeName}</h2>
                                </div>

                                <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6" id="messages-container">
                                    {messages.length === 0 ? (
                                        <div className="flex h-full flex-col items-center justify-center text-center">
                                            <p className="text-headline">No messages yet</p>
                                            <p className="mt-1 text-callout text-label-2">Say hello and ask about the flat.</p>
                                        </div>
                                    ) : (
                                        <ul className="space-y-1.5">
                                            {messages.map((msg, index) => {
                                                const isMine = msg.sender_id === userId;
                                                return (
                                                    <li key={msg.message_id || index} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 md:max-w-[65%] ${isMine ? 'bg-accent text-on-accent' : 'bg-fill text-label'}`}>
                                                            <p className="whitespace-pre-wrap break-words text-callout">{msg.content}</p>
                                                            <p className={`mt-0.5 text-right text-caption num ${isMine ? 'opacity-75' : 'text-label-2'}`}>
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>

                                <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-separator p-3">
                                    <label htmlFor="message-input" className="sr-only">Message</label>
                                    <input
                                        id="message-input"
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Message"
                                        autoComplete="off"
                                        className="field flex-1 rounded-full"
                                    />
                                    <button type="submit" disabled={!newMessage.trim()} className="btn btn-primary btn-sm">
                                        Send
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </Container>
        </div>
    );
}

function Avatar({ small = false }: { small?: boolean }) {
    return (
        <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full bg-fill-strong text-label-2 ${small ? 'h-8 w-8' : 'h-10 w-10'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={small ? 'h-4 w-4' : 'h-5 w-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0A17.9 17.9 0 0112 21.75c-2.68 0-5.22-.58-7.5-1.65z" />
            </svg>
        </span>
    );
}

function LoadingScreen() {
    return (
        <div className="flex min-h-dvh items-center justify-center bg-surface-2 pt-24" role="status" aria-label="Loading">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-fill-strong border-t-label-2" />
        </div>
    );
}

export default function Messages() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <MessagesContent />
        </Suspense>
    );
}
