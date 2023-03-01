import type { APIContext, AstroGlobal } from "astro";
import { getSupabase } from "../db";

const isDev = import.meta.env.DEV;

export async function updateProfile(authorId: string, profile_picture: string) {
  return await _updateProfile(authorId, profile_picture);
}

export async function updateProfileSSR(
  authorId: string,
  profile_picture: string,
  context: APIContext | AstroGlobal
) {
  return await _updateProfile(authorId, profile_picture, context);
}

async function _updateProfile(
  authorId: string,
  profile_picture: string,
  context?: APIContext | AstroGlobal
) {
  const supabase = getSupabase(context);

  const { data, error } = await supabase
    .from("profile")
    .update({ profile_picture })
    .eq("user_id", authorId)
    .select();

  if (!error) return data[0];
  if (isDev) console.error("error", error);
  return;
}
