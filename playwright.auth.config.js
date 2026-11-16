import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/auth",
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5176/La_Viandita/",
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5176 --strictPort",
    url: "http://127.0.0.1:5176/La_Viandita/",
    reuseExistingServer: false,
    env: {
      VITE_DATA_MODE: "supabase",
      VITE_BASE_PATH: "/La_Viandita/",
      VITE_ROUTER_MODE: "hash",
    },
  },
});
