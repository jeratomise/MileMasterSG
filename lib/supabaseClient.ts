
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gaxfdvmqgflsqommdeth.supabase.co';
const supabaseKey = 'sb_publishable_3Qswi2JBeIo7163whoCAoA_dqDi8gAx';

export const supabase = createClient(supabaseUrl, supabaseKey);
