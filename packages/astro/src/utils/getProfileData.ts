import type { User } from "@supabase/supabase-js";

export function getUserName(user: User) {
  if (user.user_metadata.personalized_name) {
    return user.user_metadata.personalized_name;
  }

  if (user.user_metadata.full_name) {
    return user.user_metadata.full_name;
  }

  return "No name found";
}

export function getUserEmail(user: User) {
  if (user.email) return user.email;

  return "Email not found";
}
