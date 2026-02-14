import { PrismaClient, GameFormat, AgeBracket } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SOUTH_BAY_CLUBS = [
  { name: "Bay Club Courtside", address: "1 Bay Club Dr", city: "Cupertino", zip: "95014", lat: 37.3230, lng: -122.0322 },
  { name: "Palo Alto Pickleball Center", address: "4250 El Camino Real", city: "Palo Alto", zip: "94306", lat: 37.4029, lng: -122.1143 },
  { name: "Mountain View Recreation Center", address: "201 S Rengstorff Ave", city: "Mountain View", zip: "94040", lat: 37.3941, lng: -122.0967 },
  { name: "Sunnyvale Community Center", address: "550 E Remington Dr", city: "Sunnyvale", zip: "94087", lat: 37.3527, lng: -122.0059 },
  { name: "Los Gatos Racquet Club", address: "350 Blossom Hill Rd", city: "Los Gatos", zip: "95032", lat: 37.2358, lng: -121.9635 },
  { name: "Campbell Community Center", address: "1 W Campbell Ave", city: "Campbell", zip: "95008", lat: 37.2872, lng: -121.9500 },
  { name: "Santa Clara Pickleball Courts", address: "969 Kiely Blvd", city: "Santa Clara", zip: "95051", lat: 37.3520, lng: -121.9710 },
  { name: "Milpitas Sports Center", address: "1325 E Calaveras Blvd", city: "Milpitas", zip: "95035", lat: 37.4333, lng: -121.8895 },
  { name: "Saratoga Recreational Park", address: "19655 Allendale Ave", city: "Saratoga", zip: "95070", lat: 37.2638, lng: -122.0230 },
  { name: "San Jose Almaden CC", address: "6445 Camden Ave", city: "San Jose", zip: "95120", lat: 37.2281, lng: -121.8604 },
  { name: "Fremont Central Park Courts", address: "40204 Paseo Padre Pkwy", city: "Fremont", zip: "94538", lat: 37.5485, lng: -121.9660 },
  { name: "Newark Community Center", address: "35501 Cedar Blvd", city: "Newark", zip: "94560", lat: 37.5224, lng: -122.0404 },
  { name: "Redwood City Paddle Club", address: "3500 Woodside Rd", city: "Redwood City", zip: "94062", lat: 37.4539, lng: -122.2109 },
  { name: "San Mateo Athletic Club", address: "2000 Fashion Island Blvd", city: "San Mateo", zip: "94404", lat: 37.5564, lng: -122.2711 },
  { name: "Foster City Recreation Center", address: "650 Shell Blvd", city: "Foster City", zip: "94404", lat: 37.5580, lng: -122.2630 },
  { name: "Menlo Park Belle Haven Courts", address: "100 Terminal Ave", city: "Menlo Park", zip: "94025", lat: 37.4744, lng: -122.1397 },
];

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "sanchishah@gmail.com" },
    update: {},
    create: {
      email: "sanchishah@gmail.com",
      name: "Sanchi Shah",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("Admin user created:", admin.email);

  // Create demo user
  const demoHash = await bcrypt.hash("demo123", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@matchpoint.app" },
    update: {},
    create: {
      email: "demo@matchpoint.app",
      name: "Demo Player",
      passwordHash: demoHash,
      role: "USER",
    },
  });

  // Create demo profile
  await prisma.profile.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      name: "Demo Player",
      age: 30,
      ageBracket: "AGE_25_34",
      gender: "MALE",
      skillLevel: 3,
      radiusMiles: 10,
      zip: "95014",
      lat: 37.3230,
      lng: -122.0322,
    },
  });
  console.log("Demo user created:", demoUser.email);

  // Seed clubs
  const clubs = [];
  for (const c of SOUTH_BAY_CLUBS) {
    const club = await prisma.club.upsert({
      where: { id: c.name.replace(/\s/g, "-").toLowerCase().slice(0, 25) },
      update: {},
      create: {
        name: c.name,
        address: c.address,
        city: c.city,
        state: "CA",
        zip: c.zip,
        lat: c.lat,
        lng: c.lng,
        notes: "Matchpoint team booked this slot",
      },
    });
    clubs.push(club);
  }
  console.log(`${clubs.length} clubs seeded`);

  // Create slots for next 2 weeks
  const now = new Date();
  const formats: GameFormat[] = ["SINGLES", "DOUBLES"];
  const skills = [1, 2, 3, 4, 5];
  const brackets: AgeBracket[] = ["AGE_18_24", "AGE_25_34", "AGE_35_44", "AGE_45_54", "AGE_55_64", "AGE_65_PLUS"];
  const durations = [60, 120];
  const costs = [500, 1000]; // $5, $10

  let slotCount = 0;
  for (let day = 1; day <= 14; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);

    // Create 3-4 slots per day across random clubs
    const slotsPerDay = 3 + Math.floor(Math.random() * 2);
    for (let s = 0; s < slotsPerDay; s++) {
      const club = clubs[Math.floor(Math.random() * clubs.length)];
      const hour = 8 + Math.floor(Math.random() * 10); // 8am-6pm
      const format = formats[Math.floor(Math.random() * formats.length)];
      const skill = skills[Math.floor(Math.random() * skills.length)];
      const bracket = brackets[Math.floor(Math.random() * brackets.length)];
      const duration = durations[Math.floor(Math.random() * durations.length)];
      const cost = costs[Math.floor(Math.random() * costs.length)];

      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);

      const lockTime = new Date(startTime);
      lockTime.setHours(lockTime.getHours() - 8);

      await prisma.slot.create({
        data: {
          clubId: club.id,
          startTime,
          durationMins: duration,
          format,
          requiredPlayers: format === "SINGLES" ? 2 : 4,
          totalCostCents: cost,
          skillLevel: skill,
          ageBracket: bracket,
          status: "OPEN",
          lockTime,
          notes: "Matchpoint team booked this slot",
        },
      });
      slotCount++;
    }
  }
  console.log(`${slotCount} slots created`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
