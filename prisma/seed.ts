import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Create initial invite code if none exists
  const existingInvite = await prisma.inviteConfig.findFirst({
    where: { isActive: true },
  });

  if (!existingInvite) {
    const invite = await prisma.inviteConfig.create({
      data: {
        code: "MELOW2024",
        createdBy: "system",
        isActive: true,
      },
    });
    console.log("Created initial invite code:", invite.code);
  } else {
    console.log("Invite code already exists:", existingInvite.code);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
