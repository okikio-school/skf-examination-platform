/// <reference types="astro/client" />

/// <reference types="svelte" />
/// <reference types="unplugin-icons/types/svelte" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
