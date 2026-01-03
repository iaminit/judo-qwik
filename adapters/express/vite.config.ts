import { extendConfig } from "@builder.io/qwik-city/vite";
import baseConfig from "../../vite.config";
import { nodeServerAdapter } from "@builder.io/qwik-city/adapters/node-server/vite";

export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["src/entry.express.tsx", "@qwik-city-plan"],
      },
      outDir: "./.adapters/express",
    },
    plugins: [
      nodeServerAdapter({
        name: "express",
      }),
    ],
  };
});
