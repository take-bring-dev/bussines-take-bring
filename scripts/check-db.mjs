import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const [users, loads, tables] = await Promise.all([
    prisma.user.count(),
    prisma.load.count(),
    prisma.$queryRawUnsafe(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1",
    ),
  ]);
  console.log(`users=${users} loads=${loads}`);
  console.log(
    "tables=" + tables.map((t) => t.tablename).join(","),
  );
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
