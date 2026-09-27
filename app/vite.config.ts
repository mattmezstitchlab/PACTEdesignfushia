import { defineConfig, loadEnv, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  // @ts-ignore — module JS sans déclarations de types (serveur local Node)
  const { pacteApiPlugin } = await import('./server/vitePlugin.js');
  const plugins = [react(), tailwindcss(), pacteApiPlugin()];
  try {
    // @ts-ignore — greffon optionnel d'attribution de sources (environnement d'édition)
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {}

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  const config: UserConfig = {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
    server: { host: true, allowedHosts: true },
    preview: { host: true, allowedHosts: true },
  };
  return config;
})
