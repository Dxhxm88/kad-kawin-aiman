/* Runs on Netlify before each deploy (see netlify.toml).
   WhatsApp needs a full link for the preview image, so this swaps __SITE_URL__ in
   index.html for the site's real address. Netlify provides it as the URL env variable
   (your custom domain if you set one, otherwise https://<name>.netlify.app). */
import { readFileSync, writeFileSync } from "node:fs";

const url = (process.env.URL || "").replace(/\/$/, "");
if (!url) {
  console.log("site-url: URL not set (not on Netlify?), leaving index.html as is");
} else {
  const html = readFileSync("index.html", "utf8");
  writeFileSync("index.html", html.replaceAll("__SITE_URL__", url));
  console.log(`site-url: link preview uses ${url}`);
}
