/**
 * Creates flat geometric SVG illustrations (brand palette),
 * rasterizes to PNG, then optimizes to WebP via sharp.
 * No photo/AI look — simple logistics shapes only.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "images");
mkdirSync(outDir, { recursive: true });

const C = {
  primary: "#ABC629",
  primaryDark: "#8FA622",
  light: "#D4E88A",
  ink: "#1A1F16",
  cream: "#F7F8F3",
  white: "#FFFFFF",
  muted: "#5C6754",
};

function svgToFiles(name, svg, width, height) {
  const svgPath = join(outDir, `${name}.svg`);
  writeFileSync(svgPath, svg);
  return sharp(Buffer.from(svg))
    .png()
    .toFile(join(outDir, `${name}.png`))
    .then(() =>
      sharp(Buffer.from(svg))
        .webp({ quality: 82 })
        .toFile(join(outDir, `${name}.webp`)),
    )
    .then(() => console.log(`✓ ${name}.svg/.png/.webp (${width}x${height})`));
}

const authHero = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" fill="none">
  <rect width="640" height="480" rx="24" fill="${C.ink}"/>
  <circle cx="520" cy="90" r="70" fill="${C.primary}" opacity="0.25"/>
  <circle cx="80" cy="400" r="90" fill="${C.primaryDark}" opacity="0.2"/>
  <!-- road -->
  <rect x="40" y="300" width="560" height="16" rx="4" fill="${C.muted}" opacity="0.35"/>
  <rect x="60" y="304" width="40" height="8" rx="2" fill="${C.light}" opacity="0.5"/>
  <rect x="140" y="304" width="40" height="8" rx="2" fill="${C.light}" opacity="0.5"/>
  <rect x="220" y="304" width="40" height="8" rx="2" fill="${C.light}" opacity="0.5"/>
  <rect x="300" y="304" width="40" height="8" rx="2" fill="${C.light}" opacity="0.5"/>
  <rect x="380" y="304" width="40" height="8" rx="2" fill="${C.light}" opacity="0.5"/>
  <rect x="460" y="304" width="40" height="8" rx="2" fill="${C.light}" opacity="0.5"/>
  <!-- truck body -->
  <rect x="180" y="220" width="220" height="80" rx="10" fill="${C.primary}"/>
  <rect x="400" y="240" width="70" height="60" rx="8" fill="${C.light}"/>
  <rect x="455" y="255" width="28" height="22" rx="3" fill="${C.ink}" opacity="0.35"/>
  <circle cx="220" cy="310" r="22" fill="${C.ink}"/>
  <circle cx="220" cy="310" r="10" fill="${C.cream}"/>
  <circle cx="420" cy="310" r="22" fill="${C.ink}"/>
  <circle cx="420" cy="310" r="10" fill="${C.cream}"/>
  <!-- package -->
  <rect x="100" y="250" width="48" height="48" rx="6" fill="${C.light}"/>
  <path d="M100 274h48M124 250v48" stroke="${C.ink}" stroke-width="2" opacity="0.4"/>
</svg>`;

const platformOverview = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="560" viewBox="0 0 720 560" fill="none">
  <rect width="720" height="560" rx="28" fill="${C.cream}"/>
  <rect x="48" y="48" width="280" height="200" rx="16" fill="${C.white}" stroke="${C.primary}" stroke-width="2"/>
  <rect x="72" y="80" width="160" height="14" rx="4" fill="${C.primary}"/>
  <rect x="72" y="110" width="220" height="10" rx="3" fill="${C.muted}" opacity="0.25"/>
  <rect x="72" y="132" width="180" height="10" rx="3" fill="${C.muted}" opacity="0.2"/>
  <rect x="72" y="180" width="100" height="36" rx="8" fill="${C.primaryDark}"/>
  <rect x="392" y="48" width="280" height="200" rx="16" fill="${C.white}" stroke="${C.primaryDark}" stroke-width="2"/>
  <circle cx="460" cy="120" r="28" fill="${C.light}"/>
  <rect x="510" y="100" width="120" height="12" rx="3" fill="${C.ink}" opacity="0.7"/>
  <rect x="510" y="124" width="90" height="10" rx="3" fill="${C.muted}" opacity="0.3"/>
  <rect x="432" y="180" width="200" height="40" rx="10" fill="${C.light}"/>
  <rect x="48" y="280" width="624" height="220" rx="16" fill="${C.white}" stroke="#D5DCC8" stroke-width="2"/>
  <rect x="80" y="320" width="180" height="140" rx="12" fill="${C.light}" opacity="0.55"/>
  <rect x="280" y="320" width="180" height="140" rx="12" fill="${C.primary}" opacity="0.35"/>
  <rect x="480" y="320" width="160" height="140" rx="12" fill="${C.primaryDark}" opacity="0.3"/>
  <text x="360" y="510" text-anchor="middle" fill="${C.muted}" font-family="Segoe UI, Arial" font-size="14">Shipper · Carrier · Admin</text>
</svg>`;

const registerRoles = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" fill="none">
  <rect width="640" height="480" rx="24" fill="${C.ink}"/>
  <rect x="70" y="120" width="220" height="240" rx="20" fill="${C.primary}"/>
  <rect x="110" y="170" width="140" height="14" rx="4" fill="${C.ink}" opacity="0.55"/>
  <rect x="110" y="200" width="100" height="10" rx="3" fill="${C.ink}" opacity="0.35"/>
  <circle cx="180" cy="280" r="36" fill="${C.ink}" opacity="0.2"/>
  <rect x="350" y="120" width="220" height="240" rx="20" fill="${C.light}"/>
  <rect x="390" y="170" width="140" height="14" rx="4" fill="${C.ink}" opacity="0.55"/>
  <rect x="390" y="200" width="100" height="10" rx="3" fill="${C.ink}" opacity="0.35"/>
  <rect x="410" y="250" width="100" height="50" rx="8" fill="${C.primaryDark}"/>
  <circle cx="430" cy="320" r="14" fill="${C.ink}"/>
  <circle cx="490" cy="320" r="14" fill="${C.ink}"/>
</svg>`;

const secureAuth = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200" viewBox="0 0 640 200" fill="none">
  <rect width="640" height="200" fill="${C.cream}"/>
  <rect x="40" y="40" width="560" height="120" rx="16" fill="${C.white}" stroke="#D5DCC8"/>
  <rect x="70" y="70" width="48" height="60" rx="8" fill="${C.primary}"/>
  <path d="M86 95h16v24H86z" fill="${C.ink}" opacity="0.35"/>
  <rect x="140" y="78" width="200" height="12" rx="3" fill="${C.ink}" opacity="0.7"/>
  <rect x="140" y="102" width="280" height="10" rx="3" fill="${C.muted}" opacity="0.25"/>
  <rect x="140" y="122" width="160" height="10" rx="3" fill="${C.muted}" opacity="0.2"/>
</svg>`;

const icon192 = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="40" fill="${C.primary}"/>
  <path d="M40 105h48l18-38h46" fill="none" stroke="${C.ink}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="70" cy="134" r="14" fill="${C.ink}"/>
  <circle cx="138" cy="134" r="14" fill="${C.ink}"/>
</svg>`;

const icon512 = icon192.replace('width="192" height="192" viewBox="0 0 192 192"', 'width="512" height="512" viewBox="0 0 192 192"');

await Promise.all([
  svgToFiles("auth-hero", authHero, 640, 480),
  svgToFiles("platform-overview", platformOverview, 720, 560),
  svgToFiles("register-roles", registerRoles, 640, 480),
  svgToFiles("secure-auth", secureAuth, 640, 200),
  svgToFiles("icon-192", icon192, 192, 192),
  svgToFiles("icon-512", icon512, 512, 512),
]);

console.log("Brand images ready in public/images/");
if (!existsSync(outDir)) process.exit(1);
