import { supabase } from "../client";
import { supabaseUrl } from "../../utils/consts";
import { nanoid } from "nanoid/async";

const isDev = import.meta.env.DEV;

const storageUrl = `${supabaseUrl}/storage/v1/object/public`;

export async function uploadProfilePicture(file: File, userId: string) {
  const extension = file.type.replace(/(.*)\//g, "");

  const randomId = await nanoid();

  // remove the old profile picture
  const { data: list, error: listErr } = await supabase.storage
    .from("profile")
    .list(`user-${userId}/profile/`);

  if (!listErr) {
    for (const item of list) {
      const { error } = await supabase.storage
        .from("profile")
        .remove([`user-${userId}/profile/${item.name}`]);
      if (isDev && error) {
        console.error("error", error);
      }
    }
  }

  const { data, error } = await supabase.storage
    .from("profile")
    .upload(`user-${userId}/profile/${randomId}.${extension}`, file, {
      upsert: true,
    });

  if (error) {
    if (isDev) console.error("error", error);
    return;
  }

  return data.path;
}

export function getProfilePicture(path: string) {
  return `${storageUrl}/profile/${path}`;
}
