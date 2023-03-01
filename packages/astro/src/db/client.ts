import { createClient } from "@supabase/supabase-js";
import { getApiKey, supabaseUrl } from "../utils/consts";

const supabaseKey = (await getApiKey()) || "";

export const supabase = createClient(supabaseUrl, supabaseKey);
