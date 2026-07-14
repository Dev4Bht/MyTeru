import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DrukSave — Helping Bhutan Save Smarter",
    short_name: "DrukSave",
    description: "Bhutan's AI-powered personal financial companion.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf3e4",
    theme_color: "#f0a629",
    icons: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
