import "@Muster/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  // The dev tools button defaults to bottom-left, which on this console lands on
  // top of the last fleet row: MST-02, the aircraft on 12 percent. Every corner
  // of an ops screen is occupied, so there is nowhere to move it to. Off.
  devIndicators: false,
};

export default nextConfig;
