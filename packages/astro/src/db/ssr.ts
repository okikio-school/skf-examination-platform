import { getApiKey, supabaseUrl } from "../utils/consts";
import {
  CookieOptions,
  createServerSupabaseClient as _createServerSupabaseClient,
} from "@supabase/auth-helpers-shared";
import type { AstroGlobal, APIContext } from "astro";
import type { Database } from "./database.types";

const supabaseKey = (await getApiKey()) || "";

export const supabaseSSR = (context: APIContext | AstroGlobal) =>
  createServerSupabaseClient(supabaseUrl, supabaseKey, context);

function createServerSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string,
  context: APIContext | AstroGlobal,
  {
    cookieOptions,
  }: {
    cookieOptions?: CookieOptions;
  } = {}
) {
  return _createServerSupabaseClient<Database>({
    supabaseUrl,
    supabaseKey,
    getCookie(name) {
      return context.cookies.get(name).value;
    },
    setCookie(name, value, options) {
      context.cookies.set(name, value, {
        ...options,
        httpOnly: true,
      });
    },
    getRequestHeader: (key) => {
      return context.request.headers.get(key) ?? undefined;
    },
    cookieOptions,
  });
}
