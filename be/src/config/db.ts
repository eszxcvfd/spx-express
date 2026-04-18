import { PrismaClient } from '@prisma/client';

type PrismaClientWithModels = PrismaClient & Record<string, any>;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientWithModels };

export const prisma: PrismaClientWithModels = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
}) as PrismaClientWithModels;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
