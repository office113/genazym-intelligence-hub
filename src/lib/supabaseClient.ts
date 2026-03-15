import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pnxmyvulzyphzojubptx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QcJi3be5HmvGPh2r3T6MMQ_y_SWQqG9";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
