/**
 * Turbopack resolves maplibre's `new Worker(new URL(...), {type:'module'})` to an
 * empty string, so the worker never starts and GeoJSON sources silently never
 * load: raster tiles paint, nothing else does. Serving the worker from /public
 * and pointing setWorkerUrl at it sidesteps bundler resolution entirely.
 *
 * Copied on predev and prebuild so the files cannot drift from the installed
 * maplibre-gl version.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/dist/maplibre-gl.mjs"));
const out = join(import.meta.dirname, "..", "public", "maplibre");

await mkdir(out, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  await copyFile(join(dist, file), join(out, file));
}
console.log(`maplibre worker copied to public/maplibre from ${dist}`);
