import type { APIContext, AstroGlobal } from "astro";
import { getSupabase } from "../db";

const isDev = import.meta.env.DEV;

export async function getUserProfile(id: string) {
  return await _getUserProfile(id);
}

export async function getUserProfileSSR(
  id: string,
  context: APIContext | AstroGlobal
) {
  return await _getUserProfile(id, context);
}

async function _getUserProfile(id: string, context?: APIContext | AstroGlobal) {
  const supabase = getSupabase(context);

  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", id)
    .limit(1);
  if (!error) return data[0];
  if (isDev) console.error("error", error);
  return;
}
