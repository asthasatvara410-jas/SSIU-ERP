import { PrismaClient } from '@prisma/client';

/**
 * SSIU ERP — Central Database Service Instance
 * Provides singleton access to PrismaClient for PostgreSQL operations.
 */
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = globalThis.prismaGlobal ?? new PrismaClient();

if (typeof globalThis !== 'undefined') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
