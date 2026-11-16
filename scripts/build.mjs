import { mkdir, rm, cp, readdir } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const name of await readdir("."))
  if (
    /\.(html|css|js|svg|xml|txt)$/.test(name) ||
    ["_headers", "app"].includes(name)
  )
    await cp(name, `dist/${name}`, { recursive: true });
console.log(
  "Static site and app shell built. Backend source, tests and configuration excluded.",
);
