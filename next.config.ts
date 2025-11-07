//import MillionLint from "@million/lint";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  allowedDevOrigins: ["192.168.0.209"]
};

export default nextConfig;
/* export default MillionLint.next({
  enabled: true,
  rsc: true
})(nextConfig); */