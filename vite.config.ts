import { defineConfig as defineViteConfig } from "vite";
import netlify from "@netlify/vite-plugin-tanstack-start";
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";

export default defineViteConfig(async (env) => {
  const isNetlify = Boolean(process.env.NETLIFY);
  const config = await defineLovableConfig({
    tanstackStart: {
      // Keep the app's SSR error wrapper as the TanStack Start server entry.
      server: { entry: "server" },
    },
    // Netlify's TanStack Start plugin configures the server runtime itself.
    // Keep Lovable's default Nitro target for builds outside Netlify.
    nitro: isNetlify ? false : undefined,
  })(env);

  if (isNetlify) {
    config.plugins = [...(config.plugins ?? []), netlify()];
  }
  return config;
});
