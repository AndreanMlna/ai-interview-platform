import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    // @ts-expect-error vitest config
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./src/test/setup.ts",
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    "vendor-react": ["react", "react-dom", "react-router-dom"],
                    "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs", "@radix-ui/react-alert-dialog", "@radix-ui/react-dropdown-menu"],
                    "vendor-misc": ["axios", "jotai", "lucide-react", "react-hook-form"],
                },
            },
        },
    },
});
