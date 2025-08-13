const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Usuario y organizador demo
  const user = await prisma.user.upsert({
    where: { email: "demo@partyfinder.mx" },
    update: {},
    create: { email: "demo@partyfinder.mx", name: "Demo Organizer", role: "ORGANIZER" },
  });

  const organizer = await prisma.organizerProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      displayName: "Fiestas Demo",
      phone: "8180000000",
      instagram: "@fiestasdemo",
      verified: true,
    },
  });

  // Venue demo
  const venue = await prisma.venue.upsert({
    where: { id: "seed-venue-1" },
    update: {},
    create: {
      id: "seed-venue-1",
      name: "Quinta La Florida",
      address: "Carretera Monterrey–Reynosa",
      city: "General Bravo, NL",
      lat: 25.8,
      lng: -99.1,
      capacity: 200,
    },
  });

  // Evento en 7 días, 6 horas de duración
  const now = new Date();
  const startsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 6 * 60 * 60 * 1000);

  const event = await prisma.event.create({
    data: {
      title: "Fiesta de Lanzamiento PartyFinder",
      description: "Primera fiesta de prueba con boletos QR.",
      startsAt,
      endsAt,
      organizerId: organizer.id,
      venueId: venue.id,
      tags: ["electrónica", "lanzamiento"],
      minAge: 18,
      visibility: "PUBLIC",
    },
  });

  // Tipo de boleto
  await prisma.ticketType.create({
    data: {
      eventId: event.id,
      name: "General",
      priceMXN: 25000, // $250.00 MXN
      totalQty: 100,
      perUserLimit: 4,
    },
  });

  console.log("✅ Seed listo. Evento creado con id:", event.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
