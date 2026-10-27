'use client'

import { createClient } from '@/utils/supabase/client';

/**
 * One favorites query per user per page load, shared by every card
 * (previously each card ran its own auth + favorites round trip).
 */
let cache: { userId: string; ids: Promise<Set<number>> } | null = null;

export function loadSavedIds(userId: string): Promise<Set<number>> {
    if (cache?.userId === userId) return cache.ids;
    const ids = Promise.resolve(
        createClient().from('favorites').select('property_id').eq('user_id', userId)
    ).then(({ data }) => new Set((data || []).map((r: { property_id: number }) => r.property_id)))
        .catch(() => new Set<number>());
    cache = { userId, ids };
    return ids;
}

export async function setSaved(userId: string, propertyId: number, saved: boolean): Promise<boolean> {
    const supabase = createClient();
    const { error } = saved
        ? await supabase.from('favorites').insert({ user_id: userId, property_id: propertyId })
        : await supabase.from('favorites').delete().eq('user_id', userId).eq('property_id', propertyId);
    if (error) return false;
    const set = await loadSavedIds(userId);
    if (saved) set.add(propertyId);
    else set.delete(propertyId);
    return true;
}
