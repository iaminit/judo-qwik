/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for the Google Cloud Run server when building for production.
 *
 * Learn more about the Cloud Run integration here:
 * - https://qwik.builder.io/docs/deployments/gcp-cloud-run/
 *
 */
import { createQwikCity } from "@builder.io/qwik-city/middleware/node";
import qwikCityPlan from "@qwik-city-plan";
import render from "./entry.ssr";
import express from "express";
import compression from "compression";

// Create the Qwik City Node middleware
const { router, notFound } = createQwikCity({ render, qwikCityPlan });

// Allow for a custom express server, or use the default one.
const app = express();

// Enable gzip compression
app.use(compression());

// Static asset handlers
// https://expressjs.com/en/starter/static-files.html
app.use(
  `/build`,
  express.static(`dist/build`, { immutable: true, maxAge: "1y" })
);
app.use(express.static(`dist`, { immutable: true, maxAge: "1y" }));

// Use Qwik City's page and endpoint request handler
app.use(router);

// Use Qwik City's 404 handler
app.use(notFound);

// Start the express server
const port = parseInt(process.env.PORT || "8080");
const server = app.listen(port, () => {
  console.log(`Server started: http://localhost:${port}/`);
});
