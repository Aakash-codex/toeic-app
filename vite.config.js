import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Set base to your GitHub repo name for GitHub Pages, e.g. "/ascent-toeic/"
// Keep "/" if deploying to Vercel/Netlify or a custom domain.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
