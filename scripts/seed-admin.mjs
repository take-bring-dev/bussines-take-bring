import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMeAdmin10!";

async function upsertUser({
  email,
  password,
  role,
  name,
  shipper,
  carrierCompany,
  carrierIndividual,
}) {
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role,
        status: "ACTIVE",
        passwordHash,
        name,
      },
    });
    await prisma.profile.upsert({
      where: { userId: existing.id },
      update: { kycStatus: "APPROVED" },
      create: { userId: existing.id, kycStatus: "APPROVED" },
    });
    return prisma.user.findUniqueOrThrow({ where: { email } });
  }

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      status: "ACTIVE",
      name,
      profile: { create: { kycStatus: "APPROVED" } },
      ...(shipper ? { shipperProfile: { create: shipper } } : {}),
      ...(carrierCompany
        ? { carrierCompanyAdmin: { create: carrierCompany } }
        : {}),
      ...(carrierIndividual
        ? { carrierIndividual: { create: carrierIndividual } }
        : {}),
    },
  });
}

async function main() {
  const password = DEFAULT_PASSWORD;

  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL || "admin@take-bring.eu"
  ).toLowerCase();
  const shipperEmail = (
    process.env.SEED_SHIPPER_EMAIL || "shipper@take-bring.eu"
  ).toLowerCase();
  const carrierEmail = (
    process.env.SEED_CARRIER_EMAIL || "carrier@take-bring.eu"
  ).toLowerCase();

  const admin = await upsertUser({
    email: adminEmail,
    password,
    role: "SUPER_ADMIN",
    name: "Platform Admin",
  });

  const shipper = await upsertUser({
    email: shipperEmail,
    password,
    role: "SHIPPER",
    name: "Daimler Logistics GmbH",
    shipper: {
      accountType: "COMPANY",
      companyName: "Daimler Logistics GmbH",
      legalForm: "GmbH",
      vatId: "DE312948123",
      billingStreet: "Hafenstraße 12",
      billingZip: "20457",
      billingCity: "Hamburg",
      billingCountry: "DE",
      contactName: "Dispatch Desk",
      contactRole: "Shipper Admin",
      invoiceEmail: shipperEmail,
    },
  });

  // Ensure shipper profile exists on re-seed
  await prisma.shipperProfile.upsert({
    where: { userId: shipper.id },
    update: {
      companyName: "Daimler Logistics GmbH",
      vatId: "DE312948123",
      billingCity: "Hamburg",
    },
    create: {
      userId: shipper.id,
      accountType: "COMPANY",
      companyName: "Daimler Logistics GmbH",
      legalForm: "GmbH",
      vatId: "DE312948123",
      billingStreet: "Hafenstraße 12",
      billingZip: "20457",
      billingCity: "Hamburg",
      billingCountry: "DE",
      contactName: "Dispatch Desk",
      contactRole: "Shipper Admin",
      invoiceEmail: shipperEmail,
    },
  });

  const carrier = await upsertUser({
    email: carrierEmail,
    password,
    role: "CARRIER_COMPANY_ADMIN",
    name: "Vos Logistics Continental BV",
    carrierCompany: {
      companyName: "Vos Logistics Continental BV",
      legalForm: "BV",
      vatId: "NL892183",
      addressStreet: "Transportweg 1",
      addressZip: "5040",
      addressCity: "Tilburg",
      addressCountry: "NL",
      adminPhone: "+31 13 000 0000",
      fleetSizeEstimate: 40,
    },
  });

  await prisma.carrierCompanyProfile.upsert({
    where: { adminUserId: carrier.id },
    update: {
      companyName: "Vos Logistics Continental BV",
      vatId: "NL892183",
    },
    create: {
      adminUserId: carrier.id,
      companyName: "Vos Logistics Continental BV",
      legalForm: "BV",
      vatId: "NL892183",
      addressStreet: "Transportweg 1",
      addressZip: "5040",
      addressCity: "Tilburg",
      addressCountry: "NL",
      adminPhone: "+31 13 000 0000",
      fleetSizeEstimate: 40,
    },
  });

  console.log("\nSeed complete (admin + shipper + carrier only)\n");
  console.log("  Admin:   ", admin.email);
  console.log("  Shipper: ", shipper.email);
  console.log("  Carrier: ", carrier.email);
  console.log("  Password:", password);
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
