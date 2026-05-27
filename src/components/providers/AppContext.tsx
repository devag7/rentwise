'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AppContextType {
    user: User | null;
    session: Session | null;
    role: 'tenant' | 'landlord' | null;
    isLoading: boolean;
}

const AppContext = createContext<AppContextType>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<'tenant' | 'landlord' | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const initializeAuth = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (!error && session) {
                setSession(session);
                setUser(session.user);
                setRole(session.user.user_metadata?.role || null);
            }
            setIsLoading(false);
        };

        initializeAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            setUser(session?.user || null);
            setRole(session?.user?.user_metadata?.role || null);
            setIsLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase.auth]);

    return (
        <AppContext.Provider value={{ user, session, role, isLoading }}>
            {children}
        </AppContext.Provider>
    );
}

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
