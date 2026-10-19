import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const accepted = await p.loadApplication.findMany({
  where: { status: "ACCEPTED" },
  include: {
    load: { include: { escrow: true } },
  },
});

let created = 0;
for (const app of accepted) {
  if (app.load.escrow) continue;
  await p.escrowPayment.create({
    data: {
      loadId: app.loadId,
      applicationId: app.id,
      shipperId: app.load.shipperId,
      carrierUserId: app.applicantUserId,
      amount: app.proposedPrice,
      currency: app.currency || "EUR",
      status: "AWAITING_PAYMENT",
      mock: true,
    },
  });
  created += 1;
  console.log("created escrow for", app.load.reference || app.loadId);
}

console.log({ accepted: accepted.length, created });
await p.$disconnect();
