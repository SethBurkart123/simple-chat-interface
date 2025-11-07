//import MillionLint from "@million/lint";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
/* export default MillionLint.next({
  enabled: true,
  rsc: true
})(nextConfig); */