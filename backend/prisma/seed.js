const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultCategories = [
  // Kirim kategoriyalari
  { name: 'Oylik maosh', type: 'income', icon: '💼', isDefault: true },
  { name: 'Biznes daromad', type: 'income', icon: '🏢', isDefault: true },
  { name: 'Qarz qaytarish', type: 'income', icon: '💸', isDefault: true },
  { name: "Sovg'a/Bonus", type: 'income', icon: '🎁', isDefault: true },
  { name: 'Boshqa kirim', type: 'income', icon: '📦', isDefault: true },
  // Chiqim kategoriyalari
  { name: 'Oziq-ovqat', type: 'expense', icon: '🛒', isDefault: true },
  { name: 'Transport', type: 'expense', icon: '🚗', isDefault: true },
  { name: "Kommunal to'lovlar", type: 'expense', icon: '🏠', isDefault: true },
  { name: 'Kiyim-kechak', type: 'expense', icon: '👔', isDefault: true },
  { name: "Sog'liq", type: 'expense', icon: '🏥', isDefault: true },
  { name: "Ta'lim", type: 'expense', icon: '📚', isDefault: true },
  { name: 'Aloqa/Internet', type: 'expense', icon: '📱', isDefault: true },
  { name: "Ko'ngilochar", type: 'expense', icon: '🎉', isDefault: true },
  { name: 'Boshqa chiqim', type: 'expense', icon: '📦', isDefault: true },
];

async function main() {
  console.log('Seeding default categories...');
  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { id: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
