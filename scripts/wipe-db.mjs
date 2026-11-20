import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$queryRaw`select 1 as ok`;
  console.log("Connected.");

  // Child → parent order (FK-safe)
  const steps = [
    () => prisma.auditLog.deleteMany(),
    () => prisma.document.deleteMany(),
    () => prisma.deviceToken.deleteMany(),
    () => prisma.notification.deleteMany(),
    () => prisma.escrowPayment.deleteMany(),
    () => prisma.loadApplication.deleteMany(),
    () => prisma.driverLocationPoint.deleteMany(),
    () => prisma.driverLocationLatest.deleteMany(),
    () => prisma.load.deleteMany(),
    () => prisma.driver.deleteMany(),
    () => prisma.vehicle.deleteMany(),
    () => prisma.carrierCompanyProfile.deleteMany(),
    () => prisma.carrierIndividualProfile.deleteMany(),
    () => prisma.shipperProfile.deleteMany(),
    () => prisma.passwordResetToken.deleteMany(),
    () => prisma.authSession.deleteMany(),
    () => prisma.profile.deleteMany(),
    () => prisma.user.deleteMany(),
  ];

  for (const step of steps) {
    const r = await step();
    console.log("deleted", r.count);
  }

  console.log("Database wiped.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
