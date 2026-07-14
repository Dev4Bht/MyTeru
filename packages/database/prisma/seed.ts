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

/**
 * User accounts are no longer seeded here — every account is created via
 * signup (see AuthService.signup), so there's no meaningful "fake" account
 * to pre-populate. To grant ADMIN, sign up once for real, then update that
 * user's `role` directly in the database.
 */
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
  console.log(`Seeded ${SYSTEM_CATEGORIES.length} system categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
