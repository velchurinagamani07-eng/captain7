import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          motion: ["framer-motion"],
          charts: ["recharts"],
          swiper: ["swiper/react", "swiper/modules"]
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
