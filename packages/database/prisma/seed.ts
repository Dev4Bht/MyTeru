import argon2 from "argon2";
import { PrismaClient, TransactionType } from "../generated/client";

const prisma = new PrismaClient();

const SYSTEM_CATEGORIES: { name: string; type: TransactionType; icon: string }[] = [
  { name: "Salary", type: "INCOME", icon: "💼" },
  { name: "Business Income", type: "INCOME", icon: "🏪" },
  { name: "Agriculture Income", type: "INCOME", icon: "🌾" },
  { name: "Food & Dining", type: "EXPENSE", icon: "🍜" },
  { name: "Transport", type: "EXPENSE", icon: "🚕" },
  { name: "Rent", type: "EXPENSE", icon: "🏠" },
  { name: "Bills & Utilities", type: "EXPENSE", icon: "💡" },
  { name: "Mobile & Internet", type: "EXPENSE", icon: "📱" },
  { name: "Family Support", type: "EXPENSE", icon: "👨‍👩‍👧" },
  { name: "Festivals & Losar", type: "EXPENSE", icon: "🎉" },
  { name: "Religious Offerings", type: "EXPENSE", icon: "🙏" },
  { name: "Health", type: "EXPENSE", icon: "🏥" },
  { name: "Education", type: "EXPENSE", icon: "📚" },
  { name: "Entertainment", type: "EXPENSE", icon: "🎬" },
];

async function main() {
  console.log("Seeding system categories...");
  for (const category of SYSTEM_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: `system-${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` },
      update: {},
      create: {
        id: `system-${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: category.name,
        type: category.type,
        icon: category.icon,
        isSystem: true,
      },
    });
  }

  const passwordHash = await argon2.hash("DrukSave@123", { type: argon2.argon2id });

  console.log("Seeding dev users...");
  const tashi = await prisma.user.upsert({
    where: { phone: "+97517123456" },
    update: {},
    create: {
      phone: "+97517123456",
      email: "tashi.dema@example.bt",
      passwordHash,
      isPhoneVerified: true,
      role: "USER",
      profile: {
        create: {
          fullName: "Tashi Dema",
          dzongkhag: "Thimphu",
          occupation: "Government Employee",
        },
      },
      settings: {
        create: {},
      },
    },
  });

  const karma = await prisma.user.upsert({
    where: { phone: "+97517654321" },
    update: {},
    create: {
      phone: "+97517654321",
      email: "karma.wangdi@example.bt",
      passwordHash,
      isPhoneVerified: true,
      role: "USER",
      profile: {
        create: {
          fullName: "Karma Wangdi",
          dzongkhag: "Paro",
          occupation: "Taxi Driver",
        },
      },
      settings: {
        create: {},
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { phone: "+97517000000" },
    update: {},
    create: {
      phone: "+97517000000",
      email: "admin@druksave.bt",
      passwordHash,
      isPhoneVerified: true,
      role: "ADMIN",
      profile: {
        create: {
          fullName: "DrukSave Admin",
          dzongkhag: "Thimphu",
          occupation: "Platform Administrator",
        },
      },
      settings: {
        create: {},
      },
    },
  });

  console.log(`Seeded users: ${tashi.phone}, ${karma.phone}, ${admin.phone}`);
  console.log("Dev password for all seeded users: DrukSave@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
