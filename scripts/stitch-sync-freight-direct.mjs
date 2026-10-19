/**
 * Sync Freight Direct B2B screens from Stitch + generate any gaps.
 * Usage: node --env-file=.env scripts/stitch-sync-freight-direct.mjs
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Stitch, StitchToolClient, StitchError } from "@google/stitch-sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "_stitch-out", "freight-direct");
const PROJECT_ID = "9015715932474265506";

const apiKey = process.env.STITCH_API_KEY?.trim();
if (!apiKey) {
  console.error("STITCH_API_KEY missing");
  process.exit(1);
}

const client = new StitchToolClient({ apiKey, timeout: 300_000 });
const stitch = new Stitch(client);
const project = stitch.project(PROJECT_ID);

const BRAND = `
Take & Bring Business — EU freight marketplace (zipmend/DAGO/inTime model).
Shipper publishes load → carriers submit priced offers → shipper awards ONE offer.
Design system Freight Direct B2B: primary-container #ABC629, primary #556500, surface #f1fde5, ink #151e10, Geist font, light mode, Linear×Stripe density.
No purple, no dark mode, no neon.
`;

const GAPS = [
  {
    slug: "shipper-overview-mobile",
    deviceType: "MOBILE",
    prompt: `${BRAND}
MOBILE native shipper overview PWA: bottom tabs Overview/Loads/Alerts with lime active pill, KPI strip OPEN/BIDS/ASSIGNED, urgent bids banner, load cards with route waypoint Köln→München and Review Offers CTA, FAB New Load. App-like safe areas.`,
  },
  {
    slug: "admin-overview-desktop",
    deviceType: "DESKTOP",
    prompt: `${BRAND}
DESKTOP admin overview console: sidebar Admin, KPI cards Users / KYC pending / Open loads / Offers today, recent activity list. Freight Direct B2B tokens.`,
  },
  {
    slug: "new-load-mobile",
    deviceType: "MOBILE",
    prompt: `${BRAND}
MOBILE full-screen new load form: pickup city, delivery city, weight, vehicle class, cargo description, Publish primary + Save draft. Native sheet feel.`,
  },
];

function slugFromTitle(title) {
  return String(title || "screen")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function downloadScreen(meta) {
  const id = (meta.name || "").split("/").pop() || meta.id;
  const slug = meta.slug || slugFromTitle(meta.title) || id;
  const base = path.join(outDir, slug);
  await mkdir(base, { recursive: true });

  const json = {
    slug,
    title: meta.title,
    screenId: id,
    projectId: PROJECT_ID,
    deviceType: meta.deviceType,
    htmlUrl: meta.htmlCode?.downloadUrl || meta.htmlUrl,
    screenshotUrl: meta.screenshot?.downloadUrl || meta.screenshotUrl,
  };
  await writeFile(`${base}/meta.json`, JSON.stringify(json, null, 2));

  if (json.htmlUrl) {
    const res = await fetch(json.htmlUrl);
    const html = await res.text();
    await writeFile(`${base}/screen.html`, html);
  }
  console.log("✓ saved", slug);
  return json;
}

async function generateGap(gap) {
  console.log(`\n→ Generating gap: ${gap.slug} (${gap.deviceType})…`);
  try {
    const screen = await project.generate(gap.prompt, gap.deviceType);
    return downloadScreen({
      slug: gap.slug,
      title: gap.slug,
      name: `projects/${PROJECT_ID}/screens/${screen.screenId || screen.id}`,
      deviceType: gap.deviceType,
      htmlUrl: await screen.getHtml(),
      screenshotUrl: await screen.getImage(),
    });
  } catch (error) {
    if (error instanceof StitchError && error.code === "CLARIFICATION_REQUIRED") {
      const reply =
        error.clarification?.suggestions?.[0] ||
        "Use Freight Direct B2B lime #ABC629, light theme, marketplace award flow.";
      const screen = await project.generate(reply, gap.deviceType);
      return downloadScreen({
        slug: gap.slug,
        title: gap.slug,
        name: `projects/${PROJECT_ID}/screens/${screen.screenId || screen.id}`,
        deviceType: gap.deviceType,
        htmlUrl: await screen.getHtml(),
        screenshotUrl: await screen.getImage(),
      });
    }
    console.error("✗", gap.slug, error.message || error);
    return { slug: gap.slug, error: String(error.message || error) };
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  console.log("Listing Freight Direct screens…");
  const listed = await client.callTool("list_screens", { projectId: PROJECT_ID });
  const existing = listed.screens || [];
  console.log("Existing:", existing.length);

  const saved = [];
  for (const s of existing) {
    saved.push(await downloadScreen(s));
  }

  // Generate gaps in sequence (API heavy) but start after downloads
  const titles = new Set(existing.map((s) => (s.title || "").toLowerCase()));
  for (const gap of GAPS) {
    const already =
      titles.has(gap.slug.replace(/-/g, " ")) ||
      saved.some((s) => s.slug === gap.slug);
    if (already) {
      console.log("skip existing gap", gap.slug);
      continue;
    }
    saved.push(await generateGap(gap));
  }

  await writeFile(path.join(outDir, "index.json"), JSON.stringify(saved, null, 2));
  console.log("\nDone →", outDir);
  await client.close();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await client.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
