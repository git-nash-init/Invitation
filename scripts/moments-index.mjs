// Writes index.html for each celebration design (private-templates/<slug>/), so the nine pages
// stay identical apart from their title, fonts and theme colour.
//   node scripts/moments-index.mjs
import fs from "node:fs";
import path from "node:path";

const DESIGNS = JSON.parse(fs.readFileSync(path.resolve("private-templates/_moments/designs.json"), "utf8"));

for (const d of DESIGNS) {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${d.name}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="${d.theme}">
  <base href="./">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${d.fonts}&display=swap">
  <link rel="stylesheet" href="../_platform/toolbar.css">
  <link rel="stylesheet" href="../_platform/rsvp.css">
  <link rel="stylesheet" href="../_platform/music.css">
  <link rel="stylesheet" href="../_moments/engine.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="mo-root"></div>
  <script>window.BalconyRsvpWords = { wish: ${JSON.stringify(d.wish)}, wishLabel: "Message or wishes" };</script>
  <script src="design.js"></script>
  <script src="../_platform/toolbar.js"></script>
  <script src="../_platform/music.js"></script>
  <script src="../_moments/engine.js"></script>
  <script src="../_platform/rsvp.js"></script>
  <script>
    if (window.BalconyMusic && typeof window.BalconyMusic.mount === 'function') {
      window.BalconyMusic.mount(window.Moments);
    }
  </script>
</body>
</html>
`;
  const dir = path.resolve("private-templates", d.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  console.log("wrote", d.slug);
}
