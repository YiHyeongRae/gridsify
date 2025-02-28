// vite.config.ts
import * as path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, "src/lib/index.tsx"),
            name: "index",
            fileName: "index",
            formats: ["es", "umd", "cjs"],
        },
        rollupOptions: {
            external: ["react"],
            output: {
                globals: {
                    react: "React",
                },
            },
        },
        commonjsOptions: {
            esmExternals: ["react"],
        },
    },
    plugins: [dts()],
});
