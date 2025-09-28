import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

// Yapılandırmayı yeni config dosyasından al
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

/**
 * Supabase'in supabaseConfig.ts dosyası aracılığıyla yapılandırılıp yapılandırılmadığını kontrol eder.
 * @returns {boolean} Yapılandırılmışsa true, değilse false döner.
 */
export const isSupabaseConfigured = (): boolean => {
  // Varsayılan yer tutucu değerlerin değiştirilip değiştirilmediğini kontrol et
  const urlIsDefault = !supabaseUrl || supabaseUrl.includes('YOUR_SUPABASE_URL');
  const keyIsDefault = !supabaseAnonKey || supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY');
  
  return !urlIsDefault && !keyIsDefault;
};

let supabaseInstance: SupabaseClient | null = null;

// This function acts as a singleton getter for the Supabase client.
// It will only attempt to create a client if one doesn't exist.
const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }
    
    // The createClient function will throw an error if the URL is missing,
    // which is the desired behavior if this code path is reached improperly.
    supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!);
    return supabaseInstance;
};

// A proxy to lazy-initialize the client on first property access.
// This prevents the `createClient` error from happening on module load.
const handler = {
    get(target: any, prop: any) {
        // We only attempt to get/create the client when a property is accessed.
        // If not configured, App.tsx should prevent any component from accessing it.
        // If it's accessed anyway, Supabase's own error will be thrown.
        const client = getSupabase();
        const property = Reflect.get(client, prop);

        if (typeof property === 'function') {
            return property.bind(client);
        }
        return property;
    }
};

export const supabase = new Proxy({} as SupabaseClient, handler);


/**
 * Oturum açmış kullanıcının tam profilini 'users' tablosundan alır.
 * @returns {Promise<User | null>} Kullanıcı profilini veya null döner.
 */
export const fetchUserProfile = async (): Promise<User | null> => {
    if (!isSupabaseConfigured()) {
        return null;
    }
    
    // FIX: Cast to 'any' to bypass potential type mismatches in Supabase auth client.
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (session?.user) {
        const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
        if (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
        return userProfile as User;
    }
    return null;
};