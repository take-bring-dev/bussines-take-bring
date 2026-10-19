import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const [escrows, accepted] = await Promise.all([
  p.escrowPayment.findMany({
    select: {
      id: true,
      loadId: true,
      status: true,
      shipperId: true,
      carrierUserId: true,
      amount: true,
    },
  }),
  p.loadApplication.findMany({
    where: { status: "ACCEPTED" },
    include: {
      load: {
        select: {
          id: true,
          shipperId: true,
          reference: true,
          status: true,
        },
      },
    },
  }),
]);

console.log(
  JSON.stringify(
    {
      escrowCount: escrows.length,
      acceptedCount: accepted.length,
      escrows,
      accepted: accepted.map((x) => ({
        appId: x.id,
        loadId: x.loadId,
        carrier: x.applicantUserId,
        shipper: x.load.shipperId,
        ref: x.load.reference,
        loadStatus: x.load.status,
        price: String(x.proposedPrice),
      })),
    },
    null,
    2,
  ),
);

await p.$disconnect();
