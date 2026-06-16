import { createClient } from '@supabase/supabase-js';

// Tunasafiri moja kwa moja bila kutumia .env ili kuondoa "Failed to fetch"
const supabaseUrl = 'https://ivzvtqouphvxdamdnmii.supabase.co';
const supabaseAnonKey = 'sb_publishable_zEMYO4pVGO61BzzieFreng_8XpWRG0B';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);