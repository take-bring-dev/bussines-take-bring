/**
 * End-to-end balance test for admin-mediated loads.
 *
 * Flow covered:
 *  shipper submit → admin notify → publish → carrier/individual notify+bid
 *  → admin award → losers rejected → shipper notified → no escrow
 *
 * Edge cases: draft/submit validation, bid before publish, double bid,
 * shipper cannot award, driver off board, price hidden from carriers.
 *
 * Usage:
 *   node --env-file=.env --env-file=.env.local scripts/e2e-admin-load-flow.mjs
 *   BASE_URL=https://app.take-bring.eu node --env-file=.env scripts/e2e-admin-load-flow.mjs
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const BASE = (process.env.BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMeAdmin10!";
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "admin@take-bring.eu").toLowerCase();
const SHIPPER_EMAIL = (process.env.SEED_SHIPPER_EMAIL || "shipper@take-bring.eu").toLowerCase();
const CARRIER_EMAIL = (process.env.SEED_CARRIER_EMAIL || "carrier@take-bring.eu").toLowerCase();
const INDIVIDUAL_EMAIL = "individual@take-bring.eu";
const DRIVER_EMAIL = "e2e-driver@take-bring.eu";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
const failures = [];

function ok(name) {
  passed += 1;
  console.log(`  ✓ ${name}`);
}

function fail(name, detail) {
  failed += 1;
  failures.push({ name, detail });
  console.log(`  ✗ ${name}`);
  if (detail) console.log(`      ${detail}`);
}

function assert(cond, name, detail) {
  if (cond) ok(name);
  else fail(name, detail);
}

class Session {
  constructor(label) {
    this.label = label;
    this.cookies = new Map();
  }

  jarHeader() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  absorb(res) {
    const list =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : [];
    for (const raw of list) {
      const part = raw.split(";")[0];
      const eq = part.indexOf("=");
      if (eq > 0) this.cookies.set(part.slice(0, eq), part.slice(eq + 1));
    }
  }

  async json(path, { method = "GET", body } = {}) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        cookie: this.jarHeader(),
      },
      body: body != null ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    this.absorb(res);
    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    return { status: res.status, data };
  }

  async login(email, password = PASSWORD) {
    const r = await this.json("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    if (r.status !== 200 || !r.data?.ok) {
      throw new Error(`${this.label} login failed (${email}): ${r.status} ${JSON.stringify(r.data)}`);
    }
    return r.data.user;
  }
}

function loadPayload(overrides = {}) {
  const now = Date.now();
  return {
    publish: true,
    reference: `E2E-${now}-${Math.floor(Math.random() * 999)}`,
    title: "E2E test load",
    pickupCity: "Hamburg",
    pickupZip: "20457",
    pickupCountry: "DE",
    pickupStreet: "Hafenstraße 1",
    pickupCompany: "E2E Shipper Depot",
    pickupWindowStart: new Date(now + 36e5).toISOString(),
    pickupWindowEnd: new Date(now + 72e5).toISOString(),
    deliveryCity: "Berlin",
    deliveryZip: "10115",
    deliveryCountry: "DE",
    deliveryStreet: "Torstraße 1",
    deliveryCompany: "E2E Consignee",
    deliveryWindowStart: new Date(now + 864e5).toISOString(),
    deliveryWindowEnd: new Date(now + 900e5).toISOString(),
    cargoDescription: "E2E pallets",
    weightKg: 1200,
    palletCount: 8,
    requiredVehicleClass: "van",
    suggestedBudgetEur: 480,
    ...overrides,
  };
}

async function ensureFixtures() {
  const hash = await bcrypt.hash(PASSWORD, 12);

  let individual = await prisma.user.findUnique({ where: { email: INDIVIDUAL_EMAIL } });
  if (!individual) {
    individual = await prisma.user.create({
      data: {
        email: INDIVIDUAL_EMAIL,
        passwordHash: hash,
        role: "CARRIER_INDIVIDUAL",
        status: "ACTIVE",
        name: "E2E Solo Carrier",
        profile: { create: { kycStatus: "APPROVED" } },
        carrierIndividual: {
          create: {
            fullName: "E2E Solo Carrier",
            addressStreet: "Teststr. 1",
            addressZip: "20095",
            addressCity: "Hamburg",
            addressCountry: "DE",
            vehicleClass: "VAN_3_5T",
            plateNumber: "E2E-IND-1",
            maxPayloadKg: 1500,
          },
        },
      },
    });
  } else {
    await prisma.user.update({
      where: { id: individual.id },
      data: { passwordHash: hash, status: "ACTIVE", role: "CARRIER_INDIVIDUAL" },
    });
  }

  const carrierAdmin = await prisma.user.findUnique({ where: { email: CARRIER_EMAIL } });
  if (!carrierAdmin) throw new Error("Seed company carrier missing — run npm run db:seed");
  const company = await prisma.carrierCompanyProfile.findUnique({
    where: { adminUserId: carrierAdmin.id },
  });
  if (!company) throw new Error("Seed company profile missing — run npm run db:seed");

  let driverUser = await prisma.user.findUnique({ where: { email: DRIVER_EMAIL } });
  if (!driverUser) {
    driverUser = await prisma.user.create({
      data: {
        email: DRIVER_EMAIL,
        passwordHash: hash,
        role: "CARRIER_DRIVER",
        status: "ACTIVE",
        name: "E2E Fleet Driver",
        profile: { create: { kycStatus: "APPROVED" } },
      },
    });
  } else {
    await prisma.user.update({
      where: { id: driverUser.id },
      data: { passwordHash: hash, status: "ACTIVE", role: "CARRIER_DRIVER" },
    });
  }

  let driver = await prisma.driver.findUnique({ where: { userId: driverUser.id } });
  if (!driver) {
    driver = await prisma.driver.create({
      data: {
        companyId: company.id,
        userId: driverUser.id,
        fullName: "E2E Fleet Driver",
        email: DRIVER_EMAIL,
        status: "ACTIVE",
      },
    });
  }

  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  const shipper = await prisma.user.findUnique({ where: { email: SHIPPER_EMAIL } });
  const carrier = await prisma.user.findUnique({ where: { email: CARRIER_EMAIL } });
  if (!admin || !shipper || !carrier) {
    throw new Error("Missing seed users — run npm run db:seed first");
  }

  return {
    adminId: admin.id,
    shipperId: shipper.id,
    carrierId: carrier.id,
    individualId: individual.id,
    driverUserId: driverUser.id,
    driverId: driver.id,
  };
}

async function latestNotif(userId, type, after) {
  return prisma.notification.findFirst({
    where: {
      userId,
      type,
      createdAt: { gte: after },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function countNotifs(userId, type, after) {
  return prisma.notification.count({
    where: { userId, type, createdAt: { gte: after } },
  });
}

async function main() {
  console.log(`\nE2E admin load flow @ ${BASE}\n`);

  // Health
  try {
    const ping = await fetch(`${BASE}/login`);
    assert(ping.ok || ping.status === 200, "dev server reachable");
  } catch (e) {
    fail("dev server reachable", String(e));
    throw new Error("Start npm run dev on :3001 before running this script");
  }

  const t0 = new Date();
  const ids = await ensureFixtures();
  ok("fixtures ready (admin/shipper/carrier/individual/driver)");

  const admin = new Session("admin");
  const shipper = new Session("shipper");
  const carrier = new Session("carrier");
  const individual = new Session("individual");
  const driver = new Session("driver");

  await admin.login(ADMIN_EMAIL);
  await shipper.login(SHIPPER_EMAIL);
  await carrier.login(CARRIER_EMAIL);
  await individual.login(INDIVIDUAL_EMAIL);
  await driver.login(DRIVER_EMAIL);
  ok("all roles logged in");

  // --- Edge: draft without price OK ---
  {
    const r = await shipper.json("/api/loads", {
      method: "POST",
      body: loadPayload({ publish: false, suggestedBudgetEur: null }),
    });
    assert(r.status === 200 && r.data?.load?.status === "DRAFT", "draft without price → DRAFT", JSON.stringify(r.data));
  }

  // --- Edge: submit without price fails ---
  {
    const r = await shipper.json("/api/loads", {
      method: "POST",
      body: loadPayload({ publish: true, suggestedBudgetEur: null }),
    });
    assert(r.status === 400, "submit without price → 400", JSON.stringify(r.data));
  }

  // --- Happy: two loads submitted ---
  const created = [];
  for (let i = 0; i < 2; i++) {
    const r = await shipper.json("/api/loads", {
      method: "POST",
      body: loadPayload({
        suggestedBudgetEur: 400 + i * 50,
        reference: `E2E-MULTI-${Date.now()}-${i}`,
      }),
    });
    assert(
      r.status === 200 && r.data?.load?.status === "PENDING_ADMIN",
      `shipper submit load #${i + 1} → PENDING_ADMIN`,
      JSON.stringify(r.data),
    );
    if (r.data?.load?.id) created.push(r.data.load);
  }
  const [loadA, loadB] = created;
  if (!loadA || !loadB) throw new Error("Failed to create test loads");

  // Admin notified for submissions
  {
    const n = await countNotifs(ids.adminId, "admin.load.pending", t0);
    assert(n >= 2, `admin got ≥2 pending-load notifications (got ${n})`);
  }

  // Carriers must NOT see pending loads on board API
  {
    const cList = await carrier.json("/api/loads");
    const iList = await individual.json("/api/loads");
    const dList = await driver.json("/api/loads");
    const onBoard = (list, id) =>
      (list.data?.loads || []).some((l) => l.id === id);
    assert(!onBoard(cList, loadA.id), "carrier board hides PENDING_ADMIN load A");
    assert(!onBoard(iList, loadA.id), "individual board hides PENDING_ADMIN load A");
    assert(
      dList.status === 200 && (dList.data?.loads || []).length === 0,
      "driver board API returns empty list",
    );
  }

  // Edge: bid before publish
  {
    const r = await carrier.json(`/api/loads/${loadA.id}/apply`, {
      method: "POST",
      body: { proposedPrice: 450 },
    });
    assert(r.status === 400, "bid before publish → 400", JSON.stringify(r.data));
  }

  // Edge: shipper cannot award
  {
    const r = await shipper.json(`/api/loads/${loadA.id}/accept`, {
      method: "POST",
      body: { applicationId: "x" },
    });
    assert(r.status === 401 || r.status === 403, "shipper cannot accept (unauthorized)");
  }

  // Edge: carrier cannot publish
  {
    const r = await carrier.json(`/api/loads/${loadA.id}/publish`, { method: "POST" });
    assert(r.status === 401 || r.status === 403, "carrier cannot publish");
  }

  // --- Admin publishes load A only ---
  {
    const r = await admin.json(`/api/loads/${loadA.id}/publish`, { method: "POST" });
    assert(
      r.status === 200 && r.data?.load?.status === "RECEIVING_OFFERS",
      "admin publish load A → RECEIVING_OFFERS",
      JSON.stringify(r.data),
    );
  }

  {
    const row = await prisma.load.findUnique({ where: { id: loadA.id } });
    assert(row?.status === "RECEIVING_OFFERS" && row.publishedAt != null, "DB: load A publishedAt set");
  }

  // load B still pending
  {
    const row = await prisma.load.findUnique({ where: { id: loadB.id } });
    assert(row?.status === "PENDING_ADMIN", "load B still PENDING_ADMIN until published");
  }

  // Notifications on publish
  {
    const shipperN = await latestNotif(ids.shipperId, "load.admin_published", t0);
    const carrierN = await latestNotif(ids.carrierId, "load.published", t0);
    const indivN = await latestNotif(ids.individualId, "load.published", t0);
    const driverN = await latestNotif(ids.driverUserId, "load.published", t0);
    assert(!!shipperN, "shipper notified load went live");
    assert(!!carrierN, "company carrier notified new load");
    assert(!!indivN, "individual carrier notified new load");
    assert(!driverN, "company driver NOT notified of board publish");
  }

  // Board visibility + price hidden
  {
    const cList = await carrier.json("/api/loads");
    const loads = cList.data?.loads || [];
    const found = loads.find((l) => l.id === loadA.id);
    assert(!!found, "carrier board shows published load A");
    assert(
      !("suggestedBudgetEur" in (found || {})),
      "carrier list payload omits suggestedBudgetEur",
    );
    assert(
      !loads.some((l) => l.id === loadB.id),
      "carrier board still hides unpublished load B",
    );
  }

  // Driver cannot apply
  {
    const r = await driver.json(`/api/loads/${loadA.id}/apply`, {
      method: "POST",
      body: { proposedPrice: 400 },
    });
    assert(r.status === 401 || r.status === 403, "driver cannot bid on open board");
  }

  // --- Bids from company + individual ---
  let appCarrier;
  let appIndividual;
  {
    const r1 = await carrier.json(`/api/loads/${loadA.id}/apply`, {
      method: "POST",
      body: { proposedPrice: 455, message: "E2E company bid" },
    });
    assert(r1.status === 200 && r1.data?.application?.id, "company carrier bid OK", JSON.stringify(r1.data));
    appCarrier = r1.data?.application;

    const r2 = await individual.json(`/api/loads/${loadA.id}/apply`, {
      method: "POST",
      body: { proposedPrice: 470, message: "E2E solo bid" },
    });
    assert(r2.status === 200 && r2.data?.application?.id, "individual bid OK", JSON.stringify(r2.data));
    appIndividual = r2.data?.application;
  }

  // Double bid
  {
    const r = await carrier.json(`/api/loads/${loadA.id}/apply`, {
      method: "POST",
      body: { proposedPrice: 440 },
    });
    assert(r.status === 409, "double bid → 409", JSON.stringify(r.data));
  }

  // Admin + shipper get bid signals
  {
    const adminBids = await countNotifs(ids.adminId, "admin.application.created", t0);
    const shipperBids = await countNotifs(ids.shipperId, "application.created", t0);
    assert(adminBids >= 2, `admin received bid notifications (got ${adminBids})`);
    assert(shipperBids >= 1, `shipper received offer notifications (got ${shipperBids})`);
  }

  // --- Admin awards company bid ---
  {
    const r = await admin.json(`/api/loads/${loadA.id}/accept`, {
      method: "POST",
      body: { applicationId: appCarrier.id },
    });
    assert(r.status === 200 && r.data?.ok, "admin accept company bid", JSON.stringify(r.data));
  }

  {
    const load = await prisma.load.findUnique({ where: { id: loadA.id } });
    const apps = await prisma.loadApplication.findMany({ where: { loadId: loadA.id } });
    const winner = apps.find((a) => a.id === appCarrier.id);
    const loser = apps.find((a) => a.id === appIndividual.id);
    assert(load?.status === "ASSIGNED", "load A → ASSIGNED");
    assert(winner?.status === "ACCEPTED", "winner application ACCEPTED");
    assert(loser?.status === "REJECTED", "loser application auto-REJECTED");
  }

  // No escrow created by award
  {
    const escrow = await prisma.escrowPayment.findUnique({ where: { loadId: loadA.id } }).catch(() => null);
    // findUnique on loadId only if unique — check schema
    const escrows = await prisma.escrowPayment.findMany({ where: { loadId: loadA.id } });
    assert(escrows.length === 0, "no escrow row created on admin award");
    void escrow;
  }

  // Notifications after award
  {
    const win = await latestNotif(ids.carrierId, "application.accepted", t0);
    const lose = await latestNotif(ids.individualId, "application.rejected", t0);
    const ship = await latestNotif(ids.shipperId, "load.awarded", t0);
    assert(!!win, "winner notified application.accepted");
    assert(!!lose, "loser notified application.rejected");
    assert(!!ship, "shipper notified load.awarded");
  }

  // Edge: accept again fails
  {
    const r = await admin.json(`/api/loads/${loadA.id}/accept`, {
      method: "POST",
      body: { applicationId: appIndividual.id },
    });
    assert(r.status === 400, "second accept on awarded load → 400", JSON.stringify(r.data));
  }

  // Edge: publish already receiving/assigned fails
  {
    const r = await admin.json(`/api/loads/${loadA.id}/publish`, { method: "POST" });
    assert(r.status === 400, "re-publish awarded load → 400", JSON.stringify(r.data));
  }

  // Publish load B and leave open (balance: multiple loads)
  {
    const r = await admin.json(`/api/loads/${loadB.id}/publish`, { method: "POST" });
    assert(
      r.status === 200 && r.data?.load?.status === "RECEIVING_OFFERS",
      "admin publish second load → RECEIVING_OFFERS",
      JSON.stringify(r.data),
    );
    const onlyIndiv = await individual.json(`/api/loads/${loadB.id}/apply`, {
      method: "POST",
      body: { proposedPrice: 510 },
    });
    assert(onlyIndiv.status === 200, "second load accepts a fresh bid");
  }

  // Final balance snapshot
  {
    const a = await prisma.load.findUnique({ where: { id: loadA.id } });
    const b = await prisma.load.findUnique({ where: { id: loadB.id } });
    const pendingA = await prisma.loadApplication.count({
      where: { loadId: loadA.id, status: "PENDING" },
    });
    assert(a.status === "ASSIGNED" && pendingA === 0, "load A balance: ASSIGNED, 0 pending bids");
    assert(b.status === "RECEIVING_OFFERS", "load B balance: still receiving offers");
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log(` - ${f.name}: ${f.detail || ""}`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error("\nFatal:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (failed > 0) process.exitCode = 1;
  });
