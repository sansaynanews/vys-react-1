const { PrismaClient } = require('./src/generated/prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.kullanicilar.findMany({
      take: 5,
      select: {
        id: true,
        kullanici_adi: true,
        rol: true
      }
    });
    console.log('Kullanıcılar:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
