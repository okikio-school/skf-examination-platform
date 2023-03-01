import { supabase } from "../client";

export async function registerUser(
  email: string,
  password: string,
  name: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        personalized_name: name,
      },
    },
  });

  if (!error) return { data, error: false };

  return { data, error: true, message: error.message };
}
