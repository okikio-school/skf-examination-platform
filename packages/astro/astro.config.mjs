import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
import Icons from "unplugin-icons/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  output: "server",
  adapter: vercel(),
  vite: {
    optimizeDeps: {
      // Add both @codemirror/state and @codemirror/view to included deps for optimization
      include: ["@codemirror/state", "@codemirror/view"],
    },
    plugins: [
      Icons({
        // experimental
        autoInstall: true,
        compiler: "svelte",
      }),
    ],
  },
});
