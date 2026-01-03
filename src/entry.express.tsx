/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for the Express HTTP server when building for production.
 *
 * Learn more about Node.js server adapters here:
 * - https://qwik.dev/docs/deployments/node/
 *
 */
import {
  createQwikCity,
  type PlatformNode,
} from "@builder.io/qwik-city/middleware/node";
import qwikCityPlan from "@qwik-city-plan";
import { manifest } from "@qwik-client-manifest";
import render from "./entry.ssr";
import express from "express";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import compression from "compression";
import { createProxyMiddleware } from "http-proxy-middleware";

declare global {
  interface QwikCityPlatform extends PlatformNode { }
}

// Directories where the static assets are located
const distDir = join(fileURLToPath(import.meta.url), "..", "..", "dist");
const buildDir = join(distDir, "build");

// Allow for dynamic port
const PORT = process.env.PORT ?? 3000;

// Create the Qwik City Node middleware
const { router, notFound, staticFile } = createQwikCity({
  render,
  qwikCityPlan,
  manifest,
});

// Create the express server
const app = express();

// Log requests for debugging 403
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.startsWith('/api')) {
    console.log(`[Express] POST ${req.path} - Origin: ${req.headers.origin}, Host: ${req.headers.host}`);
  }
  next();
});

// Enable gzip compression
app.use(compression());

// Proxy PocketBase Admin and API
app.use(
  createProxyMiddleware({
    pathFilter: (path) => {
      // Proxy everything in /_ (Admin UI)
      if (path.startsWith('/_')) return true;
      // Proxy /api EXCEPT our local Qwik API routes
      if (path.startsWith('/api')) {
        const localApiRoutes = ['/api/local-media', '/api/media', '/api/upload', '/api/delete-media'];
        return !localApiRoutes.some(route => path.startsWith(route));
      }
      return false;
    },
    target: "http://127.0.0.1:8090",
    changeOrigin: true,
  })
);

// Static asset handlers
app.use(`/build`, express.static(buildDir, { immutable: true, maxAge: "1y" }));
app.use(express.static(distDir, { redirect: false }));

// Add specific routes for media
// 1. Static media from the Docker image (read-only system images)
app.use("/media", express.static(join(distDir, "media")));

// 2. Persistent media from the Cloud Storage bucket
if (process.env.NODE_ENV === "production") {
  const persistentRoot = "/app/pb_data";
  // Prioritize the new organized /media folder
  app.use("/media", express.static(join(persistentRoot, "media")));
  // Fallback to the root bucket folders (audio, bacheca, home, icons)
  app.use("/media", express.static(persistentRoot));
}

// Use Qwik City's page and endpoint request handler
app.use(router);

// Use Qwik City's 404 handler
app.use(notFound);

// Start the express server
app.listen(PORT, () => {
  /* eslint-disable */
  console.log(`Server started: http://localhost:${PORT}/`);
});
