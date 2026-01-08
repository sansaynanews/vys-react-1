import { PrismaClient } from '@/generated/prisma/client';

declare global {
    var prisma: PrismaClient | undefined;
}

// Prisma 7.x - DATABASE_URL environment variable otomatik kullanılır
export const prisma = global.prisma || new (PrismaClient as any)();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
