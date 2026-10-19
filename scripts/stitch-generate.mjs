/**
 * Generate Take & Bring Business screens via Google Stitch MCP/SDK.
 * Usage: node --env-file=.env scripts/stitch-generate.mjs
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Stitch, StitchToolClient, StitchError } from "@google/stitch-sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "_stitch-out");

const apiKey = process.env.STITCH_API_KEY?.trim();
if (!apiKey) {
  console.error("STITCH_API_KEY missing");
  process.exit(1);
}

const client = new StitchToolClient({
  apiKey,
  timeout: 300_000,
});
const stitch = new Stitch(client);

const BRAND = `
Brand: Take & Bring Business (EU freight marketplace / digital forwarder).
Palette ONLY: primary #ABC629, primaryDark #8FA622, primaryLight #D4E88A, ink #1A1F16, muted #5C6754, surface #F7F8F3, white #FFFFFF, border #E4E8DC, danger #C44B3C, warning #C9A227, success #3F7D4E.
Inspired by zipmend / DAGO Express / inTime: shipper posts load → carriers submit priced offers → shipper awards ONE carrier (accept). Not a generic admin CRM.
Premium light B2B UI (Linear × Stripe × Uber Freight). No purple, no neon, no dark mode.
`;

const SCREENS = [
  {
    id: "shipper-overview-desktop",
    deviceType: "DESKTOP",
    prompt: `${BRAND}
DESKTOP shipper dashboard overview for freight marketplace.
Left sidebar 240px: Take & Bring logo, role "Shipper", nav Overview/Loads/Alerts, Sign out.
Top bar: title "Overview", Live pulse badge, notification bell.
Main: 3 KPI cards (Open loads, Pending offers, Assigned), Recent loads list with route Köln→München, status Receiving offers, offer count, New load primary CTA.
Dense ops layout, award-winning clarity.`,
  },
  {
    id: "shipper-overview-mobile",
    deviceType: "MOBILE",
    prompt: `${BRAND}
MOBILE native-app shipper home (not shrunk desktop).
Bottom tab bar: Overview, Loads, Alerts with lime active pill.
Top app bar title + bell. KPI strip. Load cards full-bleed. Floating "New load" FAB above tabs. Safe area padding. 44px touch targets.`,
  },
  {
    id: "carrier-loads-mobile",
    deviceType: "MOBILE",
    prompt: `${BRAND}
MOBILE carrier open-loads marketplace board (like zipmend/DAGO job list).
Bottom tabs: Overview, Open loads, Fleet, Alerts.
Cards: route, weight, vehicle class Van 3.5t, pickup window, Apply button.
Show bottom sheet open for Apply: proposed price € input + message + Send. Native app feel.`,
  },
  {
    id: "shipper-load-detail-desktop",
    deviceType: "DESKTOP",
    prompt: `${BRAND}
DESKTOP shipper load detail with carrier applications (award flow).
Header: Köln → München, status Receiving offers, 800kg Van.
List of carrier offers with name, individual/company badge, price €420, Accept button.
Confirm dialog visible: "Accept this offer? Other pending offers will be rejected." Primary Accept / Cancel.`,
  },
  {
    id: "login-desktop",
    deviceType: "DESKTOP",
    prompt: `${BRAND}
DESKTOP login split layout: left brand panel with Take & Bring wordmark and logistics imagery feel, right form email+password+Continue, link to Sign up. Premium EU B2B.`,
  },
  {
    id: "admin-overview-desktop",
    deviceType: "DESKTOP",
    prompt: `${BRAND}
DESKTOP admin overview: sidebar Admin role, KPIs Users / KYC pending / Open loads / Offers today. Clean ops console for marketplace moderation.`,
  },
];

async function genOne(project, screen) {
  console.log(`\n→ Generating ${screen.id} (${screen.deviceType})…`);
  try {
    const result = await project.generate(screen.prompt, screen.deviceType);
    const htmlUrl = await result.getHtml();
    const imageUrl = await result.getImage();
    const meta = {
      id: screen.id,
      screenId: result.screenId || result.id,
      projectId: project.projectId || project.id,
      deviceType: screen.deviceType,
      htmlUrl,
      imageUrl,
      at: new Date().toISOString(),
    };
    await writeFile(
      path.join(outDir, `${screen.id}.json`),
      JSON.stringify(meta, null, 2),
    );
    if (htmlUrl) {
      const res = await fetch(htmlUrl);
      const html = await res.text();
      await writeFile(path.join(outDir, `${screen.id}.html`), html);
    }
    console.log(`✓ ${screen.id} screenId=${meta.screenId}`);
    return meta;
  } catch (error) {
    if (error instanceof StitchError && error.code === "CLARIFICATION_REQUIRED") {
      console.log(`? Clarification: ${error.clarification?.question}`);
      const reply =
        error.clarification?.suggestions?.[0] ||
        "Use Take & Bring lime brand #ABC629, light theme, freight marketplace shipper-awards model.";
      const result = await project.generate(reply, screen.deviceType);
      const htmlUrl = await result.getHtml();
      const imageUrl = await result.getImage();
      const meta = {
        id: screen.id,
        screenId: result.screenId || result.id,
        htmlUrl,
        imageUrl,
        clarified: true,
      };
      await writeFile(
        path.join(outDir, `${screen.id}.json`),
        JSON.stringify(meta, null, 2),
      );
      if (htmlUrl) {
        const res = await fetch(htmlUrl);
        await writeFile(path.join(outDir, `${screen.id}.html`), await res.text());
      }
      console.log(`✓ ${screen.id} after clarification`);
      return meta;
    }
    console.error(`✗ ${screen.id}`, error.message || error);
    return { id: screen.id, error: String(error.message || error) };
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  console.log("Listing tools…");
  try {
    const { tools } = await client.listTools();
    console.log(
      "tools:",
      tools.map((t) => t.name).join(", "),
    );
  } catch (e) {
    console.log("listTools:", e.message);
  }

  console.log("Creating Stitch project…");
  let created;
  try {
    created = await client.callTool("create_project", {
      title: "Take & Bring Business — Marketplace Dashboards",
    });
  } catch (e) {
    console.log("create_project failed, trying existing projects:", e.message);
  }
  console.log("create_project result:", JSON.stringify(created).slice(0, 800));

  // Resolve project id from tool result shapes
  let projectId =
    created?.projectId ||
    created?.id ||
    created?.project?.projectId ||
    created?.project?.id;
  if (!projectId && created && typeof created === "object") {
    const raw = JSON.stringify(created);
    const m = raw.match(/projects\/(\d+)/) || raw.match(/"projectId"\s*:\s*"?(\d+)"?/);
    if (m) projectId = m[1];
  }
  if (!projectId) {
    const projects = await stitch.projects();
    console.log("existing projects:", projects.length);
    projectId = projects[0]?.projectId || projects[0]?.id;
  }
  if (!projectId) throw new Error("Could not resolve project id");
  console.log("Using project:", projectId);
  await writeFile(path.join(outDir, "project.json"), JSON.stringify({ projectId }, null, 2));

  const project = stitch.project(String(projectId).replace(/^projects\//, ""));

  // Try design system if tool exists
  try {
    await project.createDesignSystem({
      displayName: "Take & Bring",
      // best-effort; schema may vary
      colorMode: "LIGHT",
    });
  } catch (e) {
    console.log("design system skip:", e.message);
  }

  const results = [];
  for (const screen of SCREENS) {
    results.push(await genOne(project, screen));
  }

  await writeFile(path.join(outDir, "index.json"), JSON.stringify(results, null, 2));
  console.log("\nDone. Output in _stitch-out/");
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
