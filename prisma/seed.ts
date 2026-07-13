// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Admin1234!", 10);

  await prisma.user.upsert({
    where: { email: "admin@vallor.ro" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@vallor.ro",
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      annualKmTarget: 120000,
      workingWeeksPerYear: 48,
    },
  });

  // Default company costs
  const existing = await prisma.companyCostItem.count();
  if (existing === 0) {
    await prisma.companyCostItem.createMany({
      data: [
        // Minden érték nettó; vatApplicable = kell-e rá 21% TVA (adók TVA-mentesek)
        { name: "Könyvelő", amountLei: 1200, vatApplicable: true, basisType: "time", intervalMonths: 1 },
        { name: "Napidíj adók (ANGAJATI IMPOZITELE)", amountLei: 2070, vatApplicable: false, basisType: "time", intervalMonths: 1 },
        { name: "Engedély / Licenc", amountLei: 2000, vatApplicable: false, basisType: "time", intervalMonths: 60 },
        { name: "Irodai kellékek", amountLei: 1200, vatApplicable: true, basisType: "time", intervalMonths: 12 },
        { name: "Tárgyi eszköz adó", amountLei: 3050, vatApplicable: false, basisType: "time", intervalMonths: 12 },
        { name: "SSU-SSM (munkavédelem)", amountLei: 800, vatApplicable: true, basisType: "time", intervalMonths: 12 },
        { name: "Parkolás", amountLei: 300, vatApplicable: true, basisType: "time", intervalMonths: 1 },
      ],
    });
  }

  console.log("Seed kész! Admin: admin@vallor.ro / Admin1234!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
