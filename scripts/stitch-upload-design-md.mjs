import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { StitchToolClient } from "@google/stitch-sdk";

const apiKey = process.env.STITCH_API_KEY?.trim();
const projectId = process.argv[2] || "10585559960028075128";
if (!apiKey) {
  console.error("STITCH_API_KEY missing");
  process.exit(1);
}

const mdPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "Take-Bring",
  "_local-plans",
  "STITCH-DASHBOARD-PROMPT.md",
);

const client = new StitchToolClient({ apiKey, timeout: 300_000 });
const md = await readFile(mdPath, "utf8");

console.log("Uploading design md to project", projectId, "chars=", md.length);
try {
  const r = await client.callTool("upload_design_md", {
    projectId,
    designMd: md.slice(0, 100_000),
  });
  console.log("upload result:", JSON.stringify(r).slice(0, 600));
} catch (e) {
  console.log("upload_design_md failed:", e.message);
  try {
    const r2 = await client.callTool("create_design_system_from_design_md", {
      projectId,
      designMd: md.slice(0, 50_000),
    });
    console.log("from_md result:", JSON.stringify(r2).slice(0, 600));
  } catch (e2) {
    console.log("create_design_system_from_design_md failed:", e2.message);
  }
}
await client.close();
