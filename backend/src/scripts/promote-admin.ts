import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";

async function promoteAdmin() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error("Usage: npm run admin:promote -- user@example.com");
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: UserRole.ADMIN },
      select: { email: true },
    });
    console.log(`Administrator role granted to ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

void promoteAdmin().catch((error: unknown) => {
  console.error("Could not promote administrator:", error);
  process.exitCode = 1;
});
