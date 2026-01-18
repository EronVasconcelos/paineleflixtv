
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hcieyevaerxynhobcsgd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tVZ1fgSc-JPzfOFEuUCiHQ_xaE_CvMi';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);