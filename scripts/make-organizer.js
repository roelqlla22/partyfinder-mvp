const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  const user = await prisma.user.upsert({
    where: { email: "admin@partyfinder.local" },
    update: {},
    create: { email: "admin@partyfinder.local", name: "Admin", role: "ORGANIZER" },
  });
  const org = await prisma.organizerProfile.upsert({
    where: { userId: user.id },
    update: { verified: true, displayName: "Organizador Admin" },
    create: { userId: user.id, displayName: "Organizador Admin", verified: true },
  });
  console.log("Organizer ID:", org.id);
  process.exit(0);
})();
