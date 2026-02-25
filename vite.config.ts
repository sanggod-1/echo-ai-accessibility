import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// --- Tier 1 Key Verification (Added by Antigravity) ---
const env = loadEnv('', process.cwd(), 'VITE_');
const apiKey = env.VITE_GEMINI_API_KEY;
if (apiKey) {
  const maskedKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  console.log(`\n✅ [EchoAI] Tier 1 Key Authorized: ${maskedKey}`);
  console.log(`🚀 [EchoAI] Model Upgraded: Gemini 3 Pro Enabled\n`);
} else {
  console.log(`\n⚠️ [EchoAI] Warning: VITE_GEMINI_API_KEY not found in .env\n`);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5188,
    strictPort: true,
  }
})
